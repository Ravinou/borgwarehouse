import classes from './Nav.module.css';
import { IconUser, IconLogout, IconSettings, IconChevronDown } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { authClient, useAuthSession } from '~/lib/auth-client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function Nav() {
  const router = useRouter();
  const { status, data } = useAuthSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const onLogoutClickedHandler = async () => {
    await authClient.signOut();
    router.replace('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = data?.user?.image;

  return (
    <ul className={classes.Nav}>
      <li style={{ margin: '0px 15px 0px 0px' }}>
        <div className={classes.userMenu} ref={dropdownRef}>
          <button
            className={classes.userTrigger}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={data?.user?.name ?? 'avatar'}
                width={36}
                height={36}
                className={classes.avatar}
              />
            ) : (
              <IconUser size={28} />
            )}
            {status === 'authenticated' && (
              <span className={classes.username}>{data?.user?.name}</span>
            )}
            <IconChevronDown
              size={16}
              className={`${classes.chevron} ${open ? classes.chevronOpen : ''}`}
            />
          </button>

          {open && (
            <div className={classes.dropdown}>
              <Link href='/account' className={classes.dropdownItem} onClick={() => setOpen(false)}>
                <IconSettings size={16} />
                My Account
              </Link>
              <button
                className={`${classes.dropdownItem} ${classes.dropdownLogout}`}
                onClick={onLogoutClickedHandler}
              >
                <IconLogout size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </li>
    </ul>
  );
}
