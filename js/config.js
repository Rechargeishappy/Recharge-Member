// ใส่ URL ของ Apps Script Web App ที่ deploy แล้ว (ลงท้ายด้วย /exec)
// หาได้จาก Apps Script editor > Deploy > Manage deployments > Web app URL
// ต้อง deploy แบบ "Execute as: Me" + "Who has access: Anyone" ถึงจะเรียกจาก GitHub Pages ได้
const RECHARGE_API = {
  baseUrl: "https://script.google.com/macros/s/AKfycbxXWcnhRlTD0ePRhGArIPgADQ4D-krKA5uDGCYvfqfN0GbgV5F0rVH2y6ccrDguYv0sqw/exec"
};
