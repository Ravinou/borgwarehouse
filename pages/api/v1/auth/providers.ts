import type { NextApiRequest, NextApiResponse } from 'next';
import { getEnabledProviders, isPasswordLoginEnabled } from '~/lib/auth';

// Public endpoint : no auth required (used on login page)
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res
    .status(200)
    .json({ providers: getEnabledProviders(), passwordLoginEnabled: isPasswordLoginEnabled });
}
