/** Preparation only: no app URL is exposed before security acceptance and approval. */
export function WebAppEntry() {
  return <span role="link" aria-disabled="true" tabIndex={0} title="Web App noch nicht freigegeben" className="inline-flex max-w-40 flex-col rounded-lg border border-white/20 px-3 py-2 text-xs text-slate-200">
    <span className="font-semibold">Partner Login / Web App</span>
    <span className="text-[10px] text-slate-400">In Vorbereitung</span>
  </span>;
}
