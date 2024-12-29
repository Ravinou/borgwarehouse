//Lib
import classes from './Nav.module.css';
import { IconUser, IconLogout } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';

export default function Nav() {
  ////Var
  //Get the current route to light the right Item
  const router = useRouter();
  const currentRoute = router.pathname;
  const { status, data } = useSession();

  //Function
  const onLogoutClickedHandler = async () => {
    //This bug is open : https://github.com/nextauthjs/next-auth/issues/1542
    //I put redirect to false and redirect with router.
    //The result on logout click is an ugly piece of page for a few milliseconds before returning to the login page.
    //It's ugly if you are perfectionist but functional and invisible for most of users while waiting for a next-auth fix.
    await signOut({ redirect: false });
    router.replace('/login');
  };

  return (
    <ul className={classes.Nav}>
      <li style={{ margin: '0px 15px 0px 0px' }} className={classes.account}>
        <Link href='/account' className={currentRoute === '/account' ? classes.active : null}>
          <div className={classes.user}>
            <div>
              <IconUser size={28} />
            </div>
            <div className={classes.username}>{status === 'authenticated' && data.user.name}</div>
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
