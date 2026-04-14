import Login from "@/pages/Login";
import { redirect } from "next/navigation";

type LoginPageProps = {
    searchParams?: Promise<{
        userId?: string;
        secret?: string;
        expire?: string;
        error?: string;
    }>;
};

async function LoginPage({ searchParams }: LoginPageProps) {
    const paramsObj = searchParams ? await searchParams : undefined;

    if (paramsObj?.userId && paramsObj?.secret) {
        const params = new URLSearchParams();
        params.set('userId', paramsObj.userId);
        params.set('secret', paramsObj.secret);

        if (paramsObj.expire) {
            params.set('expire', paramsObj.expire);
        }

        redirect(`/reset-password?${params.toString()}`);
    }

    return (
        <>
            <Login/>
        </>
    );
}

export default LoginPage;