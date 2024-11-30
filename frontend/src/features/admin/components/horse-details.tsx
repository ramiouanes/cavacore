import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { adminService } from '../services/admin-service';

interface Horse {
  id: number;
  name: string;
  breed: string;
  // Add other horse properties as needed
}

const HorseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [horse, setHorse] = useState<Horse | null>(null);

  useEffect(() => {
    const fetchHorse = async () => {
      try {
        const data = await adminService.getHorseById(Number(id));
        setHorse(data);
      } catch (error) {
        console.error('Error fetching horse details:', error);
      }
    };
    fetchHorse();
  }, [id]);

  if (!horse) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Horse Details</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Name:
          </label>
          <p className="text-gray-700">{horse.name}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Breed:
          </label>
          <p className="text-gray-700">{horse.breed}</p>
        </div>
        {/* Add more horse details as needed */}
      </div>
    </div>
  );
};

export default HorseDetails;