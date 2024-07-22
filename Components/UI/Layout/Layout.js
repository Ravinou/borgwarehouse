//Lib
import Footer from './Footer/Footer';
import Header from './Header/Header';
import NavSide from './NavSide/NavSide';
import classes from './Layout.module.css';
import { useSession } from 'next-auth/react';

function Layout(props) {
  //Var
  const { status } = useSession();

  if (status === 'authenticated') {
    return (
      <>
        <Header />
        <NavSide />
        <div className={classes.mainWrapper}>{props.children}</div>
        <Footer />
      </>
    );
  } else if (status === 'unauthenticated') {
    return (
      <>
        <div className={classes.login}>{props.children}</div>
      </>
    );
  }
}

export default Layout;
