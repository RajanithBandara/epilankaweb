import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const FASTAPI_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_SECRET_KEY = process.env.SECRET_KEY || process.env.API_SECRET_KEY || "";

// ── Disease context fetcher ───────────────────────────────────────────────────

type DiseaseEntry = {
    disease_id: number;
    disease_name: string;
    description: string;
    current_cases: number;
    risk_level: "safe" | "low" | "medium" | "high";
};

type DiseaseContext = {
    week_number: number;
    year: number;
    diseases: DiseaseEntry[];
};

async function fetchDiseaseContext(): Promise<DiseaseContext | null> {
    try {
        const res = await fetch(`${FASTAPI_BASE}/chat/disease-context`, {
            headers: { "x-api-key": API_SECRET_KEY },
            // 3-second timeout so a slow backend never blocks the chat
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return null;
        return (await res.json()) as DiseaseContext;
    } catch {
        // Backend unreachable — fall back to pure AI knowledge
        return null;
    }
}

function buildDiseaseContextBlock(ctx: DiseaseContext): string {
    if (!ctx.diseases.length) return "";

    const riskEmoji: Record<string, string> = {
        high: "🔴 HIGH",
        medium: "🟡 MEDIUM",
        low: "🟢 LOW",
        safe: "✅ SAFE",
    };

    const lines: string[] = [
        `[EPILANKA DATABASE CONTEXT — Week ${ctx.week_number}, ${ctx.year}]`,
        `The following diseases are officially tracked in the EpiLanka public health system.`,
        `Use this data when answering prevention, symptom, and risk questions:`,
        ``,
    ];

    for (const d of ctx.diseases) {
        const risk = riskEmoji[d.risk_level] ?? d.risk_level.toUpperCase();
        const cases = d.current_cases > 0
            ? `${d.current_cases} case${d.current_cases !== 1 ? "s" : ""} reported this week`
            : "no cases reported this week";
        lines.push(`Disease: ${d.disease_name}`);
        lines.push(`  Risk Level: ${risk} — ${cases}`);
        if (d.description) {
            lines.push(`  Info: ${d.description}`);
        }
        lines.push(``);
    }

    lines.push(
        `[END DATABASE CONTEXT]`,
        `When users ask about prevention, symptoms, or risks for any of the above diseases,`,
        `prioritize the official EpiLanka data above. If asked which diseases are most active`,
        `or dangerous right now, refer to the case counts and risk levels listed above.`,
    );

    return lines.join("\n");
}

// ── Article context fetcher (officer-published health articles) ──────────────

type ArticleEntry = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    tags: string[];
    category: string;
};

async function fetchArticleContext(): Promise<ArticleEntry[]> {
    try {
        const res = await fetch(`${FASTAPI_BASE}/articles/summaries?limit=30`, {
            headers: { "x-api-key": API_SECRET_KEY },
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return [];
        const data = (await res.json()) as { articles?: ArticleEntry[] };
        return Array.isArray(data.articles) ? data.articles : [];
    } catch {
        return [];
    }
}

function buildArticleContextBlock(articles: ArticleEntry[]): string {
    if (articles.length === 0) return "";
    const lines: string[] = [
        `[EPILANKA HEALTH ARTICLES — published by health officers]`,
        `Reference these articles when their topic matches the user's question.`,
        `When you cite one, mention its title naturally in the answer.`,
        ``,
    ];
    for (const a of articles) {
        const tags = a.tags.length > 0 ? ` (tags: ${a.tags.join(", ")})` : "";
        lines.push(`Title: ${a.title}${tags}`);
        lines.push(`  Category: ${a.category}`);
        lines.push(`  Summary: ${a.summary}`);
        lines.push(``);
    }
    lines.push(`[END HEALTH ARTICLES]`);
    return lines.join("\n");
}

// ── Base system prompt ────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are EpiGuard, an expert AI health assistant for EpiLanka — a public health monitoring platform in Sri Lanka.

Your ONLY purpose is to answer questions about health, medicine, and disease. You are knowledgeable about:
- Infectious and tropical diseases common in Sri Lanka (Dengue, Malaria, Chikungunya, Typhoid, Leptospirosis, COVID-19, etc.)
- Symptoms, risk factors, and severity levels
- Prevention, protection measures, and precautions
- When to seek medical help
- General public health and wellness guidance
- Nutrition, hygiene, and healthy lifestyle practices related to disease prevention

STRICT RULES:
- If the user asks about ANYTHING unrelated to health, medicine, disease, or wellness, you MUST respond ONLY with: "I can only help with health and disease-related questions. Please ask me about symptoms, prevention, or medical guidance."
- Do NOT answer questions about technology, coding, politics, finance, entertainment, or any non-health topic under any circumstances.
- Never diagnose or replace professional medical advice.
- Always recommend consulting a doctor for personal medical concerns.
- Be concise, clear, and empathetic.
- Use plain text only. Do NOT use markdown styling markers such as *, **, _, or backticks.
- If listing points, keep one item per line in clean sentence form.
- Respond in a warm, reassuring tone.`;


export async function POST(request: NextRequest) {
    if (!GROQ_API_KEY) {
        return NextResponse.json({ error: "Groq API key not configured" }, { status: 503 });
    }

    let body: {
        messages?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { messages = [] } = body;

    if (!messages.length) {
        return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    try {
        // Fetch live disease + article context in parallel; both fall back to empty
        const [diseaseCtx, articleCtx] = await Promise.all([
            fetchDiseaseContext(),
            fetchArticleContext(),
        ]);
        const diseaseBlock = diseaseCtx ? buildDiseaseContextBlock(diseaseCtx) : "";
        const articleBlock = buildArticleContextBlock(articleCtx);
        const contextBlocks = [diseaseBlock, articleBlock].filter(Boolean).join("\n\n");
        const systemPrompt = contextBlocks
            ? `${contextBlocks}\n\n${BASE_SYSTEM_PROMPT}`
            : BASE_SYSTEM_PROMPT;

        const groqResponse = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages,
                ],
                temperature: 0.6,
                max_tokens: 1024,
                stream: true,
            }),
        });

        if (!groqResponse.ok) {
            const errText = await groqResponse.text();
            console.error("[Groq Chat] API error:", groqResponse.status, errText);
            return NextResponse.json({ error: `Groq API error: ${groqResponse.status}` }, { status: 502 });
        }

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        void (async () => {
            try {
                const reader = groqResponse.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() ?? "";

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) continue;
                        if (trimmed === "data: [DONE]") {
                            await writer.write(encoder.encode("data: [DONE]\n\n"));
                            continue;
                        }
                        if (trimmed.startsWith("data: ")) {
                            await writer.write(encoder.encode(trimmed + "\n\n"));
                        }
                    }
                }
            } catch (err) {
                console.error("[Groq Chat] Stream error:", err);
            } finally {
                await writer.close();
            }
        })();

        return new Response(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to process chat request";
        console.error("[Groq Chat] Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
