import { defineEventHandler, setResponseStatus } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'
import ExcelJS from 'exceljs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let userId: string
  let userRole: number
  let userOrgId: string

  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    userId = String(decodedToken.user_id)
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const userResult = await query(
    'SELECT org_id, role_id FROM users WHERE user_id = $1',
    [userId],
  )

  if (!userResult?.rows?.length) {
    setResponseStatus(event, 404)
    throw new CustomError('User not found', 404)
  }

  userOrgId = userResult.rows[0].org_id
  userRole = Number(userResult.rows[0].role_id)

  // Superadmin org override
  const q = getQuery(event) as Record<string, any>
  const requestedOrg = q?.org || q?.org_id || null
  const orgId = userRole === 0 && requestedOrg ? String(requestedOrg) : userOrgId

  try {
    // Fetch all departments for this organization
    const departmentsResult = await query(
      `
      SELECT dept_id, name
      FROM organization_departments
      WHERE org_id = $1 AND status = 'active'
      ORDER BY name ASC
      `,
      [orgId],
    )

    // Fetch roles (excluding superadmin role_id = 0)
    let rolesQuery = 'SELECT role_id, role_name FROM public.roles WHERE role_id != 0 ORDER BY role_id ASC'
    if (userRole === 3) {
      // Department Admin can work with USER role (2) and see their own DEPARTMENT ADMIN role (3)
      rolesQuery = 'SELECT role_id, role_name FROM public.roles WHERE role_id IN (2, 3) ORDER BY role_id ASC'
    }

    const rolesResult = await query(rolesQuery, [])

    const departments = departmentsResult?.rows || []
    // const roles = rolesResult?.rows || []
    let roles = rolesResult?.rows || []

    // Move "User" to last
    roles = roles.sort((a: any, b: any) => {
      if (a.role_name === 'User') return 1
      if (b.role_name === 'User') return -1
      return 0
    })

    // Create a new workbook with ExcelJS
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Users')

    // Add headers
    const headers = ['Name', 'Email', 'Whatsapp Number', 'Role', 'Departments']
    worksheet.addRow(headers)

    // Format header row
    const headerRow = worksheet.getRow(1)

    headerRow.eachCell((cell, colNumber) => {
      if (colNumber <= 5) { // till Departments
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
    })
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

    // Set column widths
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Whatsapp Number', key: 'whatsapp', width: 20 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Departments', key: 'departments', width: 30 },
    ]
    worksheet.getColumn('whatsapp').numFmt = '@'
    // Example + hint for users
    worksheet.getCell('C2').value = ''
    worksheet.getCell('C2').note = 'Enter WhatsApp number like +17008888889'

    // Freeze the header row
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

    // Add data validation for Role column (dropdown) using direct range
    if (roles.length > 0) {
      const roleNames = roles.map((r: any) => r.role_name);
      for (let i = 2; i <= 1000; i++) {
        worksheet.getCell(`D${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          showInputMessage: true,
          showErrorMessage: true,
          error: 'Please select a valid role from the list',
          errorTitle: 'Invalid Role',
          prompt: 'Select a role (Admin or Department Admin or User)',
          promptTitle: 'Role Selection',
          formulae: [`"${roleNames.join(',')}"`], // ✅ correct
        }
      }
      // worksheet.dataValidations.add({
      //   type: 'list',
      //   allowBlank: true,
      //   showInputMessage: true,
      //   showErrorMessage: true,
      //   error: 'Please select a valid role from the list',
      //   errorTitle: 'Invalid Role',
      //   prompt: 'Select a role (Admin or User)',
      //   promptTitle: 'Role Selection',
      //   sqref: 'D2:D1000',
      //   list: [`"${roleNames.join(',')}"`],
      // })
    }

    // Add data validation for Departments column (dropdown) using direct range
    if (departments.length > 0) {
      const departmentNames = departments.map((d: any) => d.name);

      for (let i = 2; i <= 1000; i++) {
        worksheet.getCell(`E${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          showInputMessage: true,
          showErrorMessage: false, // ⚠️ allow manual typing
          error: 'Please select valid departments from the list (comma-separated for multiple)',
          errorTitle: 'Invalid Department',
          prompt: 'Select one department from the list, or type multiple departments separated by commas (e.g., HR, Finance, IT).',
          promptTitle: 'Departments (Multi-select)',
          formulae: [`"${departmentNames.join(',')}"`], // ✅ correct
        }
      }
      // worksheet.dataValidations.add({
      //   type: 'list',
      //   allowBlank: true,
      //   showInputMessage: true,
      //   showErrorMessage: true,
      //   error: 'Please select valid departments from the list (comma-separated for multiple)',
      //   errorTitle: 'Invalid Department',
      //   prompt: 'Select departments (comma-separated for multiple)',
      //   promptTitle: 'Department Selection',
      //   sqref: 'E2:E1000',
      //   list: [`"${departmentNames.join(',')}"`],
      // })
    }

    for (let i = 2; i <= 1000; i++) {
      worksheet.getCell(`C${i}`).dataValidation = {
        type: 'textLength',
        allowBlank: true,
        showErrorMessage: false,
        prompt: 'Format: +17008888889',
        promptTitle: 'WhatsApp Number',
        formulae: [9],
      }
    }

    // Add one empty row for data entry
    // worksheet.addRow(['', '', '', '', ''])

    // Generate Excel file as buffer
    const excelBuffer = await workbook.xlsx.writeBuffer()

    setResponseStatus(event, 200)
    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=users_template.xlsx',
      },
    })
  } catch (err: any) {
    console.error('Error generating Excel template:', err)
    setResponseStatus(event, 500)
    throw new CustomError('Failed to generate Excel template', 500)
  }
})
