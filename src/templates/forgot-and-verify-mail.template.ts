import { EmailTemplateType } from 'src/enums/email-teamplate.enum';

export function ForgotAndVerifyMail(name: string, otp: string, type: EmailTemplateType): string {
  // Default messages
  let subjectText = '';
  let introText = '';

  switch (type) {
    case EmailTemplateType.EmailVerify:
      subjectText = 'Your OTP for Email Verification';
      introText = `Your One-Time Password (OTP) for verification is: <strong>${otp}</strong>`;
      break;

    case EmailTemplateType.ForgotPassword:
      subjectText = 'Your OTP for Password Reset';
      introText = `You requested to reset your password. Your One-Time Password (OTP) is: <strong>${otp}</strong>`;
      break;
  }

  return `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 500px; margin: auto;">
      <p>Dear ${name},</p>
      <p>${introText}</p>
      <p>This OTP is valid for <strong>90 seconds</strong>. Please do not share this code with anyone for security reasons.</p>
      ${
        type === EmailTemplateType.ForgotPassword
          ? '<p>If you did not request a password reset, please ignore this email or contact our support team immediately.</p>'
          : '<p>If you did not request this OTP, please ignore this email or contact our support team immediately.</p>'
      }
      <br>
      <p><strong>Best regards,</strong></p>
      <p>Converse Data Solutions</p>
      <p>support@conversedatasolutions.com</p>
    </div>
  `;
}
