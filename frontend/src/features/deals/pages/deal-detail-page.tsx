import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    ChevronLeft,
    MoreVertical,
    Clock,
    AlertTriangle,
    Calendar,
    User,
    DollarSign,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    PauseCircle
} from 'lucide-react';
import { DealProgress } from '../components/common/deal-progress';
import { dealService } from '../services/deal-service';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { DealType, DealStatus, Deal, DealStage } from '../types/deal.types';
import { DealDocument } from '../types/document.types';
import { dealTypeUtils } from '../utils/deal-type-utils';
import { Timeline } from '../components/common/timeline';
import { Participants } from '../components/common/participants';
import { Documents } from '../components/common/documents';
// import { useDeal } from '../contexts/deal-context';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { AddParticipantPayload, UpdateParticipantPayload } from '../types/participant.dto';
import { getMediaUrl } from '@/utils/media';
import { useDealSocket } from '../hooks/common/use-deal-socket';
import { PresenceIndicator } from '../components/common/presence-indicator';
import { Comments } from '../components/common/comments';
import { DocumentPreview } from '../components/common/document-preview';
import { useDealNotifications } from '../hooks/common/use-deal-notifications';




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


const formatDateRange = (startDate?: string, endDate?: string): string => {
    if (!startDate) return 'Not specified';

    const start = new Date(startDate);
    const formattedStart = start.toLocaleDateString();

    if (!endDate) return `From ${formattedStart}`;

    const end = new Date(endDate);
    return `${formattedStart} - ${end.toLocaleDateString()}`;
};

const calculateOverallProgress = (deal: Deal): number => {
    const stages = dealTypeUtils.getConfig(deal.basicInfo.type as DealType).stages;
    const currentIndex = stages.indexOf(deal.basicInfo.stage);
    const totalStages = stages.length;

    return Math.round(((currentIndex + 1) / totalStages) * 100);
};

const getStatusStyles = (status: DealStatus): string => {
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

// Permission check functions
const canManageParticipants = (deal: Deal): boolean => {
    // Add your permission logic here
    return true; // Temporary, replace with actual logic
};

const canManageDocuments = (deal: Deal): boolean => {
    // Add your permission logic here
    return true; // Temporary, replace with actual logic
};


export function DealDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showHoldDialog, setShowHoldDialog] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState<Array<any>>([]);
    const [previewDocument, setPreviewDocument] = useState<DealDocument | null>(null);

    useDealSocket(id, setConnectedUsers);
    useDealNotifications(id);



    const { data: deal, isLoading, error } = useQuery({
        queryKey: ['deal', id],
        queryFn: () => dealService.getDeal(id!),
        enabled: !!id
    });

    // Status update mutations
    const statusMutation = useMutation({
        mutationFn: ({ status, reason }: { status: DealStatus; reason?: string }) =>
            dealService.updateStatus(id!, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deal', id] });
            toast({
                title: 'Status updated',
                description: 'Deal status has been successfully updated',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error updating status',
                description: error instanceof Error ? error.message : 'An unexpected error occurred',
                variant: 'destructive'
            });
        }
    });

    const addParticipantMutation = useMutation({
        mutationFn: (data: AddParticipantPayload) => {
            if (!deal) throw new Error('Deal not found');
            console.log("data from add: ", data);
            return dealService.addParticipant(deal.id, {
                userId: data.userId,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                permissions: data.permissions || [],
                metadata: data.metadata
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deal', id] });
            toast({
                title: 'Participant added',
                description: 'New participant has been added to the deal'
            });
        },
        onError: (error) => {
            toast({
                title: 'Error adding participant',
                description: error instanceof Error ? error.message : 'An unexpected error occurred',
                variant: 'destructive'
            });
        }
    });

    const handleStatusChange = async (status: DealStatus, reason?: string) => {
        await statusMutation.mutateAsync({ status, reason });
        setShowCancelDialog(false);
        setShowHoldDialog(false);
    };

    // Calculate stage progress
    const calculateStageProgress = (deal: Deal): Record<DealStage, number> => {
        const stages = dealTypeUtils.getConfig(deal.basicInfo.type as DealType).stages;
        const currentStageIndex = stages.indexOf(deal.basicInfo.stage);

        return Object.values(DealStage).reduce((acc, stage) => ({
            ...acc,
            [stage]: stages.indexOf(stage) <= currentStageIndex ? 100 : 0
        }), {} as Record<DealStage, number>);
    };

    // Error handling
    useEffect(() => {
        if (error) {
            toast({
                title: 'Error loading deal',
                description: error instanceof Error ? error.message : 'An unexpected error occurred',
                variant: 'destructive'
            });
        }
    }, [error, toast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Not found state
    if (!deal) {
        return (
            <div className="container mx-auto py-12">
                <Card className="p-6 text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
                    <h3 className="text-lg font-medium mt-4">Deal not found</h3>
                    <p className="text-muted-foreground mt-2">
                        The deal you're looking for doesn't exist or you don't have permission to view it.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/deals')}
                        className="mt-4"
                    >
                        Return to Deals
                    </Button>
                </Card>
            </div>
        );
    }

    const config = dealTypeUtils.getConfig(deal.basicInfo.type as DealType);

    // Document handling functions

    const handleDocumentDownload = async (documents: DealDocument | DealDocument[]) => {
        try {
            const docs = Array.isArray(documents) ? documents : [documents];
            await dealService.downloadDocuments(deal.id, docs.map(document => ({
                ...document,
                metadata: {
                    ...document.metadata,
                    reviewDate: document.metadata?.reviewDate ? new Date(document.metadata.reviewDate) : undefined
                }
            })));
        } catch (error) {
            toast({
                title: 'Download failed',
                description: error instanceof Error ? error.message : 'Failed to download document',
                variant: 'destructive'
            });
        }
    };

    const handleDocumentUpload = async (files: File[]) => {
        const uploadMutation = useMutation({
            mutationFn: async () => {
                const formData = new FormData();
                files.forEach(file => formData.append('documentFiles', file));
                return dealService.uploadDocuments(deal.id, files);
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['deal', id] });
                toast({
                    title: 'Upload successful',
                    description: `Successfully uploaded ${files.length} document(s)`
                });
            },
            onError: (error: Error) => {
                toast({
                    title: 'Upload failed',
                    description: error.message,
                    variant: 'destructive'
                });
            }
        });

        await uploadMutation.mutateAsync();
    };

    const handleDocumentPreview = (document: DealDocument) => {
        // console.log('document', document);
        setPreviewDocument({
            ...document,
            dealId: deal.id // Add dealId for preview component
        });
    };




    const handleDocumentDelete = async (id: string) => {
        try {
            const deleteMutation = useMutation({
                mutationFn: () => dealService.deleteDocument(deal.id!, id),
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['deal', id] });
                    toast({
                        title: 'Document deleted',
                        description: 'Document has been successfully deleted'
                    });
                }
            });

            await deleteMutation.mutateAsync();
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };


    const handleDocumentApprove = async (id: string) => {
        try {
            const approveMutation = useMutation({
                mutationFn: () => dealService.approveDocument(deal.id!, id),
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['deal', id] });
                    toast({
                        title: 'Document approved',
                        description: 'Document has been successfully approved'
                    });
                }
            });

            await approveMutation.mutateAsync();
        } catch (error) {
            console.error('Error approving document:', error);
        }
    };


    const handleDocumentReject = async (id: string, reason: string) => {
        try {
            const rejectMutation = useMutation({
                mutationFn: () => dealService.rejectDocument(deal.id!, id, reason),
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['deal', id] });
                    toast({
                        title: 'Document rejected',
                        description: 'Document has been rejected'
                    });
                }
            });

            await rejectMutation.mutateAsync();
        } catch (error) {
            console.error('Error rejecting document:', error);
        }
    };




    // Participant management functions
    const handleAddParticipant = async (data: AddParticipantPayload) => {
        try {
            await addParticipantMutation.mutateAsync(data);
        } catch (error) {
            console.error('Error adding participant:', error);
        }
    };


    const handleRemoveParticipant = async (id: string) => {
        try {
            const removeMutation = useMutation({
                mutationFn: () => dealService.removeParticipant(deal.id!, id),
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['deal', id] });
                    toast({
                        title: 'Participant removed',
                        description: 'Participant has been removed from the deal'
                    });
                }
            });

            await removeMutation.mutateAsync();
        } catch (error) {
            console.error('Error removing participant:', error);
        }
    };



    const handleUpdateParticipant = async (participantId: string, updateData: UpdateParticipantPayload) => {
        try {
            const updateMutation = useMutation({
                mutationFn: () => dealService.updateParticipant(deal.id, participantId, updateData),
                onMutate: async () => {
                    await queryClient.cancelQueries({ queryKey: ['deal', id] });
                    const previousDeal = queryClient.getQueryData(['deal', id]);

                    queryClient.setQueryData(['deal', id], (old: Deal) => ({
                        ...old,
                        participants: old.participants.map(p =>
                            p.id === participantId ? { ...p, ...updateData } : p
                        )
                    }));

                    return { previousDeal };
                },
                onSuccess: () => {
                    toast({
                        title: 'Participant updated',
                        description: 'Participant information has been updated'
                    });
                },
                onError: (error, _, context) => {
                    queryClient.setQueryData(['deal', id], context?.previousDeal);
                    toast({
                        title: 'Error updating participant',
                        description: error instanceof Error ? error.message : 'Failed to update participant',
                        variant: 'destructive'
                    });
                },
                onSettled: () => {
                    queryClient.invalidateQueries({ queryKey: ['deal', id] });
                }
            });

            await updateMutation.mutateAsync();
        } catch (error) {
            console.error('Error updating participant:', error);
        }
    };

    return (
        // console.log("deal documents: ", deal.documents),
        // console.log("connected users: ", connectedUsers),
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
                <div className="container mx-auto py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <PresenceIndicator connectedUsers={connectedUsers} />
                            <Button
                                variant="ghost"
                                className="gap-2"
                                onClick={() => navigate('/deals')}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back to Deals
                            </Button>
                            <Badge
                                variant="outline"
                                className={getStatusStyles(deal.basicInfo.status)}
                            >
                                {getStatusIcon(deal.basicInfo.status)}
                                {deal.basicInfo.status}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>Last updated: {new Date(deal.updatedAt).toLocaleDateString()}</span>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {deal.basicInfo.status !== DealStatus.COMPLETED && (
                                        <>
                                            <DropdownMenuItem onClick={() => navigate(`/deals/${id}/edit`, { state: { mode: 'edit' } })}>
                                                Edit Deal
                                            </DropdownMenuItem>
                                            {deal.basicInfo.status === DealStatus.ACTIVE && (
                                                <DropdownMenuItem
                                                    onClick={() => setShowHoldDialog(true)}
                                                    className="text-yellow-500"
                                                >
                                                    Put on Hold
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() => setShowCancelDialog(true)}
                                                className="text-destructive"
                                            >
                                                Cancel Deal
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem>
                                        Download Documents
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Change Dialogs */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Deal</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this deal? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, keep deal active</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleStatusChange(DealStatus.CANCELLED, 'User cancelled deal')}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Yes, cancel deal
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Put Deal on Hold</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to put this deal on hold? You can resume it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, keep deal active</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleStatusChange(DealStatus.ON_HOLD, 'User put deal on hold')}
                            className="bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                            Yes, put on hold
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Main Content */}
            <div className="container mx-auto py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 className="text-3xl font-light tracking-wide text-primary-dark">
                                {deal.horse?.basicInfo.name || 'Unnamed Horse'}
                            </h1>
                            <p className="text-lg text-muted-foreground mt-2">
                                {config.title} • {deal.basicInfo.stage.replace('_', ' ')}
                            </p>
                        </motion.div>

                        {/* Horse Details Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <Card className="p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-lg font-medium mb-4">Horse Details</h2>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/horses/${deal.horse.id}`)}
                                    >
                                        View Horse Profile
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="aspect-[4/3] relative rounded-lg overflow-hidden bg-muted">
                                        {deal.horse?.media?.[0]?.url ? (
                                            <img
                                                src={getMediaUrl(deal.horse.media[0].thumbnailUrl) || getMediaUrl(deal.horse.media[0].url)}
                                                alt={deal.horse.basicInfo.name}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <AlertCircle className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                                            <div className="mt-2 space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Breed</span>
                                                    <span className="font-medium">{deal.horse?.basicInfo.breed}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Age</span>
                                                    <span className="font-medium">
                                                        {calculateAge(deal.horse?.basicInfo.dateOfBirth)} years
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Gender</span>
                                                    <span className="font-medium">{deal.horse?.basicInfo.gender}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Height</span>
                                                    <span className="font-medium">{deal.horse?.basicInfo.height} hands</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Color</span>
                                                    <span className="font-medium">{deal.horse?.basicInfo.color}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">Current Status</h3>
                                            <div className="mt-2 space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Location</span>
                                                    <span className="font-medium">
                                                        {deal.logistics?.transportation?.pickupLocation || 'Not specified'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Availability</span>
                                                    <Badge variant="outline" className="font-normal">
                                                        In Active Deal
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Terms Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <Card className="p-6">
                                <h2 className="text-lg font-medium mb-4">Deal Terms</h2>
                                <div className="space-y-6">
                                    {/* Financial Terms */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-muted-foreground">Financial Terms</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {deal.terms?.price && (
                                                <div className="p-4 rounded-lg border bg-card">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <DollarSign className="w-4 h-4" />
                                                        <span>Price</span>
                                                    </div>
                                                    <p className="text-lg font-medium">
                                                        {new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: deal.terms.currency || 'USD'
                                                        }).format(deal.terms.price)}
                                                    </p>
                                                </div>
                                            )}

                                            {(deal.terms?.duration || deal.terms?.startDate) && (
                                                <div className="p-4 rounded-lg border bg-card">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>Duration</span>
                                                    </div>
                                                    <p className="text-lg font-medium">
                                                        {deal.terms.duration
                                                            ? `${deal.terms.duration} months`
                                                            : formatDateRange(deal.terms.startDate, deal.terms.endDate)
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Conditions */}
                                    {deal.terms?.conditions && deal.terms.conditions.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-muted-foreground">Conditions</h3>
                                            <ul className="space-y-2">
                                                {deal.terms.conditions.map((condition, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-start gap-2 text-sm"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mt-1 text-primary" />
                                                        <span>{condition}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Special Terms */}
                                    {deal.terms?.specialTerms && (
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-muted-foreground">Special Terms</h3>
                                            <p className="text-sm">{deal.terms.specialTerms}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Timeline Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                        >
                            <Card className="p-6">
                                <h2 className="text-lg font-medium mb-4">Timeline</h2>
                                <Timeline entries={deal.timeline} />
                            </Card>
                        </motion.div>

                        {/* Comments Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                        >
                            <Comments dealId={id!} />
                        </motion.div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        {/* Progress */}
                        <DealProgress
                            deal = {deal}
                            dealType={deal.basicInfo.type}
                            currentStage={deal.basicInfo.stage}
                            status={deal.basicInfo.status}
                            progress={calculateOverallProgress(deal)}
                            stageProgress={calculateStageProgress(deal)}
                            showDetails
                        />

                        {/* Participants Card */}
                        <Participants
                            participants={deal.participants}
                            onAddParticipant={handleAddParticipant}
                            onRemoveParticipant={handleRemoveParticipant}
                            onUpdateParticipant={handleUpdateParticipant}
                            canManage={canManageParticipants(deal)}
                        />

                        {/* Documents Card */}
                        <Documents
                            documents={deal.documents.map(doc => ({
                                ...doc,
                                type: doc.documentType,
                                dealId: deal.id,
                                uploadedBy: doc.uploadedBy || '',
                                uploadDate: doc.uploadDate || new Date().toISOString(),
                                version: doc.version || 1,
                                id: doc.id || '',
                                url: doc.url || '',
                                metadata: doc.metadata ? {
                                    ...doc.metadata,
                                    reviewDate: doc.metadata.reviewDate ? new Date(doc.metadata.reviewDate) : undefined
                                } : undefined
                              }))}
                            onUpload={handleDocumentUpload}
                            onDownload={handleDocumentDownload}
                            onPreview={handleDocumentPreview}
                            onDelete={handleDocumentDelete}
                            onApprove={handleDocumentApprove}
                            onReject={handleDocumentReject}
                            canManage={canManageDocuments(deal)}
                        />
                    </div>
                </div>
                {previewDocument && (
                    <DocumentPreview
                        document={previewDocument}
                        onClose={() => setPreviewDocument(null)}
                        onDownload={handleDocumentDownload}
                    />
                )}
            </div>
        </div>
    );
}