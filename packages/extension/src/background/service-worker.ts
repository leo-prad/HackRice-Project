import { isOpenDashboardMessage, openDashboardTab } from "../lib/openDashboard";

chrome.runtime.onInstalled.addListener(() => console.log("GitVenture is ready."));

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isOpenDashboardMessage(message)) return;
  void openDashboardTab(message.path)
    .then(() => sendResponse({ ok: true }))
    .catch((error) =>
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "open failed" }),
    );
  return true;
});
