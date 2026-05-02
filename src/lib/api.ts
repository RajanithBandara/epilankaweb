import axios from "axios";
import { account } from "@/lib/appwrite";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Attach a fresh Appwrite JWT to every request.
 * account.createJWT() is lightweight and Appwrite caches the session.
 */
api.interceptors.request.use(async (config) => {
    try {
        const jwtObj = await account.createJWT();
        config.headers.Authorization = `Bearer ${jwtObj.jwt}`;
    } catch {
        // Not logged in — request proceeds without auth header
    }
    return config;
});

export default api;
