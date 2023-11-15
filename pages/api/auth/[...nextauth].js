//Lib
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from '../../../helpers/functions/auth';
import fs from 'fs';
import path from 'path';

////Use if need getServerSideProps and therefore getServerSession
export const authOptions = {
    providers: [
        CredentialsProvider({
            async authorize(credentials) {
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
                                password:
                                    '$2a$12$20yqRnuaDBH6AE0EvIUcEOzqkuBtn1wDzJdw2Beg8w9S.vEqdso0a',
                                roles: ['admin'],
                                emailAlert: false,
                                appriseAlert: false,
                            },
                        ])
                    );
                }
                let usersList = await fs.promises.readFile(
                    jsonDirectory + '/users.json',
                    'utf8'
                );
                //Parse the usersList
                usersList = JSON.parse(usersList);

                //Step 1 : does the user exist ?
                const userIndex = usersList
                    .map((user) => user.username)
                    .indexOf(username);
                if (userIndex === -1) {
                    throw new Error('Incorrect credentials.');
                }
                const user = usersList[userIndex];

                //Step 2 : Is the password correct ?
                const isValid = await verifyPassword(password, user.password);
                if (!isValid) {
                    throw new Error('Incorrect credentials.');
                }

                //Success
                const account = {
                    name: user.username,
                    email: user.email,
                    id: user.id,
                    roles: user.roles,
                };

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
            if (token) {
                session.user.roles = token.roles;
                session.user.id = token.id;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
