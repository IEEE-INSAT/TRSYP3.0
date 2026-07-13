import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type SendMailOptions, type Transporter } from 'nodemailer';

const SMTP_USER = 'trsyp@ieee.tn';
const SMTP_PASSWORD = 'gljv ubib agfr fgzu';
const FROM_ADDRESS = `"TRSYP 3.0" <${SMTP_USER}>`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };

    return entities[character];
  });
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly transport: Transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    }),
  ) {}

  async sendPasswordResetEmail(recipient: string, resetUrl: string): Promise<void> {
    const text = [
      'Hello,',
      '',
      'We received a request to reset your password for your TRSYP 3.0 account.',
      '',
      'Use the secure link below to choose a new password:',
      resetUrl,
      '',
      'If you did not make this request, you can safely ignore this email. Your password will not be changed.',
      '',
      'Best regards,',
      'The TRSYP 3.0 Team',
    ].join('\n');

    const mail: SendMailOptions = {
      from: FROM_ADDRESS,
      to: recipient,
      subject: 'Reset your TRSYP 3.0 password',
      text,
      html: `
        <p>Hello,</p>
        <p>We received a request to reset your password for your <strong>TRSYP 3.0</strong> account.</p>
        <p><a href="${escapeHtml(resetUrl)}">Reset your password</a></p>
        <p>If you did not make this request, you can safely ignore this email. Your password will not be changed.</p>
        <p>Best regards,<br />The TRSYP 3.0 Team</p>
      `.trim(),
    };

    try {
      await this.transport.sendMail(mail);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
