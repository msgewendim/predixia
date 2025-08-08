# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Predixia is an AI-powered predictive maintenance desktop application for semiconductor manufacturing. It's built with Tauri (Rust backend + React frontend) providing real-time monitoring, anomaly detection, and air-gapped deployment capabilities.

## Development Commands

### Core Development
```bash
# Install dependencies (uses pnpm)
pnpm install

# Start development server (React + Vite)
pnpm run dev

# Launch Tauri desktop application in dev mode
pnpm run tauri

# Build production application
pnpm run build
pnpm run tauri build
```

### Code Quality
The project uses ESLint and Prettier but lacks npm scripts for these tools. Run them directly:
```bash
# Linting (manual - no npm script available)
npx eslint src/
npx prettier --write src/
```

Note: No test scripts are currently configured in package.json.

## Architecture & State Management

### Hybrid Application Structure
- **Frontend**: React 19 + TypeScript running in Tauri webview (port 1420)
- **Backend**: Rust application providing native system access
- **IPC**: Communication between frontend/backend via Tauri's invoke system

### State Management (Zustand)
The application uses Zustand for state management with two primary stores:

**appStore.ts** - Global UI state:
- `isSidebarCollapsed` - Controls sidebar visibility

**machineStore.ts** - Domain-specific state:
- `machines[]` - Array of manufacturing equipment data
- `alerts[]` - System alerts and notifications  
- `performanceHistory[]` - Time-series metrics
- `systemHealth` & `predictionAccuracy` - Overall system metrics
- `selectedMachineId` - Currently selected equipment

### Data Models (types/machine.ts)
Core TypeScript interfaces define the domain model:
- `Machine` - Equipment with parameters, health, utilization
- `MachineParameter` - Sensor readings with thresholds
- `Alert` - Notifications with severity levels
- `PerformanceMetric` - Time-series data points

### Component Architecture
Components are organized by function:
- `components/dashboard/` - Main monitoring interface
- `components/charts/` - Data visualization (ECharts integration)
- `components/alerts/` - Alert management UI
- `components/cards/` - Status display widgets
- `components/layout/` - Application shell and navigation

### UI Framework
- **Ant Design Pro** - Enterprise React components
- **ECharts** - Data visualization and real-time charts
- **Dark Theme** - Optimized for 24/7 manufacturing environments

## Key Dependencies

### Frontend Core
- React 19.1.1 + TypeScript 5.8.3
- Ant Design 5.26.7 with Pro components
- ECharts 5.6.0 for charting
- Zustand 4.5.7 for state management

### Desktop Framework
- Tauri 1.6.3 for desktop application shell
- Vite 7.1.0 for build tooling and development server

## Build Configuration

### Tauri Configuration (src-tauri/tauri.conf.json)
- Uses pnpm commands for dev/build
- Frontend served on localhost:1420
- Bundle identifier: com.misganaw.predixia
- Limited permissions (shell.open only)

### TypeScript Configuration
- Strict mode enabled with comprehensive linting rules
- Modern ES2020 target with bundler module resolution
- React JSX transform enabled

## Development Workflow

### Hot Reload Development
1. `pnpm run dev` starts Vite development server
2. `pnpm run tauri` launches desktop app with hot reload
3. Frontend changes reload automatically
4. Rust backend changes require restart

### Data Flow
The application currently uses dummy data generated in machineStore.ts:
- Performance metrics generated for 24-hour periods
- Three sample machines with different statuses
- Mock alerts with various severity levels

This suggests the real data integration layer is not yet implemented.

## Important File Locations

### Configuration
- `tauri.conf.json` - Desktop application configuration
- `vite.config.ts` - Frontend build configuration  
- `tsconfig.json` - TypeScript compiler settings

### State & Types
- `src/store/` - Zustand state stores
- `src/types/machine.ts` - Core data model definitions

### Documentation
- `PROJECT_INDEX.md` - Comprehensive project documentation
- `docs/planning/` - Technical specifications and architecture documents
- `DEVELOPER_GUIDE.md` - Development setup and guidelines

## Planned External Integrations
Based on documentation in docs/planning/:
- OPC-UA protocol for equipment connectivity
- Python ML services for AI inference
- Node.js API services for business logic
- PostgreSQL + InfluxDB for data storage

These integrations are not yet implemented in the current codebase.