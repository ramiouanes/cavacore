import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  PauseCircle,
  XCircle
} from 'lucide-react';
import { Deal, DealStatus, DealStage } from '../../types/deal.types';
import { Progress } from '@/components/ui/progress';
import { getMediaUrl } from '@/utils/media';
import { Link } from 'react-router-dom';

interface DealCardProps extends Deal {
  deal: Deal;
  showActions?: boolean;
}

export function DealCard({ deal, showActions = true }: DealCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);


  const getStatusIcon = (status: DealStatus) => {
    switch (status) {
      case DealStatus.ACTIVE:
        return <Clock className="w-4 h-4" />;
      case DealStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4" />;
      case DealStatus.ON_HOLD:
        return <PauseCircle className="w-4 h-4" />;
      case DealStatus.CANCELLED:
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: DealStatus) => {
    switch (status) {
      case DealStatus.ACTIVE:
        return 'bg-blue-500/10 text-blue-500 border-blue-200';
      case DealStatus.COMPLETED:
        return 'bg-green-500/10 text-green-500 border-green-200';
      case DealStatus.ON_HOLD:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-200';
      case DealStatus.CANCELLED:
        return 'bg-red-500/10 text-red-500 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-200';
    }
  };

  const getStageProgress = (stage: DealStage): number => {
    const stages = [
      DealStage.INITIATION,
      DealStage.DISCUSSION,
      DealStage.EVALUATION,
      DealStage.DOCUMENTATION,
      DealStage.CLOSING,
      DealStage.COMPLETE
    ];
    const currentIndex = stages.indexOf(stage);
    return ((currentIndex + 1) / stages.length) * 100;
  };

  return (
    <Link to={`/deals/${deal.id}`} className="block group">
      <motion.div
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="h-full"
      >
        <Card className="h-full overflow-hidden transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="p-0">
            <div className="relative aspect-[4/3] bg-muted">
              {deal.horse && deal.horse.media && deal.horse.media.length > 0 ? (
                <img
                  src={getMediaUrl(deal.horse.media[0].thumbnailUrl) || getMediaUrl(deal.horse.media[0].url)}
                  alt={deal.horse.basicInfo.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <Badge
                className={`absolute top-4 right-4 gap-1.5 ${getStatusColor(deal.basicInfo.status)}`}
              >
                {getStatusIcon(deal.basicInfo.status)}
                {deal.basicInfo.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-3">
            <div className="space-y-2">
              <div>
                <h3 className="font-medium text-lg">
                  {deal.horse?.basicInfo.name || 'Unnamed Horse'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {deal.basicInfo.type.replace('_', ' ')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{deal.basicInfo.stage.replace('_', ' ')}</span>
                </div>
                <Progress value={getStageProgress(deal.basicInfo.stage)} className="h-1" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Participants</p>
                  <p className="font-medium">{deal.participants.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Update</p>
                  <p className="font-medium">
                    {new Date(deal.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          {showActions && (
            <CardFooter className="p-1 bg-muted/50">
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => navigate(`/deals/${deal.id}`)}
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