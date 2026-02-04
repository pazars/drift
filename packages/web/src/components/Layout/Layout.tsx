import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  activityCount?: number;
}

export function Layout({ children, sidebar, activityCount }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        activityCount={activityCount}
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen}>{sidebar}</Sidebar>

        <main role="main" className="flex-1 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
