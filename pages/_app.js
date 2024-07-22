//Lib
import '../styles/default.css';
import Head from 'next/head';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SessionProvider } from 'next-auth/react';

//Components
import Layout from '../Components/UI/Layout/Layout';

export default function MyApp({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <Layout>
        <Head>
          <meta name='viewport' content='width=device-width, initial-scale=1'></meta>
          <link rel='shortcut icon' href='/favicon.ico' />
          <title>BorgWarehouse</title>
        </Head>
        <ToastContainer stacked />
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}
