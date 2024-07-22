//Lib
import classes from './Footer.module.css';
import packageInfo from '../../../../package.json';

function Footer() {
  return (
    <div className={classes.footer}>
      <p>
        About{' '}
        <a
          className={classes.site}
          target='_blank'
          href='https://borgwarehouse.com/'
          rel='noreferrer'
        >
          BorgWarehouse
        </a>{' '}
        - v{packageInfo.version}
      </p>
    </div>
  );
}

export default Footer;
