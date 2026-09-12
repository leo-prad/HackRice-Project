import { mountIssueList } from "./issueList";
import { mountIssueDetail } from "./issueDetail";

let previousRoute = "";
let timer = 0;

function unmountAll() {
  document.querySelectorAll('[data-questline-root="1"]').forEach((node) => node.remove());
}

function route() {
  const path = location.pathname;
  const routeKey = `${path}${location.search}`;
  if (routeKey !== previousRoute) {
    unmountAll();
    previousRoute = routeKey;
  }
  if (/^\/[^/]+\/[^/]+\/issues\/?$/.test(path)) void mountIssueList();
  else if (/^\/[^/]+\/[^/]+\/issues\/\d+$/.test(path)) void mountIssueDetail();
  else unmountAll();
}

function debouncedRoute() {
  window.clearTimeout(timer);
  timer = window.setTimeout(route, 150);
}

route();
document.addEventListener("turbo:load", route);
// GitHub swaps page fragments with Turbo, and this catches layouts that omit the event.
new MutationObserver(debouncedRoute).observe(document.body, { childList: true, subtree: true });
