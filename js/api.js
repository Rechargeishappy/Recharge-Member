/**
 * เรียก Apps Script Web App (Recharge CRM) จาก GitHub Pages
 * GET ใช้สำหรับอ่านข้อมูล (search, lineLookup) — ไม่ติด CORS preflight
 * POST ใช้ Content-Type: text/plain เพื่อเลี่ยง CORS preflight (Apps Script ไม่รองรับ OPTIONS)
 */

async function apiSearchMember(phone) {
  const url = `${RECHARGE_API.baseUrl}?api=member&action=search&phone=${encodeURIComponent(phone)}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return (data.results && data.results[0]) || null;
}

async function apiLineLookup(lineUid) {
  const url = `${RECHARGE_API.baseUrl}?api=member&action=lineLookup&lineUid=${encodeURIComponent(lineUid)}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.member || null;
}

async function apiRegisterMember(payload) {
  const response = await fetch(RECHARGE_API.baseUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "register", payload })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.member;
}

async function apiLinkLine(payload) {
  const response = await fetch(RECHARGE_API.baseUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "linkLine", payload })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.member;
}
