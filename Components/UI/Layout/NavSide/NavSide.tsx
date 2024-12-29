//Lib
import classes from './NavSide.module.css';
import { IconServer, IconSettingsAutomation, IconActivityHeartbeat } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

//Composants

export default function NavSide() {
  ////Var
  //Get the current route to light the right Item
  const router = useRouter();
  const currentRoute = router.pathname;

  return (
    <ul className={classes.NavSide}>
      <li className={classes.NavSideItem}>
        <Link href='/' className={currentRoute === '/' ? classes.active : null}>
          <IconServer size={40} />
        </Link>
        <span className={classes.tooltip}>Repositories</span>
      </li>
      <li className={classes.NavSideItem}>
        <Link
          href='/setup-wizard/1'
          className={currentRoute === '/setup-wizard/[slug]' ? classes.active : null}
        >
          <IconSettingsAutomation size={40} />
        </Link>
        <span className={classes.tooltip}>Setup Wizard</span>
      </li>
      <li className={classes.NavSideItem}>
        <Link href='/monitoring' className={currentRoute === '/monitoring' ? classes.active : null}>
          <IconActivityHeartbeat size={40} />
        </Link>
        <span className={classes.tooltip}>Monitoring</span>
      </li>
    </ul>
  );
}
