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

document.addEventListener("DOMContentLoaded", () => {
  applyTier(appState.currentTier);

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
    const birthday = form.elements.birthday.value.trim();

    if (!displayName || phone.length < 9) {
      showFormError(form, "กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ครบ");
      return;
    }

    setFormBusy(form, true, "กำลังสมัคร...");
    try {
      const member = await apiRegisterMember({
        displayName,
        phoneNumber: phone,
        birthday
      });
      applyTier(tierKey(member.membershipTier));
      renderMember(member);
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
