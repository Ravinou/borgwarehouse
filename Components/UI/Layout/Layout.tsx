import Footer from './Footer/Footer';
import Header from './Header/Header';
import NavSide from './NavSide/NavSide';
import classes from './Layout.module.css';
import { useAuthSession } from '~/lib/auth-client';
import { useEffect } from 'react';

type LayoutProps = {
  children: React.ReactNode;
};

function Layout(props: LayoutProps) {
  const { status } = useAuthSession();

  useEffect(() => {
    if (
      status === 'unauthenticated' &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/setup'
    ) {
      window.location.href = '/login';
    }
  }, [status]);

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

  // status === 'loading': render nothing (SSR already handled auth gate)
  return null;
}

export default Layout;
