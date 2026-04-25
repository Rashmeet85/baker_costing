import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cookie, Plus, ShoppingBag, SquarePen, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function FloatingHomeFab() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isVisible = pathname === '/';

  const items = [
    { icon: SquarePen, label: 'Add Recipe', action: () => navigate('/create-recipe') },
    { icon: ShoppingBag, label: 'Add Sale', action: () => navigate('/sales') },
    { icon: Cookie, label: 'Ingredient Library', action: () => navigate('/ingredients') }
  ];

  return (
    <>
      <AnimatePresence>
        {isVisible ? (
          <motion.button
            type="button"
            className="floating-fab"
            aria-label="Open quick actions"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            whileTap={{ scale: 0.94 }}
          >
            <Plus size={24} />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              className="sheet-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-label="Close quick actions"
            />
            <motion.div
              className="sheet glass-card"
              initial={{ y: 260 }}
              animate={{ y: 0 }}
              exit={{ y: 260 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <div className="sheet-handle" />
              <div className="page-header" style={{ marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0 }}>Quick actions</h3>
                  <p className="page-subtitle">Pick what you want to add.</p>
                </div>
                <button type="button" className="icon-button" onClick={() => setOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="stack-sm">
                {items.map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    type="button"
                    className="glass-card surface-card"
                    style={{ border: 0, textAlign: 'left' }}
                    onClick={() => {
                      action();
                      setOpen(false);
                    }}
                  >
                    <div className="list-item" style={{ padding: 0 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="icon-button">
                          <Icon size={18} />
                        </div>
                        <strong>{label}</strong>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
