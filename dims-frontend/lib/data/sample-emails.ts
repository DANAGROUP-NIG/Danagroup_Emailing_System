import { Email } from '@/lib/types/email'

export const SAMPLE_EMAILS: Email[] = [
  {
    id: '1',
    folder: 'inbox',
    sender: {
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    },
    recipients: [{ name: 'You', email: 'john@email.com' }],
    subject: 'Project update: Q1 roadmap',
    body: `Hi John,

I wanted to follow up on the Q1 roadmap we discussed. Here are the key highlights:

1. Design system overhaul (Weeks 1-3)
2. API optimization (Weeks 2-4)
3. Mobile app launch (Weeks 3-5)

Please review and let me know your thoughts by EOD Friday.

Best regards,
Sarah`,
    preview: 'Project update: Q1 roadmap - I wanted to follow up on the Q1...',
    timestamp: '2024-03-17T14:45:00Z',
    starred: false,
    read: false,
    attachments: [],
  },
  {
    id: '2',
    folder: 'inbox',
    sender: {
      name: 'James Wilson',
      email: 'james.wilson@company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
    },
    recipients: [{ name: 'You', email: 'john@email.com' }],
    subject: 'Meeting notes from Monday\'s standup',
    body: `Hi Team,

Attached are the notes from Monday's standup. Key action items:

1. James to follow up on API integration
2. Sarah to prepare Q1 presentation
3. Team to review the new design system

Please let me know if you have any questions!

Best,
James`,
    preview: 'Meeting notes from Monday\'s standup - Attached are the notes from...',
    timestamp: '2024-03-17T13:20:00Z',
    starred: true,
    read: false,
    attachments: [
      { name: 'Meeting_Notes.pdf', size: '245 KB' },
      { name: 'Action_Items.xlsx', size: '512 KB' },
    ],
  },
  {
    id: '3',
    folder: 'inbox',
    sender: {
      name: 'Emily Johnson',
      email: 'emily.johnson@company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    },
    recipients: [{ name: 'You', email: 'john@email.com' }],
    subject: 'Feedback on the design system',
    body: `Hi John,

I've reviewed the design system and have some feedback:

Strengths:
- Clear color palette
- Consistent spacing
- Good component documentation

Areas for improvement:
- More accessibility guidelines needed
- Typography hierarchy could be clearer
- Some components need dark mode support

Let's schedule a meeting to discuss!

Best,
Emily`,
    preview: 'Feedback on the design system - I\'ve reviewed the design system...',
    timestamp: '2024-03-17T12:10:00Z',
    starred: false,
    read: true,
    attachments: [],
  },
  {
    id: '4',
    folder: 'inbox',
    sender: {
      name: 'Michael Brown',
      email: 'michael.brown@company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
    },
    recipients: [{ name: 'You', email: 'john@email.com' }],
    subject: 'Client request: urgent site performance optimization',
    body: `Hi John,

We have a client request for urgent performance optimization. The site is currently loading in 4.5 seconds on mobile.

Target: Under 2 seconds

Priority actions:
1. Image optimization
2. Code splitting
3. Caching strategy

Can you start working on this today?

Thanks,
Michael`,
    preview: 'Client request: urgent site performance... - We have a client request...',
    timestamp: '2024-03-17T11:00:00Z',
    starred: false,
    read: false,
    attachments: [
      { name: 'Performance_Report.pdf', size: '1.2 MB' },
    ],
  },
  {
    id: '5',
    folder: 'inbox',
    sender: {
      name: 'Laura Thompson',
      email: 'laura.thompson@company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laura',
    },
    recipients: [{ name: 'You', email: 'john@email.com' }],
    subject: 'Re: Budget approval for new tools',
    body: `Hi John,

Following up on the budget request for new development tools. I've reviewed the proposal and it looks great.

Approved items:
- IDE upgrade ($500)
- Project management tool ($1000/year)
- Performance monitoring ($2000/year)

The total budget is approved. Please proceed with procurement.

Best,
Laura`,
    preview: 'Re: Budget approval for new tools - Following up on the budget...',
    timestamp: '2024-03-17T09:30:00Z',
    starred: false,
    read: true,
    attachments: [],
  },
  {
    id: '6',
    folder: 'sent',
    sender: {
      name: 'You',
      email: 'john@email.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    },
    recipients: [{ name: 'Sarah Mitchell', email: 'sarah.mitchell@company.com' }],
    subject: '[Sent] Re: Q1 Planning Session',
    body: `Hi Sarah,

Thanks for setting up the planning session. I've reviewed the agenda and it looks comprehensive.

I'll be there on time tomorrow at 2 PM. See you then!

Best,
John`,
    preview: '[Sent] Re: Q1 Planning Session - Thanks for setting up...',
    timestamp: '2024-03-16T16:45:00Z',
    starred: false,
    read: true,
    attachments: [],
  },
  {
    id: '7',
    folder: 'drafts',
    sender: {
      name: 'You',
      email: 'john@email.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    },
    recipients: [{ name: 'Team', email: 'team@company.com' }],
    subject: 'Draft: Weekly Update',
    body: `Hi Team,

This week I completed:
- Feature X implementation
- Bug fixes for reported issues
- Documentation updates

Next week I'll focus on:
- Performance optimization
- New feature development
- Code review for PR #123

Please let me know if you need anything else.`,
    preview: 'Draft: Weekly Update - This week I completed...',
    timestamp: '2024-03-17T10:00:00Z',
    starred: false,
    read: true,
    attachments: [],
  },
]
