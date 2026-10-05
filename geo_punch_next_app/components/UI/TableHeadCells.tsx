import clsx from "clsx";
import React from "react";

const TableHeadCells = ({ children, className, isAction }: { children: React.ReactNode; className?: string; isAction?: boolean }) => {
    return (
        <th className={clsx("border-b border-gray-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide", className, isAction ? "w-20 text-right" : undefined)}>
            {children}
        </th>
    );
};

export default React.memo(TableHeadCells) as typeof TableHeadCells;
