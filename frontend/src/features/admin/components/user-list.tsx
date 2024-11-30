import React, { useEffect, useState } from 'react';
import { adminService } from '../services/admin-service';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface User {
  id: number;
  username: string;
  email: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User List</h1>
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id} className="border p-2 rounded">
            <span>{user.username} - {user.email}</span>
            <Link to={`/admin/users/${user.id}`}>
              <Button className="ml-2">View Details</Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;