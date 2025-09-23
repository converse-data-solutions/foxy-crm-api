export function basicSetupFailureTemplate(userName: string): string {
  return `
<div style="font-family: Arial, sans-serif; border: 1px solid #f5c6cb; padding: 20px; max-width: 500px; margin: auto; background-color: #f8d7da; color: #721c24;">
  <p>Dear ${userName},</p>
  
  <p>We regret to inform you that the <strong>basic setup for your applications could not be completed successfully</strong>.</p>
  
  <p>This may have occurred due to a technical issue or incomplete configuration. Our team has been notified and is already investigating the matter.</p>
  
  <p>Please try again after some time, or contact our support team if the issue persists.</p>
  
  <br>
  <p><strong>Best regards,</strong></p>
  <p>Converse Data Solutions</p>
  <p>support@conversedatasolutions.com</p>
</div>
    `;
}
