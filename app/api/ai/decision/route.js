export const runtime = "edge";

const MODELS = {
  openrouter: [
    { id: "openrouter/free", name: "OpenRouter Free Router", free: true },
    { id: "nvidia/nemotron-3-ultra-550b-a55b-20260604:free", name: "Nemotron 3 Ultra", free: true },
    { id: "nvidia/nemotron-3-super-120b-a12b-20230311:free", name: "Nemotron 3 Super", free: true },
    { id: "inclusionai/ling-3.0-flash:free", name: "Ling 3.0 Flash", free: true },
    { id: "inclusionai/ling-3.0-flash-fin:free", name: "Ling 3.0 Flash Fin", free: true }
  ],
  groq: [
    { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", free: false },
    { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", free: false },
    { id: "qwen/qwen3.8-27b", name: "Qwen 3.8 27B", free: false }
  ],
  cloudflare: [
    { id: "@cf/zai-org/glm-4.7-flash", name: "GLM 4.7 Flash", free: true },
    { id: "@cf/nvidia/nemotron-3-120b-a12b", name: "Nemotron 3 120B", free: true },
    { id: "@cf/openai/gpt-oss-20b", name: "GPT OSS 20B", free: true },
    { id: "@cf/qwen/qwen3-30b-a3b-fp8", name: "Qwen 3 30B", free: true }
  ],
  mistral: [
    { id: "mistral-small-latest", name: "Mistral Small", free: false },
    { id: "mistral-large-latest", name: "Mistral Large", free: false }
  ],
  cohere: [
    { id: "command-a-03-2025", name: "Command A", free: false }
  ],
  huggingface: [
    { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", free: true },
    { id: "Qwen/Qwen3-8B", name: "Qwen 3 8B", free: true }
  ],
  zai: [
    { id: "glm-4.7-flash", name: "GLM 4.7 Flash", free: false },
    { id: "glm-5", name: "GLM 5", free: false }
  ]
};

const KEYS = {
  openrouter: "OPENROUTER_API_KEY",
  groq: "GROQ_API_KEY",
  cloudflare: "CLOUDFLARE_AI_API_TOKEN",
  mistral: "MISTRAL_API_KEY",
  cohere: "COHERE_API_KEY",
  huggingface: "HF_TOKEN",
  zai: "ZAI_API_KEY"
};

export async function GET() {
  return Response.json({ providers: Object.fromEntries(Object.entries(MODELS).map(([id, models]) => [id, {
    configured: !!process.env[KEYS[id]],
    keyEnv: KEYS[id],
    models
  }]))});
}

function cleanJson(text) {
  const raw = String(text || "").trim().replace(/^\`\`\`(?:json)?/i, "").replace(/\`\`\`$/i, "").trim();
  const a = raw.indexOf("{"), b = raw.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(raw.slice(a, b + 1)); } catch {} }
  return null;
}

async function openAiCompat(base, key, model, body, extra = {}) {
  const r = await fetch(base, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra },
    body: JSON.stringify({ model, messages: body.messages, temperature: 0.15, max_tokens: 180 })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || j?.message || `Provider HTTP ${r.status}`);
  return j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || "";
}

async function callProvider(provider, model, messages) {
  const key = provider === "openrouter" ? process.env.OPENROUTER_API_KEY : provider === "groq" ? process.env.GROQ_API_KEY : provider === "mistral" ? process.env.MISTRAL_API_KEY : provider === "cohere" ? process.env.COHERE_API_KEY : provider === "huggingface" ? process.env.HF_TOKEN : provider === "zai" ? process.env.ZAI_API_KEY : provider === "cloudflare" ? process.env.CLOUDFLARE_AI_API_TOKEN : "";
  if (!key) throw new Error(`${provider} is not configured on the server`);
  if (provider === "openrouter") return openAiCompat("https://openrouter.ai/api/v1/chat/completions", key, model, {messages}, {"HTTP-Referer":"https://animal-cup-remastered.rahmanjimmy504.workers.dev","X-Title":"Animal Cup Remastered"});
  if (provider === "groq") return openAiCompat("https://api.groq.com/openai/v1/chat/completions", key, model, {messages});
  if (provider === "mistral") return openAiCompat("https://api.mistral.ai/v1/chat/completions", key, model, {messages});
  if (provider === "huggingface") return openAiCompat("https://router.huggingface.co/v1/chat/completions", key, model, {messages});
  if (provider === "zai") return openAiCompat("https://api.z.ai/api/paas/v4/chat/completions", key, model, {messages});
  if (provider === "cohere") {
    const r=await fetch("https://api.cohere.com/v2/chat",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model,messages,temperature:0.15,max_tokens:180})});
    const j=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j?.message||`Provider HTTP ${r.status}`);
    return j?.message?.content?.map?.(x=>x.text||"").join("")||"";
  }
  if (provider === "cloudflare") {
    const account=process.env.CLOUDFLARE_ACCOUNT_ID;
    if(!account) throw new Error("CLOUDFLARE_ACCOUNT_ID is not configured on the server");
    const prompt=messages.map(m=>`${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${encodeURIComponent(model)}`,{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({prompt,max_tokens:180,temperature:0.15})});
    const j=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j?.errors?.[0]?.message||`Provider HTTP ${r.status}`);
    return j?.result?.response||"";
  }
  throw new Error("Unsupported provider");
}

export async function POST(req) {
  try {
    const body=await req.json();
    const provider=String(body.provider||"");
    const model=String(body.model||"");
    if(!MODELS[provider]?.some(x=>x.id===model)) return Response.json({error:"Model is not in the server allow-list"},{status:400});
    const side=body.side==="blue"?"BLUE":"RED";
    const state=body.state||{};
    const system=`You are the ${side} AI football controller in Animal Cup Remastered. You control ONLY the currently selected player for your team. Decide the next short action from the supplied state. Return ONLY JSON: {"vx":number,"vy":number,"sprint":boolean,"action":"none|pass|lob|throughPass|shoot|finesse|chip|powerShot|tackle|secondDefender|switchPlayer|jockey"}. vx/vy are -1..1 field movement directions. Use short decisive actions; do not explain. If you do not have the ball, defend, press, jockey or switch. If you have the ball, move toward space and choose a pass/shoot when appropriate.`;
    const user=`MATCH STATE:\n${JSON.stringify(state)}`;
    const text=await callProvider(provider,model,[{role:"system",content:system},{role:"user",content:user}]);
    const action=cleanJson(text);
    if(!action) return Response.json({error:"Model returned invalid action JSON",raw:String(text).slice(0,500)},{status:502});
    return Response.json({action});
  } catch(e) {
    return Response.json({error:e?.message||"AI provider error"},{status:500});
  }
}
