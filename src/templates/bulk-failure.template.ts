export function bulkLeadFailureTemplate(
  userName: string,
  fileName: string,
  errorMessage?: string,
): string {
  return `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; line-height: 1.6; color: #333333; border: 1px solid #dcdcdc; padding: 25px; max-width: 550px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
  <p style="margin-top: 0;">Dear ${userName},</p>

  <p style="color: #c0392b; font-size: 16px; font-weight: bold; margin-bottom: 20px;">Bulk Lead Upload Failed</p>

  <p>We encountered an issue while processing the bulk lead upload from the file: <strong>${fileName}</strong>.</p>

  ${errorMessage ? `<p><strong>Error Details:</strong> ${errorMessage}</p>` : ''}

  <p style="margin-bottom: 20px;">
    <strong>What you can do:</strong><br>
    &#8226; Please check the file and ensure all required fields are correctly formatted.<br>
    &#8226; Retry uploading the file.<br>
    &#8226; If the issue persists, contact our support team for assistance.
  </p>

  <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">

  <p style="margin-bottom: 5px;"><strong>Best regards,</strong></p>
  <p style="margin-top: 0; margin-bottom: 5px;">The Team at Converse Data Solutions</p>
  <p style="margin-top: 0;"><a href="mailto:support@conversedatasolutions.com" style="color: #2980b9; text-decoration: none;">support@conversedatasolutions.com</a></p>
</div>
  `;
}
