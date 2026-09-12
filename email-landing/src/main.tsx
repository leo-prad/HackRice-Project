import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth";
import LandingPage from "./pages/LandingPage";
import OnboardingPage from "./pages/OnboardingPage";
import OnboardingSourcesPage from "./pages/OnboardingSourcesPage";
import AuthCallback from "./pages/AuthCallback";
import AppLayout from "./layouts/AppLayout";
import { LANDING_SECTION, type LandingScrollState, MAIL_ROUTES, ROUTES } from "./lib/routes";
import InboxPage from "./pages/InboxPage";
import ProfilePage from "./pages/ProfilePage";
import CoursesPage from "./pages/CoursesPage";
import SettingsPage from "./pages/SettingsPage";
import { purgeExpiredTokens } from "./lib/auth";
import "./index.css";

purgeExpiredTokens();

const mailRouteElements = {
  [ROUTES.HOME]: <InboxPage />,
  [ROUTES.NEEDS_REPLY]: <InboxPage />,
  [ROUTES.BATCH_READY]: <InboxPage />,
  [ROUTES.INBOX]: <InboxPage />,
  [ROUTES.SENT]: <InboxPage />,
  [ROUTES.DRAFTS]: <InboxPage />,
  [ROUTES.JUNK]: <InboxPage />,
  [ROUTES.DELETED]: <InboxPage />,
  [ROUTES.ARCHIVE]: <InboxPage />,
} as const;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* ── Public marketing + OAuth callback ───────────────────────── */}
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route path="/landing" element={<Navigate to={ROUTES.LANDING} replace />} />
        <Route path="/connect" element={<Navigate to={ROUTES.LANDING} replace />} />
        <Route
          path={ROUTES.PRICING}
          element={
            <Navigate
              to={ROUTES.LANDING}
              state={{ scrollTo: LANDING_SECTION.PRICING } satisfies LandingScrollState}
              replace
            />
          }
        />
        <Route
          path={ROUTES.ABOUT}
          element={<Navigate to={ROUTES.LANDING} replace />}
        />
        <Route
          path={ROUTES.CONTACT}
          element={<Navigate to={ROUTES.LANDING} replace />}
        />
        <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />

        {/* ── First-run onboarding wizard (auth, no AppLayout) ────────── */}
        <Route
          path={ROUTES.ONBOARDING}
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.ONBOARDING_SOURCES}
          element={
            <RequireAuth>
              <OnboardingSourcesPage />
            </RequireAuth>
          }
        />

        {/* ── Authenticated app (RequireAuth + AppLayout) ───────────────── */}
        <Route
          element={<AppLayout />}
        >
          {MAIL_ROUTES.map((path) => (
            <Route key={path} path={path} element={mailRouteElements[path]} />
          ))}
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.COURSES} element={<CoursesPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={`${ROUTES.COURSES}/:id`} element={<Navigate to={ROUTES.COURSES} replace />} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
