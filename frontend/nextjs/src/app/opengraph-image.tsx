import { ImageResponse } from "next/og";

/**
 * The card a link to this site unfolds into, in a message or a feed. It is generated from the same
 * facts the page states rather than drawn by hand, so it cannot drift away from them.
 */
export const alt = "Mustafa Göksel Gökmen · Senior Software Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FACTS = ["One API contract", "One backend live, three planned", "149 automated tests"];

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #05070f 55%, #0b2230 100%)",
        padding: 72,
        color: "#e2e8f0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 10,
            border: "2px solid rgba(34, 211, 238, 0.45)",
            color: "#22d3ee",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          MG
        </div>
        <div style={{ fontSize: 20, letterSpacing: 4, color: "#22d3ee" }}>
          SENIOR SOFTWARE DEVELOPER · 20+ YEARS
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>
          Mustafa Göksel Gökmen
        </div>
        <div style={{ fontSize: 32, lineHeight: 1.4, color: "#94a3b8", maxWidth: 900 }}>
          I build systems where the hard parts are handled rather than hoped for: identity, event
          delivery, concurrency and the boundary between services.
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {FACTS.map((fact) => (
          <div
            key={fact}
            style={{
              display: "flex",
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: 22,
              color: "#cbd5e1",
            }}
          >
            {fact}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
