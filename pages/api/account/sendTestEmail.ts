import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import nodemailerSMTP from '~/helpers/functions/nodemailerSMTP';
import emailTest from '~/helpers/templates/emailTest';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401);
  }

  try {
    const transporter = nodemailerSMTP();
    if (!session.user?.email || !session.user?.name) {
      return res.status(400).json({ message: 'User email or name is missing' });
    }
    const mailData = emailTest(session.user.email, session.user.name);
    const info = await transporter.sendMail(mailData);
    console.log(info);

    return res.status(200).json({ message: 'Mail successfully sent' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: `An error occurred while sending the email: ${error}` });
  }
}
