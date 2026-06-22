import classes from './NavSide.module.css';
import { IconServer, IconSettingsAutomation, IconActivityHeartbeat } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV_ITEMS = [
  { href: '/', match: '/', label: 'Repositories', Icon: IconServer },
  { href: '/monitoring', match: '/monitoring', label: 'Monitoring', Icon: IconActivityHeartbeat },
  {
    href: '/setup-wizard/1',
    match: '/setup-wizard/[slug]',
    label: 'Setup Wizard',
    Icon: IconSettingsAutomation,
  },
];

export default function NavSide() {
  const router = useRouter();
  const currentRoute = router.pathname;

  return (
    <ul className={classes.NavSide}>
      {NAV_ITEMS.map(({ href, match, label, Icon }) => {
        const isActive = currentRoute === match;
        return (
          <li key={href} className={classes.NavSideItem}>
            <Link
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={`${classes.link} ${isActive ? classes.active : ''}`}
            >
              <Icon size={24} stroke={1.8} />
            </Link>
            <span className={classes.tooltip}>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
