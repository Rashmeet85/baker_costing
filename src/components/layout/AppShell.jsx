import { motion } from 'framer-motion';
import { BottomNav } from '../navigation/BottomNav';
import { FloatingHomeFab } from '../navigation/FloatingHomeFab';

export function AppShell({ children }) {
  return (
    <>
      <div className="app-background" aria-hidden="true">
        <div className="cloud-blob cloud-blob-pink" />
        <div className="cloud-blob cloud-blob-purple" />
        <div className="cloud-blob cloud-blob-white" />
        <div className="cloud-blob cloud-blob-soft" />
        <div className="sparkle-layer">
          <span className="sparkle sparkle-1" />
          <span className="sparkle sparkle-2" />
          <span className="sparkle sparkle-3" />
          <span className="sparkle sparkle-4" />
          <span className="sparkle sparkle-5" />
          <span className="sparkle sparkle-6" />
        </div>
      </div>
      <motion.main
        className="app-shell"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
      >
        {children}
      </motion.main>

      <BottomNav />
      <FloatingHomeFab />
    </>
  );
}
