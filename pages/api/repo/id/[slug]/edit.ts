import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { alertOptions } from '~/types/domain/constants';
import {
  getRepoList,
  updateRepoList,
  tokenController,
  isSshPubKeyDuplicate,
} from '~/helpers/functions';
import { NextApiRequest, NextApiResponse } from 'next';
import ApiResponse from '~/helpers/functions/apiResponse';
import { Repository } from '~/types/domain/config.types';
import { updateRepoShell } from '~/helpers/functions/shell.utils';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

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

  dataHandler(req, res);

  try {
    const { alias, sshPublicKey, storageSize, comment, alert, lanCommand, appendOnlyMode } =
      req.body;
    const slug = req.query.slug;
    const repoList = await getRepoList();
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

    const { stderr } = await updateRepoShell(
      updatedRepo.repositoryName,
      updatedRepo.sshPublicKey,
      updatedRepo.storageSize,
      updatedRepo.appendOnlyMode ?? false
    );
    if (stderr) {
      console.log('Update repository error: ', stderr);
      return ApiResponse.serverError(res);
    }

    const updatedRepoList = [...filteredRepoList, updatedRepo];
    await updateRepoList(updatedRepoList, true);
    return res.status(200).json({ message: `Repository ${repo.repositoryName} has been edited` });
  } catch (error) {
    console.error(error);
    return ApiResponse.serverError(res);
  }
}

const dataHandler = (req: NextApiRequest, res: NextApiResponse) => {
  const slug = req.query.slug;
  if (!slug || Array.isArray(slug)) {
    return ApiResponse.badRequest(res, 'Missing slug or slug is malformed');
  }
  const { alias, sshPublicKey, storageSize, comment, alert, lanCommand, appendOnlyMode } = req.body;
  if (alias !== undefined && typeof alias !== 'string') {
    return ApiResponse.badRequest(res, 'Alias must be a string');
  }
  if (sshPublicKey !== undefined && typeof sshPublicKey !== 'string') {
    return ApiResponse.badRequest(res, 'SSH Public Key must be a string');
  }
  if (storageSize !== undefined && typeof storageSize !== 'number') {
    return ApiResponse.badRequest(res, 'Storage Size must be a number');
  }
  if (comment !== undefined && typeof comment !== 'string') {
    return ApiResponse.badRequest(res, 'Comment must be a string');
  }
  if (alert !== undefined && typeof alert !== 'number') {
    return ApiResponse.badRequest(res, 'Alert must be a number');
  }
  if (lanCommand !== undefined && typeof lanCommand !== 'boolean') {
    return ApiResponse.badRequest(res, 'Lan Command must be a boolean');
  }
  if (appendOnlyMode !== undefined && typeof appendOnlyMode !== 'boolean') {
    return ApiResponse.badRequest(res, 'Append Only Mode must be a boolean');
  }
};
