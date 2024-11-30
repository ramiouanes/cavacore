import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('app.email.host'),
      port: this.configService.get('app.email.port'),
      secure: this.configService.get('app.email.secure'),
      auth: {
        user: this.configService.get('app.email.user'),
        pass: this.configService.get('app.email.password'),
      },
    });
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {

    if (this.configService.get('NODE_ENV') === 'production') {
      const verificationUrl = `${this.configService.get(
        'app.frontend.url',
      )}/verify-email?token=${token}`;
  
      await this.transporter.sendMail({
        to: email,
        subject: 'Verify your Cavacore account',
        html: `
          <h1>Welcome to Cavacore, ${firstName}!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        `,
      });
    } else {
      console.log(`[DEV MODE] Welcome email would be sent to ${email}`);
    }
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get(
      'app.frontend.url',
    )}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      to: email,
      subject: 'Reset your Cavacore password',
      html: `
        <h1>Hello ${firstName},</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  }
}
