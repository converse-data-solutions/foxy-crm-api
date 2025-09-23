export interface InvoiceTemplateOptions {
  userName: string;
  amount: number;
  currency: string;
  invoiceNumber?: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  dueDate?: string;
}

export function invoiceTemplate(options: InvoiceTemplateOptions): string {
  const { userName, amount, currency, invoiceNumber, hostedInvoiceUrl, invoicePdf, dueDate } =
    options;

  return `
<div style="font-family: Arial, sans-serif; border: 1px solid #c3e6cb; padding: 20px; max-width: 600px; margin: auto; background-color: #d4edda; color: #155724; border-radius: 8px;">
  <p>Dear ${userName},</p>
  
  <p>We are pleased to inform you that your <strong>invoice has been generated successfully</strong>.</p>

  <div style="background: #fff; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 6px;">
    ${invoiceNumber ? `<p><strong>Invoice Number:</strong> ${invoiceNumber}</p>` : ''}
    <p><strong>Amount:</strong> ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</p>
    ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
  </div>

  ${
    hostedInvoiceUrl || invoicePdf
      ? `<p>You can access your invoice using the following links:</p>
         <ul>
           ${hostedInvoiceUrl ? `<li><a href="${hostedInvoiceUrl}" style="color: #155724;">View Invoice Online</a></li>` : ''}
           ${invoicePdf ? `<li><a href="${invoicePdf}" style="color: #155724;">Download PDF</a></li>` : ''}
         </ul>`
      : ''
  }

  <hr style="border: none; border-top: 1px solid #b1dfbb; margin: 20px 0;">
  
  <p><strong>Best regards,</strong></p>
  <p>Converse Data Solutions</p>
  <p><a href="mailto:support@conversedatasolutions.com" style="color: #155724; text-decoration: underline;">support@conversedatasolutions.com</a></p>
</div>
  `;
}
