import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { processDocument } from '~/server/utils/processDocument'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Buffer } from 'buffer'
import { Readable } from 'stream'
import { getOrgUsageLimits, getOrgUsageStats } from '../../utils/usageLimits'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const bucketName = config.awsBucketName
  const folderName = config.awsFolderName

  if (!bucketName) {
    throw new CustomError('S3 bucket name is not configured', 500)
  }

  const token = event.node.req.headers['authorization']?.split(' ')[1]
  if (!token) {
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let userId
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string)
    userId = (decodedToken as { user_id: any }).user_id
  } catch {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  try {
    const userQuery = `
    SELECT u.org_id, u.role_id, o.org_name
    FROM users u
    INNER JOIN organizations o ON u.org_id = o.org_id
    WHERE u.user_id = $1;
    `
    const userResult = await query(userQuery, [userId])
    if (userResult.rows.length === 0) {
      throw new CustomError('User or organization not found', 404)
    }

    const tokenUserOrg = userResult.rows[0].org_id
    const tokenUserRole = userResult.rows[0].role_id

    const body = await readBody(event)
    const { selectedFileDetails, category, org_id: bodyOrg, departments: departmentsFromBody } = body

    // Parse departments from request body
    let departments: string[] = []
    console.log(`[google-drive.post.ts] Raw departmentsFromBody:`, departmentsFromBody, 'type:', typeof departmentsFromBody, 'isArray:', Array.isArray(departmentsFromBody))

    if (departmentsFromBody) {
      try {
        let parsedDepts: any = departmentsFromBody

        if (Array.isArray(departmentsFromBody)) {
          parsedDepts = departmentsFromBody
          console.log(`[google-drive.post.ts] departmentsFromBody is array:`, parsedDepts)
        } else if (typeof departmentsFromBody === 'string') {
          console.log(`[google-drive.post.ts] Parsing JSON string...`)
          parsedDepts = JSON.parse(departmentsFromBody)
          console.log(`[google-drive.post.ts] Parsed to:`, parsedDepts)
        }

        // Ensure all elements are strings and trim
        if (Array.isArray(parsedDepts)) {
          departments = parsedDepts.map((d: any) => String(d).trim()).filter((d: string) => d)
          console.log(`[google-drive.post.ts] Final departments array:`, departments)
        } else {
          console.warn(`[google-drive.post.ts] parsedDepts is not an array:`, parsedDepts)
          departments = []
        }
      } catch (e: any) {
        console.error('Failed to parse departments:', departmentsFromBody, 'error:', e.message)
        departments = []
      }
    } else {
      console.log(`[google-drive.post.ts] No departmentsFromBody provided`)
    }

    const q = getQuery(event) as Record<string, any>
    const requestedOrg = q?.org || q?.org_id || bodyOrg || null
    const org_id = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

    // Fetch org_name for effective org
    const orgRow = await query('SELECT org_name FROM organizations WHERE org_id = $1 LIMIT 1', [org_id])
    if (!orgRow?.rows?.length) throw new CustomError('Organization not found', 404)
    const org_name = orgRow.rows[0].org_name

    if (!selectedFileDetails || !Array.isArray(selectedFileDetails)) {
      throw new CustomError('No files selected for upload', 400)
    }

    if (!category) {
      throw new CustomError('Category is required', 400)
    }

    // Lookup category ID by name
    const categoryQuery = `
      SELECT id FROM document_category
      WHERE name = $1 AND org_id = $2
    `
    const categoryResult = await query(categoryQuery, [category, org_id])

    if (categoryResult.rows.length === 0) {
      throw new CustomError(`Category '${category}' not found for your organization`, 400)
    }

    const categoryId = categoryResult.rows[0].id

    // Calculate total size of files being uploaded and check limits
    let totalFileSize = 0
    for (const file of selectedFileDetails) {
      const fileSize = file.size ? parseInt(file.size.replace(' KB', '')) * 1024 : 0
      totalFileSize += fileSize
    }

    // Check document count and storage limits for multiple files
    const limits = await getOrgUsageLimits(org_id)
    const stats = await getOrgUsageStats(org_id)

    // console.log(`[google-drive.post.ts] Multiple file upload check for org_id ${org_id}:`)
    // console.log(`  - Files to upload: ${selectedFileDetails.length}`)
    // console.log(`  - Total file size: ${(totalFileSize / (1024 * 1024)).toFixed(2)}MB`)
    // console.log(`  - Current documents: ${stats.totalDocuments}, Limit: ${limits.documents}`)
    // console.log(`  - Current storage: ${(stats.totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)}GB, Limit: ${limits.storageGb}GB`)

    // Check if plan is expired/unsubscribed (limits are 0)
    if (limits.documents === 0 || limits.storageGb === 0) {
      // console.log(`[google-drive.post.ts] Plan expired/unsubscribed - blocking upload`)
      setResponseStatus(event, 403)
      throw new CustomError('Document upload not allowed. Your plan has expired or is not subscribed. Please renew your subscription.', 403)
    }

    // Check document count limit
    if (limits.documents !== null && limits.documents > 0) {
      const wouldBeDocuments = stats.totalDocuments + selectedFileDetails.length
      if (wouldBeDocuments > limits.documents) {
        // console.log(`[google-drive.post.ts] Artifact count limit exceeded - would be: ${wouldBeDocuments}, limit: ${limits.documents}`)
        setResponseStatus(event, 403)
        throw new CustomError(
          `The Artifact limit for your plan has been reached. Please contact your Organization Admin to upgrade and continue. This upload would exceed your artifact limit by ${wouldBeDocuments - limits.documents} artifact(s).`,
          403
        )
      }
    }

    // Check storage limit
    if (limits.storageGb !== null && limits.storageGb > 0) {
      const currentStorageGb = stats.totalStorageBytes / (1024 * 1024 * 1024)
      const totalSizeGb = totalFileSize / (1024 * 1024 * 1024)
      if (currentStorageGb + totalSizeGb > limits.storageGb) {
        // console.log(`[google-drive.post.ts] Storage limit exceeded - current: ${currentStorageGb.toFixed(2)}GB, adding: ${totalSizeGb.toFixed(2)}GB, limit: ${limits.storageGb}GB`)
        setResponseStatus(event, 403)
        throw new CustomError(
          `The Artifact storage limit for your plan has been reached. Please contact your Organization Admin to upgrade and continue. This upload would exceed your storage limit by ${(currentStorageGb + totalSizeGb - limits.storageGb).toFixed(2)}GB.`,
          403
        )
      }
    }

    const s3Client = new S3Client({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    })

    const companyName = org_name.toLowerCase().replace(/ /g, '_')
    const prefix = `${folderName}/${companyName}/files/`

    const uploadedFiles = []
    const documentData = []

    for (const file of selectedFileDetails) {
      const { id, name, webViewLink, mimeType, size, googleAccessToken } = file
      if (!id || !webViewLink) {
        throw new CustomError(`Invalid file data: ${name}`, 400)
      }

      const downloadUrl = googleAccessToken
        ? `https://www.googleapis.com/drive/v3/files/${id}?alt=media`
        : `https://drive.google.com/uc?export=download&id=${id}`

      const axiosConfig: any = {
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream',
        headers: googleAccessToken
          ? { Authorization: `Bearer ${googleAccessToken}` }
          : undefined,
      }

      const response = await axios(axiosConfig)
      if (!response || !response.data) {
        throw new CustomError(`Failed to download file: ${name}`, 500)
      }

      const chunks: Buffer[] = []
      for await (const chunk of response.data as Readable) {
        chunks.push(Buffer.from(chunk))
      }
      const fileBuffer = Buffer.concat(chunks)

      const s3Key = `${prefix}${name}`

      // Upload file to S3 with enhanced error handling
      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: fileBuffer,
            ContentLength: fileBuffer.length,
            ContentType: mimeType,
          })
        )
      } catch (s3Error: any) {
        // Check if it's a path/permission issue
        if (s3Error.Code === 'NoSuchBucket') {
          throw new CustomError(`S3 bucket '${bucketName}' does not exist`, 500)
        } else if (s3Error.Code === 'AccessDenied') {
          throw new CustomError(`Access denied to S3 bucket or path '${prefix}'`, 500)
        } else {
          throw new CustomError(`Failed to upload file '${name}' to S3: ${s3Error.message}`, 500)
        }
      }

      const publicUrl = `https://${bucketName}.s3.${config.awsRegion}.amazonaws.com/${s3Key}`

      // Insert or update in DB
      const existing = await query(
        `SELECT id FROM organization_documents WHERE org_id = $1 AND name = $2`,
        [org_id, name]
      )

      let documentId
      if (existing.rows.length > 0) {
        const result = await query(
          `UPDATE organization_documents
           SET document_link = $1, file_category = $2, status = $3, summary = $4, is_summarized = $5, updated_at = NOW(), added_by = $6
           WHERE id = $7 RETURNING id`,
          [publicUrl, categoryId, 'processing', null, false, userId, existing.rows[0].id]
        )
        documentId = result.rows[0].id
      } else {
        const result = await query(
          `INSERT INTO organization_documents
           (org_id, doc_type, document_link, status, file_category, name, content_type, file_size, summary, is_summarized, added_by)
           VALUES ($1, 'gdrive', $2, 'processing', $3, $4, $5, $6, null, false, $7) RETURNING id`,
          [
            org_id,
            publicUrl,
            categoryId,
            name,
            mimeType,
            size ? parseInt(size.replace(' KB', '')) * 1024 : null,
            userId,
          ]
        )
        documentId = result.rows[0].id
      }

      // 🔑 Handle department assignments for each document
      if (departments && Array.isArray(departments) && departments.length > 0) {
        try {
          console.log(`[google-drive.post.ts] Assigning ${departments.length} departments to document ${documentId}`)
          console.log(`[google-drive.post.ts] Department IDs:`, JSON.stringify(departments))

          // Delete existing department mappings
          await query(
            `DELETE FROM document_departments WHERE document_id = $1`,
            [documentId]
          )

          // Insert new department mappings - iterate safely
          for (let i = 0; i < departments.length; i++) {
            const deptId = departments[i]
            const trimmedDeptId = String(deptId).trim()

            console.log(`[google-drive.post.ts] Dept[${i}]: original="${deptId}", trimmed="${trimmedDeptId}", type=${typeof deptId}`)

            if (trimmedDeptId && trimmedDeptId.length > 0 && /^[0-9a-f-]{36}$/.test(trimmedDeptId)) {
              console.log(`[google-drive.post.ts] Inserting valid UUID: ${trimmedDeptId} for document ${documentId}`)

              await query(
                `INSERT INTO document_departments (document_id, dept_id, org_id)
                 VALUES ($1, $2::uuid, $3::uuid)
                 ON CONFLICT (document_id, dept_id) DO NOTHING`,
                [documentId, trimmedDeptId, org_id]
              )
            } else {
              console.warn(`[google-drive.post.ts] Skipping invalid UUID: "${trimmedDeptId}"`)
            }
          }
          console.log(`[google-drive.post.ts] Successfully assigned departments to document ${documentId}`)
        } catch (e: any) {
          console.error('Failed to assign departments to document:', e)
          // Don't fail the upload if department assignment fails
        }
      } else {
        console.log(`[google-drive.post.ts] No departments to assign.`)
        console.log(`[google-drive.post.ts] departments=${JSON.stringify(departments)}, isArray=${Array.isArray(departments)}, length=${departments?.length}`)
      }

      documentData.push({
        id: documentId,
        name,
        type: 'document',
        link: publicUrl,
      })

      uploadedFiles.push({
        name,
        publicUrl,
        contentType: mimeType,
        size,
        type: file.type,
      })
    }

    if (documentData.length > 0) {
      await processDocument(bucketName, folderName, org_name, org_id, userId, documentData, token, departments)
    }

    setResponseStatus(event, 201)
    return {
      statusCode: 201,
      status: 'success',
      message: 'Files uploaded successfully to S3',
      files: uploadedFiles,
    }
  } catch (error: any) {
    throw new CustomError(error.message || 'Failed to upload files', 500)
  }
})
