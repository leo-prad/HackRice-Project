import { Github, LogOut } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { session } from "../lib/api";
import { GitVentureWordmark } from "./brand/GitVentureMark";
import PageTransition from "./motion/PageTransition";

export default function Layout() {
  const signedIn = Boolean(session.get());
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  const isNewcomerChrome =
    pathname === "/ingest" || pathname === "/onboard" || pathname === "/auth/continue";

  // Landing owns its chrome (hide-on-scroll nav + Lenis).
  if (isLanding) {
    return (
      <div className="relative min-h-screen">
        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  // Newcomer layer — no app nav (avoids leaking returning-player destinations).
  if (isNewcomerChrome) {
    return (
      <div className="relative min-h-screen bg-void font-body text-snow">
        <main>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-void font-body text-snow">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-void/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to={signedIn ? "/auth/continue" : "/"} className="flex items-center" aria-label="GitVenture home">
            <GitVentureWordmark />
          </Link>
          <nav className="flex items-center gap-1 text-sm text-fog">
            {signedIn && (
              <NavLink
                to="/next"
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 font-body transition-colors duration-300 hover:text-snow ${
                    isActive ? "bg-white/[0.06] text-snow" : ""
                  }`
                }
              >
                Next Quest
              </NavLink>
            )}
            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 font-body transition-colors duration-300 hover:text-snow ${
                  isActive ? "bg-white/[0.06] text-snow" : ""
                }`
              }
            >
              Leaderboard
            </NavLink>
            {signedIn && (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 font-body transition-colors duration-300 hover:text-snow ${
                    isActive ? "bg-white/[0.06] text-snow" : ""
                  }`
                }
              >
                Profile
              </NavLink>
            )}
            {signedIn ? (
              <button
                className="gv-btn-secondary ml-2 p-2.5"
                title="Sign out"
                onClick={() => {
                  session.clear();
                  location.href = "/";
                }}
              >
                <LogOut size={16} />
              </button>
            ) : (
              <a
                className="gv-btn-primary ml-2 px-3.5 py-2 text-sm"
                href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"}/auth/github`}
              >
                <Github size={16} /> Sign in
              </a>
            )}
          </nav>
        </div>
      </header>
      <main>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
