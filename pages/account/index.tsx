//Lib
import Head from 'next/head';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from 'next-auth/react';
import { authOptions } from '../api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next';
import { SessionStatus } from '~/types/api/next-auth.types';

//Components
import UserSettings from '~/Containers/UserSettings/UserSettings';

export default function Account() {
  ////Var
  const { status, data } = useSession();

  //Function
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
  //Var
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
