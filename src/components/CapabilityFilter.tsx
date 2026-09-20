import { useEffect, useState } from "react";

export default function CapabilityFilter() {
  const [mode, setMode] = useState<"all" | "shipped">("all");
  useEffect(() => { document.documentElement.dataset.capFilter = mode; }, [mode]);
  return (
    <div role="group" aria-label="Filter capabilities" className="inline-flex rounded-lg border border-line-bright p-0.5 text-sm">
      {(["all", "shipped"] as const).map((m) => (
        <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
          className="rounded-md px-3 py-1.5 aria-pressed:bg-btn aria-pressed:text-on-accent">
          {m === "all" ? "Everything" : "Available now"}
        </button>
      ))}
    </div>
  );
}
