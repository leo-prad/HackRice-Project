const SIGN_OUT_EVENT = "questline:sign-out";

document.addEventListener(SIGN_OUT_EVENT, () => {
  void chrome.storage.local.remove("questlineToken");
});
