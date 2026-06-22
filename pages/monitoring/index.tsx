import Head from 'next/head';
import { getSession } from '~/helpers/getServerSession';
import { GetServerSidePropsContext } from 'next';

//Components
import StorageUsedChartBar from '~/Containers/Monitoring/StorageUsedChartBar/StorageUsedChartBar';

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
              color: 'var(--text-strong)',
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
