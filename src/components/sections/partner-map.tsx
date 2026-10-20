import { Reveal } from "@/components/ui/reveal";
import { WorkshopFinder } from "@/components/sections/workshop-finder";

export function PartnerMap() {
  return (
    <section id="partner-map" className="scroll-mt-24 bg-midnight py-24">
      <div className="section-shell">
        <Reveal>
          <WorkshopFinder locale="de" />
        </Reveal>
      </div>
    </section>
  );
}
