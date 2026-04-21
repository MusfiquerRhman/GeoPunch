import { motion } from 'framer-motion';
import clsx from 'clsx';
import React from 'react';

type BurgerProps = {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Burger = ({ isOpen, setIsOpen }: BurgerProps) => {
    return (
        <motion.div
            className="absolute top-1 z-10"
            initial={{ x: isOpen ? 198 : 0 }}
            animate={{ x: isOpen ? 198 : 0 }}
            transition={{ type: "tween" }}
        >
            <button onClick={() => setIsOpen(current => !current)} 
                className={clsx(
                    'absolute top-2 left-1 rounded-lg w-10 h-5 z-10 hover:cursor-pointer group', 
                    'bg-transparent hover:bg-primary-accent'
                )}
            >
                <motion.div className={clsx('block w-6 h-0.5 my-1.5 mx-auto', 
                    'bg-black opacity-60 group-hover:opacity-100 group-hover:bg-red-600'
                )}
                    initial={{ rotate: isOpen ? 45 : 0, y: isOpen ? 8 : 0 }}
                    animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 8 : 0 }}
                    transition={{ delay: 0.4}}
                />
                <motion.div className={clsx('block w-6 h-0.5 my-1.5 mx-auto', 
                    'bg-black opacity-60 group-hover:opacity-100 group-hover:bg-red-600'
                )}
                    initial={{ width: isOpen ? 0 : 24}}
                    animate={{ width: isOpen ? 0 : 24 }}
                    transition={{ delay: 0.4}}
                />
                <motion.div className={clsx('block w-6 h-0.5 my-1.5 mx-auto', 
                    'bg-black opacity-60 group-hover:opacity-100 group-hover:bg-red-600'
                )}
                    initial={{ rotate: isOpen ? 135 : 0, y: isOpen ? -8 : 0 }}
                    animate={{ rotate: isOpen ? 135 : 0, y: isOpen ? -8 : 0 }}
                    transition={{ delay: 0.4}}
                />
            </button>
        </motion.div>
    )
}

export default React.memo(Burger) as typeof Burger;