import { Inject, Injectable, Logger } from '@nestjs/common';
import {
    createTransport,
    type SendMailOptions,
    type Transporter,
} from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

const SMTP_USER = 'trsyp@ieee.tn';
const SMTP_PASSWORD = 'gljv ubib agfr fgzu';
const FROM_ADDRESS = `"TRSYP 3.0" <${SMTP_USER}>`;
export const EMAIL_TRANSPORT = Symbol('EMAIL_TRANSPORT');

export function createEmailTransport(): Transporter {
    const options: SMTPTransport.Options = {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
        },
    };
    return createTransport(options);
}

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
        @Inject(EMAIL_TRANSPORT)
        private readonly transport: Transporter,
    ) {}

    async sendPasswordResetEmail(
        recipient: string,
        resetUrl: string,
    ): Promise<void> {
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

    async sendAccountVerificationEmail(
        recipient: string,
        verificationUrl: string,
    ): Promise<void> {
        const text = [
            'Welcome to TRSYP 3.0,',
            '',
            'Thanks for creating an account. Verify your email address to activate your TRSYP 3.0 account:',
            verificationUrl,
            '',
            'If you did not create this account, you can safely ignore this email.',
            '',
            'Best regards,',
            'The TRSYP 3.0 Team',
        ].join('\n');

        const mail: SendMailOptions = {
            from: FROM_ADDRESS,
            to: recipient,
            subject: 'Verify your TRSYP 3.0 email address',
            text,
            html: `
        <p>Welcome to TRSYP 3.0,</p>
        <p>Thanks for creating an account. Verify your email address to activate your <strong>TRSYP 3.0</strong> account.</p>
        <p><a href="${escapeHtml(verificationUrl)}">Verify your email address</a></p>
        <p>If you did not create this account, you can safely ignore this email.</p>
        <p>Best regards,<br />The TRSYP 3.0 Team</p>
      `.trim(),
        };

        try {
            await this.transport.sendMail(mail);
        } catch (error) {
            this.logger.error(
                `Failed to send account verification email: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }
}
