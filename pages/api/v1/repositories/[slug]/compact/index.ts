import { authOptions } from '~/pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { BorgWarehouseApiResponse, Repository } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';
import { ConfigService, AuthService, ShellService } from '~/services';
import repositoryNameCheck from '~/helpers/functions/repositoryNameCheck';


const updateStorage = async () => {
  const storageUsed = await ShellService.getStorageUsed();
  const repoList = await ConfigService.getRepoList();

  //Update the storageUsed value of each repository
  const updatedRepoList = repoList.map((repo) => {
    const repoFiltered = storageUsed.find((x) => x.name === repo.repositoryName);
    if (!repoFiltered) return repo;
    return {
      ...repo,
      storageUsed: repoFiltered.size,
    };
  });

 await ConfigService.updateRepoList(updatedRepoList);
};


export default async function handler(
  req: NextApiRequest & { body: Partial<Repository> },
  res: NextApiResponse<BorgWarehouseApiResponse | { repo: Repository }>
) {
  const session = await getServerSession(req, res, authOptions);
  const { authorization } = req.headers;
  if (!session && !authorization) {
    return ApiResponse.unauthorized(res);
  }

  // Validate slug
  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!slug || !repositoryNameCheck(slug)) {
    return ApiResponse.badRequest(
      res,
      'Slug must be a valid repository name (8-character hexadecimal string)'
    );
  }

  if (req.method == 'POST') {
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
        return ApiResponse.notFound(res, 'No repository with name ' + slug);
      }
      
      if (repo.appendOnlyMode && process.env.DISABLE_COMPACT_APPEND_ONLY === 'true') {
        return res.status(403).json({ status: 403, message: `Repository ${slug} is append-only and the server does not allow compacting` });
      }

      if (req.body.await !== undefined && typeof req.body.await !== 'boolean') {
       throw new Error('await must be a boolean');
      }
      if (req.body.await) {
        await ShellService.compactRepo(slug);
        await updateStorage();
        return res.status(200).json({ status: 200, message: `Repository ${slug} has been compacted` });
      }
      ShellService.compactRepo(slug);
      return res.status(200).json({ status: 200, message: `Repository ${slug} has started compaction` });
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  } 
    return ApiResponse.methodNotAllowed(res);
}

