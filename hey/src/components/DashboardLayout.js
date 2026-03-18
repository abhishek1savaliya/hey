'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex-1 md:ml-64">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="mt-20 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
