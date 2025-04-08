import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { BorgWarehouseApiResponse } from '~/types/api/error.types';
import ApiResponse from '~/helpers/functions/apiResponse';
import { ConfigService, AuthService } from '~/services';
import { Repository } from '~/types/domain/config.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BorgWarehouseApiResponse | { repoList: Repository[] }>
) {
  if (req.method !== 'GET') {
    return ApiResponse.methodNotAllowed(res);
  }

  const session = await getServerSession(req, res, authOptions);
  const { authorization } = req.headers;
  if (!session && !authorization) {
    return ApiResponse.unauthorized(res);
  }

  try {
    if (!session && authorization) {
      const permissions = await AuthService.tokenController(req.headers);
      if (!permissions) {
        return ApiResponse.unauthorized(res, 'Invalid API key');
      }
      if (!permissions.read) {
        return ApiResponse.forbidden(res, 'Insufficient permissions');
      }
    }
  } catch (error) {
    return ApiResponse.serverError(res);
  }

  try {
    const repoList = await ConfigService.getRepoList();

    return res.status(200).json({ repoList });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
}
