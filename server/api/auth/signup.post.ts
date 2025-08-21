export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, password } = body

  // Validate input
  if (!name || !email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name, email, and password are required',
    })
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email format',
    })
  }

  // Password strength validation
  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters long',
    })
  }

  try {
    // In a real app, you would:
    // 1. Check if user already exists
    // 2. Hash the password
    // 3. Save to database
    // 4. Send welcome email
    // 5. Generate and return a JWT token

    /*
    // Example with database operations:
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User already exists'
      })
    }

    const passwordHash = await hashPassword(password)
    const newUser = await createUser({
      name,
      email,
      passwordHash,
      role: 'user'
    })

    // Send welcome email
    await sendWelcomeEmail(email, name)

    const token = generateJWT(newUser)
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return {
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    }
    */

    // For demo purposes, create a mock user
    const user = {
      id: Math.floor(Math.random() * 1000) + 2,
      email: email,
      name: name,
      role: 'user',
      createdAt: new Date().toISOString(),
    }

    return {
      success: true,
      data: user,
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
