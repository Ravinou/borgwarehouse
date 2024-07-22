import Head from 'next/head';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

//Components
import StorageUsedChartBar from '../../Containers/Monitoring/StorageUsedChartBar/StorageUsedChartBar';

export default function Monitoring() {
  return (
    <>
      <Head>
        <title>Monitoring - BorgWarehouse</title>
      </Head>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          //justifyContent: 'center',
          width: '80%',
          height: '100%',
        }}
      >
        <div>
          <h1
            style={{
              color: '#494b7a',
              textAlign: 'center',
              marginTop: '5%',
              marginBottom: '10%',
            }}
          >
            📊 Storage used
          </h1>
          <div
            style={{
              margin: 'auto',
            }}
          >
            <StorageUsedChartBar />
          </div>
        </div>
      </div>
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
