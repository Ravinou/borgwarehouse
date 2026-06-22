import { useEffect, useState } from 'react';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandWindows,
  IconBrandGitlab,
  IconKey,
  IconLink,
  IconUnlink,
} from '@tabler/icons-react';
import { authClient } from '~/lib/auth-client';

type LinkedAccount = {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: string;
};

type OAuthProvider = {
  id: string;
  name: string;
};

const providerIcons: Record<string, React.ReactNode> = {
  github: <IconBrandGithub size={20} />,
  google: <IconBrandGoogle size={20} />,
  microsoft: <IconBrandWindows size={20} />,
  gitlab: <IconBrandGitlab size={20} />,
  oidc: <IconKey size={20} />,
  credential: null,
};

const providerDisplayNames: Record<string, string> = {
  github: 'GitHub',
  google: 'Google',
  microsoft: 'Microsoft',
  gitlab: 'GitLab',
  credential: 'Password',
};

export default function LinkedAccounts() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/list-accounts').then((r) => r.json()),
      fetch('/api/v1/auth/providers').then((r) => r.json()),
    ])
      .then(([accountsData, providersData]) => {
        setAccounts(accountsData ?? []);
        setProviders(providersData.providers ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const oauthAccounts = accounts.filter((a) => a.providerId !== 'credential');

  const [linking, setLinking] = useState<string | null>(null);

  const handleLink = async (provider: OAuthProvider) => {
    setLinking(provider.id);
    try {
      await authClient.linkSocial({ provider: provider.id as any, callbackURL: '/account' });
    } catch {
      toast.error(`Failed to link ${provider.name}`, toastOptions);
      setLinking(null);
    }
  };

  const handleUnlink = async (account: LinkedAccount) => {
    setUnlinking(account.id);
    try {
      const res = await fetch('/api/auth/unlink-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: account.providerId, accountId: account.accountId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || 'Failed to unlink account', toastOptions);
      } else {
        setAccounts((prev) => prev.filter((a) => a.id !== account.id));
        const name = providerDisplayNames[account.providerId] || account.providerId;
        toast.success(`${name} account unlinked`, toastOptions);
      }
    } catch {
      toast.error('Failed to unlink account', toastOptions);
    } finally {
      setUnlinking(null);
    }
  };

  // Don't render if no OAuth providers are configured
  if (!loading && providers.length === 0) return null;

  const getProviderName = (providerId: string): string => {
    const provider = providers.find((p) => p.id === providerId);
    if (provider) return provider.name;
    return providerDisplayNames[providerId] || providerId;
  };

  return (
    <div className={classes.containerSetting}>
      <div className={classes.settingCategory}>
        <h2>OAuth</h2>
      </div>
      <div className={classes.setting}>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : (
          <>
            {oauthAccounts.length > 0 && (
              <div className={classes.linkedAccountsList}>
                {oauthAccounts.map((account) => (
                  <div key={account.id} className={classes.linkedAccountCard}>
                    <div className={classes.linkedAccountInfo}>
                      <span className={classes.linkedAccountIcon}>
                        {providerIcons[account.providerId] || <IconLink size={20} />}
                      </span>
                      <div>
                        <strong>{getProviderName(account.providerId)}</strong>
                        <small className={classes.linkedAccountDate}>
                          Linked {new Date(account.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                    <button
                      className={classes.unlinkButton}
                      onClick={() => handleUnlink(account)}
                      disabled={unlinking !== null}
                      title={`Unlink ${getProviderName(account.providerId)}`}
                    >
                      <IconUnlink size={16} />
                      {unlinking === account.id ? 'Unlinking...' : 'Unlink'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Show available but not yet linked providers */}
            {providers.filter((p) => !oauthAccounts.some((a) => a.providerId === p.id)).length >
              0 && (
              <div
                className={classes.linkedAccountsList}
                style={{ marginTop: oauthAccounts.length > 0 ? '12px' : 0 }}
              >
                {providers
                  .filter((p) => !oauthAccounts.some((a) => a.providerId === p.id))
                  .map((p) => (
                    <div key={p.id} className={classes.linkedAccountCard}>
                      <div className={classes.linkedAccountInfo}>
                        <span className={classes.linkedAccountIcon}>
                          {providerIcons[p.id] || <IconLink size={20} />}
                        </span>
                        <div>
                          <strong>{p.name}</strong>
                          <small className={classes.linkedAccountDate}>Not linked</small>
                        </div>
                      </div>
                      <button
                        className={classes.linkButton}
                        onClick={() => handleLink(p)}
                        disabled={linking !== null || unlinking !== null}
                        title={`Link ${p.name}`}
                      >
                        <IconLink size={16} />
                        {linking === p.id ? 'Linking...' : 'Link'}
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {oauthAccounts.length === 0 && providers.length === 0 && (
              <p style={{ color: 'var(--text-faint)', fontSize: '0.9em' }}>
                No OAuth accounts linked. Sign in with an OAuth provider to link it.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
