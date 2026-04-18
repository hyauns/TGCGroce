/**
 * app/loading.tsx — Global Next.js Suspense loading UI
 *
 * Shown on every route transition while the server component is fetching.
 * Light/white theme to match the existing frontend.
 * Zero external dependencies — all assets are inline SVG + CSS keyframes.
 */
export default function Loading() {
  return (
    <>
      {/* ── Keyframe definitions ─────────────────────────────────────────── */}
      <style>{`
        @keyframes cardFlipFloat {
          0%   { transform: translateY(0px)   rotateY(0deg); }
          20%  { transform: translateY(-14px) rotateY(90deg); }
          40%  { transform: translateY(-22px) rotateY(180deg); }
          60%  { transform: translateY(-14px) rotateY(270deg); }
          80%  { transform: translateY(-6px)  rotateY(340deg); }
          100% { transform: translateY(0px)   rotateY(360deg); }
        }

        @keyframes shadowPulse {
          0%,100% { transform: scaleX(1);    opacity: 0.18; filter: blur(6px); }
          40%      { transform: scaleX(0.55); opacity: 0.07; filter: blur(12px); }
        }

        @keyframes dotBounce {
          0%,80%,100% { transform: translateY(0);    opacity: 0.35; }
          40%          { transform: translateY(-7px); opacity: 1; }
        }

        @keyframes textPulse {
          0%,100% { opacity: 0.65; }
          50%      { opacity: 1; }
        }

        @keyframes shimmerCorner {
          0%,100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }

        @keyframes centerGlow {
          0%,100% { opacity: 0.8; r: 7; }
          50%      { opacity: 1;   r: 10; }
        }

        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes ringRotateR {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }

        .tgc-card       { animation: cardFlipFloat 2.6s cubic-bezier(0.45,0.05,0.55,0.95) infinite; transform-style: preserve-3d; }
        .tgc-shadow     { animation: shadowPulse   2.6s ease-in-out infinite; }
        .tgc-dot-1      { animation: dotBounce 1.3s ease-in-out infinite; }
        .tgc-dot-2      { animation: dotBounce 1.3s ease-in-out infinite 0.20s; }
        .tgc-dot-3      { animation: dotBounce 1.3s ease-in-out infinite 0.40s; }
        .tgc-text       { animation: textPulse  2s  ease-in-out infinite; }
        .tgc-corner     { animation: shimmerCorner 2s ease-in-out infinite; }
        .tgc-ring-cw    { animation: ringRotate  8s linear infinite; transform-origin: 60px 84px; }
        .tgc-ring-ccw   { animation: ringRotateR 6s linear infinite; transform-origin: 60px 84px; }
        .tgc-core       { animation: centerGlow  2s ease-in-out infinite; }
      `}</style>

      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      <div
        aria-label="Loading, please wait"
        role="status"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          gap: 0,
        }}
      >
        {/* ── Card scene ───────────────────────────────────────────────── */}
        <div style={{ position: "relative", marginBottom: 28 }}>

          {/* Levitation shadow — lives BELOW the card */}
          <div
            className="tgc-shadow"
            style={{
              position: "absolute",
              bottom: -10,
              left: "50%",
              translate: "-50% 0",
              width: 90,
              height: 14,
              borderRadius: "50%",
              background: "rgb(37 99 235)",
              transformOrigin: "center center",
            }}
          />

          {/* The TCG card */}
          <div
            className="tgc-card"
            style={{
              filter:
                "drop-shadow(0 8px 28px rgba(37,99,235,0.18)) drop-shadow(0 2px 6px rgba(37,99,235,0.10))",
            }}
          >
            <svg
              width="120"
              height="168"
              viewBox="0 0 120 168"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* ── Card body ── */}
              <rect x="2" y="2" width="116" height="164" rx="10" fill="white" />
              {/* Blue border — 3 px */}
              <rect
                x="2" y="2" width="116" height="164" rx="10"
                stroke="rgb(37,99,235)" strokeWidth="3" fill="none"
              />
              {/* Subtle inner-border */}
              <rect
                x="7" y="7" width="106" height="154" rx="7"
                stroke="rgb(37,99,235)" strokeWidth="0.6" strokeOpacity="0.25" fill="none"
              />

              {/* ── Outer spinning ring ── */}
              <g className="tgc-ring-cw">
                <circle
                  cx="60" cy="84" r="34"
                  stroke="rgb(37,99,235)" strokeWidth="0.75"
                  strokeDasharray="5 5" fill="none" strokeOpacity="0.30"
                />
                {/* 8 ring nodes */}
                {[0,45,90,135,180,225,270,315].map((deg) => {
                  const rad = (deg * Math.PI) / 180
                  return (
                    <circle
                      key={deg}
                      cx={60 + 34 * Math.cos(rad)}
                      cy={84 + 34 * Math.sin(rad)}
                      r={deg % 90 === 0 ? 3 : 2}
                      fill={deg % 90 === 0 ? "#eab308" : "rgb(37,99,235)"}
                      opacity={deg % 90 === 0 ? 0.85 : 0.40}
                    />
                  )
                })}
              </g>

              {/* ── Inner counter-spinning ring ── */}
              <g className="tgc-ring-ccw">
                <circle
                  cx="60" cy="84" r="22"
                  stroke="#eab308" strokeWidth="0.75"
                  strokeDasharray="3 7" fill="none" strokeOpacity="0.40"
                />
                {[0,60,120,180,240,300].map((deg) => {
                  const rad = (deg * Math.PI) / 180
                  return (
                    <circle
                      key={deg}
                      cx={60 + 22 * Math.cos(rad)}
                      cy={84 + 22 * Math.sin(rad)}
                      r="2"
                      fill="#eab308"
                      opacity="0.55"
                    />
                  )
                })}
              </g>

              {/* ── Central emblem — diamond ── */}
              {/* Outer diamond */}
              <polygon
                points="60,62 78,84 60,106 42,84"
                fill="white"
                stroke="rgb(37,99,235)"
                strokeWidth="1.5"
              />
              {/* Inner diamond */}
              <polygon
                points="60,70 72,84 60,98 48,84"
                fill="white"
                stroke="#eab308"
                strokeWidth="1"
                strokeOpacity="0.7"
              />
              {/* Cardinal rays */}
              {[0,90,180,270].map((deg) => {
                const rad = (deg * Math.PI) / 180
                return (
                  <line
                    key={deg}
                    x1={60 + 7  * Math.cos(rad)} y1={84 + 7  * Math.sin(rad)}
                    x2={60 + 15 * Math.cos(rad)} y2={84 + 15 * Math.sin(rad)}
                    stroke="rgb(37,99,235)" strokeWidth="1.5" strokeLinecap="round"
                    opacity="0.7"
                  />
                )
              })}
              {/* Diagonal rays */}
              {[45,135,225,315].map((deg) => {
                const rad = (deg * Math.PI) / 180
                return (
                  <line
                    key={deg}
                    x1={60 + 6  * Math.cos(rad)} y1={84 + 6  * Math.sin(rad)}
                    x2={60 + 11 * Math.cos(rad)} y2={84 + 11 * Math.sin(rad)}
                    stroke="#eab308" strokeWidth="1" strokeLinecap="round"
                    opacity="0.6"
                  />
                )
              })}
              {/* Glowing core dot */}
              <circle className="tgc-core" cx="60" cy="84" r="7" fill="#eab308" opacity="0.9" />
              <circle cx="60" cy="84" r="3.5" fill="white" />

              {/* ── Gold corner ornaments ── */}
              {/* Top-left */}
              <g className="tgc-corner">
                <polygon points="14,14 24,14 14,24" fill="#eab308" opacity="0.75" />
                <line x1="14" y1="28" x2="14" y2="35" stroke="#eab308" strokeWidth="1" opacity="0.4" />
                <line x1="18" y1="14" x2="25" y2="14" stroke="#eab308" strokeWidth="1" opacity="0.4" />
              </g>
              {/* Top-right */}
              <g className="tgc-corner" style={{ animationDelay: "0.5s" }}>
                <polygon points="106,14 96,14 106,24" fill="#eab308" opacity="0.75" />
                <line x1="106" y1="28" x2="106" y2="35" stroke="#eab308" strokeWidth="1" opacity="0.4" />
                <line x1="102" y1="14" x2="95" y2="14" stroke="#eab308" strokeWidth="1" opacity="0.4" />
              </g>
              {/* Bottom-left */}
              <g className="tgc-corner" style={{ animationDelay: "1s" }}>
                <polygon points="14,154 24,154 14,144" fill="#eab308" opacity="0.75" />
                <line x1="14" y1="140" x2="14" y2="133" stroke="#eab308" strokeWidth="1" opacity="0.4" />
                <line x1="18" y1="154" x2="25" y2="154" stroke="#eab308" strokeWidth="1" opacity="0.4" />
              </g>
              {/* Bottom-right */}
              <g className="tgc-corner" style={{ animationDelay: "1.5s" }}>
                <polygon points="106,154 96,154 106,144" fill="#eab308" opacity="0.75" />
                <line x1="106" y1="140" x2="106" y2="133" stroke="#eab308" strokeWidth="1" opacity="0.4" />
                <line x1="102" y1="154" x2="95" y2="154" stroke="#eab308" strokeWidth="1" opacity="0.4" />
              </g>

              {/* ── Top label strip ── */}
              <rect x="16" y="13" width="88" height="13" rx="3" fill="rgb(37,99,235)" opacity="0.07" />
              <text
                x="60" y="23"
                textAnchor="middle"
                fill="rgb(37,99,235)"
                fontSize="6.5"
                fontFamily="Georgia, 'Times New Roman', serif"
                letterSpacing="2.5"
                opacity="0.6"
              >
                TCG Lore Operated by A TOY HAULERZ LLC Company
              </text>

              {/* ── Bottom label strip ── */}
              <rect x="16" y="142" width="88" height="13" rx="3" fill="rgb(37,99,235)" opacity="0.07" />
              <text
                x="60" y="152"
                textAnchor="middle"
                fill="#eab308"
                fontSize="5.5"
                fontFamily="Georgia, 'Times New Roman', serif"
                letterSpacing="1.8"
                opacity="0.7"
              >
                MYTHIC COLLECTION
              </text>

              {/* ── Side filigree lines ── */}
              <line x1="12" y1="46"  x2="12" y2="122" stroke="rgb(37,99,235)" strokeWidth="0.6" strokeOpacity="0.18" />
              <line x1="108" y1="46" x2="108" y2="122" stroke="rgb(37,99,235)" strokeWidth="0.6" strokeOpacity="0.18" />
            </svg>
          </div>
        </div>

        {/* ── Text + dots ───────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <span
            className="tgc-text"
            style={{
              color: "rgb(37, 99, 235)",
              fontSize: 13,
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: "0.22em",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Shuffling Deck
          </span>

          {/* Gold pulsing dots */}
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {(["tgc-dot-1", "tgc-dot-2", "tgc-dot-3"] as const).map((cls) => (
              <span
                key={cls}
                className={cls}
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#eab308",
                  boxShadow: "0 0 6px #eab308aa",
                }}
              />
            ))}
          </span>
        </div>

        {/* ── Subtitle ─────────────────────────────────────────────────── */}
        <p
          style={{
            color: "rgb(37,99,235)",
            fontSize: 11,
            fontFamily: "sans-serif",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: 0.4,
            margin: 0,
          }}
        >
          TCG Lore Operated by A TOY HAULERZ LLC Company.
        </p>
      </div>
    </>
  )
}
