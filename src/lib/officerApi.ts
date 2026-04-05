import axios from "axios";

const API_BASE =
    process.env.API_BASE_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

const API_KEY =
    process.env.API_SECRET_KEY ||
    process.env.SECRET_KEY ||
    process.env.NEXT_PUBLIC_SECRET_KEY ||
    "";

export function makeOfficerApi(officerJwt?: string | null) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
    };

    if (officerJwt) {
        headers["Authorization"] = `Bearer ${officerJwt}`;
    }

    return axios.create({
        baseURL: API_BASE,
        headers,
        timeout: 15000,
    });
}
