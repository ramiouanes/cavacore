import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function UserNav() {
  const isAuthenticated = false; // TODO: Replace with actual auth state

  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <Link to="/login">
          <Button variant="ghost">Log in</Button>
        </Link>
        <Link to="/register">
          <Button className='font-medium text-secondary'>Sign up</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* TODO: Add user dropdown menu */}
    </div>
  );
}