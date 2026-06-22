import Head from 'next/head';
import { getSession } from '~/helpers/getServerSession';
import { GetServerSidePropsContext } from 'next';

//Components
import MonitoringDashboard from '~/Containers/Monitoring/MonitoringDashboard/MonitoringDashboard';

export default function Monitoring() {
  return (
    <>
      <Head>
        <title>Monitoring - BorgWarehouse</title>
      </Head>

      <MonitoringDashboard />
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
