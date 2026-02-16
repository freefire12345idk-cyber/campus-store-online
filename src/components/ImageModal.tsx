"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type ImageModalProps = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

export function ImageModal({ src, alt, open, onClose }: ImageModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80" />
          <motion.div
            className="relative z-10 bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-2 absolute top-0 right-0 z-20">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4 pt-14 flex items-center justify-center min-h-[200px]">
              <div className="relative max-h-[85vh] h-[70vh] w-full">
                <Image src={src} alt={alt} fill sizes="90vw" className="object-contain rounded" draggable={false} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
