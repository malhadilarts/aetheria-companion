# Aetheria — companion demo

Next.js 16 companion experience. Visitors can create characters and chat in browser-based reflection mode without an API key. Data is saved locally in each browser.

## Vercel deploy

1. Upload these **extracted files** to a new GitHub repository (do not upload the ZIP as a single file).
2. In Vercel, import the repository and click Deploy; framework is Next.js.
3. Without environment variables the public website uses reflection mode and does not incur AI charges.

## Optional OpenAI GPT

**Do not enable paid public AI before installing abuse/spending protections.** In Vercel environment variables, add `OPENAI_API_KEY`, `AETHERIA_PUBLIC_AI=enabled`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and optionally `OPENAI_MODEL` and `AETHERIA_DAILY_LIMIT` (default 5, max 20). Use a small API account budget and monitor usage. IP-based daily counting is best-effort, not robust authentication; reverse proxies, shared IPs and concurrency may affect it. Redis is required and failures are closed. OpenAI requests happen only server-side. Aetheria sends the latest chat history and character settings to OpenAI when enabled.

## Self-hosted Ollama

Set `OLLAMA_BASE_URL` to a reachable server URL. A Vercel-hosted instance cannot reach Ollama on visitors' own localhost.

Do not commit `.env` files or secrets.
