import { useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
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
}

export function AuthRequiredDialog({ open, onOpenChange }: AuthRequiredDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goRegister = () => {
    onOpenChange(false);
    navigate({ to: "/login", search: { mode: "register" } });
  };

  const goLogin = () => {
    onOpenChange(false);
    navigate({ to: "/login", search: { mode: "login" } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Ro'yxatdan o'tish kerak</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            Siz hali tizimga kirmagansiz. Xarid qilishni davom ettirish uchun avval ro'yxatdan
            o'tishingiz yoki hisobingizga kirishingiz lozim.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          {!user ? (
            <button
              onClick={goRegister}
              className="flex w-full items-center justify-center gap-2 bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              <LogIn size={14} />
              Ro'yxatdan o'tish
            </button>
          ) : (
            <button
              onClick={goLogin}
              className="flex w-full items-center justify-center gap-2 bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              <LogIn size={14} />
              Hisobimga kirish
            </button>
          )}
          <div className="flex justify-center">
            <button
              onClick={goLogin}
              className="cursor-pointer bg-transparent text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Allaqachon hisobingiz bormi? Kirish
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
