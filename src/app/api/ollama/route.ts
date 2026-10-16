import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.OPENAI_API_KEY && process.env.AETHERIA_PUBLIC_AI === "enabled" && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return NextResponse.json({ connected: true, models: ["OpenAI GPT"], provider: "openai" });
  }
  const base = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  try {
    const response = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(3000), cache: "no-store" });
    if (!response.ok) throw new Error("Ollama unavailable");
    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models.map((m: { name?: string }) => m.name).filter((m: unknown): m is string => typeof m === "string") : [];
    return NextResponse.json({ connected: true, models });
  } catch {
    return NextResponse.json({ connected: false, models: [] });
  }
}
