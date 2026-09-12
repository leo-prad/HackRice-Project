import { useEffect, useMemo, useRef } from "react";
import { wrapEmailHtmlDocument } from "../../lib/emailHtmlDocument";

type Props = {
  html: string;
};

export function EmailHtmlBody({ html }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const srcDoc = useMemo(() => wrapEmailHtmlDocument(html), [html]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function resize() {
      const doc = iframe?.contentDocument;
      if (!doc) return;
      const height = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
      iframe!.style.height = `${height}px`;
    }

    function onLoad() {
      resize();
      const doc = iframe?.contentDocument;
      if (!doc?.body) return;

      doc.querySelectorAll("img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", resize, { once: true });
      });

      const observer = new ResizeObserver(resize);
      observer.observe(doc.body);
      return () => observer.disconnect();
    }

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [srcDoc]);

  return (
    <iframe
      ref={iframeRef}
      title="Email message"
      sandbox="allow-same-origin allow-popups"
      srcDoc={srcDoc}
      className="mail-email-html-frame w-full rounded-lg border-0 bg-transparent"
      style={{ minHeight: 120, display: "block" }}
    />
  );
}
