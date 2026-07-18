import { getSession } from '~/helpers/getServerSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { BorgWarehouseApiResponse } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';
import { ConfigService, AuthService, ShellService } from '~/services';
import repositoryNameCheck from '~/helpers/functions/repositoryNameCheck';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BorgWarehouseApiResponse>
) {
  const session = await getSession(req, res);
  const { authorization } = req.headers;
  if (!session && !authorization) {
    return ApiResponse.unauthorized(res);
  }

  if (req.method !== 'POST') {
    return ApiResponse.methodNotAllowed(res);
  }

  // Validate slug
  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!slug || !repositoryNameCheck(slug)) {
    return ApiResponse.badRequest(
      res,
      'Slug must be a valid repository name (8-character hexadecimal string)'
    );
  }

  try {
    if (!session && authorization) {
      const permissions = await AuthService.tokenController(req.headers);
      if (!permissions) {
        return ApiResponse.unauthorized(res, 'Invalid API key');
      }
      if (!permissions.update) {
        return ApiResponse.forbidden(res, 'Insufficient permissions');
      }
    }
  } catch (error) {
    return ApiResponse.serverError(res, error);
  }

  try {
    const repoList = await ConfigService.getRepoList();
    const repo = repoList.find((repo) => repo.repositoryName === slug);
    if (!repo) {
      return ApiResponse.notFound(res, 'Repository with name ' + slug + ' not found');
    }

    await ShellService.breakLockRepo(repo.repositoryName);

    return ApiResponse.success(res, `Lock on repository ${repo.repositoryName} has been released`);
  } catch (error) {
    console.log(error);
    return ApiResponse.serverError(res, error);
  }
}
