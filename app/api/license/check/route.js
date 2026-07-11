export const runtime = "edge";

// 付費授權清單 — 新增/移除後 push 到 GitHub 即自動生效（約3分鐘）
// 格式: "授權碼": { bar: "店名", expires: "YYYY-MM-DD", active: true }
const LICENSES = {
  // 範例試用（14天）— 你去安裝前先用這個測試
  "ANIMCUP-TRIAL-001": { bar: "試用酒吧", expires: "2026-07-26", active: true },
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) return Response.json({ valid: false });

  const lic = LICENSES[key];
  if (!lic || !lic.active) return Response.json({ valid: false });

  if (new Date() > new Date(lic.expires)) {
    return Response.json({ valid: false, reason: "expired" });
  }

  return Response.json({ valid: true, bar: lic.bar, expires: lic.expires });
}
