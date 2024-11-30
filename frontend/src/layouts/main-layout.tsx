import { Outlet } from 'react-router-dom';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { MobileNav } from '@/components/mobile-nav';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function MainLayout() {
  const [scrollY, setScrollY] = useState(0);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Hero Background for Homepage */}
      {isHomePage && (
        <div className="fixed inset-0 w-full">
          <div className="absolute inset-0 h-[100vh] md:h-[80vh] overflow-hidden">
            <img 
              src="/hero.jpg"
              alt=""
              className="object-cover w-full h-full"
              style={{
                transform: `translateY(${scrollY * 0.5}px)`,
                willChange: 'transform'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
          </div>
        </div>
      )}

      {/* Desktop Header - Full width and hidden on mobile */}
      <header className={`sticky top-0 z-50 w-full border-b hidden lg:block ${isHomePage ? 'bg-transparent' : 'bg-background/50 backdrop-blur-sm'}`}>
        <div className="w-full">
          <div className="flex items-center justify-between h-16 px-8">
            <MainNav />
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main Content - Adjusted padding for mobile nav */}
      <main className="flex-1 relative pb-20 lg:pb-0 overscroll-y-none overflow-y-hidden">
        <Outlet />
      </main>

      {/* Footer - Hidden on mobile */}
      <footer className="border-t hidden lg:block">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} cavacore. All rights reserved.
        </div>
      </footer>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}