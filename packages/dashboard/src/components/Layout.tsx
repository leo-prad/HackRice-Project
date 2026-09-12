import { Github, LogOut } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { session } from "../lib/api";

export default function Layout() {
  const signedIn = Boolean(session.get());
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3 font-black tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-acid text-lg text-ink">Q</span>
            GITQUEST
            <span className="hidden rounded-full border border-acid/20 bg-acid/5 px-2 py-1 font-mono text-[9px] text-acid sm:inline">BETA</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm text-slate-400">
            {signedIn && (
              <NavLink to="/next" className={({ isActive }) => `rounded-lg px-3 py-2 hover:text-white ${isActive ? "bg-white/[.06] text-white" : ""}`}>
                Next Quest
              </NavLink>
            )}
            <NavLink to="/leaderboard" className={({ isActive }) => `rounded-lg px-3 py-2 hover:text-white ${isActive ? "bg-white/[.06] text-white" : ""}`}>
              Leaderboard
            </NavLink>
            {signedIn && (
              <NavLink to="/profile" className={({ isActive }) => `rounded-lg px-3 py-2 hover:text-white ${isActive ? "bg-white/[.06] text-white" : ""}`}>
                Profile
              </NavLink>
            )}
            {signedIn ? (
              <button className="ml-2 rounded-lg border border-white/10 p-2 hover:border-white/25" title="Sign out" onClick={() => { session.clear(); location.href = "/"; }}>
                <LogOut size={16} />
              </button>
            ) : (
              <a className="ml-2 flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-bold text-ink" href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"}/auth/github`}>
                <Github size={16} /> Sign in
              </a>
            )}
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  );
}
