import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { BorgWarehouseApiResponse } from '~/types/api/error.types';
import ApiResponse from '~/helpers/functions/apiResponse';
import { getRepoList, tokenController } from '~/helpers/functions';
import { Repository } from '~/types/domain/config.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BorgWarehouseApiResponse | { repo: Repository }>
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
      const permissions = await tokenController(req.headers);
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
    const repoList = await getRepoList();

    const slug = req.query.slug;
    if (!slug || Array.isArray(slug)) {
      return ApiResponse.badRequest(res, 'Missing slug or slug is malformed');
    }

    const repo = repoList.find((repo) => repo.id === parseInt(slug as string, 10));
    if (!repo) {
      return ApiResponse.notFound(res, 'No repository with id #' + req.query.slug);
    }

    return res.status(200).json({ repo });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
}
