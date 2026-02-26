import { defineEventHandler, setResponseStatus, getHeaders } from 'h3'
import formidable from 'formidable'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { processDocument } from '~/server/utils/processDocument'
import fs from 'fs'
import mime from 'mime-types'
import { checkDocumentLimitExceeded } from '../../utils/usageLimits'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const bucketName = config.awsBucketName
    const folderName = config.awsFolderName

    if (!bucketName) {
      throw new CustomError('AWS S3 bucket name is not configured', 500)
    }

    const token = event.node.req.headers['authorization']?.split(' ')[1]
    if (!token) {
      throw new CustomError('Unauthorized: No token provided', 401)
    }

    let userId
    try {
      const decodedToken = jwt.verify(token, config.jwtToken as string)
      userId = (decodedToken as { user_id: any }).user_id
    } catch (error) {
      throw new CustomError('Unauthorized: Invalid token', 401)
    }

    // Determine caller org and role; allow superadmin override via query param or form field
    const decodedUserQuery = `
    SELECT u.org_id, u.role_id, o.org_name
    FROM users u
    INNER JOIN organizations o ON u.org_id = o.org_id
    WHERE u.user_id = $1;
  `
    const userResult = await query(decodedUserQuery, [userId])

    if (userResult.rows.length === 0) {
      throw new CustomError('User or organization not found', 404)
    }

    const tokenUserOrg = userResult.rows[0].org_id
    const tokenUserRole = userResult.rows[0].role_id

    // For multipart form, requested org can be in query or form fields; we'll derive later after parsing form
    // We'll keep org_name/org_id variables populated after parsing form
    let org_name = userResult.rows[0].org_name
    let org_id = tokenUserOrg
    const prefixBase = `${folderName}`

    // Parse form early to extract any org override field
    const form = formidable({ multiples: false, maxFileSize: 20 * 1024 * 1024 })
    const parsed = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err)
        resolve({ fields, files })
      })
    })
    const fields = parsed.fields
    const files = parsed.files

    const q = getQuery(event) as Record<string, any>
    const headers = getHeaders(event)
    const headerOrg = headers['x-org-id'] || headers['x-orgid'] || headers['x_org_id'] || null
    const requestedOrg = headerOrg || q?.org || q?.org_id || fields?.org_id || null

    if (tokenUserRole === 0 && requestedOrg) {
      // fetch org_name for requestedOrg
      const orgRow = await query('SELECT org_name FROM organizations WHERE org_id = $1 LIMIT 1', [requestedOrg])
      if (!orgRow?.rows?.length) throw new CustomError('Requested organization not found', 404)
      org_name = orgRow.rows[0].org_name
      org_id = String(requestedOrg)
    }

    const companyName = org_name.toLowerCase().replace(/ /g, '_')
    const prefix = `${prefixBase}/${companyName}/files/`

    // Reassign form fields/files for rest of logic
    // (we parsed above, so use parsed values below)

    const s3Client = new S3Client({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    })

    try {
      // 'fields' and 'files' are already parsed above

      if (!files.file) {
        throw new CustomError('No file uploaded', 400)
      }

      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file
      if (!uploadedFile?.originalFilename) {
        throw new CustomError('Invalid file uploaded', 400)
      }

      // Get form fields
      const category = String(fields.category || '')
      const description = String(fields.description || '')

      // Parse departments array from form
      // Note: formidable returns form fields as arrays
      let departments: string[] = []
      const departmentsField = fields.departments
      // console.log(`[upload.post.ts] Raw departmentsField:`, departmentsField, 'type:', typeof departmentsField, 'isArray:', Array.isArray(departmentsField))

      if (departmentsField) {
        try {
          let parsedDepts: any = departmentsField

          // formidable returns fields as arrays - extract the value
          if (Array.isArray(departmentsField) && departmentsField.length > 0) {
            parsedDepts = departmentsField[0]  // Get first element
            // console.log(`[upload.post.ts] Extracted from array, parsedDepts:`, parsedDepts, 'type:', typeof parsedDepts)
          }

          // If it's a string, parse it as JSON
          if (typeof parsedDepts === 'string') {
            // console.log(`[upload.post.ts] Parsing JSON string...`)
            parsedDepts = JSON.parse(parsedDepts)
            // console.log(`[upload.post.ts] Parsed to:`, parsedDepts, 'type:', typeof parsedDepts)
          }

          // Ensure it's an array and clean it up
          if (Array.isArray(parsedDepts)) {
            departments = parsedDepts.map((d: any) => String(d).trim()).filter((d: string) => d)
            // console.log(`[upload.post.ts] Final departments array:`, departments)
          } else {
            console.warn(`[upload.post.ts] parsedDepts is not an array after parsing:`, parsedDepts)
            departments = []
          }
        } catch (e: any) {
          console.error('Failed to parse departments field:', departmentsField, 'error:', e.message)
          departments = []
        }
      } else {
        // console.log(`[upload.post.ts] No departmentsField provided`)
      }

      if (!category) {
        throw new CustomError('Category is required', 400)
      }

      // Validate file size (20MB limit)
      const maxSize = 20 * 1024 * 1024
      if (uploadedFile.size > maxSize) {
        throw new CustomError(`The file "${uploadedFile.originalFilename}" exceeds 20MB size limit.`, 400)
      }

      // Check document upload limits (count and storage)
      const documentLimitCheck = await checkDocumentLimitExceeded(org_id, uploadedFile.size)
      // console.log(`[upload.post.ts] documentLimitCheck result for org_id ${org_id}:`, JSON.stringify(documentLimitCheck, null, 2))
      if (documentLimitCheck.exceeded) {
        // console.log(`[upload.post.ts] Upload blocked - limit exceeded for org_id ${org_id}`)
        setResponseStatus(event, 403)
        throw new CustomError(documentLimitCheck.message, 403)
      }
      // console.log(`[upload.post.ts] Upload allowed - limits not exceeded for org_id ${org_id}`)

      const filePath = uploadedFile.filepath
      let fileName = uploadedFile.originalFilename.replace(/\s+/g, '_')

      let fileBuffer
      try {
        fileBuffer = fs.readFileSync(filePath)
      } catch (err) {
        throw new CustomError('Failed to read uploaded file', 500)
      }

      const fileMimeType = uploadedFile.mimetype || mime.lookup(fileName) || 'application/octet-stream'
      const destinationKey = `${prefix}${fileName}`

      // Check if file already exists
      const existingFileQuery = await query(
        `SELECT id FROM organization_documents WHERE org_id = $1 AND name = $2`,
        [org_id, fileName]
      )
      const existingFile = existingFileQuery.rows.length > 0 ? existingFileQuery.rows[0] : null

      // Upload to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: destinationKey,
        Body: fileBuffer,
        ContentType: fileMimeType,
      }))

      const publicUrl = `https://${bucketName}.s3.${config.awsRegion}.amazonaws.com/${destinationKey}`

      // Find category ID
      let categoryId = null
      if (category && category !== 'Uncategorized') {
        const categoryQuery = await query(
          `SELECT id FROM document_category WHERE name = $1 AND org_id = $2`,
          [category, org_id]
        )
        if (categoryQuery.rows.length > 0) {
          categoryId = categoryQuery.rows[0].id
        } else {
          // Create category if it doesn't exist
          const newCategoryResult = await query(
            `INSERT INTO document_category (name, org_id, added_by) VALUES ($1, $2, $3) RETURNING id`,
            [category, org_id, userId]
          )
          categoryId = newCategoryResult.rows[0].id
        }
      }

      let documentId: number
      if (existingFile) {
        // Update existing file
        const updateResult = await query(
          `UPDATE organization_documents
            SET document_link = $1, status = $2, summary = $3, is_summarized = $4, updated_at = NOW(), file_category = $5, doc_type = 'document', content_type = $6, file_size = $7, description = $8, added_by = $9
            WHERE id = $10
            RETURNING id`,
          [publicUrl, 'processing', null, false, categoryId, fileMimeType, parseInt(uploadedFile.size.toString(), 10), description || null, userId, existingFile.id]
        )
        documentId = updateResult.rows[0].id
      } else {
        // Insert new file
        const insertFileResult = await query(
          `INSERT INTO organization_documents (org_id, doc_type, document_link, status, file_category, name, content_type, file_size, summary, is_summarized, description, added_by)
            VALUES ($1, 'document', $2, 'processing', $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id`,
          [
            org_id,
            publicUrl,
            categoryId,
            fileName,
            fileMimeType,
            parseInt(uploadedFile.size.toString(), 10),
            null,
            false,
            description || null,
            userId,
          ]
        )
        documentId = insertFileResult.rows[0].id
      }

      // 🔑 Department Admin validation for document assignments
      if (tokenUserRole === 3) {
        // Department Admin cannot upload common documents
        if (!departments || departments.length === 0) {
          throw new CustomError(
            'Department Admins cannot upload common documents. Please assign this document to at least one of your departments.',
            403
          )
        }

        // Validate Department Admin can only assign to their own departments
        try {
          const adminDeptResult = await query(
            `SELECT dept_id FROM user_departments WHERE user_id = $1`,
            [String(userId)]
          )
          const adminDeptIds = adminDeptResult.rows.map((row) => String(row.dept_id))

          // Check if all requested departments are in admin's departments
          const unauthorizedDepts = departments.filter((deptId) => !adminDeptIds.includes(String(deptId)))
          if (unauthorizedDepts.length > 0) {
            throw new CustomError(
              `Cannot assign documents to departments outside your scope. Unauthorized departments: ${unauthorizedDepts.join(', ')}`,
              403
            )
          }
        } catch (e: any) {
          if (e instanceof CustomError) throw e
          console.error('Failed to validate Department Admin scope:', e)
          throw new CustomError('Failed to validate department permissions', 500)
        }
      }

      // 🔑 Handle department assignments
      // Extra validation - ensure departments is an array of strings
      if (departments && Array.isArray(departments) && departments.length > 0) {
        try {
          // console.log(`[upload.post.ts] Assigning ${departments.length} departments to document ${documentId}`)
          // console.log(`[upload.post.ts] Department IDs:`, JSON.stringify(departments))

          // Delete existing department mappings
          await query(
            `DELETE FROM document_departments WHERE document_id = $1`,
            [documentId]
          )

          // Insert new department mappings - iterate safely
          for (let i = 0; i < departments.length; i++) {
            const deptId = departments[i]
            const trimmedDeptId = String(deptId).trim()

            // console.log(`[upload.post.ts] Dept[${i}]: original="${deptId}", trimmed="${trimmedDeptId}", type=${typeof deptId}`)

            if (trimmedDeptId && trimmedDeptId.length > 0 && /^[0-9a-f-]{36}$/.test(trimmedDeptId)) {
              // console.log(`[upload.post.ts] Inserting valid UUID: ${trimmedDeptId} for document ${documentId}`)

              await query(
                `INSERT INTO document_departments (document_id, dept_id, org_id)
                 VALUES ($1, $2::uuid, $3::uuid)
                 ON CONFLICT (document_id, dept_id) DO NOTHING`,
                [documentId, trimmedDeptId, org_id]
              )
            } else {
              console.warn(`[upload.post.ts] Skipping invalid UUID: "${trimmedDeptId}"`)
            }
          }
          // console.log(`[upload.post.ts] Successfully assigned departments to document ${documentId}`)
        } catch (e: any) {
          console.error('Failed to assign departments to document:', e)
          // Don't fail the upload if department assignment fails
        }
      } else {
        // console.log(`[upload.post.ts] No departments to assign.`)
        // console.log(`[upload.post.ts] departments=${JSON.stringify(departments)}, isArray=${Array.isArray(departments)}, length=${departments?.length}`)
      }

      // Process the document
      await processDocument(bucketName, folderName, org_name, org_id, userId, [
        { id: String(documentId), name: fileName, type: 'document', link: publicUrl },
      ], token, departments)

      setResponseStatus(event, 201)
      return {
        statusCode: 201,
        status: 'success',
        message: existingFile ? 'Artifact updated successfully' : 'Artifact uploaded successfully',
        data: {
          id: documentId,
          name: fileName,
          description: description || '-',
          category: category,
          type: getFileType(fileName),
          size: formatFileSize(uploadedFile.size),
          status: 'processing',
          uploadedBy: 'Current User',
          lastUpdated: new Date().toISOString(),
          artefact: fileName,
          publicUrl,
          contentType: fileMimeType,
        },
      }
    } catch (error: any) {
      if (error instanceof CustomError) {
        setResponseStatus(event, error.statusCode)
        return {
          statusCode: error.statusCode,
          status: 'error',
          message: error.message,
        }
      }
      setResponseStatus(event, 500)
      return {
        statusCode: 500,
        status: 'error',
        message: error.message || 'Failed to process request',
      }
    }
  } catch (outerError: any) {
    setResponseStatus(event, 500)
    return {
      statusCode: 500,
      status: 'error',
      message: 'Unexpected server error',
    }
  }
})

function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const typeMap: Record<string, string> = {
    pdf: 'PDF',
    doc: 'Word',
    docx: 'Word',
    txt: 'TXT',
    csv: 'CSV',
    md: 'Markdown',
    png: 'Image',
    jpg: 'Image',
    jpeg: 'Image',
  }
  return typeMap[extension || ''] || 'Unknown'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'kB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
