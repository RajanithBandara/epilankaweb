/**
 * adminApi.ts — server-side axios factory for FastAPI admin calls.
 *
 * Usage in Next.js API routes:
 *   const jwt = (await cookies()).get('appwrite-admin-jwt')?.value;
 *   const api = makeAdminApi(jwt);
 *   const res = await api.get('/admin/users');
 */
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

/**
 * Creates a pre-configured axios instance.
 * Pass the admin JWT so FastAPI's get_current_admin dependency is satisfied.
 */
export function makeAdminApi(adminJwt?: string | null) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
    };
    if (adminJwt) {
        headers["Authorization"] = `Bearer ${adminJwt}`;
    }
    return axios.create({ baseURL: API_BASE, headers, timeout: 15000 });
}

/** Legacy singleton — no JWT, only for truly public admin routes. */
export const adminApi = makeAdminApi();
