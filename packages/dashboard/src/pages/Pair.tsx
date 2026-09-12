import { Check, Chrome, Copy, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, session } from "../lib/api";
import PageShell from "../components/ui/PageShell";
import { Surface } from "../components/ui/Surface";
import ScrollReveal from "../motion/ScrollReveal";

export default function Pair() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (!session.get()) return;
    setError("");
    try {
      setCode((await api<{ code: string }>("/auth/pair/create", { method: "POST" })).code);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create code");
    }
  };

  useEffect(() => {
    void create();
  }, []);

  if (!session.get()) {
    return (
      <PageShell>
        <ScrollReveal className="mx-auto max-w-lg py-16 text-center">
          <Chrome className="mx-auto text-trail" size={36} />
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-snow">
            Pair the Chrome extension
          </h1>
          <p className="mt-3 font-body text-fog">
            Sign in first. Then we will make a one-time code for your extension.
          </p>
          <a
            href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"}/auth/github`}
            className="gv-btn-primary mt-7 px-5 py-3"
          >
            Sign in with GitHub
          </a>
        </ScrollReveal>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ScrollReveal className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] border border-trail/25 bg-trail/10 text-trail">
          <Chrome size={28} />
        </div>
        <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-trail">
          Extension pairing
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-snow">
          Connect your browser
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body leading-relaxed text-fog">
          Open GitVenture from Chrome, paste this code, and click Pair extension. It works once and
          expires in five minutes.
        </p>

        <button
          type="button"
          onClick={async () => {
            if (code) {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }
          }}
          className="group mt-10 w-full"
        >
          <Surface
            hover
            className="p-7 transition-colors duration-300 group-hover:border-trail/30"
          >
            <span className="block font-mono text-3xl font-bold tracking-[0.18em] text-snow sm:text-4xl">
              {code || "••••••••••"}
            </span>
            <span className="mt-4 flex items-center justify-center gap-2 font-body text-xs text-mist">
              {copied ? (
                <>
                  <Check size={14} className="text-trail" /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Click to copy
                </>
              )}
            </span>
          </Surface>
        </button>

        {error && <p className="mt-4 font-body text-sm text-red-400">{error}</p>}

        <div className="mt-7 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => void create()}
            className="gv-btn-secondary px-4 py-2.5 text-sm"
          >
            <RefreshCw size={14} /> New code
          </button>
          <Link to="/auth/continue" className="gv-btn-secondary border-transparent bg-transparent px-4 py-2.5 text-sm text-mist hover:text-snow">
            Continue to app
          </Link>
        </div>
      </ScrollReveal>
    </PageShell>
  );
}
