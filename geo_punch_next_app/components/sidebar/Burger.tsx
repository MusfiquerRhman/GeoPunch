"use client";

import { motion } from 'framer-motion';
import React from 'react';

type BurgerProps = {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Burger = ({ isOpen, setIsOpen }: BurgerProps) => {
    return (
        <motion.div
            className="absolute left-0 top-0 z-50"
            initial={{ x: isOpen ? 202 : 0 }}
            animate={{ x: isOpen ? 202 : 0 }}
            transition={{ type: "tween", duration: 0.25 }}
        >
            <button onClick={() => setIsOpen(current => !current)}
                aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                aria-expanded={isOpen}
                className="absolute left-0 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-transparent text-gray-600 transition hover:bg-gray-100 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
                <motion.svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-7 w-7"
                    initial={{ rotate: isOpen ? 180 : 0 }}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "tween", duration: 0.2 }}
                >
                    <path d="m10 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
            </button>
        </motion.div>
    )
}

export default Burger;
