import '../styles/default.css';
import Head from 'next/head';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SessionProvider } from 'next-auth/react';
import { AppProps } from 'next/app';
import Router from 'next/router';
import NProgress from 'nprogress';

//Components
import Layout from '../Components/UI/Layout/Layout';
import { LoaderProvider } from '~/contexts/LoaderContext';

NProgress.configure({ showSpinner: false });

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <LoaderProvider>
        <Layout>
          <Head>
            <meta name='viewport' content='width=device-width, initial-scale=1'></meta>
            <link rel='shortcut icon' href='/favicon.ico' />
            <title>BorgWarehouse</title>
          </Head>
          <ToastContainer stacked />
          <Component {...pageProps} />
        </Layout>
      </LoaderProvider>
    </SessionProvider>
  );
}
