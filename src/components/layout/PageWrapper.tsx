'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface PageWrapperProps {
    children: ReactNode;
    className?: string;
}

const pageVariants: Variants = {
    initial: {
        opacity: 0,
        y: 12,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        y: -12,
        transition: {
            duration: 0.3,
        },
    },
};

export default function PageWrapper({ children, className = '' }: PageWrapperProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            className={`min-h-[calc(100vh-4rem)] ${className}`}
        >
            {children}
        </motion.div>
    );
}
