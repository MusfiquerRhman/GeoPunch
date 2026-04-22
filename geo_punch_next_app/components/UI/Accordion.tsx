'use client';

import { useState, type JSX } from "react";
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

    return (
        <div>
            <Button onClick={() => setIsOpen(!isOpen)} 
                variant="accordion"
                type="button" 
                label={label} 
                rightIcon={isOpen ? caretUpIcon : caretDownIcon} 
                className={`${isOpen ? 'bg-primary text-[0.9rem]' : 'bg-secondary text-[0.9rem] '}`}
                leftIcon={icon} 
            />
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                className="overflow-hidden bg-gray-light/10 border-primary ml-2 border-l-4 z-50"
            >
                {items.map((item, index) => (
                    <div key={index} className="hover:bg-gray-200">{item}</div>
                ))}
            </motion.div>
        </div>
    );
};

export default Accordion;