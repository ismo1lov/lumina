import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmOptions & { open: boolean }>({
    open: false,
    title: "",
    description: "",
  });
  const [pending, setPending] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setPending(() => resolve);
      setState({ ...opts, open: true });
    });

  const close = (value: boolean) => {
    setState((s) => ({ ...s, open: false }));
    if (pending) {
      pending(value);
      setPending(null);
    }
  };

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      destructive={state.destructive}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return { confirm, dialog };
}
