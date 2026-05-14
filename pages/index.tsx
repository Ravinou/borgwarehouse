import { getSession } from '~/helpers/getServerSession';
import { useAuthSession } from '~/lib/auth-client';
import Head from 'next/head';
import RepoList from '../Containers/RepoList/RepoList';
import { GetServerSidePropsContext } from 'next';

export default function Index() {
  const { status } = useAuthSession();

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
  const session = await getSession(context.req, context.res);

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
