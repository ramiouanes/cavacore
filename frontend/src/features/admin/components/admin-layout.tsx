import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex">
      <aside className="w-64 bg-gray-100 h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <nav className="space-y-2">
          <Link to="/admin">
            <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="ghost" className="w-full justify-start">Users</Button>
          </Link>
          <Link to="/admin/horses">
            <Button variant="ghost" className="w-full justify-start">Horses</Button>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
};