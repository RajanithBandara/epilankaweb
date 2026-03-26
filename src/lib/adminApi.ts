import axios from "axios";

export const adminApi = axios.create({
    baseURL:
        process.env.API_BASE_URL ||
        process.env.API_URL ||
        process.env.NEXT_PUBLIC_API_URL, // fallback for existing envs
    headers: {
        "Content-Type": "application/json",
        "x-api-key":
            process.env.API_SECRET_KEY ||
            process.env.SECRET_KEY ||
            process.env.NEXT_PUBLIC_SECRET_KEY ||
            "", // fallback for existing envs
    },
    timeout: 10000,
});
