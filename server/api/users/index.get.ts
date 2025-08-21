export default defineEventHandler(async (event) => {
  try {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Mock users data
    // In a real app, this would come from your database
    const users = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        status: 'active' as const,
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        status: 'active' as const,
        createdAt: '2024-01-14T15:45:00Z',
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'user',
        status: 'inactive' as const,
        createdAt: '2024-01-13T09:20:00Z',
      },
      {
        id: 4,
        name: 'Alice Williams',
        email: 'alice@example.com',
        role: 'user',
        status: 'active' as const,
        createdAt: '2024-01-12T14:10:00Z',
      },
    ]

    /*
    // Example with real database query:
    const { page = 1, limit = 10, search, status } = getQuery(event)
    
    let query = `
      SELECT id, name, email, role, status, created_at
      FROM users 
      WHERE 1=1
    `
    const params = []
    
    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 2})`
      params.push(`%${search}%`, `%${search}%`)
    }
    
    if (status) {
      query += ` AND status = $${params.length + 1}`
      params.push(status)
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, (page - 1) * limit)
    
    const users = await db.query(query, params)
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM users WHERE 1=1`
    const countParams = []
    
    if (search) {
      countQuery += ` AND (name ILIKE $${countParams.length + 1} OR email ILIKE $${countParams.length + 2})`
      countParams.push(`%${search}%`, `%${search}%`)
    }
    
    if (status) {
      countQuery += ` AND status = $${countParams.length + 1}`
      countParams.push(status)
    }
    
    const { rows: [{ count }] } = await db.query(countQuery, countParams)
    
    return {
      success: true,
      data: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    }
    */

    return {
      success: true,
      data: users,
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users',
    })
  }
})
