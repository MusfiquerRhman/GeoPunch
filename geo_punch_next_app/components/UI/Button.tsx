import clsx from "clsx";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import React from "react";

interface ButtonProps {
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    label: string;
    variant?: "primary" | "secondary" | "delete" | "disabled" | "accordion";
    disabled?: boolean;
    className?: string;
    leftIcon?: StaticImageData;
    rightIcon?: StaticImageData;
};

// Button component with variant styles and optional icons
const Button = (props: ButtonProps) => {
    const { type = 'button', onClick, label, variant = 'primary', disabled = false, className, leftIcon, rightIcon, ...rest} = props;

    const trueCondition = (disabled ? "disabled" : variant) as NonNullable<ButtonProps['variant']>;

    const variantClasses: string = ({
        primary: "bg-primary hover:bg-primary-accent hover:cursor-pointer justify-center rounded-lg text-[1.1rem] font-rajdhani font-semibold",
        secondary: "bg-secondary hover:bg-secondary-accent hover:cursor-pointer justify-center rounded-lg text-[1.1rem] font-rajdhani font-semibold",
        delete: "bg-red hover:bg-red-accent hover:cursor-pointer justify-center rounded-lg text-[1.1rem] font-rajdhani font-semibold",
        disabled: "bg-gray-accent hover:cursor-not-allowed justify-center rounded-lg text-[1.1rem] font-rajdhani font-semibold",
        accordion: "hover:bg-secondary-accent hover:cursor-pointer justify-between",
    } as Record<NonNullable<ButtonProps['variant']>, string>)[trueCondition];

    return (
        <button {...rest}
            onClick={onClick} 
            disabled={disabled}
            className={clsx(variantClasses, className, 
                `px-4 flex flex-row items-center w-full h-11 py-2.5 text-white shadow-md transition-all duration-150 active:scale-98 active:translate-y-px`, 
            )}
            type={ type} 
        >
            <span className="flex gap-3 items-center">
                {leftIcon && <Image width={25} height={25} src={leftIcon} alt="" className={clsx("inline-block py-1", variant === 'accordion' ? "w-5" : "w-4")} />}
                {label}
            </span>
            {rightIcon && <Image width={25} height={25} src={rightIcon} alt="" className={clsx("inline-block w-3 py-1 ml-3")} />}
        </button>
    )
}

export default React.memo(Button) as typeof Button;