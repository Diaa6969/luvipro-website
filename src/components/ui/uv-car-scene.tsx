/**
 * Lightweight, purely illustrative UV vehicle scan.
 * No photos, user records, diagnostic results, canvas or WebGL dependencies.
 * Static artwork remains legible with reduced motion.
 */
const carBody =
  "M75 212 Q90 188 186 177 L244 115 Q255 102 281 102 L409 102 Q432 103 453 125 L503 174 Q557 177 590 196 Q607 207 609 222 L609 232 Q607 243 587 244 L549 244 Q543 197 502 197 Q460 197 450 244 L238 244 Q234 197 192 197 Q151 197 139 244 L96 244 Q76 242 75 228 Z";

export function UvCarScene({ label = "Stilisierte Fahrzeugkarosserie mit animiertem UV-Lichtscan", compact = false }: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className={`uv-car-scene relative isolate w-full overflow-hidden rounded-2xl ${compact ? "uv-car-scene-compact" : ""}`} role="img" aria-label={label}>
      <div className="uv-car-aura" aria-hidden="true" />
      <div className="uv-car-floor" aria-hidden="true" />
      <svg className="uv-car-illustration relative z-10 block h-auto w-full" viewBox="0 0 680 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="luvi-car-paint" x1="0" y1="0" x2="0.95" y2="1">
            <stop offset="0%" stopColor="#37405c" />
            <stop offset="34%" stopColor="#11182a" />
            <stop offset="62%" stopColor="#25243e" />
            <stop offset="100%" stopColor="#090e1c" />
          </linearGradient>
          <linearGradient id="luvi-car-window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#33486d" stopOpacity=".9" />
            <stop offset="1" stopColor="#080d1a" stopOpacity=".98" />
          </linearGradient>
          <linearGradient id="luvi-car-scan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8c40ff" stopOpacity=".06" />
            <stop offset=".5" stopColor="#aa75ff" stopOpacity=".54" />
            <stop offset="1" stopColor="#29d9ff" stopOpacity=".15" />
          </linearGradient>
          <linearGradient id="luvi-car-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#99b5e5" stopOpacity=".65" />
            <stop offset=".7" stopColor="#6370a3" stopOpacity=".10" />
            <stop offset="1" stopColor="#6e50ca" stopOpacity=".4" />
          </linearGradient>
          <radialGradient id="luvi-car-wheel">
            <stop offset="0%" stopColor="#68758f" />
            <stop offset="28%" stopColor="#283246" />
            <stop offset="40%" stopColor="#0c101c" />
            <stop offset="72%" stopColor="#171d2b" />
            <stop offset="100%" stopColor="#010307" />
          </radialGradient>
          <filter id="luvi-car-glow" x="-60%" y="-80%" width="220%" height="260%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <clipPath id="luvi-car-body-clip">
            <path d={carBody} />
          </clipPath>
          <clipPath id="luvi-car-sweep-clip">
            <rect className="uv-car-sweep-rect" x="-210" y="0" width="210" height="310" />
          </clipPath>
        </defs>
        <g opacity=".45" fill="none" strokeWidth="1">
          <path d="M34 270 H650" stroke="#496eaa" strokeOpacity=".45" />
          <path d="M111 288 H574" stroke="#3f2e96" strokeOpacity=".55" />
          <path d="M166 298 H511" stroke="#22d6ff" strokeOpacity=".13" />
          <path d="M125 74 H181 M500 65 H562" stroke="#3b91d4" strokeOpacity=".5" strokeDasharray="9 10" />
          <path d="M561 85 H616 M39 117 H101" stroke="#8c4bed" strokeOpacity=".35" strokeDasharray="3 8" />
          <circle cx="561" cy="89" r="3" fill="#36d2ee" stroke="none" />
          <circle cx="128" cy="76" r="2.5" fill="#966bff" stroke="none" />
        </g>
        <ellipse cx="342" cy="268" rx="272" ry="16" fill="#7946ff" opacity=".16" filter="url(#luvi-car-glow)" />
        <path d={carBody} fill="url(#luvi-car-paint)" stroke="url(#luvi-car-metal)" strokeWidth="2.5" />
        <path d="M246 117 Q257 106 279 106 L345 106 L344 174 L192 175 Z" fill="url(#luvi-car-window)" stroke="#6b8cac" strokeOpacity=".48" strokeWidth="1.5" />
        <path d="M357 107 H406 Q425 108 440 127 L488 174 H355 Z" fill="url(#luvi-car-window)" stroke="#6b8cac" strokeOpacity=".48" strokeWidth="1.5" />
        <path d="M348 109 L350 234 M492 179 L474 199 M171 183 L138 192" stroke="#8ba1bd" strokeOpacity=".35" strokeWidth="2" fill="none" />
        <path d="M310 185 H335 M378 185 H404" stroke="#b1b9df" strokeOpacity=".44" strokeWidth="2" strokeLinecap="round" />
        <path d="M82 210 Q145 189 196 185 L499 184 Q566 185 595 209" stroke="#b1bcf7" strokeOpacity=".32" strokeWidth="1.6" fill="none" />
        <path d="M246 123 L221 166 M446 132 L471 166" stroke="#ffffff" strokeOpacity=".15" strokeWidth="3" />
        <path d="M576 205 L607 212 L606 219 L582 220 Z" fill="#b9f8ff" opacity=".78" />
        <path d="M82 208 L105 201 L99 215 L78 219 Z" fill="#ff497c" opacity=".75" />
        {([192, 502] as const).map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="241" r="44" fill="#020308" />
            <circle cx={cx} cy="241" r="36" fill="url(#luvi-car-wheel)" stroke="#4f587c" strokeWidth="1.5" />
            <circle cx={cx} cy="241" r="20" fill="#1a2337" stroke="#899aba" strokeOpacity=".56" strokeWidth="2" />
            <circle cx={cx} cy="241" r="7" fill="#64718f" />
            <path d={`M${cx - 15} 225 L${cx + 15} 257 M${cx + 15} 225 L${cx - 15} 257 M${cx} 221 V261 M${cx - 20} 241 H${cx + 20}`} stroke="#c5d3ef" strokeOpacity=".25" strokeWidth="2" />
          </g>
        ))}
        <g clipPath="url(#luvi-car-body-clip)">
          <g clipPath="url(#luvi-car-sweep-clip)">
            <rect x="60" y="90" width="580" height="170" fill="url(#luvi-car-scan)" opacity=".8" />
            <path d={carBody} fill="none" stroke="#aa77ff" strokeWidth="4" opacity=".95" />
            <path d="M110 214 Q190 177 345 179 Q490 174 596 207 M242 118 L347 117 L443 126" fill="none" stroke="#49ecff" strokeWidth="2.2" opacity=".9" />
            <path d="M345 116 V241 M484 182 L478 237" stroke="#f0cbff" strokeWidth="1.7" opacity=".8" />
          </g>
        </g>
        <g className="uv-car-scan-ray">
          <rect x="-105" y="65" width="6" height="207" fill="#b590ff" opacity=".6" filter="url(#luvi-car-glow)" />
          <rect x="-102" y="79" width="2" height="185" fill="#abf3ff" opacity=".8" />
        </g>
        <path d="M95 262 H583" stroke="#22d6ff" strokeOpacity=".23" strokeWidth="1.5" />
      </svg>
      <div className="uv-car-bottom-glow" aria-hidden="true" />
    </div>
  );
}
