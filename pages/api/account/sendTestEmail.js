import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import nodemailerSMTP from '../../../helpers/functions/nodemailerSMTP';
import emailTest from '../../../helpers/templates/emailTest';

export default async function handler(req, res) {
  if (req.method == 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'You must be logged in.' });
    }

    //Create the SMTP Transporter
    const transporter = nodemailerSMTP();
    //Mail options
    const mailData = emailTest(session.user.email, session.user.name);

    try {
      const info = await transporter.sendMail(mailData);
      console.log(info);
      return res.status(200).json({
        message: 'Mail successfully sent',
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        message: 'An error occurred while sending the email: ' + err,
      });
    }
  }
}
