import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, X, AlertCircle, Users, Shield } from 'lucide-react';
import { ParticipantRole, DealParticipant } from '../../types/deal.types';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import { useDealNotifications } from '../../hooks/common/use-deal-notifications';

interface DealParticipantsFormProps {
  onSubmit: (data: DealParticipant[]) => void;
  onBack: () => void;
  onCancel: () => void;
  initialData?: DealParticipant[];
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
}

// interface Participant {
//   userId: string;
//   role: ParticipantRole;
//   permissions: string[];
//   metadata?: {
//     title?: string;
//     company?: string;
//     license?: string;
//     notes?: string;
//   };
// }

const DEFAULT_PERMISSIONS: Record<ParticipantRole, string[]> = {
  [ParticipantRole.SELLER]: ['manage_terms', 'manage_documents', 'approve_completion'],
  [ParticipantRole.BUYER]: ['manage_terms', 'manage_documents', 'approve_completion'],
  [ParticipantRole.AGENT]: ['manage_terms', 'manage_documents'],
  [ParticipantRole.VETERINARIAN]: ['manage_documents', 'add_reports'],
  [ParticipantRole.TRAINER]: ['manage_documents', 'add_evaluations'],
  [ParticipantRole.INSPECTOR]: ['manage_documents', 'add_reports'],
  [ParticipantRole.TRANSPORTER]: ['view_details', 'update_logistics']
};
const ROLE_RECOMMENDATIONS: Record<ParticipantRole, string[]> = {
  [ParticipantRole.SELLER]: [
    'Consider adding proof of ownership documentation',
    'Ensure all disclosure requirements are met'
  ],
  [ParticipantRole.BUYER]: [
    'Consider appointing an agent for evaluations',
    'Review insurance requirements'
  ],
  [ParticipantRole.AGENT]: [
    'Specify areas of representation',
    'Include licensing information'
  ],
  [ParticipantRole.VETERINARIAN]: [
    'Include professional credentials',
    'Specify examination requirements'
  ],
  [ParticipantRole.TRAINER]: [
    'Detail training experience',
    'Include certifications'
  ],
  [ParticipantRole.INSPECTOR]: [
    'Specify inspection scope',
    'Include professional affiliations'
  ],
  [ParticipantRole.TRANSPORTER]: [
    'Include insurance details',
    'Specify transport equipment capabilities'
  ]
};

export const DealParticipantsForm = ({
  onSubmit,
  onBack,
  initialData,
  currentStep,
  totalSteps,
  title,
  description,
  onCancel
}: DealParticipantsFormProps) => {
  const { id } = useParams();

  useDealNotifications(id);

  const [participants, setParticipants] = useState<DealParticipant[]>(initialData || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateParticipants = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Check minimum participants
    if (participants.length < 2) {
      newErrors.general = 'At least two participants are required';
    }

    // Check required roles
    const hasSeller = participants.some(p => p.role === ParticipantRole.SELLER);
    const hasBuyerOrAgent = participants.some(p => 
      p.role === ParticipantRole.BUYER || p.role === ParticipantRole.AGENT
    );

    if (!hasSeller || !hasBuyerOrAgent) {
      newErrors.roles = 'Must include both seller and buyer/agent';
    }

    // Validate individual participants
    participants.forEach((participant, index) => {
      if (!participant.userId?.trim()) {
        newErrors[`participant-${index}`] = 'User selection is required';
      }
      if (!participant.role) {
        newErrors[`role-${index}`] = 'Role selection is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [participants]);


  const addParticipant = () => {
    const newRole = !participants.some(p => p.role === ParticipantRole.SELLER)
      ? ParticipantRole.SELLER
      : !participants.some(p => p.role === ParticipantRole.BUYER)
        ? ParticipantRole.BUYER
        : ParticipantRole.AGENT;

    const newParticipant: DealParticipant = {
      id: uuidv4(),
      userId: '',
      role: newRole,
      permissions: DEFAULT_PERMISSIONS[newRole],
      // dateAdded: new Date().toISOString(),
      // status: 'active',
      metadata: {}
    };

    setParticipants(prev => [...prev, newParticipant]);
  };

  const removeParticipant = (index: number) => {
    setParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, field: keyof DealParticipant, value: any) => {
    setParticipants(prev => prev.map((p, i) => {
      if (i === index) {
        if (field === 'role') {
          return {
            ...p,
            [field]: value,
            permissions: DEFAULT_PERMISSIONS[value as ParticipantRole]
          };
        }
        return { ...p, [field]: value };
      }
      return p;
    }));

    setTouched(prev => ({
      ...prev,
      [`${field}-${index}`]: true
    }));
  };

  const handleSubmit = () => {
    // Mark all relevant fields as touched
    participants.forEach((_, index) => {
      setTouched(prev => ({
        ...prev,
        [`participant-${index}`]: true,
        [`role-${index}`]: true
      }));
    });

    if (validateParticipants()) {
      onSubmit(participants);
    }
  };

  useEffect(() => {
    if (Object.values(touched).some(Boolean)) {
      validateParticipants();
    }
  }, [participants, touched, validateParticipants]);


  return (
    <FormStep
      title={title}
      description={description}
      currentStep={currentStep}
      totalSteps={totalSteps}
      isValid={Object.keys(errors).length === 0}
      onNext={handleSubmit}
      onPrev={onBack}
      onCancel={onCancel}
    >
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center">
          <Button
            onClick={addParticipant}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Participant
          </Button>

          <div className="flex gap-2">
            {participants.some(p => p.role === ParticipantRole.SELLER) && (
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                Seller Added
              </Badge>
            )}
            {participants.some(p => p.role === ParticipantRole.BUYER) && (
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                Buyer Added
              </Badge>
            )}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {participants.map((participant, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 relative">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Shield className="w-3 h-3" />
                    {participant.permissions.length} Permissions
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParticipant(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="User"
                    required
                    error={touched[`participant-${index}`] ? 
                      errors[`participant-${index}`] : undefined}
                    description="Enter the participant's user ID or email"
                  >
                    <Input
                      placeholder="Enter user email or ID"
                      value={participant.userId}
                      onChange={(e) => updateParticipant(index, 'userId', e.target.value)}
                    />
                  </FormField>

                  <FormField
                    label="Role"
                    required
                    error={touched[`role-${index}`] ? 
                      errors[`role-${index}`] : undefined}
                    description="Select the participant's role in this deal"
                  >
                    <Select
                      value={participant.role}
                      onValueChange={(value) => 
                        updateParticipant(index, 'role', value as ParticipantRole)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ParticipantRole).map((role) => (
                          <SelectItem 
                            key={role} 
                            value={role}
                            className="capitalize"
                          >
                            {role.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    label="Company/Organization"
                    description="Optional company or organization affiliation"
                  >
                    <Input
                      placeholder="Enter company name"
                      value={participant.metadata?.company || ''}
                      onChange={(e) => updateParticipant(index, 'metadata', {
                        ...participant.metadata,
                        company: e.target.value
                      })}
                    />
                  </FormField>

                  <FormField
                    label="License/Registration"
                    description="Professional license or registration number if applicable"
                  >
                    <Input
                      placeholder="Enter license number"
                      value={participant.metadata?.license || ''}
                      onChange={(e) => updateParticipant(index, 'metadata', {
                        ...participant.metadata,
                        license: e.target.value
                      })}
                    />
                  </FormField>
                </div>

                {/* Role-specific recommendations */}
                {ROLE_RECOMMENDATIONS[participant.role] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t"
                  >
                    <p className="text-sm text-muted-foreground mb-2">
                      Recommendations for {participant.role}:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {ROLE_RECOMMENDATIONS[participant.role].map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Error Summary */}
        <AnimatePresence>
          {Object.keys(errors).length > 0 && Object.values(touched).some(Boolean) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-destructive/10 p-4"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">Please fix the following errors:</p>
              </div>
              <ul className="mt-2 space-y-1">
                {Object.values(errors).map((error, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-destructive"
                  >
                    {error}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </FormStep>
  );
}

export default DealParticipantsForm;