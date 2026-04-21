'use client';

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
            <div className='fixed'>
                <motion.div className="h-[99.4dvh] w-62 bg-sidebar m-0.75 pt-4 overflow-hidden"
                    initial={{ width: isOpen ? 248 : 0, opacity: isOpen ? 1 : 0 }} // 248px = w-62
                    animate={{ width: isOpen ? 248 : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ type: "tween", duration: 0.25, ease: 'linear' }}
                >
                    <Image width={300} height={200} src={banner.src} alt="Logo"/>

                    <div className='h-[calc(100dvh-150px)] mt-5 pb-36 overflow-y-scroll [&::-webkit-scrollbar]:hidden 
                                    [-ms-overflow-style:none] [scrollbar-width:none] custom-scrollbar'
                    >
                        <NavTree />
                    </div>
                </motion.div>

                <Burger isOpen={isOpen} setIsOpen={setIsOpen} />
            </div>

            <motion.div
                initial={{ marginLeft: isOpen ? 264 : 32, width: isOpen ? "calc(100% - 17rem)" : "100%" }}
                animate={{
                    marginLeft: isOpen ? 264 : 32, 
                    width: isOpen ? "calc(100% - 17rem)" : "100%", 
                }}
                transition={{ type: false }}
                className={clsx(
                    "my-0.75 mx-4 rounded-lg transition-all h-[99.4dvh] w-full",
                    isOpen ? "mr-4" : "mx-8"
                )}
            >
                {children}
            </motion.div>
        </div>
    )
}

export default React.memo(SideBar) as typeof SideBar;