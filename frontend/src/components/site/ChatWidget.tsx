import { AnimatePresence, motion } from "motion/react";
import { MessageSquare, Send, X } from "lucide-react";
import { useState } from "react";

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        aria-label="Chat with Lumina"
        onClick={() => setOpen((v) => !v)}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 grid size-14 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_40px_-16px_rgba(38,27,20,0.55)]"
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[calc(100vw-3rem)] max-w-[400px] flex-col overflow-hidden border border-border bg-background shadow-[0_40px_90px_-30px_rgba(38,27,20,0.5)]"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-walnut text-cream">
                  <MessageSquare size={16} />
                </span>
                <p className="text-base font-medium leading-tight">Chat with Lumina</p>
              </div>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="cursor-pointer p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
              <MessageSquare size={32} className="text-muted-foreground/40" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Chat with Lumina — we'll help with orders, delivery and custom pieces.
              </p>
            </div>

            <div className="flex items-center gap-2 border-t p-3">
              <input
                type="text"
                placeholder="Type a message…"
                disabled
                className="flex-1 border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
              />
              <button
                type="button"
                aria-label="Send message"
                disabled
                className="grid size-10 cursor-pointer place-items-center bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
