import { Db, MongoClient } from "mongodb";

const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "epilanka";

let cachedClient: MongoClient | null = null;
let cachedClientPromise: Promise<MongoClient> | null = null;

function getMongoUri() {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("MONGODB_URI is not configured.");
    }

    return mongoUri;
}

async function getMongoClient() {
    if (cachedClient) {
        return cachedClient;
    }

    if (!cachedClientPromise) {
        const client = new MongoClient(getMongoUri());
        cachedClientPromise = client.connect();
    }

    cachedClient = await cachedClientPromise;
    return cachedClient;
}

export async function getMongoDb(): Promise<Db> {
    const client = await getMongoClient();
    return client.db(MONGODB_DB_NAME);
}
