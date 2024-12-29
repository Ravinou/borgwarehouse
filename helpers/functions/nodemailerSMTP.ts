import nodemailer from 'nodemailer';

export default function nodemailerSMTP() {
  const config = {
    port: parseInt(process.env.MAIL_SMTP_PORT, 10),
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

  const transporter = nodemailer.createTransport(config);
  return transporter;
}
