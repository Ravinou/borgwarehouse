//Lib
import SetupWizard from '../../Containers/SetupWizard/SetupWizard';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

export default function SetupWizardStep() {
    ////Var
    const router = useRouter();
    const step = router.query.slug;

    return (
        <>
            <Head>
                <title>Setup Wizard - BorgWarehouse</title>
            </Head>
            <SetupWizard step={step} />
        </>
    );
}

export async function getServerSideProps(context) {
    //Var
    const session = await getServerSession(
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
