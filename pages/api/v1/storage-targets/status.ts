import { getSession } from '~/helpers/getServerSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { BorgWarehouseApiResponse, StorageTargetStatusWithNameDTO } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';
import { getStorageTargets, getStorageTargetsWithNames } from '~/helpers/functions';
import { ShellService } from '~/services';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BorgWarehouseApiResponse | { statuses: StorageTargetStatusWithNameDTO[] }>
) {
  const session = await getSession(req, res);
  if (!session) {
    return ApiResponse.unauthorized(res);
  }

  if (req.method !== 'GET') {
    return ApiResponse.methodNotAllowed(res);
  }

  try {
    const names = new Map(getStorageTargetsWithNames().map((t) => [t.path, t.name]));
    const statuses = await ShellService.checkStorageTargets(getStorageTargets());
    const withName: StorageTargetStatusWithNameDTO[] = statuses.map((s) => ({
      ...s,
      name: names.get(s.path) ?? s.path,
    }));
    return res.status(200).json({ statuses: withName });
  } catch (error) {
    return ApiResponse.serverError(res, error);
  }
}
