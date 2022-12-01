import RepoList from '../../../Containers/RepoList/RepoList';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';

export default function Add() {
    return <RepoList />;
}

export async function getServerSideProps(context) {
    //Var
    const session = await unstable_getServerSession(
        context.req,
        context.res,
        authOptions
    );

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
