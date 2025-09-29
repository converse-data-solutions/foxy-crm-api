export function emailVerifyTemplate(name: string, otp: string): string {
  return `
      <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 500px; margin: auto;">
        <p>Dear ${name},</p>
        <p>Your One-Time Password (OTP) for verification is: <strong>${otp}</strong></p>
        <p>This OTP is valid for <strong>90 seconds</strong>. Please do not share this code with anyone for security reasons.</p>
        <p>If you did not request this OTP, please ignore this email or contact our support team immediately.</p>
        <br>
        <p><strong>Best regards,</strong></p>
        <p>Converse Data Solutions</p>
        <p>support@conversedatasolutions.com</p>
      </div>
    `;
}
