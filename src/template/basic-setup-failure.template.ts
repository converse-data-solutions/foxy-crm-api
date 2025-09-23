export function basicSetupFailureTemplate(userName: string): string {
  return `
<div style="font-family: Arial, sans-serif; border: 1px solid #f5c6cb; padding: 20px; max-width: 500px; margin: auto; background-color: #f8d7da; color: #721c24; border-radius: 8px;">
  <p>Dear ${userName},</p>
  
  <p>We regret to inform you that the <strong>basic setup for your applications could not be completed successfully</strong>.</p>
  
  <p>This may have occurred due to a technical issue or incomplete configuration. Our team has already been notified and is investigating the issue.</p>
  
  <p>Please try again later, or contact our support team if the problem persists.</p>
  
  <hr style="border: none; border-top: 1px solid #f1b0b7; margin: 20px 0;">
  
  <p><strong>Best regards,</strong></p>
  <p>Converse Data Solutions</p>
  <p><a href="mailto:support@conversedatasolutions.com" style="color: #721c24; text-decoration: underline;">support@conversedatasolutions.com</a></p>
</div>
  `;
}
