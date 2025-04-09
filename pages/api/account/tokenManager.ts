import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import ApiResponse from '~/helpers/functions/apiResponse';
import { ConfigService } from '~/services';
import { getUnixTime } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { BorgWarehouseApiResponse, IntegrationTokenType, TokenPermissionsType } from '~/types';

export default async function handler(
  req: NextApiRequest & { body: Partial<IntegrationTokenType> },
  res: NextApiResponse<
    BorgWarehouseApiResponse | { token: string } | Omit<IntegrationTokenType, 'token'>[]
  >
) {
  // Auth
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return ApiResponse.unauthorized(res);
  }

  if (req.method == 'POST') {
    try {
      validateRequestBody(req);
    } catch (error) {
      if (error instanceof Error) {
        return ApiResponse.badRequest(res, error.message);
      }
      return ApiResponse.badRequest(res, 'Invalid request data');
    }

    try {
      const { name, permissions } = req.body as IntegrationTokenType;

      const usersList = await ConfigService.getUsersList();
      const user = usersList.find((u) => u.username === session.user.name);
      if (!user) {
        return ApiResponse.unauthorized(res);
      }

      const isTokenNameAlreadyExists = user.tokens?.some((t) => t.name === name);
      if (isTokenNameAlreadyExists) {
        return ApiResponse.badRequest(res, 'Token name already exists');
      }

      const newToken: IntegrationTokenType = {
        token: uuidv4(),
        name,
        permissions,
        creation: getUnixTime(new Date()),
      };

      const updatedUsersList = usersList.map((u) => {
        if (u.username === user.username) {
          u.tokens = u.tokens ? [...u.tokens, newToken] : [newToken];
        }
        return u;
      });

      await ConfigService.updateUsersList(updatedUsersList);
      return res.status(200).json({ token: newToken.token });
    } catch (error) {
      console.log(error);
      return ApiResponse.serverError(res);
    }
  } else if (req.method == 'GET') {
    try {
      const usersList = await ConfigService.getUsersList();
      const user = usersList.find((u) => u.username === session.user.name);
      if (!user) {
        return ApiResponse.unauthorized(res);
      }
      // Send the token list without the token value
      const tokenList: Omit<IntegrationTokenType, 'token'>[] =
        user.tokens?.map((t) => ({
          name: t.name,
          creation: t.creation,
          permissions: t.permissions,
        })) || [];

      return res.status(200).json(tokenList);
    } catch (error) {
      console.log(error);
      return ApiResponse.serverError(res);
    }
  } else if (req.method == 'DELETE') {
    try {
      const usersList = await ConfigService.getUsersList();
      const user = usersList.find((u) => u.username === session.user.name);
      if (!user) {
        return ApiResponse.unauthorized(res);
      }

      let { name } = req.body;
      if (!name) {
        return ApiResponse.badRequest(res, 'Missing token name');
      }

      const isTokenNameExists = user.tokens?.some((t) => t.name === name);
      if (!isTokenNameExists) {
        return ApiResponse.badRequest(res, 'Token name not found');
      }

      const updatedUsersList = usersList.map((u) => {
        if (u.username === user.username) {
          u.tokens = u.tokens?.filter((t) => t.name !== name);
        }
        return u;
      });

      await ConfigService.updateUsersList(updatedUsersList);
      return ApiResponse.success(res, 'Token deleted');
    } catch (error) {
      console.log(error);
      return ApiResponse.serverError;
    }
  } else {
    return ApiResponse.methodNotAllowed(res);
  }
}

const validateRequestBody = (
  req: NextApiRequest & { body: { name: string; permissions: TokenPermissionsType } }
) => {
  const { name, permissions } = req.body as { name: string; permissions: TokenPermissionsType };
  if (!name || !permissions) {
    throw new Error('Missing required fields');
  }
  if (
    typeof permissions.create !== 'boolean' ||
    typeof permissions.read !== 'boolean' ||
    typeof permissions.update !== 'boolean' ||
    typeof permissions.delete !== 'boolean'
  ) {
    throw new Error('Invalid permissions');
  }
  const nameRegex = new RegExp('^[a-zA-Z0-9_-]{1,25}$');
  if (!nameRegex.test(name)) {
    throw new Error('Your token name is not valid');
  }
};
