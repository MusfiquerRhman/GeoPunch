import React from "react";

const TableHead = ({ children, variant = 'header' }: { children: React.ReactNode, variant?: 'header' | 'placeholder' }) => {
    const variants = {
        header: 'bg-gray-50 text-gray-600',
        placeholder: 'bg-gray-50 text-gray-500',
    }[variant];

    return (
        <thead className={variants}>
            {children}
        </thead>
    );
};

export default React.memo(TableHead) as typeof TableHead;
