export const DASHBOARD_URL = (import.meta.env.VITE_DASHBOARD_URL || "http://127.0.0.1:5174").replace(/\/$/, "");

export const dashboardPath = (path = "") => `${DASHBOARD_URL}${path.startsWith("/") ? path : `/${path}`}`;
