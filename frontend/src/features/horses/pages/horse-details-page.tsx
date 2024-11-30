import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Calendar,
    Ruler,
    Award,
    Heart,
    Share2,
    MessageCircle,
    Eye,
    MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ImageGallery } from '@/components/ui/image/image-gallery';
import { horseService } from '../services/horse-service';
import { Horse } from '../types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/utils/media';


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

export function HorseDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isWishlisted, setIsWishlisted] = useState(false);

    const { data: horse, isLoading } = useQuery({
        queryKey: ['horse', id],
        queryFn: () => horseService.getHorse(id!)
    });

    useEffect(() => {
        if (horse) {
            horseService.recordView(id!);
            setIsWishlisted(horse.isWishlisted || false);
        }
    }, [horse, id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!horse) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="container mx-auto px-4 py-8 text-center"
            >
                <h2 className="text-2xl font-light text-primary-dark mb-4">Horse not found</h2>
                <Button
                    variant="outline"
                    onClick={() => navigate('/horses')}
                    className="hover:bg-primary hover:text-white transition-colors"
                >
                    Back to Horses
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-safe-bottom">
            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Button
                        variant="ghost"
                        className="mb-8 -ml-4 text-primary-dark hover:text-primary transition-colors"
                        onClick={() => navigate('/horses')}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to Horses
                    </Button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Media Gallery */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    >
                        <ImageGallery
                        images={horse.media.map(media => ({
                            url: getMediaUrl(media.url || ''), 
                            thumbnailUrl: getMediaUrl(media.thumbnailUrl), 
                            caption: media.caption
                        }))}
                        aspectRatio="video"
                    />
                    </motion.div>

                    {/* Horse Details */}
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                    >
                        <div>
                            <h1 className="text-4xl font-light tracking-wide text-primary-dark">
                                {horse.basicInfo.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 mt-4 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{calculateAge(horse.basicInfo.dateOfBirth)} years</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Ruler className="w-4 h-4" />
                                    <span>{horse.basicInfo.height} hands</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{horse.basicInfo.breed}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="default"
                                className="flex-1 bg-primary hover:bg-primary-dark transition-colors"
                                onClick={() => {/* Implement contact handler */ }}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Contact Owner
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsWishlisted(!isWishlisted)}
                                className={cn(
                                    "transition-colors",
                                    isWishlisted && "text-red-500 hover:text-red-600"
                                )}
                            >
                                <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="hover:bg-primary hover:text-white transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <Card className="p-6 bg-white/50 backdrop-blur-sm">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{horse.views || 0} views</span>
                                </div>
                                <span>Listed {format(new Date(horse.createdAt!), 'MMM d, yyyy')}</span>
                            </div>
                        </Card>

                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="w-full grid grid-cols-3 bg-white/50 backdrop-blur-sm">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="performance">Performance</TabsTrigger>
                                <TabsTrigger value="health">Health</TabsTrigger>
                            </TabsList>

                            <div className="mt-6 space-y-6">
                                <TabsContent value="details" className="mt-0 space-y-6">
                                    <DetailsTab horse={horse} />
                                </TabsContent>

                                <TabsContent value="performance" className="mt-0 space-y-6">
                                    <PerformanceTab horse={horse} />
                                </TabsContent>

                                <TabsContent value="health" className="mt-0 space-y-6">
                                    <HealthTab horse={horse} />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

// Separate the tab content into components for better organization
function DetailsTab({ horse }: { horse: Horse }) {
    return (
        <>
            <Card className="p-6 bg-white/50 backdrop-blur-sm">
                <h3 className="text-lg font-light tracking-wide text-primary-dark mb-4">
                    Basic Information
                </h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <dt className="text-muted-foreground">Breed</dt>
                    <dd>{horse.basicInfo.breed}</dd>
                    <dt className="text-muted-foreground">Color</dt>
                    <dd>{horse.basicInfo.color}</dd>
                    <dt className="text-muted-foreground">Gender</dt>
                    <dd className="capitalize">{horse.basicInfo.gender}</dd>
                    <dt className="text-muted-foreground">Registration</dt>
                    <dd>{horse.lineage.registrationNumber}</dd>
                </dl>
            </Card>

            <Card className="p-6 bg-white/50 backdrop-blur-sm">
                <h3 className="text-lg font-light tracking-wide text-primary-dark mb-4">
                    Lineage
                </h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <dt className="text-muted-foreground">Sire</dt>
                    <dd>
                        <div>{horse.lineage.sire.name}</div>
                        <div className="text-xs text-muted-foreground">
                            {horse.lineage.sire.breed}
                        </div>
                    </dd>
                    <dt className="text-muted-foreground">Dam</dt>
                    <dd>
                        <div>{horse.lineage.dam.name}</div>
                        <div className="text-xs text-muted-foreground">
                            {horse.lineage.dam.breed}
                        </div>
                    </dd>
                </dl>
                {horse.lineage.bloodlineNotes && (
                    <p className="mt-4 text-sm text-muted-foreground">
                        {horse.lineage.bloodlineNotes}
                    </p>
                )}
            </Card>
        </>
    );
}

function PerformanceTab({ horse }: { horse: Horse }) {
    return (
        <>
            <Card className="p-6 bg-white/50 backdrop-blur-sm">
                <h3 className="text-lg font-light tracking-wide text-primary-dark mb-4">
                    Disciplines
                </h3>
                <div className="flex flex-wrap gap-2">
                    {horse.performance.disciplines.map((discipline) => (
                        <span
                            key={discipline}
                            className="px-3 py-1 bg-primary/5 text-primary rounded-full text-sm"
                        >
                            {discipline}
                        </span>
                    ))}
                </div>
                <p className="mt-4 text-sm">
                    Current Level:{' '}
                    <span className="text-primary capitalize">
                        {horse.performance.currentLevel}
                    </span>
                </p>
            </Card>

            {horse.performance.achievements.length > 0 && (
                <Card className="p-6 bg-white/50 backdrop-blur-sm">
                    <h3 className="text-lg font-light tracking-wide text-primary-dark mb-4">
                        Achievements
                    </h3>
                    <div className="space-y-4">
                        {horse.performance.achievements.map((achievement) => (
                            <motion.div
                                key={achievement.id}
                                className="flex items-start gap-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Award className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium">{achievement.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(achievement.date), 'MMM d, yyyy')}
                                    </p>
                                    {achievement.description && (
                                        <p className="text-sm mt-1">
                                            {achievement.description}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}

            {horse.performance.trainingHistory && (
                <Card className="p-6 bg-white/50 backdrop-blur-sm">
                    <h3 className="text-lg font-light tracking-wide text-primary-dark mb-4">
                        Training History
                    </h3>
                    <p className="text-sm leading-relaxed">
                        {horse.performance.trainingHistory}
                    </p>
                </Card>
            )}
        </>
    );
}

function HealthTab({ horse }: { horse: Horse }) {
    return (
        <>
            <Card className="p-6 bg-white/50 backdrop-blur-sm">
                <h3 className="text-lg font-light tracking-wide text-primary-dark mb-4">
                    General Health
                </h3>
                <p className="text-sm leading-relaxed">
                    {horse.health.generalHealth}
                </p>
            </Card>

            {horse.health.vaccinations.length > 0 && (
                <Card className="p-6 bg-white/50 backdrop-blur-sm">
                    <h3 className="text-lg font-light tracking-wide text-primary-dark mb-4">
                        Vaccinations
                    </h3>
                    <div className="space-y-4">
                        {horse.health.vaccinations.map((vaccination) => (
                            <div
                                key={vaccination.id}
                                className="text-sm border-l-2 border-primary/20 pl-4"
                            >
                                <p className="font-medium text-primary-dark">
                                    {vaccination.type}
                                </p>
                                <p className="text-muted-foreground">
                                    Last: {format(new Date(vaccination.date), 'MMM d, yyyy')}
                                    {' • '}
                                    Next: {format(new Date(vaccination.nextDueDate), 'MMM d, yyyy')}
                                </p>
                                {vaccination.notes && (
                                    <p className="mt-1 text-muted-foreground">
                                        {vaccination.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {horse.health.specialCare && (
                <Card className="p-6 bg-white/50 backdrop-blur-sm">
                    <h3 className="text-lg font-light tracking-wide text-primary-dark mb-4">
                        Special Care Requirements
                    </h3>
                    <p className="text-sm leading-relaxed">
                        {horse.health.specialCare}
                    </p>
                </Card>
            )}

            {horse.health.insuranceInfo && (
                <Card className="p-6 bg-white/50 backdrop-blur-sm">
                    <h3 className="text-lg font-light tracking-wide text-primary-dark mb-4">
                        Insurance Information
                    </h3>
                    <p className="text-sm leading-relaxed">
                        {horse.health.insuranceInfo}
                    </p>
                </Card>
            )}
        </>
    );
}