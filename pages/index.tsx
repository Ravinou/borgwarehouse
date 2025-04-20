import { authOptions } from '~/pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import RepoList from '../Containers/RepoList/RepoList';
import { GetServerSidePropsContext } from 'next';

export default function Index() {
  const { status } = useSession();

  return (
    <>
      {status === 'unauthenticated' || status === 'loading' ? null : (
        <>
          <Head>
            {/* <link
                            rel='preload'
                            href='/api/v1/repositories'
                            as='fetch'
                            crossorigin='anonymous'
                        ></link> */}
            <title>Repositories - BorgWarehouse</title>
          </Head>
          <RepoList />
        </>
      )}
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
