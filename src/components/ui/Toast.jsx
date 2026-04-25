import { AnimatePresence, motion } from 'framer-motion';

export function Toast({ open, message }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="toast glass-card"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
