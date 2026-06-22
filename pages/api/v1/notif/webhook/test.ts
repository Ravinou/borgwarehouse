import { getUnixTime } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '~/helpers/getServerSession';
import { findUserBySession } from '~/helpers/functions';
import { ConfigService } from '~/services';
import { ErrorResponse, SuccessResponse } from '~/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Bad request on API' });

  const session = await getSession(req, res);
  if (!session) return res.status(401).json({ message: 'You must be logged in.' });

  try {
    const usersList = await ConfigService.getUsersList();
    const user = findUserBySession(usersList, session);
    if (!user)
      return res.status(400).json({ message: 'Invalid user session. Please log out and retry.' });

    if (!user.webhookURL)
      return res.status(422).json({ message: 'You must provide a webhook URL first.' });

    const payload = {
      status: 'test',
      repos: [],
      timestamp: getUnixTime(new Date()),
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user.webhookSecret) headers['X-BorgWarehouse-Secret'] = user.webhookSecret;

    const response = await fetch(user.webhookURL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok)
      return res.status(502).json({ message: `Webhook returned HTTP ${response.status}.` });

    return res.status(200).json({ message: 'Test webhook sent successfully.' });
  } catch (error) {
    return res.status(500).json({ message: `Webhook request failed: ${error}` });
  }
}
