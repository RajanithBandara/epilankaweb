import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are EpiGuard, an expert AI health assistant for EpiLanka — a public health monitoring platform in Sri Lanka.

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
        const groqResponse = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
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
