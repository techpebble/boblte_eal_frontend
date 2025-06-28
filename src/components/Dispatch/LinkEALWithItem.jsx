import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function LinkEALWithItem({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal content */}
          <motion.div
            className="fixed bottom-0 left-0 w-full bg-white rounded-t-2xl z-50 shadow-lg overflow-y-auto"
            style={{ height: '75%' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {/* Drag handle / Close button (optional) */}
            <div className="w-full text-center py-2 border-b border-gray-200">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto h-full">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default LinkEALWithItem;
