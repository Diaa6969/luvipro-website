"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Camera, Crosshair, FileCheck2, Fingerprint, Lightbulb, LockKeyhole, Smartphone, Store, Wrench } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

const chapters = [
  { name: "Fahrzeug", title: "Jedes Fahrzeug hat eine Geschichte.", body: "Wir bringen die Wahrheit ans Licht.", icon: Camera },
  { name: "Oberfläche", title: "Was das Auge übersieht", body: "Bewegen Sie das UV-Licht über die Karosserie. Unterschiede in der Oberfläche können Hinweise für die weitere Sichtprüfung geben.", icon: Crosshair },
  { name: "UV-Prüfung", title: "365 nm in der Werkstatt", body: "Das LU3656060 unterstützt die professionelle Sichtprüfung. Die Werkstatt dokumentiert ihre Beobachtungen.", icon: Lightbulb, href: "/products", link: "Gerät entdecken" },
  { name: "App", title: "Prüfung digital dokumentieren", body: "Die Werkstatt ordnet dem Fahrzeug Prüfschritte, Fotos und Videodokumentation zu. Die Bildschirmansicht zeigt den Ablauf schematisch.", icon: Smartphone, href: "/app", link: "LUVIPRO App entdecken" },
  { name: "Bericht", title: "Dokumentation mit FIN-Zuordnung", body: "Die FIN ordnet den abgeschlossenen Bericht dem Fahrzeug zu. Der vollständige Bericht bleibt berechtigten Nutzern vorbehalten.", icon: FileCheck2, href: "/reports", link: "Prüfbericht suchen" },
  { name: "Historie", title: "Fahrzeughistorie · In Planung", body: "LUVIPRO prüft, ob externe Daten zu Schäden, Kilometerständen und früheren Zulassungen die Werkstattprüfung ergänzen können.", icon: Fingerprint },
  { name: "Werkstatt", title: "Technologie trifft Werkstattkompetenz.", body: "Partnerwerkstätten prüfen und dokumentieren das Fahrzeug vor Ort. Über die Suche können Sie die Verfügbarkeit anfragen.", icon: Wrench, href: "/partner-workshops", link: "Partnerwerkstatt finden" },
  { name: "Marketplace", title: "Vom geprüften Fahrzeug zum Inserat", body: "Veröffentlichte Inserate verknüpfen Fahrzeugdaten mit einem LUVIPRO Prüfbericht. Die veranschaulichte Ansicht zeigt ein Schema.", icon: Store, href: "/marketplace", link: "Marketplace entdecken" },
  { name: "LUVIPRO", title: "Vertrauen ist gut, LUVIPRO ist besser.", body: "UV-Gerät, Partnerwerkstatt, App, Prüfbericht und Marketplace.", icon: LockKeyhole, href: "/verify#partner-map", link: "Fahrzeug checken lassen" },
];

const panels = [
  { heading: "Prüfung · Schema", rows: ["Fahrzeug und FIN", "Prüfumfang", "Foto- und Videodokumentation", "Bericht abschließen"] },
  { heading: "Prüfbericht · Schema", rows: ["FIN zugeordnet", "Prüfumfang und Dokumentation", "Zugriff mit Berechtigung"] },
  { heading: "Marketplace · Schema", rows: ["Fahrzeugdaten", "Bilder und Verkäufer", "Prüfbericht verknüpft"] },
];

export function VehicleExperience({ scene, id }: { scene?: number; id?: string }) {
  const journey = scene === undefined;
  const [selected, setSelected] = useState(scene ?? 0);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [uvPosition, setUvPosition] = useState(50);
  const runway = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [uvEnabled, setUvEnabled] = useState(true);
  const [focus, setFocus] = useState<number>();
  const uv = useRef(.5);
  const lightOn = useRef(true);
  const inspectionFocus = useRef<number | undefined>(undefined);
  const motion = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const container = runway.current;
    const viewport = surface.current;
    const output = canvas.current;
    if (!container || !viewport || !output) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let loaded = false;
    let disposed = false;
    let contextLost = false;
    let stage: ReturnType<typeof import("./stage").mountStage> | undefined;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let x = 0;
    let y = 0;
    let progress = scene ?? 0;
    let current = progress;
    let targetUv = .5;
    let currentUv = .5;
    let lastChapter = Math.round(progress);

    const measure = () => {
      if (!journey || preference.matches || contextLost) return;
      const bounds = container.getBoundingClientRect();
      const travel = Math.max(1, bounds.height - viewport.offsetHeight);
      const top = Number.parseFloat(getComputedStyle(viewport).top) || 0;
      progress = Math.min(1, Math.max(0, (top - bounds.top) / travel)) * (chapters.length - 1);
      const chapter = Math.round(progress);
      if (chapter !== lastChapter) {
        lastChapter = chapter;
        setSelected(chapter);
        setFocus(undefined);
        inspectionFocus.current = undefined;
      }
    };
    const tick = () => {
      frame = 0;
      if (!visible || disposed) return;
      measure();
      current += (progress - current) * .18;
      x += (pointerX - x) * .15;
      y += (pointerY - y) * .15;
      currentUv += (targetUv - currentUv) * .19;
      if (!preference.matches && !contextLost) stage?.draw(current, x, y, currentUv, lightOn.current, inspectionFocus.current);
      const moving = Math.max(Math.abs(progress - current), Math.abs(x - pointerX), Math.abs(y - pointerY), Math.abs(currentUv - targetUv));
      if (moving > .001 || (stage && !preference.matches && settleFrames-- > 0)) schedule();
    };
    let settleFrames = 0;
    const schedule = () => {
      if (visible && !frame) frame = requestAnimationFrame(tick);
    };
    const invalidate = () => {
      settleFrames = 15;
      schedule();
    };
    const resize = () => {
      stage?.resize(viewport.clientWidth, viewport.clientHeight);
      invalidate();
    };
    const loadStage = async () => {
      if (loaded || preference.matches) return;
      loaded = true;
      try {
        const { mountStage } = await import("./stage");
        if (disposed || preference.matches) { loaded = false; return; }
        stage = mountStage(output, panels);
        resize();
        measure();
        current = progress;
        stage.draw(current, 0, 0, uv.current, lightOn.current, inspectionFocus.current);
        setReady(true);
      } catch {
        setReady(false);
      }
    };
    const onPreference = () => {
      setReduced(preference.matches);
      if (preference.matches) setReady(false);
      else if (stage && !contextLost) setReady(true);
      else if (visible) void loadStage();
      invalidate();
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType === "touch" || preference.matches) return;
      const bounds = viewport.getBoundingClientRect();
      pointerX = (event.clientX - bounds.left) / bounds.width - .5;
      pointerY = .5 - (event.clientY - bounds.top) / bounds.height;
      targetUv = Math.min(1, Math.max(0, pointerX + .5));
      invalidate();
    };
    const leave = () => {
      pointerX = 0;
      pointerY = 0;
      targetUv = uv.current;
      invalidate();
    };
    const lost = () => { contextLost = true; setReady(false); setFallback(true); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        void loadStage();
        invalidate();
      }
    });
    const size = new ResizeObserver(resize);
    size.observe(viewport);
    observer.observe(viewport);
    onPreference();
    motion.current = () => { targetUv = uv.current; invalidate(); };
    preference.addEventListener("change", onPreference);
    window.addEventListener("scroll", invalidate, { passive: true });
    viewport.addEventListener("pointermove", pointer, { passive: true });
    viewport.addEventListener("pointerleave", leave);
    output.addEventListener("webglcontextlost", lost);
    return () => {
      disposed = true;
      observer.disconnect();
      size.disconnect();
      preference.removeEventListener("change", onPreference);
      window.removeEventListener("scroll", invalidate);
      viewport.removeEventListener("pointermove", pointer);
      viewport.removeEventListener("pointerleave", leave);
      output.removeEventListener("webglcontextlost", lost);
      cancelAnimationFrame(frame);
      stage?.dispose();
      motion.current = undefined;
    };
  }, [journey, scene]);

  const active = chapters[selected];
  const select = (index: number) => {
    setSelected(index);
    if (reduced || fallback || !runway.current || !surface.current) return;
    const top = Number.parseFloat(getComputedStyle(surface.current).top) || 0;
    const start = window.scrollY + runway.current.getBoundingClientRect().top - top;
    const travel = runway.current.offsetHeight - surface.current.offsetHeight;
    window.scrollTo({ top: start + travel * index / (chapters.length - 1), behavior: "auto" });
  };

  return (
    <div ref={runway} id={id} className={journey && !reduced && !fallback ? "vehicle-runway" : undefined}>
      <div ref={surface} className={journey ? "vehicle-stage vehicle-stage-journey" : "vehicle-stage vehicle-stage-inline"} data-ready={ready}>
        <canvas ref={canvas} aria-hidden="true" />
        {journey && <>
          <div className="vehicle-hud" lang="de">
            {selected === 8 ? <BrandLogo /> : <active.icon className="size-6 text-pulse" aria-hidden="true" />}
            <h2 className="mt-3 font-[var(--font-space-grotesk)] text-3xl font-semibold text-white sm:text-5xl">{active.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">{active.body}</p>
            {active.href && <Link href={active.href} className="mt-3 inline-flex items-center gap-2 font-semibold text-pulse">{active.link}<ArrowUpRight className="size-4" aria-hidden="true" /></Link>}
          </div>
          <nav className="vehicle-chapters" aria-label="LUVIPRO Kapitel">
            {chapters.map(({ name }, index) => <button type="button" key={name} onClick={() => select(index)} aria-current={selected === index ? "step" : undefined}>{name}</button>)}
          </nav>
        </>}
        {ready && journey && (selected === 1 || selected === 5) && <div className="vehicle-focus" aria-label="Kamerafokus">
          {[["Front", -1.45], ["Seite", 0], ["Heck", 1.45]].map(([label, target]) =>
            <button type="button" key={label} aria-pressed={focus === target} onClick={() => {
              const next = focus === target ? undefined : Number(target);
              setFocus(next);
              inspectionFocus.current = next;
              motion.current?.();
            }}>{label}</button>
          )}
        </div>}
        {ready && (selected === 1 || selected === 2) && <div className="vehicle-uv">
          <button type="button" aria-pressed={uvEnabled} onClick={() => {
            lightOn.current = !uvEnabled;
            setUvEnabled(!uvEnabled);
            motion.current?.();
          }}>UV</button>
          <input type="range" min="0" max="100" value={uvPosition} aria-label="UV-Position" disabled={!uvEnabled} onChange={event => {
            const next = Number(event.target.value);
            setUvPosition(next);
            uv.current = next / 100;
            motion.current?.();
          }} />
        </div>}
      </div>
    </div>
  );
}
