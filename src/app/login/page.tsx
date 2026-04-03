import Login from "@/pages/Login";
import { redirect } from "next/navigation";

type LoginPageProps = {
    searchParams?: {
        userId?: string;
        secret?: string;
        expire?: string;
        error?: string;
    };
};

function LoginPage({ searchParams }: LoginPageProps) {
    if (searchParams?.userId && searchParams?.secret) {
        const params = new URLSearchParams();
        params.set('userId', searchParams.userId);
        params.set('secret', searchParams.secret);

        if (searchParams.expire) {
            params.set('expire', searchParams.expire);
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