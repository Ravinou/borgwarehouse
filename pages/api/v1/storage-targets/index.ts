import { getSession } from '~/helpers/getServerSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { BorgWarehouseApiResponse, StorageTarget } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';
import { getStorageTargetsWithNames } from '~/helpers/functions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BorgWarehouseApiResponse | { storageTargets: StorageTarget[] }>
) {
  const session = await getSession(req, res);
  if (!session) {
    return ApiResponse.unauthorized(res);
  }

  if (req.method !== 'GET') {
    return ApiResponse.methodNotAllowed(res);
  }

  try {
    return res.status(200).json({ storageTargets: getStorageTargetsWithNames() });
  } catch (error) {
    return ApiResponse.serverError(res, error);
  }
}
