import { betterAuth } from 'better-auth';
import { authOptions } from '~/lib/auth-options';

export const auth = betterAuth(authOptions);

export { getEnabledProviders, isPasswordLoginEnabled } from '~/lib/auth-options';
