const appState = {
  currentTier: "gold",
  currentPhone: "",
  member: null,
  lineContext: {
    isReady: false,
    isInClient: false,
    lineUserId: "",
    displayName: "",
    pictureUrl: ""
  },
  tiers: ["basic", "bronze", "silver", "gold", "platinum"]
};

function setView(name) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === `${name}Screen`);
  });
}

function applyTier(tier) {
  appState.currentTier = tier || "gold";
  document.body.dataset.tier = appState.currentTier;
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}
