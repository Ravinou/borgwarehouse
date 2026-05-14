import Head from 'next/head';
import { useAuthSession } from '~/lib/auth-client';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Error404() {
  const { status } = useAuthSession();
  const router = useRouter();

  if (status === 'authenticated') {
    return (
      <>
        <Head>
          <title>404 - Page not found</title>
        </Head>
        <div
          style={{
            marginTop: '30px',
            height: '60%',
            width: '60%',
            position: 'absolute',
          }}
        >
          <Image src='/404.svg' alt='404 - Page not found' layout='fill' />
        </div>
      </>
    );
  } else {
    router.replace('/login');
  }
}
