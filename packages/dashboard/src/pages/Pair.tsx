import { Check, Chrome, Copy, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, session } from "../lib/api";

export default function Pair() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const create = async () => {
    if (!session.get()) return;
    setError("");
    try { setCode((await api<{ code: string }>("/auth/pair/create", { method: "POST" })).code); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create code"); }
  };
  useEffect(() => { void create(); }, []);
  if (!session.get()) return <div className="mx-auto max-w-lg px-5 py-32 text-center"><Chrome className="mx-auto text-acid" size={36}/><h1 className="mt-6 text-3xl font-black">Pair the Chrome extension</h1><p className="mt-3 text-slate-400">Sign in first. Then we will make a one-time code for your extension.</p><a href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"}/auth/github`} className="mt-7 inline-block rounded-xl bg-acid px-5 py-3 font-bold text-ink">Sign in with GitHub</a></div>;
  return <div className="mx-auto max-w-xl px-5 py-24 text-center fade-up"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-acid/20 bg-acid/10 text-acid"><Chrome size={28}/></div><p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-acid">Extension pairing</p><h1 className="mt-3 text-4xl font-black tracking-tight">Connect your browser</h1><p className="mx-auto mt-4 max-w-md leading-7 text-slate-400">Open GitQuest from Chrome, paste this code, and click Pair extension. It works once and expires in five minutes.</p><button onClick={async () => { if(code){ await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } }} className="group mt-10 w-full rounded-2xl border border-white/10 bg-panel p-7 shadow-2xl hover:border-acid/25"><span className="block font-mono text-3xl font-bold tracking-[.18em] text-white sm:text-4xl">{code || "••••••••••"}</span><span className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">{copied ? <><Check size={14} className="text-acid"/> Copied</> : <><Copy size={14}/> Click to copy</>}</span></button>{error && <p className="mt-4 text-sm text-red-400">{error}</p>}<div className="mt-7 flex justify-center gap-3"><button onClick={create} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-white/25"><RefreshCw size={14}/> New code</button><Link to="/profile" className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-white">Skip to profile</Link></div></div>;
}
