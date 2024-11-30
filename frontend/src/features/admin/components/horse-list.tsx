import React, { useEffect, useState } from 'react';
import { adminService } from '../services/admin-service';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Horse {
  id: number;
  name: string;
  breed: string;
}

const HorseList: React.FC = () => {
  const [horses, setHorses] = useState<Horse[]>([]);

  useEffect(() => {
    const fetchHorses = async () => {
      try {
        const data = await adminService.getAllHorses();
        setHorses(data);
      } catch (error) {
        console.error('Error fetching horses:', error);
      }
    };
    fetchHorses();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Horse List</h1>
      <ul className="space-y-2">
        {horses.map((horse) => (
          <li key={horse.id} className="border p-2 rounded">
            <span>{horse.name} - {horse.breed}</span>
            <Link to={`/admin/horses/${horse.id}`}>
              <Button className="ml-2">View Details</Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HorseList;