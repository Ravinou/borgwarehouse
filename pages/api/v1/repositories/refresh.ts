import { getUnixTime } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '~/helpers/getServerSession';
import { ConfigService, ShellService } from '~/services';
import { BorgWarehouseApiResponse } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BorgWarehouseApiResponse>
) {
  if (req.method !== 'POST') return ApiResponse.methodNotAllowed(res);

  const session = await getSession(req, res);
  if (!session) return ApiResponse.unauthorized(res);

  try {
    const [repoList, lastSaveList, storageUsed] = await Promise.all([
      ConfigService.getRepoList(),
      ShellService.getLastSaveList(),
      ShellService.getStorageUsed(),
    ]);

    if (repoList.length === 0) {
      return ApiResponse.success(res, 'No repository to refresh.');
    }

    const date = getUnixTime(new Date());

    const updatedRepoList = repoList.map((repo) => {
      const saveEntry = lastSaveList.find((x) => x.repositoryName === repo.repositoryName);
      const storageEntry = storageUsed.find((x) => x.name === repo.repositoryName);

      return {
        ...repo,
        ...(saveEntry && {
          lastSave: saveEntry.lastSave,
          status: date - saveEntry.lastSave <= (repo.alert ?? 0),
        }),
        ...(storageEntry && { storageUsed: storageEntry.size }),
      };
    });

    await ConfigService.updateRepoList(updatedRepoList);
    return ApiResponse.success(res, 'Repositories refreshed successfully.');
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'The check status service is already running' ||
        error.message === 'The storage used service is already running')
    ) {
      return ApiResponse.conflict(res, error.message);
    }
    return ApiResponse.serverError(res, error);
  }
}
