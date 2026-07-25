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

const REMEMBERED_PHONE_KEY = "recharge.member.phone";

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

async function initLineContext() {
  if (!RECHARGE_API.liffId || !window.liff) return appState.lineContext;

  try {
    await liff.init({ liffId: RECHARGE_API.liffId });
    appState.lineContext.isReady = true;
    appState.lineContext.isInClient = liff.isInClient();

    if (!liff.isLoggedIn()) {
      if (liff.isInClient()) return appState.lineContext;
      liff.login();
      return appState.lineContext;
    }

    const profile = await liff.getProfile();
    appState.lineContext.lineUserId = profile.userId || "";
    appState.lineContext.displayName = profile.displayName || "";
    appState.lineContext.pictureUrl = profile.pictureUrl || "";
  } catch (error) {
    console.warn("LIFF init skipped", error);
  }

  return appState.lineContext;
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

document.addEventListener("DOMContentLoaded", async () => {
  applyTier(appState.currentTier);
  const phoneInput = document.getElementById("phoneInput");
  const rememberedPhone = loadRememberedPhone();

  if (rememberedPhone) {
    phoneInput.value = rememberedPhone;
    appState.currentPhone = rememberedPhone;
  }

  const lineContext = await initLineContext();
  if (lineContext.lineUserId) {
    try {
      const member = await apiLineLookup(lineContext.lineUserId);
      if (member) {
        appState.member = member;
        applyTier(tierKey(member.membershipTier));
        renderMember(member);
        setView("member");
      }
    } catch (error) {
      console.warn("LINE lookup skipped", error);
    }
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
      showFormError(form, "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง");
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
});
