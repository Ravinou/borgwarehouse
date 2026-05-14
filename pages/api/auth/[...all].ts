import type { NextApiRequest, NextApiResponse } from 'next';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '~/lib/auth';

// https://better-auth.com/docs/integrations/next#create-api-route
export default toNodeHandler(auth) as (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export const config = {
  api: { bodyParser: false },
};
