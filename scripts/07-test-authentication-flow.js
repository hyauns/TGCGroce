import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function testAuthenticationFlow() {
  console.log("[v0] Starting comprehensive authentication flow test...\n")

  const testEmail = "test@tcgstore.com"
  const testPassword = "TestPassword123!"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  try {
    // Test 1: User Registration
    console.log("[v0] Test 1: User Registration")
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        firstName: "Test",
        lastName: "User",
      }),
    })

    const registerData = await registerResponse.json()
    console.log(`[v0] Registration Status: ${registerResponse.status}`)
    console.log(`[v0] Registration Response:`, registerData)

    if (registerResponse.ok) {
      console.log("✅ Registration successful")

      // Get verification token from database for testing
      const userResult = await sql`
        SELECT email_verification_token FROM users WHERE email = ${testEmail}
      `

      if (userResult.length > 0) {
        const verificationToken = userResult[0].email_verification_token

        // Test 2: Email Verification
        console.log("\n[v0] Test 2: Email Verification")
        const verifyResponse = await fetch(`${baseUrl}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: verificationToken }),
        })

        const verifyData = await verifyResponse.json()
        console.log(`[v0] Verification Status: ${verifyResponse.status}`)
        console.log(`[v0] Verification Response:`, verifyData)

        if (verifyResponse.ok) {
          console.log("✅ Email verification successful")
        } else {
          console.log("❌ Email verification failed")
        }
      }
    } else {
      console.log("❌ Registration failed")
    }

    // Test 3: User Login
    console.log("\n[v0] Test 3: User Login")
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        rememberMe: false,
      }),
    })

    const loginData = await loginResponse.json()
    console.log(`[v0] Login Status: ${loginResponse.status}`)
    console.log(`[v0] Login Response:`, loginData)

    let authCookie = ""
    if (loginResponse.ok) {
      console.log("✅ Login successful")

      // Extract auth cookie for subsequent requests
      const setCookieHeader = loginResponse.headers.get("set-cookie")
      if (setCookieHeader) {
        authCookie = setCookieHeader.split(";")[0]
      }
    } else {
      console.log("❌ Login failed")
    }

    // Test 4: Session Validation
    console.log("\n[v0] Test 4: Session Validation")
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      method: "GET",
      headers: {
        Cookie: authCookie,
      },
    })

    const sessionData = await sessionResponse.json()
    console.log(`[v0] Session Status: ${sessionResponse.status}`)
    console.log(`[v0] Session Response:`, sessionData)

    if (sessionResponse.ok) {
      console.log("✅ Session validation successful")
    } else {
      console.log("❌ Session validation failed")
    }

    // Test 5: Password Reset Request
    console.log("\n[v0] Test 5: Password Reset Request")
    const forgotResponse = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    })

    const forgotData = await forgotResponse.json()
    console.log(`[v0] Forgot Password Status: ${forgotResponse.status}`)
    console.log(`[v0] Forgot Password Response:`, forgotData)

    if (forgotResponse.ok) {
      console.log("✅ Password reset request successful")

      // Get reset token from database for testing
      const resetResult = await sql`
        SELECT password_reset_token FROM users WHERE email = ${testEmail}
      `

      if (resetResult.length > 0 && resetResult[0].password_reset_token) {
        const resetToken = resetResult[0].password_reset_token

        // Test 6: Password Reset
        console.log("\n[v0] Test 6: Password Reset")
        const newPassword = "NewTestPassword123!"
        const resetResponse = await fetch(`${baseUrl}/api/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: resetToken,
            password: newPassword,
          }),
        })

        const resetData = await resetResponse.json()
        console.log(`[v0] Reset Password Status: ${resetResponse.status}`)
        console.log(`[v0] Reset Password Response:`, resetData)

        if (resetResponse.ok) {
          console.log("✅ Password reset successful")

          // Test 7: Login with New Password
          console.log("\n[v0] Test 7: Login with New Password")
          const newLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: testEmail,
              password: newPassword,
              rememberMe: false,
            }),
          })

          const newLoginData = await newLoginResponse.json()
          console.log(`[v0] New Login Status: ${newLoginResponse.status}`)
          console.log(`[v0] New Login Response:`, newLoginData)

          if (newLoginResponse.ok) {
            console.log("✅ Login with new password successful")
          } else {
            console.log("❌ Login with new password failed")
          }
        } else {
          console.log("❌ Password reset failed")
        }
      }
    } else {
      console.log("❌ Password reset request failed")
    }

    // Test 8: Rate Limiting
    console.log("\n[v0] Test 8: Rate Limiting")
    console.log("[v0] Testing login rate limiting with multiple failed attempts...")

    for (let i = 1; i <= 6; i++) {
      const rateLimitResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "wrongpassword",
          rememberMe: false,
        }),
      })

      console.log(`[v0] Attempt ${i} Status: ${rateLimitResponse.status}`)

      if (rateLimitResponse.status === 429) {
        console.log("✅ Rate limiting working - blocked after multiple failed attempts")
        break
      }

      if (i === 6) {
        console.log("⚠️ Rate limiting may not be working as expected")
      }
    }

    // Test 9: Logout
    console.log("\n[v0] Test 9: Logout")
    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: authCookie,
      },
    })

    console.log(`[v0] Logout Status: ${logoutResponse.status}`)

    if (logoutResponse.ok) {
      console.log("✅ Logout successful")
    } else {
      console.log("❌ Logout failed")
    }

    // Cleanup: Remove test user
    console.log("\n[v0] Cleanup: Removing test user")
    await sql`DELETE FROM user_sessions WHERE user_id = (SELECT id FROM users WHERE email = ${testEmail})`
    await sql`DELETE FROM users WHERE email = ${testEmail}`
    console.log("[v0] Test user cleaned up")

    console.log("\n🎉 Authentication flow testing completed!")
    console.log("[v0] All major authentication features have been tested")
  } catch (error) {
    console.error("[v0] Authentication test error:", error)

    // Cleanup on error
    try {
      await sql`DELETE FROM user_sessions WHERE user_id = (SELECT id FROM users WHERE email = ${testEmail})`
      await sql`DELETE FROM users WHERE email = ${testEmail}`
      console.log("[v0] Cleanup completed after error")
    } catch (cleanupError) {
      console.error("[v0] Cleanup error:", cleanupError)
    }
  }
}

// Run the test
testAuthenticationFlow()
