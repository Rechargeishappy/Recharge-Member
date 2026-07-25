const CUP_VALUE_BAHT = 50;

function money(value) {
  return Number(value || 0).toLocaleString("th-TH");
}

function cups(value) {
  return Math.max(0, Math.round(Number(value || 0) / CUP_VALUE_BAHT)).toLocaleString("th-TH");
}

function tierKey(tierName) {
  return String(tierName || "basic").toLowerCase();
}

function displayNameFor(member) {
  return member.crmName || member.displayName || "สมาชิก Recharge";
}

function buildJourneyView(member) {
  const tierName = member.membershipTier || "Basic";
  const nextTier = member.nextTierName || "";
  const hasProgressData = member.chargeProgress !== undefined && member.chargeProgress !== null && member.chargeProgress !== "";

  if (!nextTier) {
    return {
      title: `${String(tierName).toUpperCase()} MEMBER`,
      message: member.nextBestAction || "ระดับสูงสุดของสมาชิก ขอบคุณที่เดินทางกับเรา",
      progressPercent: 100
    };
  }

  if (!hasProgressData) {
    return {
      title: `${String(tierName).toUpperCase()} JOURNEY`,
      message: "กำลังอัปเดตสถานะ Journey ของคุณ",
      progressPercent: 5
    };
  }

  const remainingCups = Math.max(0, Math.ceil((member.amountToNextTierMonthly || 0) / CUP_VALUE_BAHT));
  const progress = Math.max(0, Math.min(100, Math.round(member.chargeProgress || 0)));
  return {
    title: `${String(tierName).toUpperCase()} JOURNEY`,
    message: remainingCups > 0
      ? `อีก ${remainingCups} แก้ว สู่ ${nextTier}`
      : `พร้อมอัปเกรดสู่ ${nextTier}`,
    progressPercent: Math.max(5, progress)
  };
}

function rewardIconFor(item) {
  const explicitType = String(item.rewardType || item.type || item.icon || "").toLowerCase();
  if (["discount", "product", "massage-chair", "cap", "shirt", "gift"].includes(explicitType)) return explicitType;
  if (explicitType === "massage") return "massage-chair";
  if (explicitType === "hat") return "cap";

  const text = [
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

function renderMember(member, options = {}) {
  const tier = tierKey(member.membershipTier);
  const journey = buildJourneyView(member);
  const emblem = `assets/tier/${tier}-emblem.png`;
  const name = displayNameFor(member);
  const discount = Number(member.discountPercent || 0);

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
      ${options.justRegistered ? `
        <section class="glass-panel success-strip">
          <strong>สมัครสมาชิกเรียบร้อยแล้ว</strong>
          <span>ยินดีต้อนรับสู่ Coffee Recharge</span>
        </section>
      ` : ""}

      <section class="hello">
        <p class="eyebrow">สวัสดี ${name}</p>
        <h1>ยินดีต้อนรับกลับมา</h1>
      </section>

      <section class="glass-panel member-card">
        <div class="card-top">
          <div class="member-card-copy">
            <p class="eyebrow">Coffee Recharge</p>
            <div class="tier-card-pill">${member.membershipTier || "Basic"}</div>
            <div class="tier-label">${member.membershipTier || "Basic"} Member</div>
            <div class="member-name">${name}</div>
          </div>
          <img class="tier-emblem" src="${emblem}" alt="">
        </div>

        <div class="point-hero">
          <span class="point-value">${money(member.point)}</span>
          <span class="point-label">Points Available</span>
        </div>
        <div class="benefit-pill">${discount > 0 ? `${discount}% Member Benefit` : "Member Benefit"}</div>
      </section>

      <section class="mini-grid">
        <div class="glass-panel mini-widget">
          <span>แต้มของคุณ</span>
          <strong>${money(member.point)} บาท</strong>
        </div>
        <div class="glass-panel mini-widget">
          <span>แก้วต่อเดือน</span>
          <strong>${cups(member.monthlyAverage)} แก้ว</strong>
        </div>
      </section>

      <section class="glass-panel journey-widget">
        <div class="journey-head">
          <span class="journey-mark" aria-hidden="true">
            <img src="assets/icons/journey-png/coffee-cup.png" alt="">
          </span>
          <div>
            <span>Coffee Journey</span>
            <h2>${journey.title}</h2>
          </div>
        </div>
        <p>${journey.message}</p>
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
