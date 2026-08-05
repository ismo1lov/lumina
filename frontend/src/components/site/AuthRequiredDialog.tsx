import { useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
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

  const goRegister = () => {
    onOpenChange(false);
    navigate({ to: "/login", search: { mode: "register" } });
  };

  return (
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
            className="flex w-full items-center justify-center gap-2 bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            <LogIn size={14} />
            Ro'yxatdan o'tish
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
