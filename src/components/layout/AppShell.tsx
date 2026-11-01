import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAppData } from '../../context/AppDataContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearch } from './GlobalSearch';
import { PageSkeleton } from './PageSkeleton';

export function AppShell() {
  const { isLoading } = useAppData();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('personal-tracker:sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('personal-tracker:sidebar', collapsed ? 'collapsed' : 'expanded');
    } catch {
      // Ignore storage limitations.
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (event.key === '/' && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-app text-ink">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[padding] duration-300',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[244px]',
        )}
      >
        <Header onOpenMobile={() => setMobileOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main ref={mainRef} className="relative flex-1 overflow-y-auto bg-content">
          {isLoading ? (
            <PageSkeleton />
          ) : (
            <div className="mx-auto w-full max-w-[1480px] px-4 pb-10 pt-5 sm:px-6 lg:px-7">
              <Outlet />
            </div>
          )}
        </main>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
