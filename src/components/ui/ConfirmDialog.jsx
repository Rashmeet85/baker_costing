import { AnimatePresence, motion } from 'framer-motion';

export function ConfirmDialog({ open, title, body, confirmLabel = 'Delete', onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            aria-label="Close confirmation"
          />
          <motion.div
            className="dialog-card glass-card"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
          >
            <div className="stack-sm">
              <strong>{title}</strong>
              <span className="muted">{body}</span>
            </div>
            <div className="dialog-actions">
              <button type="button" className="button secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="button" className="button" onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
