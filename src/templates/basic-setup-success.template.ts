export function basicSetupSuccessTemplate(userName: string): string {
  return `
<div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 500px; margin: auto;">
  <p>Dear ${userName},</p>
  
  <p>We’re glad to inform you that the <strong>basic setup for your applications has been successfully completed</strong>.</p>
  
  <p>You can now log in using your <strong>Base App credentials</strong> to access your account and start exploring.</p>
  
  <p>If you encounter any issues during login or setup, please feel free to reach out to our support team.</p>
  
  <br>
  <p><strong>Best regards,</strong></p>
  <p>Converse Data Solutions</p>
  <p>support@conversedatasolutions.com</p>
</div>
    `;
}
