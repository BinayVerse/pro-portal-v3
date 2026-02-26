import { defineEventHandler, setResponseStatus, getQuery } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'
import { formatDateTime } from '../../../utils'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

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
  const clientTimezone = queryParams.timezone || 'UTC'
  const userTimezone = clientTimezone

  try {
    const userResult = await query(
      `SELECT u.org_id, u.role_id, o.org_name
      FROM users u
      INNER JOIN organizations o ON u.org_id = o.org_id
      WHERE u.user_id = $1;
      `,
      [userId]
    )

    if (!userResult.rows.length) {
      throw new CustomError('User or organization not found', 404)
    }

    const tokenUserOrg = userResult.rows[0].org_id
    const tokenUserRole = userResult.rows[0].role_id
    const tokenUserId = userId

    // Allow superadmin to request a different org via query param 'org'/'org_id'
    const requestedOrg = queryParams?.org || queryParams?.org_id || null
    const org_id = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

    // Build department filter for Department Admin (role_id = 3)
    let departmentFilter = ''
    let docQueryParams: any[] = [org_id]

    if (tokenUserRole === 3) {
      try {
        const deptResult = await query(
          `SELECT dept_id FROM user_departments WHERE user_id = $1`,
          [String(tokenUserId)],
        )
        const deptIds = deptResult.rows.map((row) => row.dept_id)

        if (deptIds.length > 0) {
          // Department Admin sees: documents in their departments + unassigned documents
          departmentFilter = `AND (
            EXISTS (
              SELECT 1 FROM document_departments dd
              WHERE dd.document_id = d.id AND dd.dept_id = ANY($2)
            )
            OR NOT EXISTS (
              SELECT 1 FROM document_departments dd2
              WHERE dd2.document_id = d.id
            )
          )`
          docQueryParams.push(deptIds)
        }
      } catch (e) {
        console.error('Failed to fetch department assignments for Department Admin:', e)
      }
    }

    // Fetch documents with category information, user who added them, AND departments
    const documentResults = await query(
      `SELECT
          d.id, d.name, d.doc_type, d.document_link, d.content_type,
          d.file_size, d.status, d.updated_at, d.file_category, d.description,
          d.is_summarized AS summarized, d.summary, d.added_by,
          COALESCE(c.name, 'Uncategorized') AS category_name,
          COALESCE(u.name, 'Unknown User') AS uploaded_by_name,
          -- 🔑 Fetch departments as array directly (like users API)
          COALESCE(
            ARRAY_AGG(dd.dept_id) FILTER (WHERE dd.dept_id IS NOT NULL),
            '{}'::uuid[]
          ) AS departments
        FROM organization_documents d
        LEFT JOIN document_category c
          ON d.file_category IS NOT NULL AND d.file_category::text = c.id::text
        LEFT JOIN users u ON d.added_by = u.user_id
        LEFT JOIN document_departments dd ON dd.document_id = d.id
        WHERE d.org_id = $1 ${departmentFilter}
        GROUP BY d.id, d.name, d.doc_type, d.document_link, d.content_type,
                 d.file_size, d.status, d.updated_at, d.file_category, d.description,
                 d.is_summarized, d.summary, d.added_by, c.name, u.name
        ORDER BY d.updated_at DESC;
        `,
      docQueryParams
    )

    // Calculate stats dynamically
    const documents = documentResults.rows
    const totalArtefacts = documents.length
    const processedArtefacts = documents.filter((doc: any) => doc.status === 'processed').length
    const uniqueCategories = new Set(documents.map((doc: any) => doc.category_name || 'Uncategorized'))
    const totalCategories = uniqueCategories.size

    // Calculate total size in bytes, then format
    const totalSizeBytes = documents.reduce((sum: number, doc: any) => {
      return sum + (doc.file_size || 0)
    }, 0)

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'kB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const getFileType = (contentType: string, fileName: string): string => {
      if (contentType) {
        if (contentType.includes('pdf')) return 'PDF'
        if (contentType.includes('word') || contentType.includes('document')) return 'Word'
        if (contentType.includes('text/plain')) return 'TXT'
        if (contentType.includes('text/csv')) return 'CSV'
        if (contentType.includes('text/markdown')) return 'Markdown'
        if (contentType.includes('image')) return 'Image'
      }

      // Fallback to file extension
      const extension = fileName?.split('.').pop()?.toLowerCase()
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

    // Format documents for frontend
    const formattedDocuments = documents.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      description: doc.description || 'No description provided',
      category: doc.category_name || 'Uncategorized',
      type: getFileType(doc.content_type, doc.name),
      size: formatFileSize(doc.file_size || 0),
      status: doc.status,
      uploadedBy: doc.uploaded_by_name || 'Unknown User',
      lastUpdated: formatDateTime(doc.updated_at, userTimezone),
      artefact: doc.name,
      publicUrl: doc.document_link,
      summarized: doc.summarized ? 'Yes' : 'No',
      summary: doc.summary,
      contentType: doc.content_type,
      fileSize: doc.file_size,
      updatedAt: doc.updated_at,
      // 🔑 Include departments as array (like users do)
      departments: doc.departments || [],
    }))

    // Prepare stats object
    const stats = {
      totalArtefacts,
      processedArtefacts,
      totalCategories,
      totalSizeBytes,
      totalSize: formatFileSize(totalSizeBytes)
    }

    setResponseStatus(event, 200)

    return {
      statusCode: 200,
      status: 'success',
      data: {
        artefacts: formattedDocuments,
        stats: stats
      },
      message: formattedDocuments.length > 0 ? 'Artefacts fetched successfully' : 'No artifacts found',
    }
  } catch (err: any) {
    throw new CustomError(err.message || 'Failed to fetch artifacts', 500)
  }
})
