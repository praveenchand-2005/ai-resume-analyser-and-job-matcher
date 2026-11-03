export class AIConfigurationError extends Error {
  constructor() {
    super("AI provider is not configured. Add AI_API_KEY and AI_MODEL as server-only environment variables.");
    this.name = "AIConfigurationError";
  }
}
export class AIProviderError extends Error {
  constructor(message: string) { super(message); this.name = "AIProviderError"; }
}
export function getAIProviderStatus() {
  return {
    configured: Boolean(process.env.AI_API_BASE_URL && process.env.AI_API_KEY && process.env.AI_MODEL),
    provider: process.env.AI_API_BASE_URL?.includes("nvidia") ? "NVIDIA-compatible" : "OpenAI-compatible",
    model: process.env.AI_MODEL || null,
  };
}
function parseJson(text: string) {
  const cleaned = text.trim().replace(/^\u0060\u0060\u0060(?:json)?\s*/i, "").replace(/\s*\u0060\u0060\u0060$/, "");
  try { return JSON.parse(cleaned); }
  catch {
    const first = cleaned.indexOf("{"), last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw new AIProviderError("The AI provider returned an unreadable response.");
  }
}
export async function generateStructuredResponse<T>(systemPrompt: string, userPrompt: string, maxTokens = 1800): Promise<{data:T;model:string}> {
  const base = process.env.AI_API_BASE_URL, key = process.env.AI_API_KEY, model = process.env.AI_MODEL;
  if (!base || !key || !model) throw new AIConfigurationError();
  let response: Response;
  try {
    response = await fetch(base.replace(/\/+$/, "") + "/chat/completions", {
      method:"POST",
      headers:{Authorization:"Bearer " + key,"Content-Type":"application/json"},
      body:JSON.stringify({model,temperature:0.2,max_tokens:maxTokens,messages:[
        {role:"system",content:systemPrompt + " Return one valid JSON object only. No markdown fences."},
        {role:"user",content:userPrompt}
      ]}),
      signal:AbortSignal.timeout(60000),
    });
  } catch { throw new AIProviderError("The AI provider could not be reached."); }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new AIProviderError("The AI provider rejected its API key.");
    if (response.status === 429) throw new AIProviderError("The AI provider rate limit was reached. Retry shortly.");
    throw new AIProviderError("The AI provider returned HTTP " + response.status + ".");
  }
  const payload = await response.json().catch(() => null);
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new AIProviderError("The AI provider returned an empty response.");
  return {data:parseJson(content) as T,model};
}
