export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export function getPasswordResetTemplate(resetUrl: string, userEmail: string): EmailTemplate {
  return {
    subject: "Reset your TCG Store password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">TCG Store</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Trading Card Game Store</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            
            <p>Hello,</p>
            
            <p>We received a request to reset the password for your TCG Store account associated with <strong>${userEmail}</strong>.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold;
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 30px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Security Notice:</strong><br>
                • This link will expire in 1 hour<br>
                • If you didn't request this reset, please ignore this email<br>
                • Your password will remain unchanged until you create a new one
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If you have any questions, please contact our support team.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The TCG Store Team
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© 2024 TCG Store. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Reset Your TCG Store Password

Hello,

We received a request to reset the password for your TCG Store account associated with ${userEmail}.

To reset your password, click the following link:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

If you have any questions, please contact our support team.

Best regards,
The TCG Store Team

© 2024 TCG Store. All rights reserved.
    `.trim(),
  }
}

export function getEmailVerificationTemplate(verificationUrl: string, userEmail: string): EmailTemplate {
  return {
    subject: "Verify your TCG Store email address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to TCG Store!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Trading Card Game Store</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            
            <p>Hello,</p>
            
            <p>Thank you for creating an account with TCG Store! To complete your registration and start shopping for your favorite trading cards, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold;
                        display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 30px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>What's Next?</strong><br>
                • Browse our extensive collection of trading cards<br>
                • Add items to your wishlist<br>
                • Enjoy secure checkout and fast shipping<br>
                • Track your orders in real-time
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If you didn't create this account, please ignore this email.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The TCG Store Team
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© 2024 TCG Store. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to TCG Store!

Hello,

Thank you for creating an account with TCG Store! To complete your registration and start shopping for your favorite trading cards, please verify your email address.

Click the following link to verify your email:
${verificationUrl}

What's Next?
• Browse our extensive collection of trading cards
• Add items to your wishlist  
• Enjoy secure checkout and fast shipping
• Track your orders in real-time

If you didn't create this account, please ignore this email.

Best regards,
The TCG Store Team

© 2024 TCG Store. All rights reserved.
    `.trim(),
  }
}
