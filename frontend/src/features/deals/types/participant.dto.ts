import { ParticipantRole } from "./deal.types";

export interface ParticipantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface DealParticipant {
  id: string;
  userId: string;
  role: ParticipantRole;
  permissions: string[];
  dateAdded: string;
  status: 'active' | 'inactive';
  metadata?: {
    title?: string;
    company?: string;
    license?: string;
    notes?: string;
    [key: string]: any;
  };
  user?: ParticipantUser;
}

export interface AddParticipantPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userId: string;
  role: ParticipantRole;
  permissions: string[];
  metadata?: {
    title?: string;
    company?: string;
    license?: string;
    notes?: string;
    [key: string]: any;
  };
}

export interface UpdateParticipantPayload {
  role?: ParticipantRole;
  permissions?: string[];
  metadata?: {
    title?: string;
    company?: string;
    license?: string;
    notes?: string;
    [key: string]: any;
  };
}

export interface ParticipantsProps {
  participants: DealParticipant[];
  onAddParticipant?: (data: AddParticipantPayload) => Promise<void>;
  onRemoveParticipant?: (id: string) => Promise<void>;
  onUpdateParticipant?: (id: string, data: UpdateParticipantPayload) => Promise<void>;
  className?: string;
  canManage?: boolean;
}
