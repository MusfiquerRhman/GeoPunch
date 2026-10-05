"use client";

import React, { useState } from 'react';
import NavTree from './NavTree';
import { motion } from 'framer-motion';
import Burger from './Burger';
import clsx from 'clsx';
import Image from 'next/image';
import { banner } from '@/assets';


const SideBar = ({children}: {children: React.ReactNode}) => {
    const [isOpen, setIsOpen] = useState<boolean>(true);

    return (
        <div className="flex flex-row">
            <div className="fixed left-3 top-3 z-40">
                <motion.div className="flex h-[calc(100dvh-1.5rem)] w-62 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
                    initial={{ width: isOpen ? 248 : 0, opacity: isOpen ? 1 : 0 }} // 248px = w-62
                    animate={{ width: isOpen ? 248 : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ type: "tween", duration: 0.25, ease: 'linear' }}
                >
                    <div className="border-b border-gray-100 px-5 pb-4 pt-5">
                        <Image width={300} height={200} src={banner.src} alt="GeoPunch" className="mx-auto h-14 w-[190px] object-contain" priority />
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        <NavTree />
                    </div>
                </motion.div>

                <Burger isOpen={isOpen} setIsOpen={setIsOpen} />
            </div>

            <motion.div
                initial={{ marginLeft: isOpen ? 264 : 56, width: isOpen ? "calc(100% - 17rem)" : "calc(100% - 4rem)" }}
                animate={{
                    marginLeft: isOpen ? 264 : 56,
                    width: isOpen ? "calc(100% - 17rem)" : "calc(100% - 4rem)",
                }}
                transition={{ type: false }}
                className={clsx(
                    "my-3 mx-4 h-[calc(100dvh-1.5rem)] w-full rounded-2xl border border-gray-100 bg-white shadow-sm transition-all",
                    "mr-3"
                )}
            >
                {children}
            </motion.div>
        </div>
    )
}

export default SideBar;
