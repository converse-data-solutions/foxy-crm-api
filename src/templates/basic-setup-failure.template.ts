export function basicSetupFailureTemplate(userName: string): string {
  return `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; line-height: 1.6; color: #333333; border: 1px solid #dcdcdc; padding: 25px; max-width: 550px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
  <p style="margin-top: 0;">Dear ${userName},</p>
  
  <p style="color: #c0392b; font-size: 16px; font-weight: bold; margin-bottom: 20px;">Important: Your Basic Setup Encountered an Issue</p>
  
  <p>We regret to inform you that the initial setup for your applications could not be completed successfully.</p>
  
  <p>This situation can occur due to a temporary technical issue or an incomplete configuration step. Our technical team has been automatically notified and is actively investigating the root cause.</p>
  
  <p style="margin-bottom: 20px;">
    <strong>What you can do:</strong><br>
    &#8226; Please try the setup again after a short while.<br>
    &#8226; If the problem persists, kindly contact our dedicated support team for immediate assistance.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
  
  <p style="margin-bottom: 5px;"><strong>Best regards,</strong></p>
  <p style="margin-top: 0; margin-bottom: 5px;">The Team at Converse Data Solutions</p>
  <p style="margin-top: 0;"><a href="mailto:support@conversedatasolutions.com" style="color: #2980b9; text-decoration: none;">support@conversedatasolutions.com</a></p>
</div>
  `;
}
