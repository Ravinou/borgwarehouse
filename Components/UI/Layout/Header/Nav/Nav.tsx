import classes from './Nav.module.css';
import { IconUser, IconLogout } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { authClient, useAuthSession } from '~/lib/auth-client';

export default function Nav() {
  const router = useRouter();
  const currentRoute = router.pathname;
  const { status, data } = useAuthSession();

  const onLogoutClickedHandler = async () => {
    await authClient.signOut();
    router.replace('/login');
  };

  return (
    <ul className={classes.Nav}>
      <li style={{ margin: '0px 15px 0px 0px' }} className={classes.account}>
        <Link href='/account' className={currentRoute === '/account' ? classes.active : undefined}>
          <div className={classes.user}>
            <div>
              <IconUser size={28} />
            </div>
            <div className={classes.username}>{status === 'authenticated' && data?.user?.name}</div>
          </div>
        </Link>
      </li>

      <li>
        <div className={classes.logout}>
          <a onClick={onLogoutClickedHandler}>
            <IconLogout size={28} />
          </a>
        </div>
      </li>
    </ul>
  );
}
