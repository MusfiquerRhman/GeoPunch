"use client";

import React from 'react';
import { Accordion } from '@/components';
import Link from 'next/link';
import clsx from 'clsx';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { bookIcon, structureIcon, officeIcon, dashboardIcon, attendanceIcon, checkIcons, logIcon, rankingIcon, adminIcon, userIcon, shieldIcon, cityIcon } from '@/assets';

// Recursive component to render the navigation tree
const NavTree = () => {
    const pathname = usePathname();

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
                }
            ]
        },
        {
            id: 'Admin',
            label: 'Admin',
            icon: adminIcon,
            link: '/admin',
            children: [
                {
                    id: 'UserManagement',
                    label: 'User Management',
                    icon: userIcon,
                    link: '/admin/users',
                },
                // {
                //     id: 'admins',
                //     label: 'Admins',
                //     icon: shieldIcon,
                //     link: '/admin/admins',
                // }
            ]
        }
    ];

    const logout = async () => {
        // Implementation for logout functionality
         const res = await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if(res.ok) {
            // Redirect to login page or show a success message
            window.location.href = "/login";
        } else {
            // Handle error case
            console.error("Logout failed");
        }
    };

    return (
        <>
            {navData.map((item) => (
                <Accordion
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isLinkOpen={pathname.includes(item.link)}
                    items={item.children?.map((child) => (
                        <Link
                            key={child.id}
                            href={child.link}
                            className={clsx(
                                "py-3 px-4 cursor-pointer flex flex-1 gap-3 hover:bg-primary-accent flex-row z-50 text-[0.9rem]",
                                pathname === child.link ? "bg-secondary/20 tracking-wide" : ""
                            )}
                        >
                            <Image
                                alt='nav icons'
                                src={child.icon.src}
                                className='inline-block w-6'
                                width={20}
                                height={20}
                            />
                            {child.label}
                        </Link>
                    )) || []}
                />
            ))}
            <div className='absolute bottom-8 px-2 right-0 w-full'>
                <button className=' bg-red-500 text-white w-[90%] py-2 rounded-md cursor-pointer'
                    onClick={() => logout()}
                >
                    logout
                </button>
            </div>
        </>
    );
};

export default NavTree;