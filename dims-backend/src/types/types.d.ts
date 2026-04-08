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
  department?: string;
  subsidiary?: string;
  department_id?: string;
  subsidiary_id?: string;
  isActive: boolean;
  avatarUrl: string;
  createdAt: Date;
}