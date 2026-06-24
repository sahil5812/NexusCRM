'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: '▪' },
    { name: 'Leads', path: '/leads', icon: '▪' },
    { name: 'Customers', path: '/customers', icon: '▪' },
    { name: 'Email Studio', path: '/emails', icon: '▪' },
    { name: 'Support', path: '/support', icon: '▪' },
    { name: 'Analytics', path: '/analytics', icon: '▪' },
    { name: 'AI Console', path: '/ai', icon: '▪' },
    { name: 'Agent Logs', path: '/logs', icon: '▪' },
    { name: 'Settings', path: '/settings', icon: '▪' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand flex-between">
        <Link href="/" className="sidebar-logo">
          {!collapsed ? (
            <span className="logo-text">
              Nexus<span className="logo-highlight">CRM</span>
            </span>
          ) : (
            <span className="logo-text-collapsed">N</span>
          )}
        </Link>
        <button 
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link 
              key={link.path} 
              href={link.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={link.name}
            >
              <span className="sidebar-icon">{link.icon}</span>
              {!collapsed && <span className="sidebar-label">{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="agent-status-indicator">
            <span className="status-dot pulsed"></span>
            <span className="status-text">4 AI Agents Active</span>
          </div>
        ) : (
          <div className="agent-status-indicator-collapsed" title="4 AI Agents Active">
            <span className="status-dot pulsed"></span>
          </div>
        )}
      </div>
    </aside>
  );
}
