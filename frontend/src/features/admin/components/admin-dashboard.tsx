import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <Link to="/admin/users">
          <Button className="w-full">Manage Users</Button>
        </Link>
        <Link to="/admin/horses">
          <Button className="w-full">Manage Horses</Button>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;