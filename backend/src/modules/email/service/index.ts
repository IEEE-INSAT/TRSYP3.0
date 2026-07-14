import { Inject, Injectable, Logger } from '@nestjs/common';
import { createTransport, type SendMailOptions } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Resend } from 'resend';

export const EMAIL_TRANSPORT = Symbol('EMAIL_TRANSPORT');
export const EMAIL_FROM_ADDRESS = Symbol('EMAIL_FROM_ADDRESS');

export interface EmailTransport {
    sendMail(mail: SendMailOptions): Promise<unknown>;
}

function requireEnvironmentVariable(
    environment: NodeJS.ProcessEnv,
    name: string,
): string {
    const value = environment[name]?.trim();
    if (!value) {
        throw new Error(`${name} must be configured to send email.`);
    }
    return value;
}

function asEmailAddress(value: SendMailOptions['from']): string {
    if (typeof value === 'string') {
        return value;
    }

    if (value && typeof value === 'object' && 'address' in value) {
        const { address, name } = value;
        return name ? `${name} <${address}>` : address;
    }

    throw new Error('Email messages must include a valid from address.');
}

function asRecipient(value: SendMailOptions['to']): string[] {
    if (typeof value === 'string') {
        return [value];
    }

    if (Array.isArray(value)) {
        return value.map((recipient) =>
            typeof recipient === 'string' ? recipient : recipient.address,
        );
    }

    if (value && typeof value === 'object' && 'address' in value) {
        return [value.address];
    }

    throw new Error('Email messages must include at least one recipient.');
}

function createResendTransport(apiKey: string): EmailTransport {
    const resend = new Resend(apiKey);

    return {
        async sendMail(mail: SendMailOptions): Promise<void> {
            const from = asEmailAddress(mail.from);
            const to = asRecipient(mail.to);
            const subject = String(mail.subject ?? '');
            const html = typeof mail.html === 'string' ? mail.html : undefined;
            const text = typeof mail.text === 'string' ? mail.text : undefined;

            if (!html && !text) {
                throw new Error(
                    'Email messages must include HTML or plain text content.',
                );
            }

            const { error } = html
                ? await resend.emails.send({ from, to, subject, html })
                : await resend.emails.send({ from, to, subject, text: text! });

            if (error) {
                throw new Error(`Resend rejected the email: ${error.message}`);
            }
        },
    };
}

export function createEmailTransport(
    environment: NodeJS.ProcessEnv = process.env,
): EmailTransport {
    const provider = (
        environment.EMAIL_PROVIDER ??
        (environment.RESEND_API_KEY ? 'resend' : 'smtp')
    )
        .trim()
        .toLowerCase();

    if (provider === 'resend') {
        return createResendTransport(
            requireEnvironmentVariable(environment, 'RESEND_API_KEY'),
        );
    }

    if (provider !== 'smtp') {
        throw new Error('EMAIL_PROVIDER must be either "resend" or "smtp".');
    }

    const port = Number(environment.SMTP_PORT ?? 465);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('SMTP_PORT must be a valid TCP port number.');
    }

    const options: SMTPTransport.Options = {
        host: environment.SMTP_HOST?.trim() || 'smtp.gmail.com',
        port,
        secure:
            environment.SMTP_SECURE === undefined
                ? port === 465
                : environment.SMTP_SECURE.toLowerCase() === 'true',
        auth: {
            user: requireEnvironmentVariable(environment, 'SMTP_USER'),
            pass: requireEnvironmentVariable(environment, 'SMTP_PASSWORD'),
        },
    };
    return createTransport(options);
}

export function createFromAddress(
    environment: NodeJS.ProcessEnv = process.env,
): string {
    return requireEnvironmentVariable(environment, 'EMAIL_FROM');
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
        private readonly transport: EmailTransport,
        @Inject(EMAIL_FROM_ADDRESS)
        private readonly fromAddress: string,
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
            from: this.fromAddress,
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
            from: this.fromAddress,
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
