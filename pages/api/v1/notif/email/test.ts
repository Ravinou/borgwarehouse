import { getSession } from '~/helpers/getServerSession';
import { findUserBySession } from '~/helpers/functions';
import { NextApiRequest, NextApiResponse } from 'next';
import emailTest from '~/helpers/templates/emailTest';
import { ConfigService, NotifService } from '~/services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405);
  }

  const session = await getSession(req, res);
  if (!session) {
    return res.status(401);
  }

  try {
    const usersList = await ConfigService.getUsersList();
    const user = findUserBySession(usersList, session);
    if (!user) {
      return res.status(400).json({ message: 'Invalid user session. Please log out and retry.' });
    }
    if (!user.email) {
      return res.status(400).json({ message: 'User email is missing' });
    }

    const transporter = NotifService.nodemailerSMTP();
    const mailData = emailTest(user.email, user.username);
    const info = await transporter.sendMail(mailData);
    console.log(info);

    return res.status(200).json({ message: 'Mail successfully sent' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: `An error occurred while sending the email: ${error}` });
  }
}
