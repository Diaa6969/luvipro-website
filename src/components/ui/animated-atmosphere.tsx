export function AnimatedAtmosphere() {
  return (
    <div className="cinematic-atmosphere" aria-hidden="true">
      <div className="cinematic-grid" />
      <div className="cinematic-glow cinematic-glow-purple" />
      <div className="cinematic-glow cinematic-glow-blue" />
      <div className="cinematic-beam cinematic-beam-one" />
      <div className="cinematic-beam cinematic-beam-two" />
      <div className="cinematic-haze" />
      <div className="cinematic-particles">
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            style={{
              left: `${(index * 41) % 100}%`,
              top: `${(index * 23) % 100}%`,
              animationDelay: `${index * 0.28}s`,
              animationDuration: `${9 + (index % 6)}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
