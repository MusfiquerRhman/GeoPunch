import React from "react";

const TableBody = ({ children }: { children: React.ReactNode }) => {
    return (
        <tbody className="text-sm text-gray-700">
            {children}
        </tbody>
    );
};

export default React.memo(TableBody) as typeof TableBody;
