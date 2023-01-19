//Lib
import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
    if (req.method == 'POST') {
        //Verify that the user is logged in.
        const session = await unstable_getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).json({ message: 'You must be logged in.' });
            return;
        }

        try {
            let nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                port: process.env.MAIL_SMTP_PORT,
                host: process.env.MAIL_SMTP_HOST,
                auth: {
                    user: process.env.MAIL_SMTP_LOGIN,
                    pass: process.env.MAIL_SMTP_PWD,
                },
                secure: true,
            });

            const mailData = {
                from: process.env.MAIL_SMTP_LOGIN,
                to: 'email@test.fr',
                subject: `Mail test`,
                text: 'Corps de test',
                html: `<div>HTML test</div><p>Sent from: test</p>`,
            };

            transporter.sendMail(mailData, function (err, info) {
                if (err) {
                    console.log(err);
                    res.status(400).json({
                        message:
                            'An error occured while sending the email : ' + err,
                    });
                    return;
                } else {
                    console.log(info);
                    res.status(200).json({
                        message: 'Mail successfully sent.',
                    });
                    return;
                }
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({
                status: 500,
                message: 'API error, contact the administrator.',
            });
        }
    }
}
