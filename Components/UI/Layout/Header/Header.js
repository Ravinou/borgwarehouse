//Lib
import classes from './Header.module.css';

//Components
import Nav from './Nav/Nav';

function Header() {
  return (
    <header className={classes.Header}>
      <div className={[classes.flex, 'container'].join(' ')}>
        <div className={classes.logo}>BorgWarehouse</div>

        <nav>
          <Nav />
        </nav>
      </div>
    </header>
  );
}

export default Header;
