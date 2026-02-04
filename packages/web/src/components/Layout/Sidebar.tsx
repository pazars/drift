import type { ReactNode } from 'react';

export interface SidebarProps {
  children: ReactNode;
  isOpen?: boolean;
}

export function Sidebar({ children, isOpen = true }: SidebarProps) {
  return (
    <aside
      role="complementary"
      className={`
        w-80 bg-white border-r border-gray-200 flex-shrink-0
        ${isOpen ? 'block' : 'hidden'}
        lg:block
      `}
    >
      {children}
    </aside>
  );
}
