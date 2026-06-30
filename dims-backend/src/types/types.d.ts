export interface MessageSearchBody {
  id: string;
  subject: string;
  body: string;
  senderId: string;
  recipientIds: string[];
  sentAt: Date;
}

export interface UserSearchBody {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  jobTitle?: string;
  department?: string;
  subsidiary?: string;
  departmentId?: string;
  subsidiaryId?: string;
  isActive: boolean;
  avatarUrl: string;
  createdAt: Date;
}
