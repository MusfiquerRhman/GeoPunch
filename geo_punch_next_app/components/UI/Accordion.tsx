'use client';

import { useEffect, useState, type JSX } from "react";
import Button from "./Button";
import { motion } from "framer-motion";
import { caretDownIcon, caretUpIcon } from "@/assets";

import type { StaticImageData } from "next/image";

type AccordionProps = {
  items: JSX.Element[];
  label: string;
  icon?: StaticImageData;
  isLinkOpen?: boolean;
};

// Accordion component with expandable/collapsible functionality
const Accordion = ({items, label, icon, isLinkOpen}: AccordionProps) => {
    const [isOpen, setIsOpen] = useState(isLinkOpen || false);

    useEffect(() => {
        if (isLinkOpen) setIsOpen(true);
    }, [isLinkOpen]);

    return (
        <div className="mb-1">
            <Button variant="accordion"
                onClick={() => setIsOpen(!isOpen)} 
                type="button" 
                label={label} 
                rightIcon={isOpen ? caretUpIcon : caretDownIcon} 
                aria-expanded={isOpen}
                className={`rounded-xl border px-3 text-sm font-medium shadow-none transition-colors ${isOpen
                    ? 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800 [&_img]:brightness-0 [&_img]:invert'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-teal-200 hover:bg-teal-50 [&_img]:brightness-0 [&_img]:opacity-60'
                }`}
                leftIcon={icon} 
            />
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                className="ml-3 overflow-hidden border-l border-gray-200 pl-2"
            >
                {items.map((item, index) => (
                    <div key={index} className="py-0.5">{item}</div>
                ))}
            </motion.div>
        </div>
    );
};

export default Accordion;
