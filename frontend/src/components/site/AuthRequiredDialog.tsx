import { useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { PageLoader } from "@/components/site/PageLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissable?: boolean;
}

export function AuthRequiredDialog({ open, onOpenChange, dismissable = true }: AuthRequiredDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const goRegister = () => {
    setLoading(true);
    onOpenChange(false);
    setTimeout(() => {
      navigate({ to: "/login", search: { mode: "register" } });
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={dismissable ? onOpenChange : () => {}}>
        <DialogContent className="max-w-md" hideClose={!dismissable}>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Ro'yxatdan o'tish kerak</DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed">
              Siz hali tizimga kirmagansiz. Xarid qilishni davom ettirish uchun avval ro'yxatdan
              o'tishingiz lozim.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              onClick={goRegister}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <LogIn size={14} />
              {loading ? "Loading…" : "Ro'yxatdan o'tish"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {loading && <PageLoader />}
    </>
  );
}
