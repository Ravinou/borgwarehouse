//Lib
import Head from 'next/head';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from 'next-auth/react';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

//Components
import UserSettings from '../../Containers/UserSettings/UserSettings';

export default function Account() {
  ////Var
  const { status, data } = useSession();

  //Function
  if (status == 'unauthenticated' || status == 'loading') {
    return <p>Loading...</p>;
  }
  return (
    <>
      <Head>
        <title>Account - BorgWarehouse</title>
      </Head>

      <UserSettings status={status} data={data} />
    </>
  );
}

export async function getServerSideProps(context) {
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
