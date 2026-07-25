// The CareShift logo (the lime "C" badge).
// It's one SVG so it looks the same everywhere it's used,
// just pass a different `size` to make it bigger or smaller.

type BrandMarkProps = {
  size?: number; // width & height in pixels, defaults to 60
};

export default function BrandMark({ size = 60 }: BrandMarkProps) {
  return (
    // viewBox stays fixed at 60x60 — this is what keeps the logo
    // looking correct no matter what `size` is passed in.
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        {/* Diagonal lime gradient for the badge background (light -> dark) */}
        <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F2FFC4" />
          <stop offset="45%" stopColor="#D4FF3E" />
          <stop offset="100%" stopColor="#9FCB1A" />
        </linearGradient>

        {/* Soft white glow in the top-left corner, like light hitting glass */}
        <radialGradient id="brandGloss" cx="30%" cy="22%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Rounded square badge background */}
      <rect width="60" height="60" rx="16" fill="url(#brandGradient)" />

      {/* Glossy highlight layered on top of the background */}
      <rect width="60" height="60" rx="16" fill="url(#brandGloss)" />

      {/* Heartbeat/pulse line behind the letter — a small nod to "care" */}
      <path
        d="M6 39 H19 L24 27 L31 47 L37 25 L41 39 H54"
        fill="none"
        stroke="#090C0B"
        strokeOpacity="0.2"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* The "C" letter, centered on top of everything */}
      <text
        x="50%"
        y="53%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontStyle="italic"
        fontWeight="900"
        fontSize="34"
        fill="#090C0B"
      >
        C
      </text>
    </svg>
  );
}
