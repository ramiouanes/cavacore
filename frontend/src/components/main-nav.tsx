import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function MainNav() {
  const routes = [
    { href: '/', label: 'Home' },
    { href: '/horses', label: 'Horses' },
    { href: '/horses/create', label: 'List a Horse' },
    { href: '/deals', label: 'Deals' },
    { href: '/deals/create', label: 'Create a Deal' },
  ];

  return (
    <nav className="flex items-center space-x-6">
      <Link to="/" className="font-bold text-xl">
        cavacore
      </Link>
      <ul className="flex items-center space-x-4">
        {routes.map((route) => (
          <li key={route.href}>
            <Link
              to={route.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary'
              )}
            >
              {route.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}