'use client';

import Providers from "@/components/provider";
import SideBar from "@/components/sidebar/SideBar";
import { Toaster } from 'sonner';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main lang="en" className="h-full antialiased">
      <Toaster />
      <SideBar>
        <Providers>
          {children}
        </Providers>
      </SideBar>
    </main>
  );
};

export default Layout;
