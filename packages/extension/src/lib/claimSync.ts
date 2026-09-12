/** Bump a shared epoch so popup + content scripts refresh claims without waiting. */
export async function bumpClaimsEpoch(claimId?: number) {
  await chrome.storage.local.set({
    claimsEpoch: Date.now(),
    ...(claimId != null ? { lastClaimId: claimId } : {}),
  });
}

export function onClaimsEpoch(handler: () => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => {
    if (area === "local" && changes.claimsEpoch) handler();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
