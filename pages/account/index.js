//Lib
import Head from 'next/head';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from 'next-auth/react';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';

//Components
import UserSettings from '../../Containers/UserSettings/UserSettings';

export default function Account() {
    ////Var
    const { status, data } = useSession();

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
