import SideBar from "@/components/sidebar/SideBar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main lang="en" className="h-full antialiased">
      <SideBar>
        {children}
      </SideBar>
    </main>
  );
};

export default Layout;