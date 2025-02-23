import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export default function nodemailerSMTP(): Transporter {
  const config: SMTPTransport.Options = {
    port: parseInt(process.env.MAIL_SMTP_PORT || '587', 10),
    host: process.env.MAIL_SMTP_HOST,
    tls: {
      // false value allow self-signed or invalid TLS certificate
      rejectUnauthorized: process.env.MAIL_REJECT_SELFSIGNED_TLS === 'false' ? false : true,
    },
  };

  const smtpLogin = process.env.MAIL_SMTP_LOGIN || '';
  const smtpPwd = process.env.MAIL_SMTP_PWD || '';

  // Some SMTP servers doesn't require authentication #364
  if (smtpLogin) {
    config.auth = {
      user: smtpLogin,
      pass: smtpPwd,
    };
  }

  const transporter: Transporter = nodemailer.createTransport(config);
  return transporter;
}
