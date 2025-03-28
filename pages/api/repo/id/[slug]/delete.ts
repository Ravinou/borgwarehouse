import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getRepoList, updateRepoList, tokenController } from '~/helpers/functions';
import { deleteRepoShell } from '~/helpers/functions/shell.utils';

import ApiResponse from '~/helpers/functions/apiResponse';
import { BorgWarehouseApiResponse } from '~/types/api/error.types';
import { authOptions } from '../../../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BorgWarehouseApiResponse>
) {
  if (req.method !== 'DELETE') {
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
      if (!permissions.delete) {
        return ApiResponse.forbidden(res, 'Insufficient permissions');
      }
    }
  } catch (error) {
    return ApiResponse.serverError(res);
  }

  if (process.env.DISABLE_DELETE_REPO === 'true') {
    return ApiResponse.forbidden(res, 'Deletion is disabled on this server');
  }

  try {
    const repoList = await getRepoList();

    const slug = req.query.slug;
    if (!slug || Array.isArray(slug)) {
      return ApiResponse.badRequest(res, 'Missing slug or slug is malformed');
    }
    const indexToDelete = repoList.map((repo) => repo.id).indexOf(parseInt(slug, 10));

    if (indexToDelete === -1) {
      return ApiResponse.notFound(res, 'Repository not found');
    }

    const { stderr } = await deleteRepoShell(repoList[indexToDelete].repositoryName);

    if (stderr) {
      console.log('Delete repository error: ', stderr);
      return ApiResponse.serverError(res);
    }

    const updatedRepoList = repoList.filter((repo) => repo.id !== parseInt(slug, 10));

    await updateRepoList(updatedRepoList, true);
    return ApiResponse.success(res, `Repository ${repoList[indexToDelete].repositoryName} deleted`);
  } catch (error) {
    console.log(error);
    return ApiResponse.serverError(res);
  }
}
