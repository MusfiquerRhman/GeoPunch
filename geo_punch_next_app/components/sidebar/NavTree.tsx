"use client";

import React, { useState } from 'react';
import { Accordion } from '@/components';
import Link from 'next/link';
import clsx from 'clsx';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { bookIcon, structureIcon, officeIcon, dashboardIcon, attendanceIcon, checkIcons, logIcon, rankingIcon, adminIcon, userIcon, shieldIcon, cityIcon } from '@/assets';

// Recursive component to render the navigation tree
const NavTree = () => {
    const pathname = usePathname();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { data: pendingDevices } = useQuery({
        queryKey: ["trusted-devices", "pending"],
        queryFn: async (): Promise<{ pendingCount: number }> => {
            const response = await fetch("/api/admin/trusted-devices?pending=1", { cache: "no-store" });
            if (!response.ok) throw new Error("Couldn’t load pending device requests.");
            return response.json();
        },
        refetchInterval: 20_000,
    });
    const pendingCount = pendingDevices?.pendingCount ?? 0;

    const navData = [
        {
            id: 'Dashboard',
            label: 'Dashboard',
            icon: dashboardIcon,
            link: '/dashboard',
        },
        {
            id: 'Library',
            label: 'Library',
            icon: bookIcon,
            link: '/library',
            children: [
                {
                    id: 'Companies',
                    label: 'Companies',
                    icon: cityIcon,
                    link: '/library/company',
                },
                {
                    id: 'Departments',
                    label: 'Departments',
                    icon: structureIcon,
                    link: '/library/departments',
                },
                {
                    id: 'Designations',
                    label: 'Designations',
                    icon: rankingIcon,
                    link: '/library/designations',
                },
                {
                    id: 'Offices',
                    label: 'Offices',
                    icon: officeIcon,
                    link: '/library/offices',
                },
            ],
        },
        {
            id: 'Attendance',
            label: 'Attendance',
            icon: attendanceIcon,
            link: '/attendance',
            children: [
                {
                    id: 'CheckIns',
                    label: 'Check Ins',
                    icon: checkIcons,
                    link: '/attendance/check-in',
                }, 
                {
                    id: 'History',
                    label: 'History',
                    icon: logIcon,
                    link: '/attendance/logs',
                },
                {
                    id: 'DailyReport',
                    label: 'Daily Report',
                    icon: logIcon,
                    link: '/attendance/report',
                },
            ]
        },
        {
            id: 'Admin',
            label: pendingCount ? `Admin (${pendingCount})` : 'Admin',
            icon: adminIcon,
            link: '/admin',
            children: [
                {
                    id: 'UserManagement',
                    label: 'User Management',
                    icon: userIcon,
                    link: '/admin/users',
                },
                {
                    id: 'TrustedDevices',
                    label: 'Trusted Devices',
                    icon: shieldIcon,
                    link: '/admin/trusted-devices',
                },
            ]
        }
    ];

    const logout = async () => {
        setIsLoggingOut(true);
        try {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) window.location.href = "/login";
            else console.error("Logout failed");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col px-3">
            <nav aria-label="Main navigation" className="space-y-1">
            {navData.map((item) => (
                <Accordion
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isLinkOpen={pathname === item.link || pathname.startsWith(`${item.link}/`) || item.children?.some((child) => pathname === child.link || pathname.startsWith(`${child.link}/`))}
                    items={item.children?.map((child) => (
                        <Link
                            key={child.id}
                            href={child.link}
                            aria-current={pathname === child.link || pathname.startsWith(`${child.link}/`) ? "page" : undefined}
                            className={clsx(
                                "flex flex-1 flex-row items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                pathname === child.link || pathname.startsWith(`${child.link}/`)
                                    ? "bg-teal-50 font-semibold text-teal-800"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <Image
                                alt=""
                                src={child.icon.src}
                                className="inline-block h-5 w-5 opacity-75"
                                width={20}
                                height={20}
                            />
                            {child.label}
                            {child.id === "TrustedDevices" && pendingCount > 0 && (
                                <span aria-label={`${pendingCount} pending requests`} className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                                    {pendingCount}
                                </span>
                            )}
                        </Link>
                    )) || []}
                />
            ))}
            </nav>
            <div className="mt-auto border-t border-gray-100 px-1 pb-4 pt-4">
                <button disabled={isLoggingOut} className="w-full rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
                    onClick={() => logout()}
                >
                    {isLoggingOut ? "Signing out…" : "Sign out"}
                </button>
            </div>
        </div>
    );
};

export default NavTree;
