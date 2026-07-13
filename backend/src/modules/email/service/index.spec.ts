import { describe, expect, it, jest } from '@jest/globals';
import type { Transporter } from 'nodemailer';
import { EmailService } from './index';

describe('EmailService', () => {
  it('sends a branded password reset email with the Supabase recovery link', async () => {
    const transport = {
      sendMail: jest.fn<any>().mockResolvedValue({ messageId: 'message-id' }),
    } as unknown as Transporter;
    const service = new EmailService(transport);
    const resetUrl = 'https://supabase.example/auth/v1/verify?token=abc&type=recovery';

    await service.sendPasswordResetEmail('member@example.com', resetUrl);

    expect(transport.sendMail).toHaveBeenCalledWith({
      from: '"TRSYP 3.0" <trsyp@ieee.tn>',
      to: 'member@example.com',
      subject: 'Reset your TRSYP 3.0 password',
      text: [
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
      ].join('\n'),
      html: expect.stringContaining('Reset your password'),
    });
  });
});
