'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastCtx {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++_id;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="adm-toast-container">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`adm-toast adm-toast-${t.type}`}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              {t.type === 'success' && <span className="adm-toast-icon">&#10003;</span>}
              {t.type === 'error' && <span className="adm-toast-icon">&#10007;</span>}
              {t.type === 'info' && <span className="adm-toast-icon">&#8505;</span>}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
