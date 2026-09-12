/** White reading surface that preserves the sender's original HTML layout (Outlook-style). */
export function wrapEmailHtmlDocument(html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <base target="_blank" rel="noopener noreferrer">
  <style>
    :root { color-scheme: light; }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    body {
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto,
        Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #1d1d1f;
      word-wrap: break-word;
      overflow-wrap: break-word;
      -webkit-font-smoothing: antialiased;
    }

    /* Keep wide content readable without breaking table layouts. */
    img {
      max-width: 100%;
      height: auto;
    }

    table {
      max-width: 100%;
    }

    a {
      color: #157e76;
    }

    pre, code {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>${html}</body>
</html>`;
}
