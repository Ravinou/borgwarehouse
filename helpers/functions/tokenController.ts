import { promises as fs } from 'fs';
import path from 'path';

export default async function tokenController(API_KEY, FROM_IP) {
  const jsonDirectory = path.join(process.cwd(), 'config');
  const timestamp = new Date().toISOString();
  try {
    if (process.env.DISABLE_INTEGRATIONS === 'true') {
      console.log(`API auth failed from : ${FROM_IP} [${timestamp}]`);
      return null;
    }

    const usersList = await fs.readFile(jsonDirectory + '/users.json', 'utf8');
    const users = JSON.parse(usersList);
    const user = users.find(
      (user) => Array.isArray(user.tokens) && user.tokens.some((token) => token.token === API_KEY)
    );
    if (user) {
      const token = user.tokens.find((token) => token.token === API_KEY);

      if (token && token.permissions && typeof token.permissions === 'object') {
        console.log(
          `API auth success with the token '${token.name}' of user '${user.username}' from : ${FROM_IP} [${timestamp}]`
        );
        return token.permissions;
      }
    }

    console.log(`API auth failed from : ${FROM_IP} [${timestamp}]`);
    return null;
  } catch (error) {
    throw new Error('Error with tokenController');
  }
}
