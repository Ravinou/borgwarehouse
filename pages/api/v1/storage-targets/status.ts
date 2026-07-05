import { getSession } from '~/helpers/getServerSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { BorgWarehouseApiResponse, StorageTargetStatusDTO } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';
import { getStorageTargets } from '~/helpers/functions';
import { ShellService } from '~/services';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BorgWarehouseApiResponse | { statuses: StorageTargetStatusDTO[] }>
) {
  const session = await getSession(req, res);
  if (!session) {
    return ApiResponse.unauthorized(res);
  }

  if (req.method !== 'GET') {
    return ApiResponse.methodNotAllowed(res);
  }

  try {
    const statuses = await ShellService.checkStorageTargets(getStorageTargets());
    return res.status(200).json({ statuses });
  } catch (error) {
    return ApiResponse.serverError(res, error);
  }
}
