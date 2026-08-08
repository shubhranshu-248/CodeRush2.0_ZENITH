"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, y: 16, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative z-10 bg-[#0d0e12]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl max-w-lg w-full p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] space-y-4 text-gray-100"
          >
            {/* Subtle top accent line */}
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-white tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
