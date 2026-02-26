import { defineEventHandler, setResponseStatus, getQuery } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'
import { deleteDocument } from '~/server/utils/deleteDocument'
import { S3Client, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
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
    userId = (decodedToken as { user_id: number }).user_id
  } catch {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const queryParams = getQuery(event) as Record<string, any>
  const artefactId = queryParams.artefactId
  const artefactName = queryParams.artefactName

  if (!artefactId && !artefactName) {
    throw new CustomError('Artifact ID or name is required', 400)
  }

  try {
    const userQuery = `
    SELECT u.org_id, u.role_id, o.org_name
    FROM users u
    INNER JOIN organizations o ON u.org_id = o.org_id
    WHERE u.user_id = $1;
    `
    const userResult = await query(userQuery, [userId])

    if (!userResult.rows.length) {
      throw new CustomError('User or organization not found', 404)
    }

    const tokenUserOrg = userResult.rows[0].org_id
    const tokenUserRole = userResult.rows[0].role_id

    const requestedOrg = queryParams?.org || queryParams?.org_id || null
    const org_id = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

    // Fetch org_name for effective org
    const orgRow = await query('SELECT org_name FROM organizations WHERE org_id = $1 LIMIT 1', [org_id])
    if (!orgRow?.rows?.length) {
      throw new CustomError('Organization not found', 404)
    }
    const org_name = orgRow.rows[0].org_name

    if (!org_name) {
      throw new CustomError('Organization information is incomplete', 400)
    }

    // Find the document by ID or name
    let checkDocQuery = ''
    let queryParamsArr: any[] = []

    if (artefactId) {
      checkDocQuery = `
        SELECT id, name, document_link, status FROM organization_documents 
        WHERE org_id = $1 AND id = $2;
      `
      queryParamsArr = [org_id, artefactId]
    } else {
      checkDocQuery = `
        SELECT id, name, document_link, status FROM organization_documents 
        WHERE org_id = $1 AND name = $2;
      `
      queryParamsArr = [org_id, artefactName]
    }

    const docResult = await query(checkDocQuery, queryParamsArr)

    if (!docResult.rows.length) {
      throw new CustomError('Artifact not found in database', 404)
    }

    const documentId = docResult.rows[0].id
    const documentName = docResult.rows[0].name
    const documentLink = docResult.rows[0].document_link
    const documentDeleteAction = docResult.rows[0].status === 'processed'

    // 🔑 PERMISSION CHECK: Check if document is a common document (no department restrictions)
    const deptCheckQuery = `
      SELECT COUNT(*) as dept_count FROM document_departments
      WHERE document_id = $1
    `
    const deptCheckResult = await query(deptCheckQuery, [documentId])
    const deptCount = Number(deptCheckResult.rows[0].dept_count)
    const isCommonDocument = deptCount === 0

    // 🔑 PERMISSION ENFORCEMENT: Department Admins (role_id = 3) cannot delete common artifacts
    if (tokenUserRole === 3 && isCommonDocument) {
      setResponseStatus(event, 403)
      throw new CustomError(
        'Department Admins cannot delete common artifacts. Only Company Admins can delete common artifacts.',
        403
      )
    }

    const s3 = new S3Client({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    })

    // Delete from S3 if it's a valid S3 URL
    if (documentLink && typeof documentLink === 'string' && documentLink.startsWith('https://')) {
      const companyName = org_name.toLowerCase().replace(/ /g, '_')
      const fileKey = `${folderName}/${companyName}/files/${documentName}`

      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: fileKey }))
        await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileKey }))
      } catch (err: any) {
        if (err.name !== 'NotFound') {
          throw new CustomError('Failed to delete file from S3', 500)
        }
        // If file doesn't exist in S3, proceed anyway
      }
    }

    // 🔑 Delete department links first (referential integrity)
    try {
      await query(`DELETE FROM document_departments WHERE document_id = $1;`, [documentId])
    } catch (e) {
      console.error('Failed to delete department links:', e)
      // Continue even if department deletion fails
    }

    // Delete from database
    await query(`DELETE FROM organization_documents WHERE id = $1;`, [documentId])

    // Delete from vector database if document was processed
    if (documentDeleteAction) {
      try {
        await deleteDocument(bucketName, folderName, org_name, org_id, [
          {
            id: documentId.toString(),
            name: documentName,
            link: documentLink,
            type: 'document'
          },
        ], token)
      } catch (vectorError) {
        // Log but don't fail the operation if vector deletion fails
        // The document is already deleted from DB and S3
      }
    }

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      message: 'Artifact deleted successfully',
      data: {
        id: documentId,
        name: documentName
      }
    }
  } catch (err: any) {
    if (err instanceof CustomError) {
      setResponseStatus(event, err.statusCode)
      return {
        statusCode: err.statusCode,
        status: 'error',
        message: err.message,
      }
    }

    setResponseStatus(event, 500)
    return {
      statusCode: 500,
      status: 'error',
      message: 'Failed to delete artifact',
    }
  }
})
