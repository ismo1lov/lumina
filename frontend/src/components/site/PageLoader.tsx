import { Loader } from "lucide-react";

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background">
      <Loader size={34} className="animate-spin text-primary" />
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Loading…</p>
    </div>
  );
}
