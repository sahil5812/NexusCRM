'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { isAuthenticated, fetchCurrentUser } from '@/lib/auth';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    async function checkAuth() {
      if (isLoginPage) {
        setCheckingAuth(false);
        return;
      }

      if (!isAuthenticated()) {
        router.replace('/login');
        return;
      }

      await fetchCurrentUser();
      setCheckingAuth(false);
    }

    checkAuth();
  }, [isLoginPage, pathname, router]);

  if (isLoginPage) {
    return <div className="login-layout-wrapper">{children}</div>;
  }

  if (checkingAuth) {
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <div className="anim-pulse">Verifying session...</div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`main-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />
        <main className="content-container">{children}</main>
      </div>
    </div>
  );
}
