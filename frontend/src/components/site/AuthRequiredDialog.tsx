import { useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
  const navigate = useNavigate();

  const goRegister = () => {
    onOpenChange(false);
    navigate({ to: "/login", search: { mode: "register" } });
  };

  return (
    <Dialog open={open} onOpenChange={dismissable ? onOpenChange : () => {}}>
      <DialogContent className="max-w-md" hideClose={!dismissable}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("Registration required")}</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            {t("You are not signed in yet. Please create an account to continue shopping.")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <button
            onClick={goRegister}
            className="flex w-full items-center justify-center gap-2 bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            <LogIn size={14} />
            {t("Create an account")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
