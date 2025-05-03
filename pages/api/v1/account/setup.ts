import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService, ConfigService } from '~/services';
import { z } from 'zod';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.DISABLE_AUTO_SETUP === 'true') {
    return ApiResponse.notFound(res);
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return ApiResponse.methodNotAllowed(res);
  }

  const repoList = await ConfigService.getRepoList();
  const usersList = await ConfigService.getUsersList();

  const hasUsers = usersList.length > 0;
  const hasRepos = repoList.length > 0;

  if (req.method === 'GET') {
    try {
      if (hasUsers) {
        return res.status(200).json({ setup: false });
      }
      if (!hasUsers && hasRepos) {
        return ApiResponse.forbidden(
          res,
          'The setup has already been completed, and some repositories are already configured. To reset, please delete the config/repo.json file or rebuild/restore the config/users.json file.'
        );
      }
      return res.status(200).json({ setup: true });
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  } else if (req.method === 'POST') {
    try {
      if (hasUsers || hasRepos) {
        return ApiResponse.notFound(res);
      }

      const setupSchema = z.object({
        username: z
          .string()
          .trim()
          .regex(/^[a-z]{1,20}$/, 'Only a-z characters are allowed (1 to 20 char.)'),
        email: z.string().trim().email('Invalid email address').optional(),
        password: z.string().min(12, 'Password must be at least 12 characters long'),
      });
      const parsedData = setupSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(422).json({ error: parsedData.error.errors[0].message });
      }

      const hashedPassword = await AuthService.hashPassword(parsedData.data.password);

      await ConfigService.updateUsersList([
        {
          id: 0,
          username: parsedData.data.username,
          password: hashedPassword,
          email: parsedData.data.email,
          roles: ['admin'],
        },
      ]);

      return ApiResponse.success(res, 'Setup completed successfully');
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  }
}
