# Predixia - Project Documentation Index

## 📋 Project Overview

**Predixia** is an AI-powered predictive maintenance software designed for semiconductor manufacturing environments. Built with Tauri, React, and TypeScript, it provides real-time monitoring, anomaly detection, and predictive analytics for industrial equipment.

### Key Features
- 🔍 Real-time equipment monitoring
- 📊 Interactive dashboard with customizable widgets  
- ⚡ Sub-millisecond response times
- 🛡️ Air-gapped deployment support
- 🤖 AI/ML-powered anomaly detection
- 📈 Advanced data visualization

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TAURI DESKTOP APPLICATION                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   React UI      │  │  WebView Bridge │  │   Rust Backend  │  │
│  │   (Frontend)    │◄─┤   (IPC Layer)   │─►│   (Core Engine) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

### Frontend (`/src/`)
```
src/
├── components/           # React components
│   ├── alerts/          # AlertList.tsx
│   ├── cards/           # StatusCard.tsx
│   ├── charts/          # GaugeChart, LineChart, ResponsiveChart
│   ├── dashboard/       # DashboardPage.tsx
│   └── layout/          # Header.tsx, MainLayout.tsx
├── store/               # State management (Zustand)
│   ├── appStore.ts      # Global application state
│   └── machineStore.ts  # Machine-specific state
├── types/               # TypeScript definitions
│   └── machine.ts       # Machine data types
├── theme/               # UI theme configuration
│   └── index.ts         # Theme definitions
└── styles/              # CSS styles
    ├── colors.css       # Color definitions
    └── responsive.css   # Responsive design
```

### Backend (`/src-tauri/`)
```
src-tauri/
├── src/
│   └── main.rs          # Tauri application entry point
├── Cargo.toml           # Rust dependencies
├── tauri.conf.json      # Tauri configuration
└── build.rs             # Build script
```

### Services (`/services/` & `/ml-services/`)
- Node.js API services for business logic
- Python ML services for AI inference
- Real-time data processing pipelines

### Documentation (`/docs/planning/`)
- Technical specifications and architecture
- Development guidelines and standards
- API specifications and schemas

## 🔧 Technology Stack

### Core Technologies
- **Frontend**: React 19.1.1 + TypeScript 5.8.3
- **Desktop**: Tauri 1.6.3 (Rust backend)
- **State Management**: Zustand 4.5.7
- **UI Framework**: Ant Design 5.26.7
- **Charts**: Apache ECharts 5.6.0
- **Build Tool**: Vite 7.1.0

### Dependencies Overview
```json
{
  "react": "^19.1.1",
  "antd": "^5.26.7",
  "echarts": "^5.6.0",
  "@tauri-apps/api": "^1.6.0",
  "zustand": "^4.5.7"
}
```

## 📚 Key Documentation

### Technical Documents
- [📋 PRD.md](./docs/planning/PRD.md) - Product Requirements Document
- [🏗️ System Architecture](./docs/planning/System%20Architecture%20Document.md) - Detailed architecture
- [⚙️ TechStack.md](./docs/planning/TechStack.md) - Complete technology specifications
- [🔧 Dev Guidelines](./docs/planning/Development%20Guidelines%20&%20Code%20Standards.md) - Development standards
- [🚀 Technical Roadmap](./docs/planning/Technical%20Development%20Roadmap.md) - Implementation roadmap

### Development Resources
- [🧪 Testing Strategy](./docs/planning/TestingStrategy.md) - Testing approach
- [📊 Database Schema](./docs/planning/DatabaseSchema.md) - Database design
- [🔌 API Specification](./docs/planning/API_SPEC.md) - API documentation
- [🚀 CI/CD](./docs/planning/CI_CD.md) - Deployment pipeline

## 🎯 Current Implementation Status

### ✅ Completed Components
- **Core Application Structure**: Tauri + React setup
- **State Management**: Zustand stores configured
- **UI Components**: Basic dashboard, alerts, charts
- **Theme System**: Dark theme for manufacturing environments
- **Build System**: Vite + Tauri build pipeline

### 🚧 Active Development
- Real-time data visualization
- Equipment monitoring interfaces
- Alert management system
- ML inference integration

### 📋 Planned Features
- OPC-UA protocol integration
- Advanced anomaly detection
- Historical data analysis
- Multi-equipment monitoring
- Air-gapped deployment

## 🔍 Component Details

### State Management (`/src/store/`)

**App Store** (`appStore.ts`)
- Global application state
- User preferences
- System configuration

**Machine Store** (`machineStore.ts`)
- Equipment data management
- Sensor readings
- Real-time monitoring state

### UI Components (`/src/components/`)

**Dashboard** (`dashboard/DashboardPage.tsx`)
- Main monitoring interface
- Real-time data display
- Equipment status overview

**Charts** (`charts/`)
- `GaugeChart.tsx` - Circular gauge displays
- `LineChart.tsx` - Time-series data visualization  
- `ResponsiveChart.tsx` - Adaptive chart container

**Alerts** (`alerts/AlertList.tsx`)
- Alert notification system
- Priority-based display
- Real-time alert updates

**Cards** (`cards/StatusCard.tsx`)
- Equipment status widgets
- Key metric displays
- Interactive status indicators

## 📊 Performance Requirements

### System Targets
- **Response Time**: <500ms for all UI operations
- **Data Processing**: 10M+ sensor readings/second
- **Memory Usage**: <200MB RAM footprint
- **Storage**: 10TB+ time-series data support
- **Uptime**: 99.9% availability

### Development Standards
- **Test Coverage**: 90%+ for business logic
- **TypeScript**: Strict mode enabled
- **Code Quality**: ESLint + Prettier
- **Performance**: Automated regression testing

## 🛠️ Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build Tauri application
npm run tauri build
```

### Code Quality Tools
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier configuration
- **Type Checking**: TypeScript strict mode
- **Testing**: Vitest + React Testing Library

## 🚀 Deployment Architecture

### Air-Gapped Deployment
- Single binary installation
- Embedded dependencies
- Offline operation capability
- Security compliance (SEMI E30, SOC 2)

### Platform Support
- Windows 10/11
- Ubuntu 20.04+
- macOS 12+

## 📈 Project Metrics

### Current Stats
- **Frontend Components**: 15+ React components
- **State Stores**: 2 Zustand stores
- **UI Framework**: Ant Design Pro
- **Chart Types**: 3 visualization components
- **Type Definitions**: Comprehensive TypeScript coverage

### Quality Metrics
- **Bundle Size**: Optimized for performance
- **Build Time**: Fast development builds
- **Hot Reload**: Instant development feedback
- **Cross-Platform**: Full desktop support

## 🔗 Quick Links

### Development
- [Package.json](./package.json) - Dependencies and scripts
- [Tauri Config](./src-tauri/tauri.conf.json) - Desktop app configuration
- [Vite Config](./vite.config.ts) - Build configuration
- [TypeScript Config](./tsconfig.json) - Type checking rules

### Documentation
- [Planning Docs](./docs/planning/) - All technical documentation
- [README](./README.md) - Basic project information

### Resources
- [Tauri Docs](https://tauri.app/v1/guides/)
- [React Docs](https://react.dev/)
- [Ant Design](https://ant.design/)
- [ECharts](https://echarts.apache.org/)

---

*Last Updated: August 2025 | Version: 1.0*