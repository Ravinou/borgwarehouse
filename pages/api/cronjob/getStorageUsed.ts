import { NextApiRequest, NextApiResponse } from 'next';
import { getRepoList, updateRepoList, ShellService } from '~/services';
import ApiResponse from '~/helpers/functions/apiResponse';
import { BorgWarehouseApiResponse } from '~/types/api/error.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BorgWarehouseApiResponse>
) {
  if (!req.headers.authorization) {
    return ApiResponse.unauthorized(res);
  }

  const CRONJOB_KEY = process.env.CRONJOB_KEY;
  const ACTION_KEY = req.headers.authorization.split(' ')[1];

  if (req.method !== 'POST' || ACTION_KEY !== CRONJOB_KEY) {
    return ApiResponse.unauthorized(res);
  }

  try {
    //Check the repoList
    const repoList = await getRepoList();
    if (repoList.length === 0) {
      return ApiResponse.success(res, 'Storage cron executed. No repository to check.');
    }

    const storageUsed = await ShellService.getStorageUsed();

    //Update the storageUsed value of each repository
    const updatedRepoList = repoList.map((repo) => {
      const repoFiltered = storageUsed.find((x) => x.name === repo.repositoryName);
      if (!repoFiltered) return repo;
      return {
        ...repo,
        storageUsed: repoFiltered.size,
      };
    });

    await updateRepoList(updatedRepoList);
    return ApiResponse.success(res, 'Storage cron has been executed.');
  } catch (err) {
    console.log(err);
    return ApiResponse.serverError(res);
  }
}
