# FigVibe UI Preview

## Light Theme

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ FigVibe  [v2.2.0]                                        ☀️   │
├─────────────────────────────────────┬───────────────────────────┤
│                                     │                           │
│  Export Format                      │  // MyComponent.tsx       │
│  ┌─────────────────────────────┐   │                           │
│  │ React ▼                      │   │  import React from 'react'│
│  └─────────────────────────────┘   │  import styles from       │
│                                     │    './MyComponent.module. │
│  Component Name                     │    css';                  │
│  ┌─────────────────────────────┐   │                           │
│  │ MyComponent                  │   │  interface MyComponentPr  │
│  └─────────────────────────────┘   │  ops {                    │
│                                     │    className?: string;    │
│  Options                            │  }                        │
│                                     │                           │
│  ⚬ Inline CSS                      │  export const MyComponent │
│    Include styles directly          │  : React.FC<MyComponentP │
│                                     │  rops> = ({ className })  │
│  ⚬ Use Tailwind CSS                │   => {                    │
│    Generate utility classes         │    return (               │
│                                     │      <div className={styl │
│  ┌─────────────────────────────┐   │      es.container}>       │
│  │ 📋 Selection Info           │   │        <h1 className={sty │
│  │                             │   │        les.title}>        │
│  │ Name:      Card Component  │   │          Hello World      │
│  │ Type:      frame           │   │        </h1>              │
│  │ Size:      320 × 240       │   │      </div>               │
│  │ Children:  12              │   │    );                     │
│  │ Complexity: Normal ✓       │   │  };                       │
│  └─────────────────────────────┘   │                           │
│                                     │  export default MyCompone │
│  ┌─────────────────────────────┐   │  nt;                      │
│  │    Generate Code            │   │                           │
│  └─────────────────────────────┘   │  [Copy] [Download] [⛶]    │
│                                     │                           │
└─────────────────────────────────────┴───────────────────────────┘
```

## Dark Theme

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ FigVibe  [v2.2.0]                                        🌙   │
├─────────────────────────────────────┬───────────────────────────┤
│                                     │                           │
│  Export Format                      │  // MyComponent.tsx       │
│  ┌─────────────────────────────┐   │                           │
│  │ React ▼                      │   │  import React from 'react'│
│  └─────────────────────────────┘   │  import styles from       │
│                                     │    './MyComponent.module. │
│  Component Name                     │    css';                  │
│  ┌─────────────────────────────┐   │                           │
│  │ MyComponent                  │   │  interface MyComponentPr  │
│  └─────────────────────────────┘   │  ops {                    │
│                                     │    className?: string;    │
│  Options                            │  }                        │
│                                     │                           │
│  ● Inline CSS                      │  export const MyComponent │
│    Include styles directly          │  : React.FC<MyComponentP │
│                                     │  rops> = ({ className })  │
│  ○ Use Tailwind CSS                │   => {                    │
│    Generate utility classes         │    return (               │
│                                     │      <div className={styl │
│  ┌─────────────────────────────┐   │      es.container}>       │
│  │ 📋 Selection Info           │   │        <h1 className={sty │
│  │                             │   │        les.title}>        │
│  │ Name:      Card Component  │   │          Hello World      │
│  │ Type:      frame           │   │        </h1>              │
│  │ Size:      320 × 240       │   │      </div>               │
│  │ Children:  12              │   │    );                     │
│  │ Complexity: Normal ✓       │   │  };                       │
│  └─────────────────────────────┘   │                           │
│                                     │  export default MyCompone │
│  ┌─────────────────────────────┐   │  nt;                      │
│  │    Generate Code            │   │                           │
│  └─────────────────────────────┘   │  [Copy] [Download] [⛶]    │
│                                     │                           │
└─────────────────────────────────────┴───────────────────────────┘
```

## Key Design Elements

### Colors

- **Light Theme**

  - Background: Clean white (#FFFFFF)
  - Surface: Subtle gray (#FAFAFA)
  - Brand: Vibrant purple (#8B5CF6)
  - Text: Dark gray (#1C1C1E)

- **Dark Theme**
  - Background: True black (#111111)
  - Surface: Dark gray (#1C1C1E)
  - Brand: Light purple (#A78BFA)
  - Text: Light gray (#F5F5F7)

### Typography

- **Headers**: SF Pro Display, 18px, Semibold
- **Body**: SF Pro Text, 14px, Regular
- **Code**: SF Mono, 13px, Regular

### Components

- **Buttons**: Rounded corners (8px), smooth hover transitions
- **Inputs**: Clean borders, focus ring animation
- **Cards**: Subtle shadows, hover lift effect
- **Switches**: iOS-style toggle with smooth animation
- **Badges**: Small, rounded pills for status

### Layout

- **Sidebar**: 320px fixed width
- **Header**: 56px height with logo and theme toggle
- **Code Editor**: Monaco editor with syntax highlighting
- **Spacing**: 8px grid system

### Interactions

- **Hover states**: All interactive elements
- **Focus rings**: Accessibility-friendly
- **Transitions**: 200ms ease-out
- **Loading states**: Animated spinner
- **Theme toggle**: Smooth color transition
