import Footer from './Footer/Footer';
import Header from './Header/Header';
import NavSide from './NavSide/NavSide';
import classes from './Layout.module.css';
import { useAuthSession } from '~/lib/auth-client';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

type LayoutProps = {
  children: React.ReactNode;
};

function Layout(props: LayoutProps) {
  const { status } = useAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (
      status === 'unauthenticated' &&
      router.pathname !== '/login' &&
      router.pathname !== '/setup'
    ) {
      router.push('/login');
    }
  }, [status, router]);

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
