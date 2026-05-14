import { GetServerSidePropsContext } from 'next';
import RepoList from '~/Containers/RepoList/RepoList';
import { getSession } from '~/helpers/getServerSession';

export default function Add() {
  return <RepoList />;
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
