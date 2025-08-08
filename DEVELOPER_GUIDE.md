# Predixia Developer Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ LTS
- Rust 1.70+
- Git

### Installation
```bash
# Clone repository
git clone <repository-url>
cd predixia

# Install dependencies
npm install

# Start development
npm run dev
```

## 🏗️ Project Structure

### Frontend Architecture
```
src/
├── components/           # Reusable React components
│   ├── alerts/          # Alert management UI
│   ├── cards/           # Status display cards
│   ├── charts/          # Data visualization
│   ├── dashboard/       # Main dashboard
│   └── layout/          # Layout components
├── store/               # State management
├── types/               # TypeScript definitions
├── theme/               # UI theming
└── styles/              # CSS styling
```

### Backend Architecture
```
src-tauri/
├── src/
│   └── main.rs          # Tauri app entry
├── Cargo.toml           # Rust dependencies
└── tauri.conf.json      # App configuration
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run tauri            # Launch Tauri app

# Building
npm run build            # Build frontend
npm run tauri build      # Build desktop app

# Quality
npm run lint             # Run ESLint
npm run typecheck        # TypeScript check
```

## 🎨 Component Development

### Creating Components
```typescript
// components/example/ExampleComponent.tsx
import React from 'react';
import { Card } from 'antd';

interface ExampleProps {
  title: string;
  data: any[];
}

export const ExampleComponent: React.FC<ExampleProps> = ({
  title,
  data
}) => {
  return (
    <Card title={title}>
      {/* Component content */}
    </Card>
  );
};
```

### State Management
```typescript
// store/exampleStore.ts
import { create } from 'zustand';

interface ExampleState {
  data: any[];
  loading: boolean;
  setData: (data: any[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  data: [],
  loading: false,
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
}));
```

## 📊 Chart Integration

### Using ECharts
```typescript
import ReactECharts from 'echarts-for-react';

const ChartComponent = ({ data }) => {
  const option = {
    xAxis: {
      type: 'time'
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: data,
      type: 'line'
    }]
  };

  return <ReactECharts option={option} />;
};
```

## 🎯 Best Practices

### TypeScript
- Use strict mode
- Define interfaces for all props
- Avoid `any` type
- Use utility types when appropriate

### React
- Use functional components with hooks
- Implement proper error boundaries
- Optimize with React.memo when needed
- Use consistent naming conventions

### Performance
- Lazy load components where appropriate
- Implement virtualization for large lists
- Use React Query for data caching
- Monitor bundle size

## 🧪 Testing Guidelines

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { ExampleComponent } from './ExampleComponent';

test('renders component correctly', () => {
  render(<ExampleComponent title="Test" data={[]} />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### Store Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useExampleStore } from './exampleStore';

test('updates data correctly', () => {
  const { result } = renderHook(() => useExampleStore());
  
  act(() => {
    result.current.setData([1, 2, 3]);
  });
  
  expect(result.current.data).toEqual([1, 2, 3]);
});
```

## 🚀 Deployment

### Development Build
```bash
npm run tauri build
```

### Production Optimization
- Enable tree shaking
- Minimize bundle size
- Optimize assets
- Configure caching

## 🔍 Debugging

### Frontend Debugging
- Use React Developer Tools
- Browser DevTools Console
- Network tab for API calls
- Performance profiler

### Tauri Debugging
- Console logs in main.rs
- Tauri DevTools
- Error handling in commands
- IPC communication debugging

## 📚 Resources

### Documentation
- [PROJECT_INDEX.md](./PROJECT_INDEX.md) - Project overview
- [docs/planning/](./docs/planning/) - Technical specs

### External Resources
- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [Ant Design](https://ant.design/)
- [Zustand](https://github.com/pmndrs/zustand)

---

*For detailed architecture and requirements, see PROJECT_INDEX.md*