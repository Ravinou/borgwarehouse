import fs from 'fs';
import NextAuth, { NextAuthOptions, RequestInternal, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import path from 'path';
import { getUsersList } from '~/services';
import { verifyPassword } from '../../../helpers/functions/auth';

const logLogin = async (message: string, req: Partial<RequestInternal>, success = false) => {
  const ipAddress = req.headers?.['x-forwarded-for'] || 'unknown';
  const timestamp = new Date().toISOString();
  if (success) {
    console.log(`Login success from ${ipAddress} with user ${message} [${timestamp}]`);
  } else {
    console.log(`Login failed from ${ipAddress} : ${message} [${timestamp}]`);
  }
};

interface customUser extends User {
  roles: string[];
}

////Use if need getServerSideProps and therefore getServerSession
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        username: { type: 'text' },
        password: { type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials) {
          throw new Error('Missing credentials');
        }
        const { username, password } = credentials;
        //Read the users file
        //Find the absolute path of the json directory
        const jsonDirectory = path.join(process.cwd(), '/config');
        //Check if the users.json file exists and initialize it if not with admin/admin.
        if (!fs.existsSync(jsonDirectory + '/users.json')) {
          fs.writeFileSync(
            jsonDirectory + '/users.json',
            JSON.stringify([
              {
                id: 0,
                email: '',
                username: 'admin',
                password: '$2a$12$20yqRnuaDBH6AE0EvIUcEOzqkuBtn1wDzJdw2Beg8w9S.vEqdso0a',
                roles: ['admin'],
                emailAlert: false,
                appriseAlert: false,
              },
            ])
          );
        }

        const usersList = await getUsersList();

        //Step 1 : does the user exist ?
        const userIndex = usersList.map((user) => user.username).indexOf(username.toLowerCase());
        if (userIndex === -1) {
          await logLogin(`Bad username ${req.body?.username}`, req);
          throw new Error('Incorrect credentials.');
        }
        const user = usersList[userIndex];

        //Step 2 : Is the password correct ?
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
          await logLogin(`Wrong password for ${req.body?.username}`, req);
          throw new Error('Incorrect credentials.');
        }

        //Success
        const account: customUser = {
          name: user.username,
          email: user.email,
          id: user.id.toString(),
          roles: user.roles,
        };

        await logLogin(req.body?.username, req, true);
        return account;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Persist the role and the ID to the token right after signin. "user" is the response from signin, and we return account.
      if (user) {
        token.roles = user.roles;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client to access to the token info through session().
      if (token && session.user) {
        session.user.roles = token.roles as string[];
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
