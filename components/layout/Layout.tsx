
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="fixed top-0 left-0 h-full pt-[69px] z-40">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto pl-[5rem] pt-[69px]">
            <div className="p-4 sm:p-6 lg:p-8">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
