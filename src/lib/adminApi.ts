import axios from "axios";

export const adminApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL, // FastAPI / Express URL
    headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_SECRET_KEY!, // SERVER ONLY
    },
    timeout: 10000,
});
