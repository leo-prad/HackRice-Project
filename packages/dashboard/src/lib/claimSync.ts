/** Cross-surface claim sync: dashboard tabs ↔ extension via BroadcastChannel + postMessage + chrome.storage. */

const CHANNEL = "gitventure-claims";
const WINDOW_TYPE = "gitventure:claims-changed";

export type ClaimsChangedDetail = { at: number; claimId?: number };

export function notifyClaimsChanged(claimId?: number) {
  const detail: ClaimsChangedDetail = { at: Date.now(), claimId };
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(detail);
    channel.close();
  } catch {
    /* BroadcastChannel unavailable */
  }
  window.dispatchEvent(new CustomEvent(WINDOW_TYPE, { detail }));
  window.postMessage({ type: WINDOW_TYPE, ...detail }, "*");
}

export function onClaimsChanged(handler: (detail: ClaimsChangedDetail) => void): () => void {
  const channel = new BroadcastChannel(CHANNEL);
  const onChannel = (event: MessageEvent<ClaimsChangedDetail>) => {
    if (event.data?.at) handler(event.data);
  };
  channel.addEventListener("message", onChannel);

  const onWindow = (event: Event) => {
    const detail = (event as CustomEvent<ClaimsChangedDetail>).detail;
    if (detail?.at) handler(detail);
  };
  window.addEventListener(WINDOW_TYPE, onWindow);

  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === WINDOW_TYPE && typeof event.data.at === "number") {
      handler({ at: event.data.at, claimId: event.data.claimId });
    }
  };
  window.addEventListener("message", onMessage);

  return () => {
    channel.removeEventListener("message", onChannel);
    channel.close();
    window.removeEventListener(WINDOW_TYPE, onWindow);
    window.removeEventListener("message", onMessage);
  };
}
