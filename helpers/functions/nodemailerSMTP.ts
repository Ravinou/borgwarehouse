//Lib
import nodemailer from 'nodemailer';

export default function nodemailerSMTP() {
  const transporter = nodemailer.createTransport({
    port: parseInt(process.env.MAIL_SMTP_PORT, 10),
    host: process.env.MAIL_SMTP_HOST,
    auth: {
      user: process.env.MAIL_SMTP_LOGIN || '',
      pass: process.env.MAIL_SMTP_PWD || '',
    },
    tls: {
      // false value allow self-signed or invalid TLS certificate
      rejectUnauthorized: process.env.MAIL_REJECT_SELFSIGNED_TLS === 'false' ? false : true,
    },
  });
  return transporter;
}
