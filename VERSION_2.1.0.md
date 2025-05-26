# FigVibe v2.1.0 - Clean Code Edition

## Version Information

- **Version**: v2.1.0-clean-code
- **Date**: May 23, 2025
- **Git Commit**: 213766c

## Major Improvements in This Version

### 1. Clean Code Generation

- React components with CSS modules
- Semantic HTML5 structure
- Flexbox-based layouts
- Responsive units (rem)
- No more inline styles

### 2. Enhanced Stability

- Supports up to 1000 children per node
- Recursion depth increased to 100
- Better error handling
- Clear user feedback

### 3. Better Developer Experience

- Meaningful class names
- Proper separation of concerns
- Production-ready code output
- Type-safe implementation

## Rollback Instructions

To rollback to this version:

```bash
git checkout 213766c
```

Or if you've tagged it:

```bash
git checkout v2.1.0-clean-code
```

## Files Changed from v2.0.0

- `src/core/normalise.ts` - Increased processing limits
- `src/serializers/react.ts` - Complete rewrite for clean code
- `src/serializers/html.ts` - Semantic HTML implementation
- `src/plugin/controller.ts` - Enhanced error handling
- `src/serializers/utils.ts` - Added formatters for CSS/HTML

## Known Limitations

- Prettier integration is basic (manual formatting)
- Tailwind support is stubbed but not implemented
- Maximum 1000 children per node
- Large files (>50MB) may cause performance issues

## Testing

See TEST_GUIDE.md for comprehensive testing instructions.
