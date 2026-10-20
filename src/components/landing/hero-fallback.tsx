/** Lightweight illustration for unavailable WebGL and while the Three scene loads. */
export function HeroSceneFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 420 360" className="h-[78%] w-[88%]" fill="none">
        <ellipse cx="210" cy="296" rx="138" ry="22" fill="#4E3AD8" opacity=".09" />
        <g transform="rotate(-8 210 210)">
          <path d="M64 142Q137 115 210 146Q283 115 356 142V278Q282 255 210 282Q137 255 64 278Z" fill="#6D5BF6" />
          <path d="M73 132Q142 108 210 140V268Q142 241 73 265Z" fill="#FFFCF3" />
          <path d="M210 140Q278 108 347 132V265Q278 241 210 268Z" fill="#FFF8E9" />
          <path d="M210 141V267" stroke="#D9D0EC" strokeWidth="4" />
          <path d="M94 163H174M94 185H185M94 207H163M94 229H180" stroke="#CEC2E8" strokeWidth="5" strokeLinecap="round" />
          <path d="M239 164H320M239 186H305M239 208H319" stroke="#E0D5ED" strokeWidth="5" strokeLinecap="round" />
          <path d="M239 232H271" stroke="#2DBB8C" strokeWidth="8" strokeLinecap="round" />
          <path d="m288 75 11 25 28 3-21 19 6 28-24-14-24 14 5-28-21-19 29-3Z" fill="#F4C95D" />
          <circle cx="116" cy="94" r="12" fill="#F2748B" />
        </g>
      </svg>
    </div>
  );
}
