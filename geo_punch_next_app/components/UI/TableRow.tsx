import clsx from "clsx";
import React from "react";

const TableRow = ({children, className}: {children: React.ReactNode, className?: string}) => {
    return (
        <tr className={clsx('transition-colors even:bg-gray-50/70 hover:bg-teal-50/70', className)}>
            {children}
        </tr>
    )
}

export default React.memo(TableRow) as typeof TableRow;
