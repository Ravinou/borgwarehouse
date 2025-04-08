import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { tokenController, isSshPubKeyDuplicate } from '~/helpers/functions';
import { NextApiRequest, NextApiResponse } from 'next';
import ApiResponse from '~/helpers/functions/apiResponse';
import { Repository } from '~/types/domain/config.types';
import { ConfigService, ShellService } from '~/services';

export default async function handler(
  req: NextApiRequest & { body: Partial<Repository> },
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return ApiResponse.methodNotAllowed(res);
  }

  // AUTHENTICATION
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
      if (!permissions.update) {
        return ApiResponse.forbidden(res, 'Insufficient permissions');
      }
    }
  } catch (error) {
    return ApiResponse.serverError(res);
  }

  try {
    validateRequestBody(req);
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

    return res.status(200).json({ message: `Repository ${repo.repositoryName} has been edited` });
  } catch (error) {
    console.log(error);
    return ApiResponse.serverError(res, error as string);
  }
}

const validateRequestBody = (req: NextApiRequest) => {
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
