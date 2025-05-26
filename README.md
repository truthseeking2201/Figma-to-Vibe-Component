# FigVibe - Universal Export Plugin (v2.2.0)

<p align="center">
  <strong>FigVibe transforms any Figma design into production-ready code for 7+ frameworks and platforms</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-supported-formats">Formats</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-development">Development</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🚀 Features

- **🎯 Pixel-Perfect Conversion**: Preserves shadows, gradients, corner radius, auto-layout, typography, and all design properties
- **🔄 Multi-Format Export**: HTML/CSS, React, React Native, Flutter, SwiftUI, Vue 3, and JSON with a single click
- **⚡ Real-Time Generation**: See generated code instantly as you select layers (< 150ms)
- **🎨 Professional UI**: Modern interface with syntax highlighting, file tabs, and customizable options
- **📦 Smart Export**: Download single files or ZIP archives with multiple files
- **🔧 Extensible Architecture**: Add new export formats in under 30 minutes
- **💯 Type-Safe**: Built with strict TypeScript for reliability and maintainability
- **🎛️ Customizable Options**: Inline CSS, Tailwind classes, component names, null safety, and more

## 🎯 Supported Export Formats

| Format           | Output Files              | Description                    | Use Case                                |
| ---------------- | ------------------------- | ------------------------------ | --------------------------------------- |
| **JSON**         | `*.json`                  | Raw Figma IR data              | Debugging, analysis, custom processing  |
| **HTML/CSS**     | `index.html`, `style.css` | Static web pages               | Landing pages, prototypes, static sites |
| **React**        | `Component.tsx`           | React 18 functional components | Modern web applications                 |
| **React Native** | `Component.tsx`           | StyleSheet-based components    | iOS and Android mobile apps             |
| **Flutter**      | `widget.dart`             | Material Design widgets        | Cross-platform mobile apps              |
| **SwiftUI**      | `View.swift`              | Native iOS/macOS views         | Apple ecosystem apps                    |
| **Vue 3**        | `Component.vue`           | Single file components         | Vue.js applications                     |

## 📊 Property Support Matrix

| Property                 | HTML/CSS           | React              | React Native          | Flutter          | SwiftUI           | Vue 3              |
| ------------------------ | ------------------ | ------------------ | --------------------- | ---------------- | ----------------- | ------------------ |
| **Layout (Auto-layout)** | ✅ Flexbox         | ✅ Flexbox         | ✅ Flex               | ✅ Row/Column    | ✅ HStack/VStack  | ✅ Flexbox         |
| **Colors & Gradients**   | ✅ CSS gradients   | ✅ Inline styles   | ✅ Colors             | ✅ BoxDecoration | ✅ LinearGradient | ✅ CSS gradients   |
| **Shadows & Effects**    | ✅ box-shadow      | ✅ boxShadow       | ✅ elevation + shadow | ✅ BoxShadow     | ✅ .shadow()      | ✅ box-shadow      |
| **Typography**           | ✅ Font properties | ✅ Font properties | ✅ Text styles        | ✅ TextStyle     | ✅ Font modifiers | ✅ Font properties |
| **Border Radius**        | ✅ border-radius   | ✅ borderRadius    | ✅ borderRadius       | ✅ BorderRadius  | ✅ cornerRadius   | ✅ border-radius   |
| **Borders & Strokes**    | ✅ border          | ✅ border          | ✅ borderWidth/Color  | ✅ Border        | ✅ stroke/overlay | ✅ border          |
| **Transforms**           | ✅ rotate()        | ✅ transform       | ✅ transform          | ✅ Transform     | ✅ rotationEffect | ✅ transform       |
| **Opacity**              | ✅ opacity         | ✅ opacity         | ✅ opacity            | ✅ Opacity       | ✅ .opacity()     | ✅ opacity         |

## 📦 Installation

### Option 1: Figma Community (Recommended)

Install directly from the [Figma Community Plugin Store](https://www.figma.com/community/plugin/1434599500152464568/figvibe)

### Option 2: Development Installation

1. **Download or clone** this repository
2. **Open Figma Desktop** and navigate to `Plugins` → `Development` → `Import plugin from manifest...`
3. **Select** the `manifest.json` file from the project directory
4. **Start using** the plugin from your plugins panel

## 🎨 Usage

### Basic Workflow

1. **Select layers** in Figma (frames, groups, components, or multiple selections)
2. **Open the plugin** from the plugins menu
3. **Choose export format** from the dropdown (React, HTML, Flutter, etc.)
4. **Configure options** like component name, inline CSS, platform settings
5. **Copy or download** the generated code
6. **Paste into your project** - the code is production-ready!

### Advanced Features

#### Multiple Selection Support

- Select multiple layers to create a virtual group
- Maintains relative positioning and hierarchy
- Exports as a single component containing all elements

#### Customization Options

- **Component Name**: Override auto-generated names
- **Inline CSS**: Choose between inline styles or separate CSS files
- **Tailwind Support**: Generate Tailwind utility classes (HTML/React)
- **Platform Settings**: iOS compatibility, null safety, etc.

#### File Management

- **Single files**: Direct copy to clipboard
- **Multiple files**: Download as ZIP archive
- **File tabs**: Switch between generated files in multi-file exports

### Code Examples

#### React Component Output

```tsx
import React from "react";

interface MyComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  className,
  style,
  ...props
}) => {
  return (
    <div className={className} style={style} {...props}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 320,
          height: 240,
          background: "linear-gradient(90deg, #ff6b6b 0%, #4ecdc4 100%)",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        <p
          style={{
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 18,
            color: "#ffffff",
          }}
        >
          Hello World
        </p>
      </div>
    </div>
  );
};

export default MyComponent;
```

#### Flutter Widget Output

```dart
import 'package:flutter/material.dart';

class MyWidget extends StatelessWidget {
  const MyWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 320,
      height: 240,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFFF6B6B), Color(0xFF4ECDC4)],
          stops: [0.0, 1.0],
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Color.fromARGB(38, 0, 0, 0),
            offset: Offset(0, 4),
            blurRadius: 12
          )
        ]
      ),
      child: Text(
        'Hello World',
        style: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
          fontSize: 18,
          color: Color(0xFFFFFFFF)
        ),
      ),
    );
  }
}
```

## 🛠️ Development

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Figma Desktop** application

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd figvibe

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Format code
npm run prettier
```

### Project Structure

```
src/
├── core/                   # Core architecture
│   ├── figma-ir.ts        # Intermediate representation types
│   └── normalise.ts       # Figma API → IR conversion
├── serializers/            # Export format implementations
│   ├── types.ts           # Serializer interfaces
│   ├── utils.ts           # Shared utilities
│   ├── json.ts            # JSON export
│   ├── html.ts            # HTML/CSS export
│   ├── react.ts           # React export
│   ├── react-native.ts    # React Native export
│   ├── flutter.ts         # Flutter export
│   ├── swiftui.ts         # SwiftUI export
│   ├── vue.ts             # Vue 3 export
│   └── index.ts           # Auto-registration
├── plugin/                 # Figma plugin logic
│   └── controller.ts      # Main plugin controller
└── app/                    # React UI
    ├── components/
    │   └── App.tsx          # Main UI component
    ├── styles.css           # UI styles
    └── index.tsx            # React app entry
```

### Build System

- **TypeScript 5.0**: Strict mode with enhanced type checking
- **Webpack 5**: Module bundling with CSS processing
- **ESLint**: Code quality with React and TypeScript rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality gates

## 🔧 Adding New Export Formats

The plugin architecture makes it easy to add new export formats. Here's how to add a new serializer in under 30 minutes:

### Step 1: Create Serializer File

Create `src/serializers/angular.ts`:

```typescript
import type { Serializer, GeneratedFile, GenCtx } from "./types";
import { register } from "./types";
import type { FigmaIRNode } from "../core/figma-ir";

const angularSerializer: Serializer = {
  id: "angular",
  label: "Angular",
  description: "Angular components with TypeScript",
  supportedOptions: ["componentName", "inlineCss"],

  async generate(
    ir: FigmaIRNode,
    ctx: GenCtx,
  ): Promise<readonly GeneratedFile[]> {
    const componentName = ctx.options.componentName || "MyComponent";

    // Generate Angular component code
    const code = `
import { Component } from '@angular/core';

@Component({
  selector: 'app-${componentName.toLowerCase()}',
  template: \`
    <div class="${componentName.toLowerCase()}">
      <!-- Generated content -->
    </div>
  \`,
  styles: [\`
    .${componentName.toLowerCase()} {
      /* Generated styles */
    }
  \`]
})
export class ${componentName}Component {
  // Component logic
}`;

    return [
      {
        filename: `${componentName.toLowerCase()}.component.ts`,
        code: code.trim(),
        language: "ts",
      },
    ];
  },
};

register(angularSerializer);
```

### Step 2: Register Serializer

Add to `src/serializers/index.ts`:

```typescript
import "./angular";
```

### Step 3: Build and Test

```bash
npm run build
```

The new format will automatically appear in the UI dropdown!

## 📋 Quality Assurance

### Testing Strategy

- **Unit Tests**: Vitest for normalizer and utility functions
- **Snapshot Tests**: Generated code output validation
- **Type Checking**: Strict TypeScript compilation
- **Linting**: ESLint with functional programming rules
- **Visual Testing**: Manual verification of generated code

### Performance Benchmarks

- **Generation Time**: < 150ms for 1000+ nodes
- **Memory Usage**: < 50MB for complex designs
- **Bundle Size**: < 50KB plugin code, < 1MB UI
- **Real-time Updates**: Live code generation as you select

### Build Quality Gates

- ✅ TypeScript strict mode compilation
- ✅ ESLint with zero errors and warnings
- ✅ Prettier formatting validation
- ✅ Pre-commit hooks with Husky
- ✅ Bundle size optimization

## 🎯 Use Cases

### For Designers

- **Rapid Prototyping**: Convert mockups to working code instantly
- **Design Handoff**: No more redlining or spec documents
- **Cross-Platform**: Same design works on web, mobile, and desktop
- **Pixel Perfect**: Maintains exact spacing, colors, and effects

### For Developers

- **Faster Development**: Skip manual CSS/styling work
- **Consistent Output**: Standardized, clean code across projects
- **Type Safety**: TypeScript interfaces and proper typing
- **Best Practices**: Framework-specific patterns and conventions

### For Teams

- **Design System**: Maintain consistency across platforms
- **Reduced Errors**: Eliminate manual translation mistakes
- **Faster Iteration**: Design → Code → Deploy acceleration
- **Documentation**: Generated code serves as living documentation

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch
4. **Make** your changes
5. **Test** thoroughly
6. **Submit** a pull request

### Contribution Guidelines

- Follow the existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure all quality gates pass (`npm run lint && npm run typecheck`)
- Use conventional commit messages

### Areas for Contribution

- **New serializers**: Additional export formats (Angular, Svelte, etc.)
- **Enhanced property support**: More Figma features
- **Performance optimizations**: Faster generation times
- **UI improvements**: Better user experience
- **Testing**: Comprehensive test coverage
- **Documentation**: Examples and tutorials

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Figma Team**: For the excellent plugin API and design tools
- **Open Source Community**: For the amazing libraries that power this plugin
- **Contributors**: Everyone who helps make this project better

## 📞 Support & Community

- **Issues**: [Report bugs and request features](https://github.com/your-username/figvibe/issues)
- **Discussions**: [Join the community discussion](https://github.com/your-username/figvibe/discussions)
- **Documentation**: Comprehensive guides in the `/docs` folder
- **Examples**: Real-world usage examples and tutorials

---

<p align="center">
  <strong>Transform your designs into production-ready code in seconds</strong><br>
  Whether you're building for web, mobile, or desktop, this plugin ensures pixel-perfect conversion with clean, maintainable code that follows each platform's best practices.
</p>

<p align="center">
  Made with ❤️ by the open source community
</p>
