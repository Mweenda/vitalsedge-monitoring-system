import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * SidebarDrawer
 * 
 * Mobile-friendly drawer that displays sidebar content in a slide-out panel.
 * Closes when clicking outside or on the X button.
 * 
 * Features:
 * - Smooth slide-in animation from left
 * - Backdrop overlay that closes drawer when clicked
 * - Close button in top-right
 * - Full-height drawer with scrollable content
 */
export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={clsx(
              'fixed left-0 top-0 z-50 h-full w-80 flex flex-col',
              'border-r border-gray-200',
              'bg-white shadow-lg'
            )}
          >
            {/* Close button */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <span className="text-sm font-semibold text-gray-600">Menu</span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
