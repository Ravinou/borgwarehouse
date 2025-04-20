import Image from 'next/image';
import classes from './Header.module.css';
import Nav from './Nav/Nav';

function Header() {
  return (
    <header className={classes.Header}>
      <div className={[classes.flex, 'container'].join(' ')}>
        <div className={classes.logo}>
          <Image
            src='/borgwarehouse-logo-violet.svg'
            alt='BorgWarehouse'
            width={225}
            height={40}
            className={classes.logoImage}
            priority
          />
        </div>

        <nav>
          <Nav />
        </nav>
      </div>
    </header>
  );
}

export default Header;
