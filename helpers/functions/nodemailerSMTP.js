//Lib
import nodemailer from 'nodemailer';

export default function nodemailerSMTP() {
    const transporter = nodemailer.createTransport({
        port: process.env.MAIL_SMTP_PORT,
        host: process.env.MAIL_SMTP_HOST,
        auth: {
            user: process.env.MAIL_SMTP_LOGIN,
            pass: process.env.MAIL_SMTP_PWD,
        },
        secure: process.env.MAIL_SMTP_SECURE, //Use TLS or not
        tls: {
            // do not fail on invalid certs >> allow self-signed or invalid TLS certificate
            rejectUnauthorized: process.env.MAIL_REJECT_SELFSIGNED_TLS,
        },
    });
    return transporter;
}
