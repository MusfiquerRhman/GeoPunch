import clsx from "clsx";
import React from "react";

type TableCellProps = {
    children: React.ReactNode;
    className?: string;
    colSpan?: number;
    fixedLength?: boolean;
}

const TableCell = ({children, className, colSpan, fixedLength = true}: TableCellProps) => {
    const variant = {
        fixed: "min-w-[175px]",
        auto: "min-w-none"
    }[fixedLength ? 'fixed' : 'auto'];

    return (
        <td colSpan={colSpan} 
            className={clsx("border-t border-gray-100 px-4 py-3 text-center text-sm text-gray-700", variant, className)}
        >
            {children}
        </td>
    )
}

export default React.memo(TableCell) as typeof TableCell;
