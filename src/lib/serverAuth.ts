import { cookies } from "next/headers";
import { Client, Account } from "node-appwrite";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";

export type ServerUser = {
    id: string;
    name: string;
    email: string;
    labels: string[];
};

async function userFromJwt(jwt: string): Promise<ServerUser | null> {
    if (!ENDPOINT || !PROJECT_ID) return null;
    try {
        const client = new Client()
            .setEndpoint(ENDPOINT)
            .setProject(PROJECT_ID)
            .setJWT(jwt);
        const account = new Account(client);
        const user = await account.get();
        return {
            id: user.$id,
            name: user.name ?? "",
            email: user.email ?? "",
            labels: (user.labels ?? []) as string[],
        };
    } catch {
        return null;
    }
}

export async function getCurrentUser(): Promise<ServerUser | null> {
    const jwt = (await cookies()).get("appwrite-jwt")?.value;
    if (!jwt) return null;
    return userFromJwt(jwt);
}

export async function getCurrentOfficer(): Promise<ServerUser | null> {
    const jwt = (await cookies()).get("appwrite-officer-jwt")?.value;
    if (!jwt) return null;
    const user = await userFromJwt(jwt);
    if (!user) return null;
    if (!user.labels.includes("officer")) return null;
    return user;
}
