import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export type EnhancedSymptomCategory = {
    category: string;       // e.g. "Early Symptoms", "Severe Symptoms"
    icon: string;           // emoji icon for the category
    items: string[];
};

export type EnhancedPrecautionCategory = {
    category: string;       // e.g. "Prevention", "Hygiene", "Medical Care"
    icon: string;
    items: string[];
};

export type EnhancedDiseaseInfo = {
    disease_name: string;
    severity_level: "low" | "moderate" | "high" | "critical";
    brief_summary: string;
    symptom_categories: EnhancedSymptomCategory[];
    precaution_categories: EnhancedPrecautionCategory[];
    when_to_seek_help: string;
    cached_at: number;
};

function buildPrompt(diseaseName: string, symptoms: string[], precautions: string[]): string {
    return `You are a medical information assistant for a public health platform in Sri Lanka.

Given the following raw disease data, organize it into a structured, readable format. Respond ONLY with valid JSON — no markdown, no explanation.

Disease: ${diseaseName}
Raw Symptoms: ${symptoms.join(", ") || "None provided"}
Raw Precautions: ${precautions.join(", ") || "None provided"}

Return this exact JSON structure:
{
  "disease_name": "${diseaseName}",
  "severity_level": "low|moderate|high|critical",
  "brief_summary": "1-2 sentence overview of the disease and why it matters in Sri Lanka",
  "symptom_categories": [
    {
      "category": "Category Name (e.g. Early Symptoms, Severe Symptoms, Physical Signs)",
      "icon": "single emoji",
      "items": ["symptom 1", "symptom 2"]
    }
  ],
  "precaution_categories": [
    {
      "category": "Category Name (e.g. Prevention, Hygiene, Food Safety, Medical Care)",
      "icon": "single emoji",
      "items": ["precaution 1", "precaution 2"]
    }
  ],
  "when_to_seek_help": "Clear sentence about when to visit a doctor or hospital"
}

Rules:
- Group symptoms into 2-4 meaningful categories based on type/stage
- Group precautions into 2-4 logical categories
- Keep each item concise and actionable
- severity_level must be one of: low, moderate, high, critical
- If symptoms or precautions are empty, use empty arrays
- Respond ONLY with the JSON object, nothing else`;
}

const CACHE_TTL_SECONDS = 21 * 24 * 60 * 60; // 21 days

export async function POST(request: NextRequest) {
    if (!GROQ_API_KEY) {
        return NextResponse.json({ error: "Groq API key not configured" }, { status: 503 });
    }

    let body: { disease_name?: string; symptoms?: string[]; precautions?: string[] };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { disease_name, symptoms = [], precautions = [] } = body;

    if (!disease_name || typeof disease_name !== "string") {
        return NextResponse.json({ error: "disease_name is required" }, { status: 400 });
    }

    // Generate cache key
    const cacheKey = `groq:enhance:v1:${disease_name.toLowerCase()}|${symptoms.sort().join(",")}|${precautions.sort().join(",")}`;

    try {
        // 1. Check Redis Cache First
        if (redis) {
            const cachedValue = await redis.get(cacheKey);
            if (cachedValue) {
                const parsedCache = JSON.parse(cachedValue) as EnhancedDiseaseInfo;
                return NextResponse.json(parsedCache, { status: 200, headers: { "X-Cache": "HIT" } });
            }
        }
    } catch (err) {
        console.error("[Redis] Cache inline read failed. Proceeding to Groq API. Error:", err);
    }

    try {
        // 2. Fetch from Groq API
        const groqResponse = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: "user",
                        content: buildPrompt(disease_name, symptoms, precautions),
                    },
                ],
                temperature: 0.3,
                max_tokens: 1024,
                response_format: { type: "json_object" },
            }),
        });

        if (!groqResponse.ok) {
            const errText = await groqResponse.text();
            console.error("[Groq] API error:", groqResponse.status, errText);
            return NextResponse.json(
                { error: `Groq API error: ${groqResponse.status}` },
                { status: 502 }
            );
        }

        const groqData = await groqResponse.json() as {
            choices: Array<{ message: { content: string } }>;
        };

        const rawContent = groqData.choices?.[0]?.message?.content ?? "{}";
        const enhanced = JSON.parse(rawContent) as EnhancedDiseaseInfo;
        enhanced.cached_at = Date.now();

        // 3. Store in Redis Cache
        try {
            if (redis) {
                await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(enhanced));
            }
        } catch (err) {
            console.error("[Redis] Cache inline write failed. Continuing execution. Error:", err);
        }

        return NextResponse.json(enhanced, { status: 200, headers: { "X-Cache": "MISS" } });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to process with Groq";
        console.error("[Groq] Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
