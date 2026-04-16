"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (prefers-color-scheme: dark) {
                body { background-color: #1A1A1A !important; }
                h1 { color: #8BAF8A !important; }
                p { color: #B0B0B0 !important; }
                button { background-color: #8BAF8A !important; color: #1A1A1A !important; }
              }
            `,
          }}
        />
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, backgroundColor: "#FAF5EC" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "2rem", color: "#2C4A3E", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", maxWidth: "400px", marginBottom: "1.5rem" }}>
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#2C4A3E",
              color: "#FAF5EC",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
