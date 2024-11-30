import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DealBasicForm } from './forms/deal-basic-form';
import { DealParticipantsForm } from './forms/deal-participants-form';
import { DealTermsForm } from './forms/deal-terms-form';
import { DealLogisticsForm } from './forms/deal-logistics-form';
import { DealDocumentsForm } from './forms/deal-documents-form';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { DealDocument, DealStage, DealStatus } from '../types/deal.types';
import { useDealProfileForm } from '../hooks/forms/use-deal-profile-form';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { dealService } from '../services/deal-service';
import { Timeline } from './common/timeline';
// import { useState } from 'react';
import { TimelineEventType } from '../types/timeline.types';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { handleCancelConfirmation } from './dialogs/cancel-confirmation-dialog';
import { useDealNotifications } from '../hooks/common/use-deal-notifications';



export function DealWizardContainer() {
    const navigate = useNavigate();

    const { id } = useParams();
    const location = useLocation();
    const mode = location.state?.mode || 'create';
    // const [timelineEntries, setTimelineEntries] = useState([]);
    const { user } = useAuth();

    useDealNotifications(id);
    

    // Fetch existing deal data if editing
    const { data: existingDeal, isLoading } = useQuery({
        queryKey: ['deal', id],
        queryFn: () => dealService.getDeal(id!),
        enabled: mode === 'edit' && !!id
    });

    console.log('Existing deal data:', mode);

    const {
        formData,
        currentStep,
        progress,
        // errors,
        setCurrentStep,
        updateFormData,
        clearFormData,
        // handleCancel,
        validateAllSteps,
        validateStep,
        getRecommendations
    } = useDealProfileForm({
        initialData: mode === 'edit' ? existingDeal : undefined
    });

    const handleCancel = async () => {
        const confirmed = await handleCancelConfirmation(mode);
        if (confirmed) {
            clearFormData();
            if (mode === 'edit' && id) {
                navigate(`/deals/${id}`);
            } else {
                navigate('/deals');
            }
        }
    };

    if (mode === 'edit' && isLoading) {
        return <LoadingSpinner />;
    }


    useEffect(() => {
        if (!user) {
            navigate('/login', {
                state: { returnUrl: location.pathname }
            });
        }
    }, [user, navigate, location.pathname]);


    const handleBasicInfoSubmit = async (data: any) => {
        try {
            const stepErrors = validateStep(1, data);
            if (Object.keys(stepErrors).length > 0) {
                return;
            }
            updateFormData('basicInfo', data, true);
        } catch (error) {
            console.error('Error updating basic info:', error);
        }
    };


    const handleParticipantsSubmit = async (data: any) => {
        try {
            const stepErrors = validateStep(2, data);
            if (Object.keys(stepErrors).length > 0) {
                return;
            }
            await updateFormData('participants', data);
        } catch (error) {
            console.error('Error updating participants:', error);
        }
    };

    const handleTermsSubmit = async (data: any) => {
        try {
            const stepErrors = validateStep(3, data);
            if (Object.keys(stepErrors).length > 0) {
                return;
            }
            await updateFormData('terms', data);
        } catch (error) {
            console.error('Error updating terms:', error);
        }
    };

    const handleLogisticsSubmit = async (data: any) => {
        try {
            const stepErrors = validateStep(4, data);
            if (Object.keys(stepErrors).length > 0) {
                return;
            }
            await updateFormData('logistics', data);
        } catch (error) {
            console.error('Error updating logistics:', error);
        }
    };

    const handleDocumentsSubmit = async (data: any) => {
        try {

            // updateFormData('docs', data, false);

            // console.log("data from handleDocumentsSubmit: ", formData);

            if (!validateAllSteps(formData)) {
                alert('Please fill in all required fields before submitting');
                return;
            }


            const formDataToSend = new FormData();
            formDataToSend.append('basicInfo', JSON.stringify(formData.basicInfo));

            formDataToSend.append('participants', JSON.stringify(formData.participants));
            formDataToSend.append('terms', JSON.stringify(formData.terms));
            formDataToSend.append('logistics', JSON.stringify(formData.logistics));

            formDataToSend.append('documents', JSON.stringify(
                data.map((doc: DealDocument) => ({
                    id: doc.id,
                    type: doc.documentType,
                    status: doc.status,
                }))
            ));

            // console.log('Files being sent:', data);


            // Add document files separately
            if (data?.length > 0) {
                data.forEach((doc: DealDocument) => {
                    if (doc.file instanceof File) {
                        formDataToSend.append('documentFiles', doc.file, doc.file.name);
                    }
                });
            }

            // console.log('Files being sent:', data.map((d: DealDocument) => d.file?.name));


            const stepErrors = validateStep(5, data);
            if (Object.keys(stepErrors).length > 0) {
                return;
            }

            // Add timeline
            formDataToSend.append('timeline', JSON.stringify([{
                id: uuidv4(),
                type: TimelineEventType.STAGE_CHANGE,
                stage: DealStage.INITIATION,
                status: DealStatus.ACTIVE,
                date: new Date().toISOString(),
                description: 'Deal created',
                actor: 'system',
                metadata: { automatic: true }
            }]));

            // updateFormData('documents', data, false);

            // console.log("form data to send: ", formDataToSend)

            const response = await dealService.createDeal(formDataToSend);
            // console.log("response from createDeal: ", response);
            clearFormData();
            navigate('/deals');

        } catch (error: any) {
            console.error('Error creating deal:', error);
        }
    };



    // const onCancel = async () => {
    //     if (await handleCancel()) {
    //         clearFormData();
    //         navigate('/deals');
    //     }
    // };


    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderCurrentStep = () => {
        // const recommendations = getRecommendations(currentStep);

        const commonProps = {
            currentStep,
            totalSteps: 5,
            onBack: handleBack,
            onCancel: handleCancel,
            // Only show cancel on steps after first (basic info has its own cancel)
            showCancel: currentStep > 1
        };

        switch (currentStep) {
            case 1:
                return (
                    <DealBasicForm
                        {...commonProps}
                        initialData={existingDeal?.basicInfo}
                        onSubmit={handleBasicInfoSubmit}
                        title="Basic Information"
                        description="Enter the basic details about the deal"
                    />
                );
            case 2:
                return (
                    <DealParticipantsForm
                        {...commonProps}
                        initialData={existingDeal?.participants}
                        onSubmit={handleParticipantsSubmit}
                        title="Participants"
                        description="Add participants involved in the deal"
                    />
                );
            case 3:
                return (
                    <DealTermsForm
                        {...commonProps}
                        initialData={existingDeal?.terms}
                        dealType={formData.basicInfo.type}
                        onSubmit={handleTermsSubmit}
                        title="Terms & Conditions"
                        description="Define the terms of the deal"
                    />
                );
            case 4:
                return (
                    <DealLogisticsForm
                        {...commonProps}
                        initialData={existingDeal?.logistics}
                        dealType={formData.basicInfo.type}
                        onSubmit={handleLogisticsSubmit}
                        title="Logistics"
                        description="Set up logistics details"
                    />
                );
            case 5:
                return (
                    <DealDocumentsForm
                        {...commonProps}
                        initialData={existingDeal?.documents}
                        dealType={formData.basicInfo.type}
                        onSubmit={handleDocumentsSubmit}
                        title="Documents"
                        description="Upload required documents"
                    />
                );
            default:
                return null;
        }
    };




    return (
        <div className="container mx-auto py-6">
            <Card className="max-w-4xl mx-auto">
                <div className="p-6">
                    {/* Progress Indicator */}
                    {/* <div className="mb-8"> */}
                    {/* <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-light text-primary-dark">
                                {currentStep === 1 ? "Create New Deal" : `Step ${currentStep} of 5`}
                            </h2>
                            <div className="text-sm text-muted-foreground">
                                {Math.round(progress.total)}% Complete
                            </div>
                        </div> */}

                    {/* <Progress
                            value={progress.total}
                            className="h-2 mb-4"
                        /> */}

                    {/* Step Progress */}
                    {/* <div className="grid grid-cols-5 gap-2">
                            {Object.entries(progress.byStep).map(([stepId, value], index) => (
                                <div key={stepId} className="text-center">
                                    <div className="text-xs text-muted-foreground mb-1">
                                        Step {index + 1}
                                    </div>
                                    <Progress value={value} className="h-1" />
                                </div>
                            ))}
                        </div> */}
                    {/* </div> */}

                    {/* Smart Recommendations */}
                    <AnimatePresence mode="wait">
                        {getRecommendations(currentStep).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 bg-secondary/10 rounded-lg"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-medium">Recommendations</h3>
                                </div>
                                <ul className="space-y-1">
                                    {getRecommendations(currentStep).map((rec, index) => (
                                        <motion.li
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-sm text-muted-foreground"
                                        >
                                            {rec}
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Current Step Form */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderCurrentStep()}
                        </motion.div>
                    </AnimatePresence>

                    {/* Error Display */}
                    {/* <AnimatePresence>
                        {(dealError || errors.submit) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 rounded-lg bg-destructive/10 p-4"
                            >
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-sm font-medium">
                                        {dealError || errors.submit}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence> */}

                    {/* Missing Requirements */}
                    {progress.missingRequirements.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-6 p-4 bg-muted rounded-lg"
                        >
                            <h4 className="text-sm font-medium mb-2">Missing Requirements:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                {progress.missingRequirements.map((req, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </div>
            </Card>

            {/* Timeline view - only show in later steps */}
            {currentStep >= 1 && (
                <Card className="mt-6 p-6">
                    <h2 className="text-lg font-medium mb-4">Deal Progress</h2>
                    <Timeline entries={formData.timeline || []} />
                </Card>
            )}
        </div>
    );
}
