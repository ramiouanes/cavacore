import { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ParticipantRole } from '../../types/deal.types';
import { v4 as uuidv4 } from 'uuid';
import { AddParticipantPayload } from '../../types/participant.dto';
import { userService } from '@/features/users/services/user-service';


const DEFAULT_PERMISSIONS: Record<ParticipantRole, string[]> = {
    [ParticipantRole.SELLER]: ['manage_terms', 'manage_documents', 'approve_completion'],
    [ParticipantRole.BUYER]: ['manage_terms', 'manage_documents', 'approve_completion'],
    [ParticipantRole.AGENT]: ['manage_terms', 'manage_documents'],
    [ParticipantRole.VETERINARIAN]: ['manage_documents', 'add_reports'],
    [ParticipantRole.TRAINER]: ['manage_documents', 'add_evaluations'],
    [ParticipantRole.INSPECTOR]: ['manage_documents', 'add_reports'],
    [ParticipantRole.TRANSPORTER]: ['view_details', 'update_logistics']
};

interface AddParticipantModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: AddParticipantPayload) => void;
}

export function AddParticipantModal({ open, onOpenChange, onSubmit }: AddParticipantModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<ParticipantRole | ''>('');
    const [lastName, setLastName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email || !role) {
            setError('Please fill in all fields');
            return;
        }
        setIsLoading(true);
        try {
            // Try to find existing user
            const user = await userService.findByEmail(email);

            console.log('user', user);

            const payload: AddParticipantPayload = {
                id: uuidv4(),
                userId: user?.id || uuidv4(),
                lastName: lastName,
                firstName: firstName,
                email: email,
                role: role as ParticipantRole,
                permissions: DEFAULT_PERMISSIONS[role as ParticipantRole] || []
            };

            onSubmit(payload);
            onOpenChange(false);
            resetForm();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to add participant');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setRole('');
        setError('');
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Add Participant</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter the participant's information and role
                    </AlertDialogDescription>
                </AlertDialogHeader>


                <div className="space-y-4 py-4">

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name</label>
                        <Input
                            type="text"
                            className="h-12 bg-white/50 focus:bg-white transition-colors duration-300"
                            placeholder="Enter Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">First Name</label>
                        <Input
                            type="text"
                            className="h-12 bg-white/50 focus:bg-white transition-colors duration-300"
                            placeholder="Enter First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            className="h-12 bg-white/50 focus:bg-white transition-colors duration-300"
                            placeholder="participant@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <Select value={role} onValueChange={(value) => setRole(value as ParticipantRole)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(ParticipantRole).map((roleOption) => (
                                    <SelectItem key={roleOption} value={roleOption}>
                                        {roleOption.replace('_', ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={resetForm}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Adding...' : 'Add Participant'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}