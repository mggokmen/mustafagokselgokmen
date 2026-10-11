/**
 * The system as it is, drawn rather than described. Solid lines are what runs in production;
 * dashed is what exists in the repository but is not deployed (ADR-011), which the legend says
 * out loud instead of letting the picture imply more than is true.
 */
export function ArchitectureDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 440 272"
      className={className}
      role="img"
      aria-label="One OpenAPI contract drives the API and its clients. A request writes a contact message and an event in one transaction; the event is published to Kafka and consumed by a separate notification service."
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
        </marker>
        <marker
          id="arrowDim"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
        </marker>
      </defs>

      {/* contract */}
      <g>
        <rect
          x="140"
          y="8"
          width="160"
          height="34"
          rx="6"
          fill="#0c4a6e"
          stroke="#22d3ee"
          strokeWidth="1.5"
        />
        <text x="220" y="30" textAnchor="middle" className="fill-cyan-200 text-[13px] font-medium">
          openapi.yaml
        </text>
      </g>

      {/* contract -> web, api, mobile */}
      <path
        d="M 180 42 L 110 70"
        stroke="#64748b"
        strokeWidth="1.2"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <path
        d="M 220 42 L 220 70"
        stroke="#64748b"
        strokeWidth="1.2"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <path
        d="M 260 42 L 330 70"
        stroke="#475569"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="4 3"
        markerEnd="url(#arrowDim)"
      />

      {/* web */}
      <rect
        x="40"
        y="72"
        width="140"
        height="34"
        rx="6"
        fill="#0f172a"
        stroke="#475569"
        strokeWidth="1.2"
      />
      <text x="110" y="88" textAnchor="middle" className="fill-slate-200 text-[12px] font-medium">
        Next.js server
      </text>
      <text x="110" y="100" textAnchor="middle" className="fill-slate-500 text-[10px]">
        holds the tokens
      </text>

      {/* mobile, planned */}
      <rect
        x="265"
        y="72"
        width="130"
        height="34"
        rx="6"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <text x="330" y="88" textAnchor="middle" className="fill-slate-400 text-[12px]">
        Android · iOS
      </text>
      <text x="330" y="100" textAnchor="middle" className="fill-slate-500 text-[10px]">
        planned
      </text>

      {/* api */}
      <rect
        x="150"
        y="122"
        width="140"
        height="38"
        rx="6"
        fill="#0f172a"
        stroke="#22d3ee"
        strokeWidth="1.5"
      />
      <text
        x="220"
        y="139"
        textAnchor="middle"
        className="fill-slate-100 text-[13px] font-semibold"
      >
        Spring Boot API
      </text>
      <text x="220" y="152" textAnchor="middle" className="fill-slate-500 text-[10px]">
        Go · .NET · FastAPI planned
      </text>

      <path
        d="M 110 106 L 180 122"
        stroke="#64748b"
        strokeWidth="1.2"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <path
        d="M 330 106 L 262 122"
        stroke="#475569"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="4 3"
        markerEnd="url(#arrowDim)"
      />

      {/* one transaction */}
      <rect
        x="130"
        y="182"
        width="180"
        height="48"
        rx="6"
        fill="#0b1220"
        stroke="#475569"
        strokeWidth="1.2"
      />
      <text
        x="220"
        y="198"
        textAnchor="middle"
        className="fill-slate-400 text-[10px] tracking-wide"
      >
        ONE TRANSACTION
      </text>
      <text x="175" y="216" textAnchor="middle" className="fill-slate-200 text-[11px]">
        contact_messages
      </text>
      <text x="266" y="216" textAnchor="middle" className="fill-cyan-200 text-[11px]">
        outbox_events
      </text>
      <path
        d="M 220 160 L 220 182"
        stroke="#64748b"
        strokeWidth="1.2"
        fill="none"
        markerEnd="url(#arrow)"
      />

      {/* kafka + consumer, not deployed */}
      <path
        d="M 310 206 L 352 206"
        stroke="#475569"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="4 3"
        markerEnd="url(#arrowDim)"
      />
      <rect
        x="352"
        y="188"
        width="78"
        height="34"
        rx="6"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <text x="391" y="203" textAnchor="middle" className="fill-slate-400 text-[11px]">
        Kafka
      </text>
      <text x="391" y="214" textAnchor="middle" className="fill-slate-500 text-[10px]">
        + consumer
      </text>

      {/* postgres */}
      <rect
        x="10"
        y="182"
        width="100"
        height="34"
        rx="6"
        fill="#0f172a"
        stroke="#475569"
        strokeWidth="1.2"
      />
      <text x="60" y="203" textAnchor="middle" className="fill-slate-200 text-[12px]">
        PostgreSQL
      </text>
      <path
        d="M 150 200 L 112 200"
        stroke="#64748b"
        strokeWidth="1.2"
        fill="none"
        markerEnd="url(#arrow)"
      />

      {/* legend */}
      <g>
        <line x1="12" y1="258" x2="36" y2="258" stroke="#64748b" strokeWidth="1.5" />
        <text x="42" y="261" className="fill-slate-400 text-[10px]">
          in production
        </text>
        <line
          x1="130"
          y1="258"
          x2="154"
          y2="258"
          stroke="#334155"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text x="160" y="261" className="fill-slate-500 text-[10px]">
          built and tested, not deployed
        </text>
      </g>
    </svg>
  );
}
