export function taskAssignmentTemplate(
  userName: string,
  taskName: string,
  entityName: string,
  priority: string,
): string {
  return `
<div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 500px; margin: auto;">
  <p>Dear ${userName},</p>
  
  <p>You have been <strong>assigned a new task</strong> in the system.</p>
  
  <p><strong>Task:</strong> ${taskName}</p>
  <p><strong>Task Priority:</strong> ${priority}</p>
  <p><strong>Related To:</strong> ${entityName}</p>
  
  <p>Please log in to your account to review and take necessary actions.</p>
  
  <br>
  <p><strong>Best regards,</strong></p>
  <p>Converse Data Solutions</p>
  <p>support@conversedatasolutions.com</p>
</div>
    `;
}
