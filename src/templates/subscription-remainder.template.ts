export function subscriptionReminderTemplate(userName: string, endDate: Date): string {
  const formattedDate = endDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = endDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `
<div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 600px; margin: auto; background-color: #ffffff; color: #000000; border-radius: 8px;">
  <p>Dear ${userName},</p>
  
  <p>This is a friendly reminder that your <strong>subscription is going to end soon</strong>.</p>

  <div style="background: #ffffff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 6px;">
    <p><strong>Subscription End Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${formattedTime}</p>
  </div>

  <p>To continue enjoying our services without interruption, please renew your subscription before the above date and time.</p>

  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
  
  <p><strong>Best regards,</strong></p>
  <p>Converse Data Solutions</p>
  <p><a href="mailto:support@conversedatasolutions.com" style="color: #000000; text-decoration: underline;">support@conversedatasolutions.com</a></p>
</div>
  `;
}
