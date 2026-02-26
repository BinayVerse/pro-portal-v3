import { defineEventHandler, setResponseStatus, getQuery } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const token = event.node.req.headers['authorization']?.split(' ')[1]
  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let userId: number
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string)
    userId = (decodedToken as { user_id: number }).user_id
  } catch (error) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const userQuery = `
    SELECT u.org_id, u.role_id, o.org_name
    FROM users u
    INNER JOIN organizations o ON u.org_id = o.org_id
    WHERE u.user_id = $1;
  `
  const userResult = await query(userQuery, [userId])

  if (userResult.rows.length === 0) {
    setResponseStatus(event, 404)
    throw new CustomError('User or organization not found', 404)
  }

  const tokenUserOrg = userResult.rows[0].org_id
  const tokenUserRole = userResult.rows[0].role_id

  const queryParams = getQuery(event) as Record<string, any>
  const fileName = queryParams.fileName
  const fileNamesParam = queryParams.fileNames

  const requestedOrg = queryParams?.org || queryParams?.org_id || null
  const org_id = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

  // Handle both single file and multiple files
  // Parse fileNames if it's a comma-separated string or array
  let filesToCheck: string[] = []

  if (fileName) {
    filesToCheck = [fileName]
  } else if (fileNamesParam) {
    // If passed as comma-separated string, split it
    if (typeof fileNamesParam === 'string') {
      filesToCheck = fileNamesParam.split(',').map(f => f.trim()).filter(f => f)
    } else if (Array.isArray(fileNamesParam)) {
      filesToCheck = fileNamesParam
    }
  }

  if (!filesToCheck || filesToCheck.length === 0) {
    setResponseStatus(event, 400)
    throw new CustomError('File name or file names array is required', 400)
  }

  try {
    // Clean filenames to match upload logic
    const cleanedFileNames = filesToCheck.map(name => name.replace(/\s+/g, '_'))

    // Handle single file case (backward compatibility)
    if (fileName) {
      const cleanedFileName = cleanedFileNames[0]

      // Check if file exists and get category name and departments
      const existingFileQuery = await query(
        `SELECT od.id, od.name, od.file_category, od.updated_at, dc.name as category_name,
                COALESCE(json_agg(DISTINCT odd.dept_id) FILTER (WHERE odd.dept_id IS NOT NULL), '[]'::json) as department_ids
         FROM organization_documents od
         LEFT JOIN document_category dc ON od.file_category IS NOT NULL AND od.file_category::text = dc.id::text
         LEFT JOIN document_departments odd ON od.id = odd.document_id
         WHERE od.org_id = $1 AND od.name = $2
         GROUP BY od.id, od.name, od.file_category, od.updated_at, dc.name`,
        [org_id, cleanedFileName]
      )

      const exists = existingFileQuery.rows.length > 0

      setResponseStatus(event, 200)
      return {
        statusCode: 200,
        status: 'success',
        exists,
        fileInfo: exists ? {
          id: existingFileQuery.rows[0].id,
          name: existingFileQuery.rows[0].name,
          category: existingFileQuery.rows[0].category_name || 'Uncategorized',
          departments: existingFileQuery.rows[0].department_ids || [],
          lastUpdated: existingFileQuery.rows[0].updated_at
        } : null
      }
    }

    // Handle multiple files case
    if (cleanedFileNames.length === 0) {
      setResponseStatus(event, 200)
      return {
        statusCode: 200,
        status: 'success',
        results: []
      }
    }

    // Validate cleaned file names
    const validFileNames = cleanedFileNames.filter(name => name && name.trim().length > 0)
    if (validFileNames.length === 0) {
      setResponseStatus(event, 200)
      return {
        statusCode: 200,
        status: 'success',
        results: filesToCheck.map(name => ({
          originalFileName: name,
          cleanedFileName: name.replace(/\s+/g, '_'),
          exists: false,
          fileInfo: null
        }))
      }
    }

    // Create parameterized query for multiple files
    const placeholders = validFileNames.map((_, index) => `$${index + 2}`).join(', ')
    const bulkExistsQuery = `
      SELECT od.id, od.name, od.file_category, od.updated_at, dc.name as category_name,
             COALESCE(json_agg(DISTINCT odd.dept_id) FILTER (WHERE odd.dept_id IS NOT NULL), '[]'::json) as department_ids
      FROM organization_documents od
      LEFT JOIN document_category dc ON od.file_category IS NOT NULL AND od.file_category::text = dc.id::text
      LEFT JOIN document_departments odd ON od.id = odd.document_id
      WHERE od.org_id = $1 AND od.name IN (${placeholders})
      GROUP BY od.id, od.name, od.file_category, od.updated_at, dc.name
    `

    const existingFilesResult = await query(
      bulkExistsQuery,
      [org_id, ...validFileNames]
    )

    // Create a map of existing files for quick lookup
    const existingFilesMap = new Map()
    existingFilesResult.rows.forEach((row: any) => {
      existingFilesMap.set(row.name, {
        id: row.id,
        name: row.name,
        category: row.category_name || 'Uncategorized',
        departments: row.department_ids || [],
        lastUpdated: row.updated_at
      })
    })

    // Build response for each original file
    const results = filesToCheck.map((originalFileName) => {
      const cleanedName = originalFileName.replace(/\s+/g, '_')
      const fileInfo = existingFilesMap.get(cleanedName)

      return {
        originalFileName,
        cleanedFileName: cleanedName,
        exists: !!fileInfo,
        fileInfo: fileInfo || null
      }
    })

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      results
    }
  } catch (error: any) {

    // Handle different types of database errors
    if (error.message?.includes('connection') || error.message?.includes('timeout') || error.code === 'ECONNREFUSED') {
      setResponseStatus(event, 503)
      throw new CustomError(`Database connection failed: ${error.message}`, 503)
    }

    if (error.message?.includes('permission') || error.message?.includes('authentication') || error.code === '28P01') {
      setResponseStatus(event, 403)
      throw new CustomError(`Database access denied: ${error.message}`, 403)
    }

    if (error.code === '3D000') {
      setResponseStatus(event, 500)
      throw new CustomError(`Database does not exist: ${error.message}`, 500)
    }

    if (error.code === '42P01') {
      setResponseStatus(event, 500)
      throw new CustomError(`Table does not exist: ${error.message}`, 500)
    }

    // Return more detailed error in development
    setResponseStatus(event, 500)
    throw new CustomError(`Database query failed: ${error.message} (Code: ${error.code || 'unknown'})`, 500)
  }
})
