import { getSession } from '~/helpers/getServerSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { BorgWarehouseApiResponse, Repository } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';
import { ConfigService, AuthService, ShellService } from '~/services';
import repositoryNameCheck from '~/helpers/functions/repositoryNameCheck';

export default async function handler(
  req: NextApiRequest & { body: { archived?: boolean } },
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

  // Validate body
  if (typeof req.body?.archived !== 'boolean') {
    return ApiResponse.badRequest(res, 'archived must be a boolean');
  }
  const archived = req.body.archived;

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

    // Freeze/unfreeze SSH access server-side (no passphrase needed).
    await ShellService.setRepoArchive(repo.repositoryName, archived);

    // Persist the archived flag on the repository.
    const updatedRepo: Repository = { ...repo, archived };
    const updatedRepoList = [
      ...repoList.filter((repo) => repo.repositoryName !== slug),
      updatedRepo,
    ];
    await ConfigService.updateRepoList(updatedRepoList, true);

    return ApiResponse.success(
      res,
      `Repository ${repo.repositoryName} has been ${archived ? 'archived' : 'unarchived'}`
    );
  } catch (error) {
    return ApiResponse.serverError(res, error);
  }
}
