import { compare, hash } from 'bcryptjs';
import { IncomingHttpHeaders } from 'http2';
import { ConfigService } from '~/services';
import { Optional, TokenPermissionsType } from '~/types';

export const AuthService = {
  hashPassword: async (password: string): Promise<string> => {
    return await hash(password, 12);
  },

  verifyPassword: async (password: string, hashedPassword: string): Promise<boolean> => {
    return await compare(password, hashedPassword);
  },

  tokenController: async (
    headers: IncomingHttpHeaders
  ): Promise<Optional<TokenPermissionsType>> => {
    const API_KEY = headers.authorization?.split(' ')[1];
    const FROM_IP = headers['x-forwarded-for'] || 'unknown';

    const timestamp = new Date().toISOString();

    try {
      if (process.env.DISABLE_INTEGRATIONS === 'true') {
        console.log(`API auth failed from : ${FROM_IP} [${timestamp}]`);
        return undefined;
      }

      const usersList = await ConfigService.getUsersList();
      const user = usersList.find((u) => u.tokens?.some((t) => t.token === API_KEY));
      if (user) {
        const token = user.tokens?.find((token) => token.token === API_KEY);

        if (token && token.permissions && typeof token.permissions === 'object') {
          console.log(
            `API auth success with the token '${token.name}' of user '${user.username}' from : ${FROM_IP} [${timestamp}]`
          );
          return token.permissions;
        }
      }

      console.log(`API auth failed from : ${FROM_IP} [${timestamp}]`);
      return undefined;
    } catch (error) {
      throw new Error('Error with tokenController');
    }
  },
};
