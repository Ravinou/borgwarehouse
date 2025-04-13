import { authOptions } from '~/pages/api/v1/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { BorgWarehouseApiResponse, Repository } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';
import { ConfigService, AuthService, ShellService } from '~/services';
import { isSshPubKeyDuplicate } from '~/helpers/functions';

export default async function handler(
  req: NextApiRequest & { body: Partial<Repository> },
  res: NextApiResponse<BorgWarehouseApiResponse | { repo: Repository }>
) {
  const session = await getServerSession(req, res, authOptions);
  const { authorization } = req.headers;
  if (!session && !authorization) {
    return ApiResponse.unauthorized(res);
  }

  if (req.method == 'GET') {
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
  } else if (req.method == 'PATCH') {
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
      return ApiResponse.serverError(res);
    }

    try {
      validatePatchRequestBody(req);
    } catch (error) {
      if (error instanceof Error) {
        return ApiResponse.badRequest(res, error.message);
      }
      return ApiResponse.badRequest(res, 'Invalid request data');
    }

    try {
      const { alias, sshPublicKey, storageSize, comment, alert, lanCommand, appendOnlyMode } =
        req.body;
      const slug = req.query.slug;
      const repoList = await ConfigService.getRepoList();
      const repoId = parseInt(slug as string, 10);
      const repo = repoList.find((repo) => repo.id === repoId);
      if (!repo) {
        return ApiResponse.notFound(res, 'Repository not found');
      }

      const filteredRepoList = repoList.filter((repo) => repo.id !== repoId);
      if (sshPublicKey && isSshPubKeyDuplicate(sshPublicKey, filteredRepoList)) {
        return res.status(409).json({
          status: 409,
          message:
            'The SSH key is already used in another repository. Please use another key or delete the key from the other repository.',
        });
      }

      const updatedRepo: Repository = {
        ...repo,
        alias: alias ?? repo.alias,
        sshPublicKey: sshPublicKey ?? repo.sshPublicKey,
        storageSize: storageSize ?? repo.storageSize,
        comment: comment ?? repo.comment,
        alert: alert ?? repo.alert,
        lanCommand: lanCommand ?? repo.lanCommand,
        appendOnlyMode: appendOnlyMode ?? repo.appendOnlyMode,
      };

      const { stderr } = await ShellService.updateRepo(
        updatedRepo.repositoryName,
        updatedRepo.sshPublicKey,
        updatedRepo.storageSize,
        updatedRepo.appendOnlyMode ?? false
      );
      if (stderr) {
        console.log('Update repository error: ', stderr);
        throw new Error();
      }

      const updatedRepoList = [...filteredRepoList, updatedRepo];
      await ConfigService.updateRepoList(updatedRepoList, true);

      return res
        .status(200)
        .json({ status: 200, message: `Repository ${repo.repositoryName} has been edited` });
    } catch (error) {
      console.log(error);
      return ApiResponse.serverError(res, error as string);
    }
  } else if (req.method == 'DELETE') {
    try {
      if (!session && authorization) {
        const permissions = await AuthService.tokenController(req.headers);
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
      const repoList = await ConfigService.getRepoList();

      const slug = req.query.slug;
      if (!slug || Array.isArray(slug)) {
        return ApiResponse.badRequest(res, 'Missing slug or slug is malformed');
      }
      const indexToDelete = repoList.map((repo) => repo.id).indexOf(parseInt(slug, 10));

      if (indexToDelete === -1) {
        return ApiResponse.notFound(res, 'Repository not found');
      }

      const { stderr } = await ShellService.deleteRepo(repoList[indexToDelete].repositoryName);

      if (stderr) {
        console.log('Delete repository error: ', stderr);
        return ApiResponse.serverError(res);
      }

      const updatedRepoList = repoList.filter((repo) => repo.id !== parseInt(slug, 10));

      await ConfigService.updateRepoList(updatedRepoList, true);
      return ApiResponse.success(
        res,
        `Repository ${repoList[indexToDelete].repositoryName} deleted`
      );
    } catch (error) {
      console.log(error);
      return ApiResponse.serverError(res);
    }
  } else {
    return ApiResponse.methodNotAllowed(res);
  }
}

const validatePatchRequestBody = (req: NextApiRequest) => {
  const slug = req.query.slug;
  if (!slug || Array.isArray(slug)) {
    throw new Error('Missing slug or slug is malformed');
  }
  if (req.body.alias !== undefined && typeof req.body.alias !== 'string') {
    throw new Error('Alias must be a string');
  }
  if (req.body.sshPublicKey !== undefined && typeof req.body.sshPublicKey !== 'string') {
    throw new Error('SSH Public Key must be a string');
  }
  if (req.body.storageSize !== undefined && typeof req.body.storageSize !== 'number') {
    throw new Error('Storage Size must be a number');
  }
  if (req.body.comment !== undefined && typeof req.body.comment !== 'string') {
    throw new Error('Comment must be a string');
  }
  if (req.body.alert !== undefined && typeof req.body.alert !== 'number') {
    throw new Error('Alert must be a number');
  }
  if (req.body.lanCommand !== undefined && typeof req.body.lanCommand !== 'boolean') {
    throw new Error('Lan Command must be a boolean');
  }
  if (req.body.appendOnlyMode !== undefined && typeof req.body.appendOnlyMode !== 'boolean') {
    throw new Error('Append Only Mode must be a boolean');
  }
};
