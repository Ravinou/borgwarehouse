import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  // Add custom properties to the User object in the session
  interface User extends DefaultUser {
    roles?: string[];
    id?: string;
  }

  interface Session {
    user: {
      roles?: string[];
      id?: string;
    } & DefaultSession['user'];
  }

  interface JWT {
    roles?: string[];
    id?: string;
  }
}

export enum SessionStatus {
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  LOADING = 'loading',
}
