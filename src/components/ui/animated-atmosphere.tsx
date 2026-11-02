import { SemanticFilm } from "@/components/ui/semantic-film";

/** Genuine workshop filming is a dark, blurred ATMOSPHERIC background only.
 * Website content stays readable in the foreground. No square grids.
 */
export function AnimatedAtmosphere() {
  return (
    <div className="cinematic-atmosphere semantic-atmosphere" aria-hidden="true">
      <SemanticFilm scene="ambient" mode="ambient" />
      <div className="semantic-ambient-aurora semantic-ambient-aurora-left" />
      <div className="semantic-ambient-aurora semantic-ambient-aurora-right" />
      <div className="semantic-ambient-beam" />
    </div>
  );
}
