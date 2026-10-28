// Cloudflare Worker deployed for this project: replace this single value after deploy.
// No endpoint or API key is exposed in the site interface.
export const AI_API_URL = "ЖАҢА_CLOUDFLARE_WORKER_URL";

export async function askQadamAI(messages, signal) {
  if (!AI_API_URL.startsWith("https://")) {
    throw new Error("AI көмекшісі әзірге қолжетімсіз. Әзірше төмендегі QADAM жаттығуларын жалғастыр.");
  }
  const response = await fetch(AI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "AI сұрауға жауап бере алмады.");
  if (typeof data.answer !== "string") throw new Error("AI жауабының пішімі дұрыс емес.");
  return data.answer;
}
