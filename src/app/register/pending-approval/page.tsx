"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { NeonButton } from "@/components/NeonButton";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-card w-full max-w-md text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-9 9-9 9-9-9-9 9 0-18z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-amber-500 mb-4">
          Registration Submitted Successfully!
        </h1>
        
        <p className="text-stone-300 mb-6">
          Your shop registration has been submitted and is pending admin approval.
        </p>
        
        <p className="text-stone-400 mb-6">
          You will receive an email notification once your shop is approved. This usually takes 24-48 hours.
        </p>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <p className="text-amber-700 font-medium mb-2">
            What happens next?
          </p>
          <ul className="text-sm text-stone-300 space-y-2">
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              Admin will review your shop details and documents
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              You'll receive an email approval/rejection notification
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              Once approved, you can start managing your shop
            </li>
          </ul>
        </div>
        
        <div className="text-center">
          <p className="text-stone-500 text-sm mb-4">
            Redirecting to homepage in {countdown} seconds...
          </p>
          <NeonButton 
            onClick={handleGoHome}
            className="px-6 py-3"
            variant="secondary"
          >
            Go to Homepage Now
          </NeonButton>
        </div>
      </motion.div>
    </div>
  );
}
