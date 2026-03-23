export interface Sender {
  name: string
  email: string
  avatar: string
}

export interface Recipient {
  name: string
  email: string
}

export interface Attachment {
  name: string
  size: string
  url?: string
}

export interface Email {
  id: string
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'starred'
  sender: Sender
  recipients: Recipient[]
  subject: string
  body: string
  preview: string
  timestamp: string
  starred: boolean
  read: boolean
  attachments: Attachment[]
}
