function setFormBusy(form, isBusy, busyText) {
  const button = form.querySelector("button[type=submit]");
  if (!button) return;
  if (isBusy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function showFormError(form, message) {
  let errorEl = form.querySelector(".form-error");
  if (!errorEl) {
    errorEl = document.createElement("p");
    errorEl.className = "form-error";
    form.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

function clearFormError(form) {
  const errorEl = form.querySelector(".form-error");
  if (errorEl) errorEl.remove();
}

function showLookupNotice(message) {
  const form = document.getElementById("lookupForm");
  if (form) showFormError(form, message);
}

const REMEMBERED_PHONE_KEY = "recharge.member.phone";
const LINE_LOOKUP_MIN_MS = 900;
const LINE_LOOKUP_TIMEOUT_MS = 12000;
const LINE_LOOKUP_RETRY_DELAY_MS = 2500;
const LINE_LOOKUP_TIMEOUT_MESSAGE = "LINE lookup timeout";
const LINE_LOOKUP_MAX_ATTEMPTS = 2;

function loadRememberedPhone() {
  try {
    return digitsOnly(window.localStorage.getItem(REMEMBERED_PHONE_KEY));
  } catch (error) {
    return "";
  }
}

function rememberPhone(phone) {
  try {
    window.localStorage.setItem(REMEMBERED_PHONE_KEY, digitsOnly(phone));
  } catch (error) {
    // Some in-app browsers can block localStorage; lookup still works without remembering.
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}

function lineLookupFallbackMessage(error) {
  if (error && error.message === LINE_LOOKUP_TIMEOUT_MESSAGE) {
    return "เชื่อมต่อ LINE นานกว่าปกติ กรุณากดค้นหาอีกครั้ง";
  }
  return (error && error.message) || "เชื่อมต่อ LINE member ไม่สำเร็จ กรุณากดค้นหาอีกครั้ง";
}

function setLineLoadingState(message, canRetry) {
  const copy = document.getElementById("lineLoadingCopy");
  const actions = document.getElementById("lineLoadingActions");
  if (copy) copy.textContent = message;
  if (actions) actions.hidden = !canRetry;
}

async function initLineContext() {
  if (!RECHARGE_API.liffId || !window.liff) return appState.lineContext;

  try {
    await liff.init({ liffId: RECHARGE_API.liffId });
    appState.lineContext.isReady = true;
    appState.lineContext.isInClient = liff.isInClient();

    if (!liff.isInClient() && !liff.isLoggedIn()) return appState.lineContext;
    if (!liff.isLoggedIn()) return appState.lineContext;

    const profile = await liff.getProfile();
    appState.lineContext.lineUserId = profile.userId || "";
    appState.lineContext.displayName = profile.displayName || "";
    appState.lineContext.pictureUrl = profile.pictureUrl || "";
  } catch (error) {
    console.warn("LIFF init skipped", error);
  }

  return appState.lineContext;
}

async function runLineAutoLookup() {
  const lineContext = await initLineContext();
  if (!lineContext.lineUserId) return;

  setView("lineLoading");
  setLineLoadingState("เชื่อมต่อข้อมูลจาก LINE สักครู่", false);

  let lastError = null;

  for (let attempt = 1; attempt <= LINE_LOOKUP_MAX_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();
    setLineLoadingState(
      attempt === 1 ? "เชื่อมต่อข้อมูลจาก LINE สักครู่" : "ลองค้นหาจาก LINE อีกครั้ง",
      false
    );

    try {
      const member = await withTimeout(
        apiLineLookup(lineContext.lineUserId),
        LINE_LOOKUP_TIMEOUT_MS,
        LINE_LOOKUP_TIMEOUT_MESSAGE
      );

      const elapsed = Date.now() - startedAt;
      if (elapsed < LINE_LOOKUP_MIN_MS) await sleep(LINE_LOOKUP_MIN_MS - elapsed);

      if (member) {
        appState.member = member;
        applyTier(tierKey(member.membershipTier));
        renderMember(member);
        setView("member");
        return;
      }

      setView("search");
      return;
    } catch (error) {
      lastError = error;
      console.warn("LINE lookup skipped", error);
      if (attempt < LINE_LOOKUP_MAX_ATTEMPTS) await sleep(LINE_LOOKUP_RETRY_DELAY_MS);
    }
  }

  setLineLoadingState(lineLookupFallbackMessage(lastError), true);
}

async function retryLineLookup() {
  const lineUserId = appState.lineContext.lineUserId;
  if (!lineUserId) {
    setView("search");
    return;
  }

  setView("lineLoading");
  setLineLoadingState("กำลังลองค้นหาจาก LINE อีกครั้ง", false);
  const startedAt = Date.now();

  try {
    const member = await withTimeout(
      apiLineLookup(lineUserId),
      LINE_LOOKUP_TIMEOUT_MS,
      LINE_LOOKUP_TIMEOUT_MESSAGE
    );
    const elapsed = Date.now() - startedAt;
    if (elapsed < LINE_LOOKUP_MIN_MS) await sleep(LINE_LOOKUP_MIN_MS - elapsed);

    if (member) {
      appState.member = member;
      applyTier(tierKey(member.membershipTier));
      renderMember(member);
      setView("member");
      return;
    }
  } catch (error) {
    console.warn("LINE retry skipped", error);
    setLineLoadingState(lineLookupFallbackMessage(error), true);
    return;
  }

  setView("search");
}

async function linkLineIfReady(phone) {
  const lineUserId = appState.lineContext.lineUserId;
  if (!lineUserId || !phone) return;

  try {
    await apiLinkLine({
      lineUid: lineUserId,
      phoneNumber: digitsOnly(phone),
      displayName: appState.lineContext.displayName,
      pictureUrl: appState.lineContext.pictureUrl
    });
  } catch (error) {
    console.warn("LINE link skipped", error);
  }
}

function normalizeBirthday(value) {
  const digits = digitsOnly(value);
  if (digits.length !== 8) return "";

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const currentYear = new Date().getFullYear();
  const isYearReasonable = (year >= 1900 && year <= currentYear) || (year >= 2443 && year <= currentYear + 543);
  const gregorianYear = year > currentYear ? year - 543 : year;
  const date = new Date(gregorianYear, month - 1, day);

  if (day < 1 || day > 31 || month < 1 || month > 12 || !isYearReasonable) return "";
  if (date.getFullYear() !== gregorianYear || date.getMonth() !== month - 1 || date.getDate() !== day) return "";

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  applyTier(appState.currentTier);
  const phoneInput = document.getElementById("phoneInput");
  const rememberedPhone = loadRememberedPhone();

  if (rememberedPhone) {
    phoneInput.value = rememberedPhone;
    appState.currentPhone = rememberedPhone;
  }

  document.getElementById("lookupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const phone = digitsOnly(form.elements.phone.value);
    appState.currentPhone = phone;
    clearFormError(form);

    if (phone.length < 9) {
      showFormError(form, "กรุณากรอกเบอร์โทรศัพท์ให้ครบ");
      return;
    }

    setFormBusy(form, true, "กำลังค้นหา...");
    try {
      const member = await apiSearchMember(phone);
      if (!member) {
        setView("notFound");
        return;
      }
      appState.member = member;
      rememberPhone(phone);
      await linkLineIfReady(phone);
      applyTier(tierKey(member.membershipTier));
      renderMember(member);
      setView("member");
    } catch (error) {
      showFormError(form, error.message || "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง");
      console.error(error);
    } finally {
      setFormBusy(form, false);
    }
  });

  document.getElementById("openRegisterButton").addEventListener("click", () => {
    document.querySelector("#registerForm [name='phone']").value = document.getElementById("phoneInput").value;
    setView("register");
  });

  document.getElementById("registerFromNotFoundButton").addEventListener("click", () => {
    document.querySelector("#registerForm [name='phone']").value = appState.currentPhone;
    setView("register");
  });

  document.getElementById("retryButton").addEventListener("click", () => setView("search"));
  document.getElementById("backToSearchButton").addEventListener("click", () => setView("search"));
  document.getElementById("retryLineLookupButton").addEventListener("click", retryLineLookup);
  document.getElementById("usePhoneLookupButton").addEventListener("click", () => {
    showLookupNotice("กรอกเบอร์สมาชิก แล้วกดดูสมาชิกได้เลย");
    setView("search");
  });

  document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    clearFormError(form);
    const displayName = form.elements.displayName.value.trim();
    const phone = digitsOnly(form.elements.phone.value);
    const birthday = normalizeBirthday(form.elements.birthday.value);

    if (!displayName || phone.length < 9 || !birthday) {
      showFormError(form, "กรุณากรอกชื่อ เบอร์โทรศัพท์ และวันเกิดเป็นวัน/เดือน/ปีให้ครบ");
      return;
    }

    setFormBusy(form, true, "กำลังสมัคร...");
    try {
      const member = await apiRegisterMember({
        displayName,
        phoneNumber: phone,
        birthday,
        lineUid: appState.lineContext.lineUserId
      });
      rememberPhone(phone);
      await linkLineIfReady(phone);
      applyTier(tierKey(member.membershipTier));
      renderMember(member, { justRegistered: true });
      setView("member");
      form.reset();
    } catch (error) {
      showFormError(form, error.message || "สมัครสมาชิกไม่สำเร็จ ลองใหม่อีกครั้ง");
      console.error(error);
    } finally {
      setFormBusy(form, false);
    }
  });

  runLineAutoLookup();
});
