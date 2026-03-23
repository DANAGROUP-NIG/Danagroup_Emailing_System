/**
 * Email folder constants
 */
export const EMAIL_FOLDERS = {
  INBOX: 'inbox',
  SENT: 'sent',
  DRAFTS: 'drafts',
  TRASH: 'trash',
  STARRED: 'starred',
} as const

/**
 * Label colors
 */
export const LABEL_COLORS = {
  IMPORTANT: '#ef4444',
  WORK: '#3b82f6',
  PERSONAL: '#10b981',
} as const

/**
 * Email pagination
 */
export const EMAIL_PAGINATION = {
  PAGE_SIZE: 20,
  INITIAL_PAGE: 1,
} as const

/**
 * Email character limits
 */
export const EMAIL_LIMITS = {
  SUBJECT_MAX: 255,
  BODY_MAX: 100000,
  PREVIEW_LENGTH: 100,
  MAX_RECIPIENTS: 100,
  MAX_ATTACHMENTS: 10,
  MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
} as const

/**
 * UI constants
 */
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: '16rem', // 256px
  MAIL_LIST_WIDTH: '24rem', // 384px
  ANIMATION_DURATION: 300,
} as const

/**
 * Regular expressions
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]+$/,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
} as const

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  COMPOSE: 'c',
  SEARCH: '/',
  ARCHIVE: 'e',
  DELETE: '#',
  REPLY: 'r',
  FORWARD: 'f',
  STAR: 's',
} as const

/**
 * Toast messages
 */
export const TOAST_MESSAGES = {
  EMAIL_SENT: 'Email sent successfully',
  EMAIL_DELETED: 'Email deleted',
  EMAIL_ARCHIVED: 'Email archived',
  EMAIL_STARRED: 'Email starred',
  EMAIL_UNSTARRED: 'Star removed',
  ERROR_GENERIC: 'Something went wrong. Please try again.',
  ERROR_INVALID_EMAIL: 'Please enter a valid email address',
  ERROR_REQUIRED_FIELD: 'This field is required',
} as const

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  GET_EMAILS: '/api/emails',
  CREATE_EMAIL: '/api/emails',
  UPDATE_EMAIL: (id: string) => `/api/emails/${id}`,
  DELETE_EMAIL: (id: string) => `/api/emails/${id}`,
  GET_ADMIN_STATS: '/api/admin/stats',
  GET_USERS: '/api/admin/users',
  UPDATE_SETTINGS: '/api/settings',
} as const

/**
 * Time formats
 */
export const TIME_FORMATS = {
  DATE: 'MMM d, yyyy',
  DATE_TIME: 'MMM d, yyyy h:mm a',
  TIME: 'h:mm a',
  RELATIVE: 'relative',
} as const
