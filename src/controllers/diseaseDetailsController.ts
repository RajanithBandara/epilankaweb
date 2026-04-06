import { getMongoDb } from "@/lib/mongodb";

const COLLECTION_NAME = "disease_details";

export type DiseaseDetailsDocument = {
    disease_id: number;
    symptoms: string[];
    precautions: string[];
    createdAt: Date;
    updatedAt: Date;
};

type CreateDiseaseDetailsInput = {
    disease_id: number;
    symptoms?: unknown;
    precautions?: unknown;
};

type UpdateDiseaseDetailsInput = {
    symptoms?: unknown;
    precautions?: unknown;
};

function normalizeStringArray(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0);
}

function serializeDiseaseDetails(document: DiseaseDetailsDocument) {
    return {
        disease_id: document.disease_id,
        symptoms: document.symptoms,
        precautions: document.precautions,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
    };
}

async function getDiseaseDetailsCollection() {
    const db = await getMongoDb();
    const collection = db.collection<DiseaseDetailsDocument>(COLLECTION_NAME);

    await collection.createIndex({ disease_id: 1 }, { unique: true });

    return collection;
}

export async function listDiseaseDetails() {
    const collection = await getDiseaseDetailsCollection();
    const documents = await collection.find({}).sort({ disease_id: 1 }).toArray();

    return documents.map(serializeDiseaseDetails);
}

export async function getDiseaseDetailsByDiseaseId(diseaseId: number) {
    const collection = await getDiseaseDetailsCollection();
    const document = await collection.findOne({ disease_id: diseaseId });

    if (!document) {
        return null;
    }

    return serializeDiseaseDetails(document);
}

export async function createDiseaseDetails(input: CreateDiseaseDetailsInput) {
    const collection = await getDiseaseDetailsCollection();

    const now = new Date();
    const document: DiseaseDetailsDocument = {
        disease_id: input.disease_id,
        symptoms: normalizeStringArray(input.symptoms),
        precautions: normalizeStringArray(input.precautions),
        createdAt: now,
        updatedAt: now,
    };

    await collection.insertOne(document);

    return serializeDiseaseDetails(document);
}

export async function updateDiseaseDetails(diseaseId: number, input: UpdateDiseaseDetailsInput) {
    const collection = await getDiseaseDetailsCollection();

    const updatePayload: Partial<DiseaseDetailsDocument> = {
        updatedAt: new Date(),
    };

    if (input.symptoms !== undefined) {
        updatePayload.symptoms = normalizeStringArray(input.symptoms);
    }

    if (input.precautions !== undefined) {
        updatePayload.precautions = normalizeStringArray(input.precautions);
    }

    const result = await collection.findOneAndUpdate(
        { disease_id: diseaseId },
        { $set: updatePayload },
        { returnDocument: "after" }
    );

    if (!result) {
        return null;
    }

    return serializeDiseaseDetails(result);
}

export async function deleteDiseaseDetails(diseaseId: number) {
    const collection = await getDiseaseDetailsCollection();
    const result = await collection.deleteOne({ disease_id: diseaseId });
    return result.deletedCount > 0;
}
