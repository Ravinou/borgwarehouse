import { exec } from 'child_process';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { promisify } from 'util';
import { getUsersList } from '~/helpers/functions';
import { ErrorResponse, SuccessResponse } from '~/types/api/error.types';
import { authOptions } from '../auth/[...nextauth]';

const execAsync = promisify(exec);

const getAppriseServicesURLs = (services: string[]): string => services.join(' ');

const checkAppriseInstalled = async (): Promise<boolean> => {
  try {
    await execAsync('apprise -V');
    return true;
  } catch {
    return false;
  }
};

const sendNotificationViaPackage = async (urls: string) => {
  const command = `apprise -v -b "This is a test notification from BorgWarehouse !" ${urls}`;
  return execAsync(command);
};

const sendNotificationViaStateless = async (statelessURL: string, urls: string) => {
  const response = await fetch(`${statelessURL}/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, body: 'This is a test notification from BorgWarehouse !' }),
  });
  if (!response.ok) throw new Error(response.statusText);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Bad request on API' });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ message: 'You must be logged in.' });

  try {
    const usersList = await getUsersList();
    const user = usersList.find((u) => u.username === session.user?.name);
    if (!user)
      return res.status(400).json({ message: 'Invalid user session. Please log out and retry.' });

    if (!user.appriseServices || user.appriseServices.length === 0) {
      return res.status(422).json({ message: 'You must provide at least one Apprise URL.' });
    }

    const appriseServicesURLs = getAppriseServicesURLs(user.appriseServices);

    if (user.appriseMode === 'package') {
      if (!(await checkAppriseInstalled())) {
        return res.status(500).json({ message: 'Apprise is not installed as a local package.' });
      }
      await sendNotificationViaPackage(appriseServicesURLs);
    } else if (user.appriseMode === 'stateless') {
      if (!user.appriseStatelessURL) {
        return res.status(500).json({ message: 'Please provide an Apprise stateless API URL.' });
      }
      await sendNotificationViaStateless(user.appriseStatelessURL, appriseServicesURLs);
    } else {
      return res.status(422).json({ message: 'Invalid or unsupported Apprise mode.' });
    }

    return res.status(200).json({ message: 'Notifications successfully sent.' });
  } catch (error) {
    return res.status(500).json({ message: `Error: ${error}` });
  }
}
