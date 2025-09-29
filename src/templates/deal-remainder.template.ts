export function dealRemainderTemplate(
  userName: string,
  dealName: string,
  expectedCloseDate: Date,
): string {
  const formattedDate = expectedCloseDate.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9;">
  <p>Hi ${userName},</p>
  
  <p>This is a reminder from the CRM system that the deal <strong>"${dealName}"</strong> is expected to close on <strong>${formattedDate}</strong>, which is less than 24 hours away.</p>
  
  <p>Please ensure that all required actions are completed to facilitate a smooth closure of the deal.</p>

  <p style="color: #d9534f; font-weight: bold;">Action Required: Review and update the deal status if needed.</p>
  
  <br>
  <p>Best regards,</p>
  <p><strong>CRM System</strong></p>
  <p>support@yourcompany.com</p>
</div>
  `;
}
