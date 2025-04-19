import { NextApiRequest, NextApiResponse } from 'next';
import ApiResponse from '~/helpers/functions/apiResponse';
import packageInfo from '~/package.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405);
  }
  try {
    return res.status(200).json({ version: packageInfo.version });
  } catch (error) {
    return ApiResponse.serverError(res, error);
  }
}
