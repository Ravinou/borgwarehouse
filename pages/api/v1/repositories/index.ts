import { authOptions } from '~/pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { BorgWarehouseApiResponse, Repository } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';
import { ConfigService, AuthService, ShellService } from '~/services';
import { isSshPubKeyDuplicate } from '~/helpers/functions';
import { getUnixTime } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    BorgWarehouseApiResponse | { repoList: Repository[] } | { id: number; repositoryName: string }
  >
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
      return ApiResponse.serverError(res, error);
    }

    try {
      const repoList = await ConfigService.getRepoList();

      return res.status(200).json({ repoList });
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  } else if (req.method == 'POST') {
    try {
      if (!session && authorization) {
        const permissions = await AuthService.tokenController(req.headers);
        if (!permissions) {
          return ApiResponse.unauthorized(res, 'Invalid API key');
        }
        if (!permissions.create) {
          return ApiResponse.forbidden(res, 'Insufficient permissions');
        }
      }
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }

    try {
      validatePOSTRequestBody(req);
    } catch (error) {
      if (error instanceof Error) {
        return ApiResponse.badRequest(res, error.message);
      }
      return ApiResponse.badRequest(res, 'Invalid request data');
    }

    try {
      const { alias, sshPublicKey, storageSize, comment, alert, lanCommand, appendOnlyMode } =
        req.body;
      const repoList = await ConfigService.getRepoList();

      if (sshPublicKey && isSshPubKeyDuplicate(sshPublicKey, repoList)) {
        return res.status(409).json({
          status: 409,
          message:
            'The SSH key is already used in another repository. Please use another key or delete the key from the other repository.',
        });
      }

      const newRepo: Repository = {
        id: repoList.length > 0 ? Math.max(...repoList.map((repo) => repo.id)) + 1 : 0,
        alias: alias,
        repositoryName: '',
        status: false,
        lastSave: 0,
        lastStatusAlertSend: getUnixTime(new Date()),
        alert: alert ?? 0,
        storageSize: storageSize,
        storageUsed: 0,
        sshPublicKey: sshPublicKey,
        comment: comment ?? '',
        lanCommand: lanCommand ?? false,
        appendOnlyMode: appendOnlyMode ?? false,
      };

      const { stdout, stderr } = await ShellService.createRepo(
        newRepo.sshPublicKey,
        newRepo.storageSize,
        newRepo.appendOnlyMode ?? false
      );
      if (stderr || !stdout) {
        console.log('Create repository error: ', stderr);
        throw new Error(stderr || 'Unknown error occurred while creating the repository');
      }

      newRepo.repositoryName = stdout.trim();
      const updatedRepoList = [...repoList, newRepo];
      await ConfigService.updateRepoList(updatedRepoList, true);

      return res.status(200).json({ id: newRepo.id, repositoryName: newRepo.repositoryName });
    } catch (error) {
      console.log(error);
      return ApiResponse.serverError(res, error as string);
    }
  } else {
    return ApiResponse.methodNotAllowed(res);
  }
}

const validatePOSTRequestBody = (req: NextApiRequest) => {
  const { alias, sshPublicKey, storageSize, comment, alert, lanCommand, appendOnlyMode } = req.body;
  // Required fields
  if (!alias || typeof alias !== 'string') {
    throw new Error('Alias must be a non-empty string');
  }
  if (!sshPublicKey || typeof sshPublicKey !== 'string') {
    throw new Error('SSH Public Key must be a non-empty string');
  }
  if (typeof storageSize !== 'number' || storageSize <= 0 || !Number.isInteger(storageSize)) {
    throw new Error('Storage Size must be a positive integer');
  }
  // Optional fields
  if (comment != undefined && typeof comment !== 'string') {
    throw new Error('Comment must be a string');
  }
  if (alert != undefined && typeof alert !== 'number') {
    throw new Error('Alert must be a number');
  }
  if (lanCommand != undefined && typeof lanCommand !== 'boolean') {
    throw new Error('Lan Command must be a boolean');
  }
  if (appendOnlyMode != undefined && typeof appendOnlyMode !== 'boolean') {
    throw new Error('Append Only Mode must be a boolean');
  }
};
