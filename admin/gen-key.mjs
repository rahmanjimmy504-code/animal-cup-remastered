// 產生新授權碼：node admin/gen-key.mjs "酒吧名稱" 365
// 產出可直接貼進 app/api/license/check/route.js 的那一行
import { randomBytes } from "node:crypto";

const bar = process.argv[2] || "新酒吧";
const days = parseInt(process.argv[3] || "365", 10);
const key = "ANIMCUP-" + randomBytes(6).toString("hex").toUpperCase();
const expires = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

console.log(`\n授權碼: ${key}`);
console.log(`店名:   ${bar}`);
console.log(`到期:   ${expires}`);
console.log(`\n貼進 LICENSES 物件:`);
console.log(`  "${key}": { bar: "${bar}", expires: "${expires}", active: true },`);
console.log(`\n寫入 license.key 檔案的內容:`);
console.log(key);
