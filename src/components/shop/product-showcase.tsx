import { BatteryCharging, Check, CircuitBoard, ScanLine, ShieldCheck, Sparkles, Waves } from "lucide-react";
import { DEVICE } from "@/lib/store";

/**
 * CSS concept visualization only. Replace with original hardware product photography
 * once the exact LU3656060 product photographs are approved.
 */
export function ProductShowcase({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative isolate overflow-hidden rounded-[28px] border border-pulse/20 bg-[#080f21] p-5 shadow-[0_18px_85px_rgba(32,214,255,0.1)] sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(139,92,246,0.30),transparent_37%),radial-gradient(circle_at_85%_72%,rgba(32,214,255,0.13),transparent_30%),linear-gradient(145deg,#090b18,#101a2d,#060a16)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 [background-size:50px_50px] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
      <div className="relative flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.14em] text-pulse">
        <span>LU • 365 NM</span>
        <span className="rounded-full border border-pulse/20 bg-pulse/10 px-3 py-1 text-[10px] text-white">PROFESSIONAL UV</span>
      </div>

      <div className={`relative flex flex-col items-center justify-center ${compact ? "min-h-[250px]" : "min-h-[320px] sm:min-h-[410px]"}`}>
        <div aria-hidden className="absolute top-1/2 h-32 w-64 -translate-y-1/2 rounded-full bg-ultraviolet/35 blur-[70px]" />
        <div className="relative w-[88%] max-w-[420px] -rotate-3 rounded-[24px] border border-white/20 bg-gradient-to-br from-[#252e48] via-[#0d1426] to-[#070b14] p-5 shadow-[0_28px_45px_rgba(0,0,0,0.55),0_0_60px_rgba(139,92,246,0.24)] sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-[var(--font-space-grotesk)] text-lg font-bold tracking-[0.2em] text-white sm:text-2xl">LUVIPRO</span>
            <CircuitBoard className="h-6 w-6 text-pulse" />
          </div>
          <div className="relative flex aspect-[1.9] items-center justify-center overflow-hidden rounded-xl border border-ultraviolet/40 bg-[#080d1b]">
            <div aria-hidden className="absolute h-28 w-40 rounded-full bg-ultraviolet/30 blur-[40px]" />
            <div className="relative flex items-center justify-center rounded-full border-4 border-pulse/45 p-6 shadow-[0_0_45px_rgba(32,214,255,0.22)]">
              <Waves className="h-12 w-12 text-pulse sm:h-16 sm:w-16" strokeWidth={1.3} />
            </div>
            <div className="absolute inset-x-4 bottom-3 h-px bg-gradient-to-r from-transparent via-pulse to-transparent" />
          </div>
          <div className="mt-4 flex justify-between gap-3 text-xs font-semibold tracking-[0.08em] text-slate-300">
            <span>{DEVICE.sku}</span>
            <span>UV INSPECTION</span>
          </div>
        </div>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-2">
          {[{ icon: ScanLine, text: "365 nm" }, { icon: BatteryCharging, text: "2 Akkus" }, { icon: ShieldCheck, text: "B2B" }].map(({ icon: Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-slate-100 backdrop-blur-lg">
              <Icon className="h-3.5 w-3.5 text-pulse" />{text}
            </span>
          ))}
        </div>
      </div>
      <div className="relative flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">
        <span>Konzeptvisualisierung – kein Produktfoto</span>
        <span className="inline-flex items-center gap-1 text-pulse"><Sparkles className="h-3.5 w-3.5" /> LUVIPRO</span>
      </div>
    </div>
  );
}

export function IncludedItem({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-3 text-sm leading-6 text-slate-200">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pulse/10 text-pulse"><Check className="h-3.5 w-3.5" /></span>
      <span>{label}</span>
    </div>
  );
}
