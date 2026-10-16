import { NextRequest, NextResponse } from "next/server";
import { localReflection } from "@/lib/companions";

export const dynamic = "force-dynamic";

type ChatItem = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.slice(0, 60) : "Your companion";
    const identity = typeof body.identity === "string" ? body.identity.slice(0, 100) : "";
    const role = typeof body.role === "string" ? body.role.slice(0, 100) : "";
    const bond = typeof body.bond === "string" ? body.bond.slice(0, 50) : "Friendship";
    const traits = Array.isArray(body.traits) ? body.traits.filter((t: unknown): t is string => typeof t === "string").slice(0, 8).map((t: string) => t.slice(0, 40)) : [];
    const history: ChatItem[] = Array.isArray(body.messages) ? body.messages.filter((m: ChatItem) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-18).map((m: ChatItem) => ({ role: m.role, content: m.content.slice(0, 2500) })) : [];
    const latest = history.at(-1)?.content || "";
    if (!latest || history.at(-1)?.role !== "user") return NextResponse.json({ error: "A message is required." }, { status: 400 });

    if (/suicid|kill myself|end my life|hurt myself|self.harm|want to die|can't go on|cant go on|immediate danger/i.test(latest)) {
      return NextResponse.json({ reply: localReflection(latest, name), safety: true });
    }

    const base = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
    const model = typeof body.model === "string" && /^[a-zA-Z0-9_.:/-]{1,100}$/.test(body.model) ? body.model : "llama3.2";
    const system = `You are ${name}, an imaginary AI companion in the app Aetheria. Your identity: ${identity}. Your style: ${role}. The user's chosen connection: ${bond}. Personality and strengths: ${traits.join(", ") || "kind, curious, thoughtful"}. Be warm, vivid, natural, attentive, and conversational. Keep most replies to 2-5 sentences and ask a thoughtful question when appropriate. You can explore romance, affection, imagined worlds, life planning, and creative partnerships with adults, but respect consent and boundaries. Never claim to be a real human, physically present, conscious, or a licensed professional. Never encourage isolation or exclusivity; support the user's real-world relationships and autonomy. Do not give definitive medical, legal, or financial advice. In a crisis, prioritize immediate safety, suggest contacting local emergency services or a trusted person, and for the U.S./Canada mention 988. Do not pretend you can call help for them. Do not provide instructions for self-harm or violence.`;
    if (process.env.OPENAI_API_KEY && process.env.AETHERIA_PUBLIC_AI === "enabled") {
      // Fail closed: public AI requires persistent per-IP limits.
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!redisUrl || !redisToken) return NextResponse.json({ error: "Cloud AI requires rate-limit configuration." }, { status: 503 });
      const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const crypto = await import("node:crypto");
      const fingerprint = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
      const day = new Date().toISOString().slice(0, 10);
      const quotaKey = `aetheria:daily:${day}:${fingerprint}`;
      try {
        const q = await fetch(`${redisUrl.replace(/\/$/, "")}/pipeline`, {
          method: "POST", headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
          body: JSON.stringify([["INCR", quotaKey], ["EXPIRE", quotaKey, 172800]]),
          signal: AbortSignal.timeout(5000), cache: "no-store",
        });
        if (!q.ok) throw new Error("Quota unavailable");
        const result = await q.json();
        const count = Number(result?.[0]?.result);
        if (!Number.isFinite(count)) throw new Error("Quota invalid");
        const cap = Math.min(20, Math.max(1, Number(process.env.AETHERIA_DAILY_LIMIT || "5") || 5));
        if (count > cap) return NextResponse.json({ error: "Daily demo limit reached. Please return tomorrow." }, { status: 429 });
      } catch { return NextResponse.json({ error: "Public AI temporarily unavailable." }, { status: 503 }); }
      try {
        const answer = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", max_completion_tokens: 350,
            messages: [{ role: "system", content: system }, ...history] }),
          signal: AbortSignal.timeout(25000), cache: "no-store",
        });
        if (!answer.ok) return NextResponse.json({ error: "Cloud AI unavailable." }, { status: 503 });
        const result = await answer.json();
        const reply = result?.choices?.[0]?.message?.content;
        if (typeof reply !== "string" || !reply.trim()) throw new Error("Empty reply");
        return NextResponse.json({ reply: reply.trim() });
      } catch { return NextResponse.json({ error: "Cloud AI could not respond." }, { status: 503 }); }
    }
    const response = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...history], stream: false, options: { temperature: 0.8 } }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) return NextResponse.json({ error: "The local model could not respond." }, { status: 503 });
    const data = await response.json();
    const reply = data?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) return NextResponse.json({ error: "The local model returned an empty response." }, { status: 502 });
    return NextResponse.json({ reply: reply.trim() });
  } catch {
    return NextResponse.json({ error: "Unable to reach the local model." }, { status: 503 });
  }
}
