import { NextApiRequest, NextApiResponse } from 'next';
import packageInfo from '~/package.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405);
  }
  try {
    return res.status(200).json({ version: packageInfo.version });
  } catch (error: any) {
    return res.status(500).json({
      status: 500,
    });
  }
}
