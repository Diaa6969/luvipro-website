/** Pure CSS background, no canvas loop, video, trackers or interaction capture. */
export function AnimatedAtmosphere() {
  return (
    <div className="cinematic-atmosphere" aria-hidden="true">
      <div className="cinematic-aurora cinematic-aurora-first" />
      <div className="cinematic-aurora cinematic-aurora-second" />
      <div className="cinematic-light-ribbon cinematic-light-ribbon-one" />
      <div className="cinematic-light-ribbon cinematic-light-ribbon-two" />
      <div className="cinematic-glow cinematic-glow-purple" />
      <div className="cinematic-glow cinematic-glow-blue" />
      <div className="cinematic-haze" />
      <div className="cinematic-particles">
        {Array.from({ length: 14 }).map((_, index) => (
          <span
            key={index}
            style={{
              left: `${(index * 41) % 100}%`,
              top: `${(index * 23) % 100}%`,
              animationDelay: `${index * 0.37}s`,
              animationDuration: `${11 + (index % 6)}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
