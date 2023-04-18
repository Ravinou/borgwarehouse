//Lib
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import nodemailerSMTP from '../../../helpers/functions/nodemailerSMTP';
import emailTest from '../../../helpers/templates/emailTest';

export default async function handler(req, res) {
    if (req.method == 'POST') {
        //Verify that the user is logged in.
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).json({ message: 'You must be logged in.' });
            return;
        }

        //Create the SMTP Transporter
        const transporter = nodemailerSMTP();

        //Mail options
        const mailData = emailTest(session.user.email, session.user.name);

        //Send mail
        try {
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
