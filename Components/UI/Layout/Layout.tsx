import Footer from './Footer/Footer';
import Header from './Header/Header';
import NavSide from './NavSide/NavSide';
import classes from './Layout.module.css';
import { useAuthSession } from '~/lib/auth-client';

type LayoutProps = {
  children: React.ReactNode;
};

function Layout(props: LayoutProps) {
  const { status } = useAuthSession();

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
    // If we're not already on a public page, hard redirect to login.
    // This handles session expiry detected client-side.
    if (
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/setup'
    ) {
      window.location.href = '/login';
      return null;
    }
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
