import { mountIssueList } from "./issueList";
import { mountIssueDetail } from "./issueDetail";

let previousRoute = "";
let timer = 0;

function unmountAll() {
  document.querySelectorAll('[data-questline-root="1"]').forEach((node) => node.remove());
  document.querySelectorAll(".ql-issue-row").forEach((node) => node.classList.remove("ql-issue-row"));
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
document.addEventListener("turbo:render", debouncedRoute);
document.addEventListener("pjax:end", debouncedRoute);
window.addEventListener("popstate", debouncedRoute);
// GitHub swaps page fragments with Turbo, and this catches layouts that omit the event.
new MutationObserver(debouncedRoute).observe(document.body, { childList: true, subtree: true });
