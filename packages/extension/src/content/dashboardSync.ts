const SIGN_OUT_EVENT = "gitventure:sign-out";
const CLAIMS_TYPE = "gitventure:claims-changed";

document.addEventListener(SIGN_OUT_EVENT, () => {
  void chrome.storage.local.remove("gitventureToken");
});

/** Dashboard → extension: bump claimsEpoch so popup / content scripts refresh instantly. */
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== CLAIMS_TYPE) return;
  const at = typeof event.data.at === "number" ? event.data.at : Date.now();
  void chrome.storage.local.set({ claimsEpoch: at });
});

/** Extension → dashboard: surface storage bumps as window messages. */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.claimsEpoch) return;
  const at = Number(changes.claimsEpoch.newValue ?? Date.now());
  window.postMessage({ type: CLAIMS_TYPE, at }, "*");
});
