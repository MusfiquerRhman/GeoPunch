import clsx from "clsx";
import React from "react";

const TableWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <div className={clsx("overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm", className)}>
            <table className="w-full border-separate border-spacing-0 text-left text-sm">
                {children}
            </table>
        </div>
    )
}

export default React.memo(TableWrapper) as typeof TableWrapper;
