import Head from 'next/head';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthSession } from '~/lib/auth-client';
import { getSession } from '~/helpers/getServerSession';
import { GetServerSidePropsContext } from 'next';
import { SessionStatus } from '~/types';

//Components
import UserSettings from '~/Containers/UserSettings/UserSettings';

export default function Account() {
  const { status, data } = useAuthSession();

  if (status == 'unauthenticated' || status == 'loading' || !data) {
    return <p>Loading...</p>;
  }
  return (
    <>
      <Head>
        <title>Account - BorgWarehouse</title>
      </Head>

      <UserSettings status={status as SessionStatus} data={data} />
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
