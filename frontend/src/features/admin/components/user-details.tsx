import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { adminService } from '../services/admin-service';

interface User {
  id: number;
  username: string;
  email: string;
  // Add other user properties as needed
}

const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await adminService.getUserById(Number(id));
        setUser(data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };
    fetchUser();
  }, [id]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Details</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Username:
          </label>
          <p className="text-gray-700">{user.username}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email:
          </label>
          <p className="text-gray-700">{user.email}</p>
        </div>
        {/* Add more user details as needed */}
      </div>
    </div>
  );
};

export default UserDetails;