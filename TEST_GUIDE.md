# Test the Improved FigVibe Plugin

## Quick Test Guide

### 1. Build the Plugin

```bash
npm run build
```

### 2. Load in Figma

1. Open Figma Desktop
2. Go to Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file
4. Run the plugin

### 3. Test Cases

#### Simple Component Test

Create a simple frame with:

- Auto-layout (vertical)
- Padding: 20px
- Gap: 16px
- Add a text element "Hello World"
- Add a button with background color

Expected Output (React):

```jsx
import React from 'react';
import styles from './SimpleComponent.module.css';

interface SimpleComponentProps {
  className?: string;
}

export const SimpleComponent: React.FC<SimpleComponentProps> = ({ className }) => {
  return (
    <div className={styles.simple_component_1}>
      <h2 className={styles.hello_world_2}>Hello World</h2>
      <button className={styles.button_3}>Click Me</button>
    </div>
  );
};

export default SimpleComponent;
```

#### Complex Component Test

Create a card with:

- Frame with shadow and rounded corners
- Auto-layout with multiple nested frames
- Mix of text sizes (headings, paragraphs)
- Images and icons
- 100+ child elements

Expected: Should process without errors and generate clean code

#### Edge Cases to Test

1. **Deep Nesting**: Create 20+ nested frames
2. **Many Children**: Frame with 500+ elements
3. **Mixed Layouts**: Combine auto-layout and absolute positioning
4. **Special Characters**: Use emojis and special chars in names

### 4. What to Look For

✅ **Good Signs:**

- Clean, readable code output
- CSS modules with meaningful class names
- Proper flexbox for auto-layout
- Semantic HTML tags
- No inline styles (except for dynamic values)
- Responsive units (rem for fonts/spacing)

❌ **Issues Fixed:**

- No more absolute positioning everywhere
- No more inline style objects
- Handles complex elements without crashing
- Clear error messages when limits exceeded

### 5. Performance Metrics

- Simple components: < 50ms
- Medium complexity: < 200ms
- Complex (1000+ nodes): < 2 seconds

### 6. Error Messages

When selecting unsupported or too complex elements, you should see:

- "Element too complex" with specific guidance
- "Element has too many nested layers"
- "Processing timeout" for extremely large selections

## Troubleshooting

### Plugin won't load

```bash
# Clean install
rm -rf node_modules
npm install
npm run build
```

### TypeScript errors

```bash
npm run typecheck
```

### View console logs

1. In Figma: Plugins → Development → Open Console
2. Check for error messages and processing times
