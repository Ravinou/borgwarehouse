import { promises as fs } from 'fs';
import path from 'path';

export default async function tokenController(API_KEY) {
  const jsonDirectory = path.join(process.cwd(), 'config');
  try {
    const usersList = await fs.readFile(jsonDirectory + '/users.json', 'utf8');
    const users = JSON.parse(usersList);

    const user = users.find(
      (user) => Array.isArray(user.tokens) && user.tokens.some((token) => token.token === API_KEY)
    );
    if (user) {
      const token = user.tokens.find((token) => token.token === API_KEY);

      if (token && token.permissions && typeof token.permissions === 'object') {
        return token.permissions;
      }
    }

    return null;
  } catch (error) {
    throw new Error('Error with tokenController');
  }
}
