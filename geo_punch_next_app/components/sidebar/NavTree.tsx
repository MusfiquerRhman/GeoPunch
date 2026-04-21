import React from 'react';
import { Accordion } from '@/components';
import Link from 'next/link';
import clsx from 'clsx';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { bookIcon, locationIcon, officeIcon } from '@/assets';

// Recursive component to render the navigation tree
const NavTree = () => {
    const pathname = usePathname();

    const navData = [
        {
            id: 1,
            label: 'Library',
            icon: bookIcon,
            link: '/library',
            children: [
                {
                    id: 2,
                    label: 'Locations',
                    icon: locationIcon,
                    link: '/library/locations',
                },
                {
                    id: 3,
                    label: 'Offices',
                    icon: officeIcon,
                    link: '/library/offices',
                },
            ],
        },
        // Add more navigation items here
    ];

    return (
        <React.Fragment>
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
                                pathname === child.link ? "bg-primary tracking-wide" : ""
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
        </React.Fragment>
    );
};

export default React.memo(NavTree);