import { Horse } from '../types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '@/utils/media';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


type HorseCardProps = {
  horse: Horse;
  showActions?: boolean;
};

const calculateAge = (dateOfBirth: string | Date): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

export function HorseCard({ horse, showActions = true }: HorseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();


  return (
    <Link to={`/horses/${horse.id}`} className="block group">
      <motion.div
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="h-full"
      >
        <Card className="h-full overflow-hidden transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="p-0">
            <div className="relative aspect-[4/3] bg-muted">
              <img
                src={getMediaUrl(horse.media[0].thumbnailUrl)}
                alt={horse.basicInfo.name}
                className="object-cover w-full h-full"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 bg-white/80 hover:bg-white backdrop-blur-sm"
                onClick={(e) => e.preventDefault()}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-3">
            <div className="space-y-2">

              {/* <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
              <h3 className="font-medium text-lg">
                {horse.basicInfo.name || 'Unnamed Horse'}
              </h3>
              </div>
              <div>
              <p className="text-sm text-muted-foreground mt-1">
                {calculateAge(horse.basicInfo.dateOfBirth)} yrs
              </p>
              </div>
          </div> */}

              <div className="space-y-2">
                <span className="font-medium text-xl text-primary">{horse.basicInfo.name || 'Unnamed Horse'}</span>


                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Age</span>

                  <p className="font-medium">
                    {calculateAge(horse.basicInfo.dateOfBirth)} yrs
                  </p>
                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-muted-foreground">Breed</span>

                  <p className="font-medium">
                    {horse.basicInfo.breed}
                  </p>

                </div>

                <div className="flex justify-between text-sm">
                  
                  <span className="text-muted-foreground">Gender</span>

                  <p className="font-medium">
                    {horse.basicInfo.gender}
                  </p>

                </div>

                <div className="flex justify-between text-sm">
                  
                  <span className="text-muted-foreground">Disciplines</span>

                  <p className="font-medium">
                    {horse.performance.disciplines.length} disciplines
                  </p>

                </div>

                <div className="flex justify-between text-sm">
                  
                  <span className="text-muted-foreground">Current Level</span>

                  <p className="font-medium">
                    {horse.performance.currentLevel}
                  </p>

                </div>


              </div>
              
            </div>

            {/* <h3 className="font-light tracking-wide text-lg text-primary-dark">
              {horse.basicInfo.name}
            </h3>
            <div className="mt-2 text-sm tracking-wide text-muted-foreground">
              {horse.basicInfo.breed} • {calculateAge(horse.basicInfo.dateOfBirth)} yrs • {horse.basicInfo.gender}
            </div> */}
          </CardContent>
          {showActions && (
            <CardFooter className="p-1 bg-muted/50">
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => navigate(`/horses/${horse.id}`)}
              >
                View Details
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''
                  }`} />
              </Button>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </Link>
  );
}
