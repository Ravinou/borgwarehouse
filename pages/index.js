//Lib
import { authOptions } from '../pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

//Lib
import RepoList from '../Containers/RepoList/RepoList';

export default function Index() {
    const { status } = useSession();

    return (
        <>
            {status === 'unauthenticated' || status === 'loading' ? null : (
                <>
                    <Head>
                        {/* <link
                            rel='preload'
                            href='/api/repo'
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
