import classes from './Footer.module.css';
import packageInfo from '~/package.json';
import { IconBrandGithub, IconWorld } from '@tabler/icons-react';

function Footer() {
  return (
    <footer className={classes.footer}>
      <div className={classes.inner}>
        <a
          className={classes.brand}
          target='_blank'
          href='https://borgwarehouse.com/'
          rel='noreferrer'
        >
          BorgWarehouse
        </a>
        <span className={classes.version}>v{packageInfo.version}</span>
        <span className={classes.sep} aria-hidden='true' />
        <nav className={classes.links}>
          <a
            className={classes.iconLink}
            href='https://github.com/Ravinou/borgwarehouse'
            target='_blank'
            rel='noreferrer'
            aria-label='GitHub repository'
            title='GitHub'
          >
            <IconBrandGithub size={16} stroke={1.75} />
          </a>
          <a
            className={classes.iconLink}
            href='https://borgwarehouse.com/'
            target='_blank'
            rel='noreferrer'
            aria-label='Website'
            title='Website'
          >
            <IconWorld size={16} stroke={1.75} />
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
