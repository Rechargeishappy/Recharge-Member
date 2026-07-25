const CUP_VALUE_BAHT = 50;
const CUP_TRACK_SLOTS = 8;

function money(value) {
  return Number(value || 0).toLocaleString("th-TH");
}

function tierKey(tierName) {
  return String(tierName || "basic").toLowerCase();
}

function buildJourneyView(member) {
  if (!member.nextTierName) {
    return {
      title: `${String(member.membershipTier || "").toUpperCase()} MEMBER`,
      message: member.nextBestAction || "ระดับสูงสุดของสมาชิก ขอบคุณที่เดินทางกับเรา",
      progressPercent: 100,
      cupsDone: CUP_TRACK_SLOTS,
      cupsTotal: CUP_TRACK_SLOTS
    };
  }
  const remainingCups = Math.max(0, Math.ceil((member.amountToNextTierMonthly || 0) / CUP_VALUE_BAHT));
  const progress = Math.max(0, Math.min(100, Math.round(member.chargeProgress || 0)));
  return {
    title: `${String(member.membershipTier || "").toUpperCase()} JOURNEY`,
    message: remainingCups > 0
      ? `อีก ${remainingCups} แก้ว สู่ ${member.nextTierName}`
      : `พร้อมอัปเกรดสู่ ${member.nextTierName}`,
    progressPercent: progress,
    cupsDone: Math.round((progress / 100) * CUP_TRACK_SLOTS),
    cupsTotal: CUP_TRACK_SLOTS
  };
}

function renderCupTrack(journey) {
  const total = journey.cupsTotal || CUP_TRACK_SLOTS;
  const done = journey.cupsDone || 0;
  return Array.from({ length: total }, (_, index) => {
    const isDone = index < done;
    return `<span class="cup-dot ${isDone ? "done" : ""}" aria-label="${isDone ? "completed step" : "remaining step"}"></span>`;
  }).join("");
}

function rewardIconFor(item) {
  const text = [
    item.icon,
    item.type,
    item.name,
    item.title,
    item.value,
    item.notes
  ].filter(Boolean).join(" ").toLowerCase();

  if (text.includes("discount") || text.includes("ส่วนลด") || text.includes("%")) return "discount";
  if (text.includes("massage") || text.includes("นวด") || text.includes("เก้าอี้")) return "massage-chair";
  if (text.includes("cap") || text.includes("hat") || text.includes("หมวก")) return "cap";
  if (text.includes("shirt") || text.includes("เสื้อ") || text.includes("t-shirt")) return "shirt";
  if (text.includes("product") || text.includes("สินค้า") || text.includes("drink") || text.includes("menu") || text.includes("แก้ว")) return "product";
  return "gift";
}

function renderMember(member) {
  const tier = tierKey(member.membershipTier);
  const journey = buildJourneyView(member);
  const emblem = `assets/tier/${tier}-emblem.png`;

  const promotions = (member.promotions && member.promotions.length ? member.promotions : DEFAULT_BENEFITS);
  const benefits = promotions.slice(0, 3).map((item, index) => {
    const icon = rewardIconFor(item);
    return `
      <div class="benefit-row">
        <span class="benefit-icon" aria-hidden="true">
          <img src="assets/icons/reward/${icon}.png" alt="">
        </span>
        <div>
          <strong>${item.title || item.name || ""}</strong>
          <span>${item.copy || item.value || ""}</span>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("memberScreen").innerHTML = `
    <div class="member-layout">
      <section class="hello">
        <p class="eyebrow">สวัสดี ${member.crmName || member.displayName || ""}</p>
        <h1>ยินดีต้อนรับกลับมา</h1>
      </section>

      <section class="glass-panel member-card">
        <div class="card-top">
          <div>
            <p class="eyebrow">Coffee Recharge</p>
            <div class="tier-label">${member.membershipTier || "Basic"} Member</div>
            <div class="member-name">${member.crmName || member.displayName || ""}</div>
          </div>
          <img class="tier-emblem" src="${emblem}" alt="">
        </div>

        <div class="point-hero">
          <span class="point-value">${money(member.point)}</span>
          <span class="point-label">Points Available</span>
        </div>
        <div class="benefit-pill">${member.discountPercent}% Member Benefit</div>
      </section>

      <section class="mini-grid">
        <div class="glass-panel mini-widget">
          <span>แต้มของคุณ</span>
          <strong>${money(member.point)} บาท</strong>
        </div>
        <div class="glass-panel mini-widget">
          <span>เฉลี่ยต่อเดือน</span>
          <strong>${money(member.monthlyAverage)}</strong>
        </div>
      </section>

      <section class="glass-panel journey-widget">
        <div class="journey-head">
          <span class="journey-mark" aria-hidden="true">
            <img src="assets/icons/journey-png/pouring-stream.png" alt="">
          </span>
          <div>
            <span>Coffee Journey</span>
            <h2>${journey.title}</h2>
          </div>
        </div>
        <p>${journey.message}</p>
        <div class="cup-track">${renderCupTrack(journey)}</div>
        <div class="progress-bar" style="--progress:${journey.progressPercent}%"><span></span></div>
      </section>

      <section class="glass-panel benefits-widget">
        <p class="eyebrow">Your Benefits</p>
        <div class="benefits-list">${benefits}</div>
      </section>

      <button class="secondary-button" type="button" id="changePhoneButton">ค้นหาเบอร์อื่น</button>
    </div>
  `;

  document.getElementById("changePhoneButton").addEventListener("click", () => setView("search"));
}
