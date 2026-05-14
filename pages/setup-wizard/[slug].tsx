import SetupWizard from '../../Containers/SetupWizard/SetupWizard';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSession } from '~/helpers/getServerSession';
import { GetServerSidePropsContext } from 'next';

export default function SetupWizardStep() {
  ////Var
  const router = useRouter();
  const slug = router.query.slug;
  const step = Array.isArray(slug) ? parseInt(slug[0], 10) : slug ? parseInt(slug, 10) : 1;

  return (
    <>
      <Head>
        <title>Setup Wizard - BorgWarehouse</title>
      </Head>
      <SetupWizard step={step} />
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
