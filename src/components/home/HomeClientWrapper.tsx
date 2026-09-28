'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HomeClientWrapperProps {
  children: React.ReactNode;
}

export function HomeClientWrapper({ children }: HomeClientWrapperProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      {children}
    </motion.main>
  );
}
