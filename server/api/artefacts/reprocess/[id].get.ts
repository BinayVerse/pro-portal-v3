import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { CustomError } from '../../../utils/custom.error'
import { query } from '../../../utils/db'
import jwt from 'jsonwebtoken'
import { processDocument } from '~/server/utils/processDocument'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const bucketName = config.awsBucketName
  const folderName = config.awsFolderName

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

  const artefactId = getRouterParam(event, 'id')
  if (!artefactId) {
    throw new CustomError('Artifact ID is required', 400)
  }

  try {
    // Determine caller org/role and allow superadmin override
    const userResult = await query(
      `SELECT u.org_id, u.role_id, o.org_name
       FROM users u
       INNER JOIN organizations o ON u.org_id = o.org_id
       WHERE u.user_id = $1;`,
      [userId]
    )

    if (userResult.rows.length === 0) {
      throw new CustomError('User or organization not found', 404)
    }

    const tokenUserOrg = userResult.rows[0].org_id
    const tokenUserRole = userResult.rows[0].role_id

    const q = getQuery(event) as Record<string, any>
    const requestedOrg = q?.org || q?.org_id || null
    const effectiveOrg = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

    // Fetch org_name for effectiveOrg
    const orgRow = await query('SELECT org_name FROM organizations WHERE org_id = $1 LIMIT 1', [effectiveOrg])
    if (!orgRow?.rows?.length) throw new CustomError('Organization not found', 404)
    const org_name = orgRow.rows[0].org_name

    // Check if the artifact exists and belongs to user's org (or requested org for superadmin)
    const artefactResult = await query(
      `SELECT id, name, doc_type, document_link, status
       FROM organization_documents
       WHERE org_id = $1 AND id = $2;`,
      [effectiveOrg, artefactId]
    )

    if (artefactResult.rows.length === 0) {
      throw new CustomError('Artifact not found or access denied', 404)
    }

    const artefact = artefactResult.rows[0]

    // Check if artifact can be reprocessed (has a document link)
    if (!artefact.document_link) {
      throw new CustomError('Artifact cannot be reprocessed - no document link found', 400)
    }

    // Update artifact status to "processing" and clear summary data
    await query(
      `UPDATE organization_documents
       SET status = 'processing', summary = NULL, is_summarized = FALSE, updated_at = NOW()
       WHERE id = $1 AND org_id = $2;`,
      [artefactId, effectiveOrg]
    )

    // Fetch document's departments
    const departmentsResult = await query(
      `SELECT dept_id FROM document_departments
       WHERE document_id = $1`,
      [artefactId]
    )
    const departments = departmentsResult.rows.map((row: any) => String(row.dept_id))

    // Prepare document data for reprocessing
    const documentData = [{
      id: artefact.id.toString(),
      name: artefact.name,
      type: 'document',
      link: artefact.document_link,
    }]

    // Trigger re-processing using the existing processDocument utility with departments
    await processDocument(bucketName, folderName, org_name, effectiveOrg, userId, documentData, token, departments)

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      message: 'Artifact re-processing started successfully',
      data: {
        id: artefact.id,
        name: artefact.name,
        status: 'processing'
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
      message: 'Failed to reprocess artifact',
    }
  }
})
