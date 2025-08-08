# Getting Started Guide - Developer Onboarding
## AI-Powered Predictive Maintenance Software

### Version 1.0 | Date: August 2025

## 1. Welcome to the Team

### 1.1 Project Overview
Welcome to the development team for our AI-powered predictive maintenance software designed for semiconductor manufacturing environments. This system processes millions of sensor readings per second, provides real-time anomaly detection, and helps prevent equipment downtime that can cost $100,000+ per hour.

**Key Technologies:**
- **Frontend**: Tauri + React + TypeScript
- **Backend**: Rust + Node.js + Python  
- **Databases**: PostgreSQL + InfluxDB + Redis
- **ML/AI**: ONNX Runtime + PyTorch + Scikit-learn
- **Monitoring**: Prometheus + Grafana + Jaeger

### 1.2 Project Structure Overview
```
Predixia/
├── src/                   # React frontend source
├── src-tauri/             # Rust backend source  
├── services/              # Node.js API services
├── ml-services/           # Python ML services
├── database/              # Database schemas & migrations
├── docs/                  # Documentation
├── tests/                 # Test suites
├── scripts/               # Development & deployment scripts
├── config/                # Configuration files
└── docker/                # Docker configurations
```

## 2. Prerequisites & Environment Setup

### 2.1 Required Software

**Development Tools:**
```bash
# Node.js (18+ LTS)
curl -fsSL https://nodejs.org/dist/v18.17.0/node-v18.17.0-linux-x64.tar.xz | tar -xJ
export PATH=$PWD/node-v18.17.0-linux-x64/bin:$PATH

# Rust (1.70+)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup component add clippy rustfmt

# Python (3.10+)
sudo apt update
sudo apt install python3.10 python3.10-pip python3.10-venv

# Git
sudo apt install git

# Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**Development Dependencies:**
```bash
# Install Tauri CLI
cargo install tauri-cli

# Install global pnpm packages
pnpm install -g typescript eslint prettier

# Install Python tools
uv pip3 install black isort mypy flake8 pytest
```

### 2.2 IDE Setup

**Recommended: Visual Studio Code**
```bash
# Install VS Code
sudo snap install code --classic

# Install recommended extensions
code --install-extension rust-lang.rust-analyzer
code --install-extension tauri-apps.tauri-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-python.python
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
```

**VS Code Settings (`.vscode/settings.json`):**
```json
{
  "rust-analyzer.check.command": "clippy",
  "rust-analyzer.rustfmt.rangeFormatting.enable": true,
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.mypyEnabled": true,
  "python.formatting.provider": "black",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

### 2.3 Environment Configuration

**Create Environment File (`.env.development`):**
```bash
# Database Configuration
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/predictive_maintenance_dev
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=dev-admin-token-123456789
INFLUX_ORG=development
INFLUX_BUCKET=sensor_data
REDIS_URL=redis://localhost:6379

# API Configuration
API_PORT=3000
ML_SERVICE_PORT=8000
JWT_SECRET=your-super-secret-jwt-key-for-development
ENCRYPTION_KEY=your-32-byte-encryption-key-base64

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=/var/log/predictive-maintenance

# Development
NODE_ENV=development
RUST_LOG=debug
PYTHONPATH=./ml-services

# OPC-UA Configuration (for testing)
OPC_SIMULATOR_ENDPOINT=opc.tcp://localhost:4840
```

## 3. First-Time Setup

### 3.1 Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/company/predixia.git
cd predixia

# Set up Git hooks
chmod +x scripts/setup-git-hooks.sh
./scripts/setup-git-hooks.sh

# Copy environment configuration
cp .env.example .env.development
# Edit .env.development with your local settings
```

### 3.2 Database Setup

```bash
# Start databases with Docker
docker-compose -f docker/docker-compose.dev.yml up -d postgres influxdb redis

# Wait for databases to be ready
sleep 10

# Run database migrations
pnpm run db:setup
pnpm run db:migrate

# Seed development data
pnpm run db:seed
```

**Manual Database Setup (if needed):**
```bash
# PostgreSQL
sudo -u postgres createuser dev_user
sudo -u postgres createdb predictive_maintenance_dev
sudo -u postgres psql -c "ALTER USER dev_user WITH ENCRYPTED PASSWORD 'dev_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE predictive_maintenance_dev TO dev_user;"

# Run schema
psql -h localhost -U dev_user -d predictive_maintenance_dev -f database/schema.sql

# InfluxDB
influx setup \
  --username admin \
  --password dev_password \
  --org development \
  --bucket sensor_data \
  --force
```

### 3.3 Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install Rust dependencies
cd src-tauri
cargo fetch
cd ..

# Install API service dependencies
cd services/api
pnpm install
cd ../..

# Install ML service dependencies
cd ml-services
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
cd ..
```

### 3.4 Verify Setup

```bash
# Run the setup verification script
./scripts/verify-setup.sh

# Expected output:
# ✅ Node.js version: v18.17.0
# ✅ Rust version: 1.70.0
# ✅ Python version: 3.10.6
# ✅ PostgreSQL connection: OK
# ✅ InfluxDB connection: OK  
# ✅ Redis connection: OK
# ✅ All dependencies installed
```

## 4. Development Workflow

### 4.1 Daily Development Routine

**Morning Startup:**
```bash
# Pull latest changes
git pull origin dev

# Check for dependency updates
pnpm outdated
cargo outdated

# Start development environment
pnpm run dev:all

# This starts:
# - PostgreSQL, InfluxDB, Redis (Docker)
# - API service (Node.js)
# - ML service (Python)
# - Frontend development server (Vite)
# - File watchers for hot reload
```

**Development Commands:**
```bash
# Frontend development
pnpm run dev              # Start Vite dev server
pnpm run lint             # Run ESLint
pnpm run type-check       # TypeScript type checking
pnpm run test             # Run frontend tests

# Tauri development  
pnpm run tauri dev        # Start Tauri in development mode
pnpm run tauri build      # Build Tauri application

# Backend services
pnpm run api:dev          # Start API service with hot reload
pnpm run ml:dev           # Start ML service with hot reload

# Rust development
cd src-tauri
cargo check              # Quick compile check
cargo clippy             # Rust linting
cargo test               # Run Rust tests
cargo fmt                # Format Rust code

# Python development
cd ml-services
source venv/bin/activate
pytest                   # Run Python tests
black .                  # Format Python code
mypy .                   # Type checking
flake8 .                 # Linting
```

### 4.2 Feature Development Process

**Step 1: Create Feature Branch**
```bash
# Create and switch to feature branch
git checkout dev
git pull origin dev
git checkout -b feature/TICKET-123-add-sensor-calibration

# Install any new dependencies if needed
pnpm install
cd src-tauri && cargo fetch && cd ..
cd ml-services && pip install -r requirements.txt && cd ..
```

**Step 2: Development**
```bash
# Make your changes following the coding standards
# Run tests frequently during development
pnpm run test:watch      # Frontend tests in watch mode
cargo test             # Rust tests  
pytest --watch         # Python tests in watch mode

# Check code quality
pnpm run lint:fix        # Auto-fix linting issues
cargo fmt              # Format Rust code
black .                # Format Python code
```

**Step 3: Testing**
```bash
# Run full test suite
pnpm run test:all        # All tests
pnpm run test:coverage   # Generate coverage report

# Run specific test types
pnpm run test:unit       # Unit tests only
pnpm run test:integration # Integration tests
pnpm run test:e2e        # End-to-end tests

# Performance testing
pnpm run test:performance # Load and performance tests
```

**Step 4: Commit and Push**
```bash
# Stage and commit changes
git add .
git commit -m "feat(sensors): add OPC-UA certificate validation

Implement X.509 certificate validation for OPC-UA connections
to ensure secure communication with manufacturing equipment.

- Added certificate parsing and validation logic
- Implemented revocation checking  
- Added unit tests for certificate validation
- Updated documentation

Closes #123"

# Push to remote
git push origin feature/TICKET-123-add-sensor-calibration
```

**Step 5: Create Pull Request**
- Go to GitHub/GitLab and create a pull request
- Use the PR template to fill in all required sections
- Request reviews from appropriate team members
- Address any feedback and update the PR

### 4.3 Common Development Tasks

**Adding a New API Endpoint:**
```typescript
// 1. Define types (src/types/api.ts)
export interface CreateSensorRequest {
  name: string;
  equipmentId: string;
  parameterType: string;
  unit: string;
  minRange?: number;
  maxRange?: number;
}

// 2. Add route handler (services/api/routes/sensors.ts)
router.post('/sensors', requirePermission(Permission.SENSOR_CREATE), async (req, res) => {
  try {
    const sensorData = req.body as CreateSensorRequest;
    const sensor = await sensorService.createSensor(sensorData);
    res.status(201).json({ success: true, data: sensor });
  } catch (error) {
    logger.error('Failed to create sensor', { error, sensorData });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 3. Add service method (services/api/services/sensorService.ts)
async createSensor(data: CreateSensorRequest): Promise<Sensor> {
  // Implementation
}

// 4. Add frontend service call (src/services/sensorService.ts)
export const sensorService = {
  async createSensor(data: CreateSensorRequest): Promise<Sensor> {
    const response = await apiClient.post<ApiResponse<Sensor>>('/sensors', data);
    return response.data.data;
  }
};

// 5. Add tests
describe('POST /sensors', () => {
  test('should create sensor successfully', async () => {
    // Test implementation
  });
});
```

**Adding a New React Component:**
```typescript
// 1. Create component file (src/components/SensorCard.tsx)
interface SensorCardProps {
  sensor: Sensor;
  onEdit?: (sensor: Sensor) => void;
  onDelete?: (sensorId: string) => void;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  sensor,
  onEdit,
  onDelete
}) => {
  // Component implementation
};

// 2. Add Storybook story (src/components/SensorCard.stories.tsx)
export default {
  title: 'Components/SensorCard',
  component: SensorCard,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof SensorCard>;

// 3. Add tests (src/components/__tests__/SensorCard.test.tsx)
import { render, screen, fireEvent } from '@testing-library/react';
import { SensorCard } from '../SensorCard';

describe('SensorCard', () => {
  test('renders sensor information', () => {
    // Test implementation
  });
});
```

**Adding Database Migration:**
```sql
-- 1. Create migration file (database/migrations/20250807_add_sensor_calibration.sql)
-- Up migration
CREATE TABLE sensor_calibration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID NOT NULL REFERENCES manufacturing.sensors(id),
    calibration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    slope DECIMAL(12,8) NOT NULL DEFAULT 1.0,
    offset DECIMAL(12,8) NOT NULL DEFAULT 0.0,
    certificate_path VARCHAR(500),
    calibrated_by UUID REFERENCES security.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sensor_calibration_sensor_id ON sensor_calibration(sensor_id);
CREATE INDEX idx_sensor_calibration_date ON sensor_calibration(calibration_date DESC);

-- Down migration
DROP TABLE IF EXISTS sensor_calibration;
```

```bash
# 2. Run migration
pnpm run db:migrate

# 3. Update database schema documentation
pnpm run db:generate-docs
```

## 5. Debugging & Troubleshooting

### 5.1 Common Issues

**Issue: "Cannot connect to database"**
```bash
# Check if databases are running
docker ps | grep -E "(postgres|influx|redis)"

# Start databases if not running
docker-compose -f docker/docker-compose.dev.yml up -d

# Check connection strings in .env.development
cat .env.development | grep -E "(DATABASE_URL|INFLUX_URL|REDIS_URL)"

# Test connections manually
psql $DATABASE_URL -c "SELECT 1;"
curl $INFLUX_URL/health
redis-cli -u $REDIS_URL ping
```

**Issue: "Module not found" or dependency issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
pnpm install

# Clear Rust target directory
cd src-tauri
cargo clean
cargo fetch
cd ..

# Recreate Python virtual environment
cd ml-services
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
cd ..
```

**Issue: "Type errors in TypeScript"**
```bash
# Clear TypeScript cache
npx tsc --build --clean

# Restart TypeScript language server in VS Code
# Ctrl/Cmd + Shift + P -> "TypeScript: Restart TS Server"

# Check for missing type definitions
pnpm run type-check

# Install missing types
pnpm install --save-dev @types/missing-package
```

### 5.2 Debugging Tools

**Frontend Debugging:**
```bash
# React Developer Tools (browser extension)
# Redux DevTools (if using Redux)

# Enable verbose logging
VITE_LOG_LEVEL=debug pnpm run dev

# Debug with browser DevTools
# Add breakpoints in browser Sources tab
# Use console.log() and console.trace()
```

**Rust Debugging:**
```rust
// Enable debug logging
env_logger::init();
log::debug!("Debug message: {:?}", variable);

// Use dbg! macro for quick debugging
let result = dbg!(some_calculation());

// Run with debug symbols
RUST_LOG=debug cargo run
```

**Python Debugging:**
```python
# Use built-in debugger
import pdb; pdb.set_trace()

# Use rich for better output
from rich import print as rprint
rprint(complex_object)

# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Run with debugger
python -m pdb script.py
```

## 6. Testing Guidelines

### 6.1 Test-Driven Development

**1. Write failing test first:**
```typescript
// src/services/__tests__/sensorService.test.ts
describe('SensorService', () => {
  test('should validate sensor reading quality', () => {
    const service = new SensorService();
    const reading = { value: 23.5, quality: 'invalid' };
    
    expect(() => service.validateReading(reading))
      .toThrow('Invalid quality value');
  });
});
```

**2. Implement minimal code to pass:**
```typescript
// src/services/sensorService.ts
export class SensorService {
  validateReading(reading: SensorReading): void {
    const validQualities = ['good', 'bad', 'uncertain', 'substitute'];
    if (!validQualities.includes(reading.quality)) {
      throw new Error('Invalid quality value');
    }
  }
}
```

**3. Refactor and improve:**
```typescript
// Improve implementation with proper types and validation
validateReading(reading: SensorReading): ValidationResult {
  // Enhanced implementation
}
```

### 6.2 Test Categories

**Unit Tests - Fast and Isolated:**
```bash
# Run specific test files
pnpm test SensorService.test.ts
cargo test sensor_service
pytest tests/unit/test_feature_extractor.py

# Run with coverage
pnpm run test:coverage
cargo test --coverage
pytest --cov=src tests/
```

**Integration Tests - Component Interaction:**
```bash
# API integration tests
pnpm run test:api

# Database integration tests  
pnpm run test:db

# ML pipeline tests
pytest tests/integration/
```

**End-to-End Tests - Full Workflows:**
```bash
# Run E2E tests
pnpm run test:e2e

# Run specific E2E test suites
pnpm run test:e2e -- --grep "equipment monitoring"
```

## 7. Performance & Optimization

### 7.1 Performance Monitoring During Development

```bash
# Frontend bundle analysis
pnpm run build:analyze

# Rust performance profiling
cargo install flamegraph
cargo flamegraph --bin predictive-maintenance

# Python profiling
pip install py-spy
py-spy top --pid <python-process-id>

# Database query analysis
EXPLAIN ANALYZE SELECT * FROM sensor_readings WHERE equipment_id = 'eq_001';
```

### 7.2 Performance Best Practices

**Frontend Performance:**
- Use React.memo() for expensive components
- Implement virtualization for large lists
- Optimize bundle size with code splitting
- Use service workers for caching

**Backend Performance:**
- Use connection pooling for databases
- Implement caching strategies
- Optimize database queries with indexes
- Use async/await properly to avoid blocking

**ML Performance:**
- Batch predictions when possible
- Use ONNX for faster inference
- Implement model caching
- Monitor GPU utilization

## 8. Resources & Documentation

### 8.1 Key Documentation Files
- **[Technical PRD](./prd_technical.md)** - Product requirements and specifications
- **[System Architecture](./system_architecture.md)** - Overall system design
- **[API Specification](./api_specification.md)** - Complete API documentation
- **[Database Schema](./database_schema.md)** - Database design and relationships
- **[Development Guidelines](./development_guidelines.md)** - Coding standards and practices

### 8.2 External Resources
- **[Tauri Documentation](https://tauri.app/v1/guides/)** - Desktop application framework
- **[React Documentation](https://react.dev/)** - Frontend framework
- **[Rust Book](https://doc.rust-lang.org/book/)** - Rust programming language
- **[InfluxDB Documentation](https://docs.influxdata.com/)** - Time-series database
- **[OPC-UA Specification](https://opcfoundation.org/developer-tools/specifications-unified-architecture)** - Industrial communication protocol

### 8.3 Team Communication
- **Slack**: #predictive-maintenance-dev
- **Email**: dev-team@company.com  
- **Standups**: Daily at 9:00 AM
- **Sprint Planning**: Every 2 weeks
- **Code Reviews**: Required for all PRs

## 9. Next Steps

### 9.1 Your First Week
1. **Day 1-2**: Complete environment setup and run the application locally
2. **Day 3**: Read through the codebase and documentation
3. **Day 4**: Take on a "good first issue" ticket
4. **Day 5**: Submit your first pull request

### 9.2 Learning Path
1. **Week 1**: Understand the system architecture and data flow
2. **Week 2**: Implement a small feature end-to-end
3. **Week 3**: Work on performance optimization
4. **Week 4**: Contribute to testing and documentation

### 9.3 Getting Help
- **Immediate Help**: Ask in #predictive-maintenance-dev Slack channel
- **Code Reviews**: Request reviews from senior team members
- **Architecture Questions**: Schedule time with the tech lead
- **Domain Knowledge**: Shadow a manufacturing engineer

Welcome to the team! We're excited to have you contributing to this critical system that helps keep semiconductor manufacturing running smoothly. Don't hesitate to ask questions - we're all here to help you succeed.

---

**Quick Reference Commands:**
```bash
# Start development environment
pnpm run dev:all

# Run all tests
pnpm run test:all

# Build for production
pnpm run build:all

# Check code quality
pnpm run lint && pnpm run type-check && cargo clippy && black . && mypy .

# Deploy to staging
pnpm run deploy:staging
```