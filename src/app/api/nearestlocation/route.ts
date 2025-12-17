import axios from "axios";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");

    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/map/nearestlocation`,
        {
            params: { latitude, longitude },
            headers: {
                "x-api-key": process.env.NEXT_PUBLIC_SECRET_KEY
            }
        }
    );

    return Response.json(response.data);
}
