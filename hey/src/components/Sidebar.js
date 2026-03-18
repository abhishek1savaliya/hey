'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Sidebar({ isOpen }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/notes', label: 'Notes', icon: '📝' },
    { href: '/profile', label: 'Profile', icon: '👤' },
    { href: '/feedback', label: 'Feedback', icon: '⭐' },
    { href: '/contact', label: 'Contact', icon: '📧' },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/tags', label: 'Tags', icon: '🏷️' },
    { href: '/admin/feedback', label: 'Feedback', icon: '⭐' },
    { href: '/admin/contacts', label: 'Contact Forms', icon: '📧' },
  ];

  const navItems = session?.user?.role === 'admin' ? adminNavItems : userNavItems;

  const isActive = (href) => pathname.startsWith(href);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300`}
        style={{ left: 0 }}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-600">Hey</h2>
          <p className="text-xs text-gray-500 mt-1">
            {session?.user?.role === 'admin' ? 'Admin Panel' : 'Notes Manager'}
          </p>
        </div>

        <nav className="sidebar-nav mt-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-8 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Version 1.0</p>
          <p className="text-xs text-gray-400">
            © 2026 Hey Notes. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}
