'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, logout } from '@/lib/auth';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  // Helper to get beautiful title based on pathname
  const getPageTitle = (path) => {
    switch (path) {
      case '/':
        return { title: 'Dashboard', subtitle: 'Real-time multi-agent activity & CRM overview' };
      case '/leads':
        return { title: 'Lead Intelligence', subtitle: 'Automated lead ingestion and scoring pipeline' };
      case '/customers':
        return { title: 'Customer Directory', subtitle: 'Manage active customer relationships and value contracts' };
      case '/emails':
        return { title: 'Email Studio', subtitle: 'Compose and coordinate AI-driven email campaigns' };
      case '/support':
        return { title: 'Support Command', subtitle: 'Agent-routed ticketing system and helpdesk' };
      case '/analytics':
        return { title: 'Analytics & Insights', subtitle: 'Real-time performance analytics and AI-generated findings' };
      case '/ai':
        return { title: 'AI Orchestration Console', subtitle: 'Chat directly with specialized autonomous agents' };
      case '/logs':
        return { title: 'Orchestrator Logs', subtitle: 'Audit trails and operation metrics for autonomous agents' };
      case '/settings':
        return { title: 'Settings', subtitle: 'Configure platform parameters, LLM thresholds, and API keys' };
      default:
        return { title: 'NexusCRM', subtitle: 'Autonomous Multi-Agent CRM System' };
    }
  };

  const { title, subtitle } = getPageTitle(pathname);
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AD';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="main-header">
      <div className="header-meta">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-actions">
        <div className="search-wrapper">
          <span className="search-icon">⌕</span>
          <input 
            type="text" 
            placeholder="Search leads, tasks, tickets..." 
            className="search-input"
          />
        </div>

        <div className="notification-bell" title="System Notifications">
          <span className="bell-icon">⚑</span>
          <span className="notification-badge"></span>
          
          {/* Simple dropdown hover list for premium feel */}
          <div className="notification-dropdown">
            <div className="notif-header">Notifications</div>
            <div className="notif-list">
              <div className="notif-item">
                <span className="notif-bullet success"></span>
                <div>
                  <p>Lead <strong>Rajesh Kumar</strong> scored 92%</p>
                  <span>2 mins ago</span>
                </div>
              </div>
              <div className="notif-item">
                <span className="notif-bullet info"></span>
                <div>
                  <p>New ticket T-401 assigned to Support Agent</p>
                  <span>15 mins ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="user-profile" onClick={handleLogout} title="Click to logout" style={{ cursor: 'pointer' }}>
          <div className="user-avatar">
            <span>{initials}</span>
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Admin User'}</span>
            <span className="user-role">{user?.role || 'Administrator'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
