import Providers from "@/components/provider";
import SideBar from "@/components/sidebar/SideBar";

import { QueryClient  } from "@tanstack/react-query";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main lang="en" className="h-full antialiased">
      <SideBar>
        <Providers>
          {children}
        </Providers>
      </SideBar>
    </main>
  );
};

export default Layout;