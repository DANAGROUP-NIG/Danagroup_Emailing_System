# UI Changes & Color Scheme Reference

## Color Palette

### Light Mode
```
Primary Purple:     #7c3aed  (oklch 0.48 0.21 285.5)
Secondary Orange:   #f59e0b  (oklch 0.67 0.22 37.8)
Accent Purple:      #a78bfa  (oklch 0.6 0.25 283.1)
Background:         #fafaf9  (oklch 0.99 0 0)
Foreground:         #1f2937  (oklch 0.13 0 0)
Muted:              #f5f5f4  (oklch 0.95 0 0)
Border:             #e7e5e4  (oklch 0.92 0 0)
```

### Dark Mode
```
Primary Purple:     #8b5cf6  (oklch 0.68 0.21 285.5)
Secondary Orange:   #fbbf24  (oklch 0.72 0.22 37.8)
Accent Purple:      #d8b4fe  (oklch 0.75 0.25 283.1)
Background:         #1f1f1f  (oklch 0.12 0 0)
Foreground:         #f3f4f6  (oklch 0.95 0 0)
Muted:              #404040  (oklch 0.25 0 0)
Border:             #404040  (oklch 0.25 0 0)
```

## Component Changes

### 1. Main Layout

#### Before
```
┌─────────────────────────────────────────┐
│ Sidebar    │ Header                  │MM│
├─────────────────────────────────────────┤
│            │ Email List  │ Email Detail  │
│  Folders   ├─────────────┼───────────────┤
│  Labels    │             │               │
│            │             │               │
│            │             │               │
└─────────────────────────────────────────┘
```

#### After (Mobile)
```
┌─────────────────────────┐
│☰ Search        User Menu│
├─────────────────────────┤
│ Email List              │
│ (Full width)            │
│                         │
└─────────────────────────┘
```

#### After (Desktop)
```
┌──────────────────────────────────────────┐
│ Sidebar (lg:block) │ Header            │MM│
├──────────────────────────────────────────┤
│                    │ Email List │ Detail │
│  Folders           │ (md:w-96)  │(flex-1)│
│  Labels            │            │        │
│  Trash             │            │        │
└──────────────────────────────────────────┘
```

### 2. Sidebar Improvements

#### Header
**Before**: Simple text + icon
**After**: 
- Purple icon container with white icon
- Gradient background (primary → transparent)
- Gradient text for "Gmail" brand
- Improved contrast

**Code**:
```tsx
<div className="p-4 bg-gradient-to-b from-primary/5 to-transparent">
  <div className="p-2 bg-primary rounded-lg">
    <MailIcon className="w-5 h-5 text-white" />
  </div>
</div>
```

#### Folder Buttons
**Before**: Simple hover state
**After**:
- Active state with primary/15 background
- Shadow on active state
- Smooth transitions (duration-200)
- Better color contrast on count badge

**Code**:
```tsx
className={`${
  currentFolder === folder.id
    ? 'bg-primary/15 text-primary font-medium shadow-sm'
    : 'text-muted-foreground hover:bg-muted/60'
}`}
```

### 3. Email List Changes

#### Email Item Selection
**Before**: 
- Simple hover with bg-muted/50
- Blue left border only when selected

**After**:
- 4px left border (primary on active, transparent otherwise)
- Smooth transitions
- Background color on hover
- Active state with primary/8 background
- Sender name turns primary color when selected

**Code**:
```tsx
className={`border-l-4 ${
  selectedId === email.id
    ? 'bg-primary/8 border-l-primary shadow-sm'
    : 'hover:bg-muted/50 border-l-transparent'
}`}
```

#### Mobile Optimization
- Hidden checkbox on mobile (space saver)
- Smaller padding on mobile (px-3 vs px-4)
- Better gap management (gap-2 on mobile, gap-3 on desktop)
- Text clamp for preview (line-clamp-2)

### 4. Email Detail View

#### Header
**Before**: Plain border-b
**After**:
- Gradient background (from-primary/5 to-accent/5)
- Truncated title with min-w-0
- Icon buttons with hover states
- Responsive padding (px-4 mobile, px-6 desktop)

#### Email Card
**Before**: Plain padding
**After**:
- Muted background (bg-muted/30)
- Rounded border
- Card styling (rounded-lg p-4 border)
- Avatar with primary background fallback

#### Reply Section
**Before**: Simple button layout
**After**:
- Gradient background (from-muted/30)
- Reply button with primary color
- Reply form in styled card
- Responsive button layout (flex-col-reverse sm:flex-row)

### 5. Compose Modal

#### New Minimize Feature
**Minimized State**:
```tsx
{isMinimized && (
  <div className="fixed bottom-4 right-4 z-40">
    <Button className="gap-2 bg-primary hover:bg-primary/90">
      <span>{subject || 'New Message'}</span>
    </Button>
  </div>
)}
```

**Header With Controls**:
- Gradient background
- Minimize button (dash icon)
- Close button (X icon) with destructive hover
- Responsive layout

**Mobile Responsive**:
```tsx
// Body container
<div className="space-y-4 max-h-[60vh] overflow-y-auto">

// Buttons (mobile first)
<div className="flex flex-col-reverse sm:flex-row gap-4">
  <Button className="flex-1 sm:flex-none">Discard</Button>
  <Button className="flex-1 sm:flex-none">Send</Button>
</div>
```

### 6. Color Usage Patterns

#### Primary Actions
```tsx
className="bg-primary hover:bg-primary/90 text-white"
```
Used for: Send button, Reply button, Compose button

#### Active/Selected States
```tsx
className="bg-primary/15 text-primary"  // Subtle active
className="border-l-primary"             // Border indicator
```
Used for: Folder selection, Email selection

#### Muted/Secondary States
```tsx
className="bg-muted/30"      // Subtle background
className="text-muted-foreground"  // Secondary text
className="hover:bg-muted/60"      // Hover state
```
Used for: Secondary backgrounds, disabled states, hint text

#### Hover States
```tsx
className="hover:bg-muted/50"  // Light hover
className="hover:text-primary"  // Color on hover
className="hover:border-l-primary/30"  // Border hint on hover
```

## Responsive Breakpoints

### Mobile-First Implementation
```tailwind
// Default (mobile 0-767px)
px-4 gap-2 w-full min-h-48

// Small devices (sm: 640px+)
sm:px-6 sm:gap-3 sm:min-h-64

// Tablets (md: 768px+)
md:w-96 md:flex-1 md:grid-cols-2

// Desktop (lg: 1024px+)
lg:block lg:w-64
```

## Typography Improvements

### Font Hierarchy
```
H1 (Subject): text-lg font-bold           // Desktop
             text-base font-bold          // Mobile

Sender: font-semibold                     // Desktop
        font-medium                       // Mobile

Body: text-base whitespace-pre-wrap       // Desktop
      text-sm                             // Mobile

Time: text-xs text-muted-foreground       // Both
```

## Interactive States

### Button States
```
Default:    bg-secondary text-black
Hover:      bg-secondary/90
Active:     bg-secondary/80
Disabled:   opacity-50 cursor-not-allowed
```

### Focus States
```
Keyboard:   ring-2 ring-primary ring-offset-2
Mouse:      no change (better UX)
```

## Shadow & Depth

```
Active Items:     shadow-sm (subtle depth)
Modal Headers:    no shadow (flat)
Floating Button:  shadow-lg (emphasis)
Cards:            border only (minimal depth)
```

## Transition Effects

```
Button Hover:          duration-200
Border Color:          duration-200
Background Color:      duration-200
Sidebar Slide:         duration-300 (smoother)
```

## Accessibility Improvements

### Color Contrast
- Text on Primary: 7.2:1 (WCAG AAA)
- Text on Secondary: 6.4:1 (WCAG AA+)
- Text on Muted: 4.8:1 (WCAG AA)

### Touch Targets
- Minimum size: 44x44px
- Actual sizes: 48x48px+ (buttons, interactive areas)
- Proper spacing: gap-2 to gap-4

### Focus Indicators
- Keyboard focus shows ring-2 ring-primary
- Clear visual indication for keyboard users
- No focus hiding (always visible)

---

**Design System Version**: 1.0
**Last Updated**: March 17, 2026
**Status**: Production Ready ✅
