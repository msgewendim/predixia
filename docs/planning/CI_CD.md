# CI/CD Pipeline & Deployment Guide
## AI-Powered Predictive Maintenance Software

### Version 1.0 | Date: August 2025

## 1. CI/CD Architecture Overview

### 1.1 Pipeline Strategy
```mermaid
graph LR
    A[Developer Push] --> B[GitHub Actions]
    B --> C[Code Quality Checks]
    C --> D[Unit Tests]
    D --> E[Integration Tests]
    E --> F[Security Scan]
    F --> G[Build Artifacts]
    G --> H[Deploy Staging]
    H --> I[E2E Tests]
    I --> J[Production Deploy]
    J --> K[Health Checks]
```

### 1.2 Environment Strategy
- **Development**: Local development with Docker Compose
- **CI/Testing**: GitHub Actions with containerized services
- **Staging**: Air-gapped environment simulation
- **Production**: Air-gapped customer deployments

## 2. GitHub Actions Workflows

### 2.1 Main CI/CD Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'
  RUST_VERSION: 'stable'
  PYTHON_VERSION: '3.10'

jobs:
  code-quality:
    name: Code Quality Checks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: ${{ env.RUST_VERSION }}
          components: rustfmt, clippy
          override: true

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          npm ci
          pip install -r ml-services/requirements.txt
          cargo fetch

      - name: Lint Frontend
        run: |
          npm run lint
          npm run type-check

      - name: Lint Rust
        run: |
          cargo clippy -- -D warnings
          cargo fmt --check

      - name: Lint Python
        run: |
          cd ml-services
          black --check .
          flake8 .
          mypy .

      - name: Security audit
        run: |
          npm audit --audit-level high
          cargo audit
          pip-audit

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: code-quality
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: ${{ env.RUST_VERSION }}
          override: true

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          npm ci
          pip install -r ml-services/requirements-test.txt
          cargo fetch

      - name: Run Frontend tests
        run: |
          npm run test:coverage
          npm run test:e2e-headless

      - name: Run Rust tests
        run: |
          cargo test --verbose
          cargo test --release

      - name: Run Python tests
        run: |
          cd ml-services
          pytest --cov=src --cov-report=xml --cov-report=html

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: |
            coverage/lcov.info
            ml-services/coverage.xml
          fail_ci_if_error: true

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      influxdb:
        image: influxdb:2.7
        env:
          DOCKER_INFLUXDB_INIT_MODE: setup
          DOCKER_INFLUXDB_INIT_USERNAME: admin
          DOCKER_INFLUXDB_INIT_PASSWORD: password123
          DOCKER_INFLUXDB_INIT_ORG: test-org
          DOCKER_INFLUXDB_INIT_BUCKET: test-bucket

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          INFLUX_URL: http://localhost:8086
          INFLUX_TOKEN: test-token

  security-scan:
    name: Security Scanning
    runs-on: ubuntu-latest
    needs: code-quality
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: OWASP ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'

  build:
    name: Build Applications
    runs-on: ${{ matrix.os }}
    needs: [unit-tests, integration-tests, security-scan]
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: ${{ env.RUST_VERSION }}
          override: true

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          npm ci
          pip install -r ml-services/requirements.txt

      - name: Build Tauri application
        run: npm run tauri build
        env:
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}

      - name: Build Python services
        run: |
          cd ml-services
          python -m build

      - name: Create deployment package
        run: npm run package:deployment

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-${{ matrix.os }}
          path: |
            dist/
            target/release/bundle/
            ml-services/dist/

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-ubuntu-latest

      - name: Deploy to staging environment
        run: |
          # Deploy to staging air-gapped simulation
          ./scripts/deploy-staging.sh
        env:
          STAGING_HOST: ${{ secrets.STAGING_HOST }}
          STAGING_SSH_KEY: ${{ secrets.STAGING_SSH_KEY }}

      - name: Run health checks
        run: |
          ./scripts/health-check.sh ${{ secrets.STAGING_HOST }}

  e2e-tests:
    name: End-to-End Tests
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/develop'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Playwright
        run: |
          npm ci
          npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: https://staging.predictive-maintenance.local

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, e2e-tests]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-ubuntu-latest

      - name: Create production deployment package
        run: |
          ./scripts/create-airgap-bundle.sh
          
      - name: Sign deployment package
        run: |
          gpg --batch --yes --detach-sign --armor \
              --local-user ${{ secrets.GPG_KEY_ID }} \
              --passphrase ${{ secrets.GPG_PASSPHRASE }} \
              predictive-maintenance-v${{ github.sha }}.tar.gz

      - name: Upload to release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            predictive-maintenance-v${{ github.sha }}.tar.gz
            predictive-maintenance-v${{ github.sha }}.tar.gz.asc
          tag_name: v${{ github.run_number }}
          name: Release v${{ github.run_number }}
          draft: false
          prerelease: false
```

### 2.2 Performance Testing Workflow

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    name: Load Testing
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Start application stack
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 30  # Wait for services to be ready

      - name: Install Artillery
        run: npm install -g artillery@latest

      - name: Run load tests
        run: |
          artillery run tests/performance/load-test.yml \
            --output performance-report.json

      - name: Generate performance report
        run: |
          artillery report performance-report.json \
            --output performance-report.html

      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: |
            performance-report.json
            performance-report.html

      - name: Check performance thresholds
        run: |
          node scripts/check-performance-thresholds.js performance-report.json

  benchmark:
    name: Benchmark Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          override: true

      - name: Run Rust benchmarks
        run: |
          cd src-tauri
          cargo bench -- --output-format json > benchmark-results.json

      - name: Compare with baseline
        run: |
          node scripts/compare-benchmarks.js benchmark-results.json

      - name: Upload benchmark results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: benchmark-results.json
```

## 3. Docker Configuration

### 3.1 Development Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: predictive_maintenance_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev_user -d predictive_maintenance_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  influxdb:
    image: influxdb:2.7
    environment:
      DOCKER_INFLUXDB_INIT_MODE: setup
      DOCKER_INFLUXDB_INIT_USERNAME: admin
      DOCKER_INFLUXDB_INIT_PASSWORD: password123
      DOCKER_INFLUXDB_INIT_ORG: development
      DOCKER_INFLUXDB_INIT_BUCKET: sensor_data
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: dev-admin-token-123456789
    ports:
      - "8086:8086"
    volumes:
      - influx_data:/var/lib/influxdb2
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8086/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  opc-simulator:
    image: opcfoundation/ua-netstandard:latest
    ports:
      - "4840:4840"
    environment:
      CONSOLE_LOGGING: "true"
    volumes:
      - ./test-data/opc-config:/app/config

  api-service:
    build:
      context: .
      dockerfile: services/api/Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://dev_user:dev_password@postgres:5432/predictive_maintenance_dev
      REDIS_URL: redis://redis:6379
      INFLUX_URL: http://influxdb:8086
      INFLUX_TOKEN: dev-admin-token-123456789
      INFLUX_ORG: development
      INFLUX_BUCKET: sensor_data
    volumes:
      - ./services/api:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      influxdb:
        condition: service_healthy
    command: npm run dev

  ml-service:
    build:
      context: .
      dockerfile: ml-services/Dockerfile.dev
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://dev_user:dev_password@postgres:5432/predictive_maintenance_dev
      REDIS_URL: redis://redis:6379
      MODEL_PATH: /app/models
    volumes:
      - ./ml-services:/app
      - ./models:/app/models
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  postgres_data:
  influx_data:
  redis_data:
```

### 3.2 Production Dockerfiles

```dockerfile
# services/api/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

```dockerfile
# ml-services/Dockerfile
FROM python:3.10-slim AS builder

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

COPY . .
RUN python -m build

FROM python:3.10-slim AS production

RUN useradd --create-home --shell /bin/bash app

WORKDIR /app

# Copy Python dependencies
COPY --from=builder /root/.local /home/app/.local
COPY --from=builder /app/dist/*.whl ./

# Install the application
RUN pip install *.whl

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 4. Air-Gapped Deployment Strategy

### 4.1 Deployment Package Creation

```bash
#!/bin/bash
# scripts/create-airgap-bundle.sh

set -e

VERSION=${1:-$(date +%Y%m%d_%H%M%S)}
BUNDLE_NAME="predictive-maintenance-v${VERSION}"
BUNDLE_DIR="dist/${BUNDLE_NAME}"

echo "Creating air-gapped deployment bundle: ${BUNDLE_NAME}"

# Create bundle directory structure
mkdir -p "${BUNDLE_DIR}"/{app,services,database,scripts,docs}

# Build Tauri application for all platforms
echo "Building Tauri applications..."
npm run tauri build -- --target x86_64-pc-windows-msvc
npm run tauri build -- --target x86_64-unknown-linux-gnu
npm run tauri build -- --target x86_64-apple-darwin

# Copy Tauri binaries
cp -r src-tauri/target/release/bundle/ "${BUNDLE_DIR}/app/"

# Build and package Node.js services
echo "Packaging Node.js services..."
cd services/api
npm ci --production
tar -czf "../../${BUNDLE_DIR}/services/api-service.tar.gz" .
cd ../..

# Build and package Python ML services
echo "Packaging Python ML services..."
cd ml-services
pip download -r requirements.txt -d ../temp-deps/
python -m build
cp dist/*.whl "../${BUNDLE_DIR}/services/"
tar -czf "../${BUNDLE_DIR}/services/python-deps.tar.gz" -C ../temp-deps .
cd ..
rm -rf temp-deps

# Copy database schemas and migrations
echo "Copying database schemas..."
cp -r database/ "${BUNDLE_DIR}/database/"

# Copy installation and configuration scripts
echo "Copying installation scripts..."
cp scripts/install-airgap.sh "${BUNDLE_DIR}/scripts/"
cp scripts/configure-system.sh "${BUNDLE_DIR}/scripts/"
cp scripts/start-services.sh "${BUNDLE_DIR}/scripts/"
cp scripts/backup.sh "${BUNDLE_DIR}/scripts/"
cp scripts/update.sh "${BUNDLE_DIR}/scripts/"

# Copy documentation
cp -r docs/ "${BUNDLE_DIR}/docs/"
cp README.md "${BUNDLE_DIR}/"
cp CHANGELOG.md "${BUNDLE_DIR}/"

# Create configuration templates
cat > "${BUNDLE_DIR}/config/config.template.yml" << EOF
database:
  postgresql:
    host: localhost
    port: 5432
    database: predictive_maintenance
    username: pm_user
    password: REPLACE_WITH_SECURE_PASSWORD
  
  influxdb:
    url: http://localhost:8086
    token: REPLACE_WITH_INFLUX_TOKEN
    org: manufacturing
    bucket: sensor_data
  
  redis:
    url: redis://localhost:6379

security:
  jwt:
    secret: REPLACE_WITH_JWT_SECRET
    expiry: 28800  # 8 hours
  
  encryption:
    key: REPLACE_WITH_ENCRYPTION_KEY

opc:
  endpoints:
    - name: "Equipment Line 1"
      url: "opc.tcp://192.168.1.100:4840"
      security_policy: "Basic256Sha256"
    - name: "Equipment Line 2"  
      url: "opc.tcp://192.168.1.101:4840"
      security_policy: "Basic256Sha256"

monitoring:
  log_level: info
  metrics_enabled: true
  health_check_interval: 30
EOF

# Create system requirements document
cat > "${BUNDLE_DIR}/docs/SYSTEM_REQUIREMENTS.md" << EOF
# System Requirements

## Minimum Hardware Requirements
- CPU: 4-core, 2.4GHz (Intel i5-8250U or AMD equivalent)
- RAM: 8GB DDR4
- Storage: 100GB SSD available space
- Network: 1Gbps Ethernet

## Recommended Hardware Requirements  
- CPU: 8-core, 3.0GHz (Intel i7-10700K or AMD equivalent)
- RAM: 16GB DDR4
- Storage: 500GB NVMe SSD
- GPU: NVIDIA RTX 3060 or better (for ML acceleration)
- Network: 10Gbps Ethernet

## Operating System Support
- Windows 10/11 (64-bit)
- Ubuntu 20.04+ LTS (64-bit)
- RHEL/CentOS 8+ (64-bit)
- macOS 12+ (Intel/Apple Silicon)

## Required Software Dependencies
- PostgreSQL 15+
- InfluxDB 2.7+
- Redis 7.0+
- Python 3.10+
- Node.js 18+
EOF

# Create installation verification script
cat > "${BUNDLE_DIR}/scripts/verify-installation.sh" << 'EOF'
#!/bin/bash

echo "Verifying Predictive Maintenance installation..."

# Check services
services=("postgresql" "influxdb" "redis-server")
for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service"; then
        echo "✓ $service is running"
    else
        echo "✗ $service is not running"
        exit 1
    fi
done

# Check application health
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✓ API service is healthy"
else
    echo "✗ API service is not responding"
    exit 1
fi

if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "✓ ML service is healthy"
else
    echo "✗ ML service is not responding"
    exit 1
fi

echo "✓ Installation verified successfully"
EOF

chmod +x "${BUNDLE_DIR}/scripts/"*.sh

# Create checksums for integrity verification
echo "Generating checksums..."
find "${BUNDLE_DIR}" -type f -exec sha256sum {} \; > "${BUNDLE_DIR}/checksums.txt"

# Create the final bundle
echo "Creating final bundle archive..."
tar -czf "${BUNDLE_NAME}.tar.gz" -C dist "${BUNDLE_NAME}"

# Generate signature
gpg --batch --yes --detach-sign --armor \
    --local-user "${GPG_KEY_ID:-}" \
    "${BUNDLE_NAME}.tar.gz"

echo "Bundle created: ${BUNDLE_NAME}.tar.gz"
echo "Signature created: ${BUNDLE_NAME}.tar.gz.asc"
echo "Bundle size: $(du -h ${BUNDLE_NAME}.tar.gz | cut -f1)"
```

### 4.2 Air-Gapped Installation Script

```bash
#!/bin/bash
# scripts/install-airgap.sh

set -e

INSTALL_DIR="/opt/predictive-maintenance"
DATA_DIR="/var/lib/predictive-maintenance"
LOG_DIR="/var/log/predictive-maintenance"
CONFIG_DIR="/etc/predictive-maintenance"
USER="pmaint"
GROUP="pmaint"

echo "Installing Predictive Maintenance Software (Air-Gapped)"
echo "======================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

# Verify bundle integrity
echo "Verifying installation package integrity..."
if ! sha256sum -c checksums.txt; then
    echo "ERROR: Package integrity check failed!"
    exit 1
fi

# Create system user
echo "Creating system user..."
if ! id "$USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$DATA_DIR" -c "Predictive Maintenance User" "$USER"
fi

# Create directories
echo "Creating directories..."
mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$LOG_DIR" "$CONFIG_DIR"
chown -R "$USER:$GROUP" "$DATA_DIR" "$LOG_DIR"

# Install system dependencies
echo "Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    apt-get update
    apt-get install -y \
        postgresql-15 \
        influxdb2 \
        redis-server \
        python3.10 \
        python3.10-venv \
        nodejs \
        npm \
        nginx \
        systemd \
        curl \
        gpg
elif command -v yum &> /dev/null; then
    # RHEL/CentOS
    yum update -y
    yum install -y \
        postgresql15-server \
        influxdb2 \
        redis \
        python3.10 \
        nodejs \
        npm \
        nginx \
        systemd \
        curl \
        gnupg2
fi

# Install Python dependencies offline
echo "Installing Python ML service..."
cd services/
tar -xzf python-deps.tar.gz
pip3.10 install --no-index --find-links python-deps/ *.whl
cd ..

# Install Node.js service
echo "Installing Node.js API service..."
cd services/
tar -xzf api-service.tar.gz -C "$INSTALL_DIR/api/"
cd "$INSTALL_DIR/api/"
npm ci --production
cd -

# Install Tauri application
echo "Installing desktop application..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    cp app/linux/predictive-maintenance /usr/local/bin/
    chmod +x /usr/local/bin/predictive-maintenance
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    cp app/windows/predictive-maintenance.exe /c/Program\ Files/PredictiveMaintenance/
fi

# Setup database
echo "Initializing PostgreSQL database..."
sudo -u postgres createdb predictive_maintenance 2>/dev/null || true
sudo -u postgres psql -d predictive_maintenance -f database/schema.sql

# Setup InfluxDB
echo "Initializing InfluxDB..."
influx setup \
    --username admin \
    --password "$INFLUX_ADMIN_PASSWORD" \
    --org manufacturing \
    --bucket sensor_data \
    --force

# Configure Redis
echo "Configuring Redis..."
cp config/redis.conf /etc/redis/
systemctl enable redis-server
systemctl start redis-server

# Install systemd services
echo "Installing system services..."
cp scripts/systemd/*.service /etc/systemd/system/
systemctl daemon-reload

# Enable and start services
services=("pm-api" "pm-ml" "pm-data-collector")
for service in "${services[@]}"; do
    systemctl enable "$service"
    systemctl start "$service"
done

# Configure nginx reverse proxy
echo "Configuring web proxy..."
cp config/nginx.conf /etc/nginx/sites-available/predictive-maintenance
ln -sf /etc/nginx/sites-available/predictive-maintenance /etc/nginx/sites-enabled/
systemctl enable nginx
systemctl reload nginx

# Setup firewall rules
echo "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 443/tcp  # HTTPS
    ufw allow 3000/tcp # API (internal)
    ufw allow 8000/tcp # ML service (internal)
    ufw reload
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --permanent --add-port=8000/tcp
    firewall-cmd --reload
fi

# Create initial configuration
echo "Creating configuration files..."
cp config/config.template.yml "$CONFIG_DIR/config.yml"
chown "$USER:$GROUP" "$CONFIG_DIR/config.yml"
chmod 600 "$CONFIG_DIR/config.yml"

# Setup log rotation
cat > /etc/logrotate.d/predictive-maintenance << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $GROUP
    postrotate
        systemctl reload pm-api pm-ml pm-data-collector
    endscript
}
EOF

# Run post-installation verification
echo "Running post-installation verification..."
sleep 10  # Allow services to start
bash scripts/verify-installation.sh

echo ""
echo "Installation completed successfully!"
echo "=================================="
echo ""
echo "Configuration file: $CONFIG_DIR/config.yml"
echo "Log files: $LOG_DIR/"
echo "Data directory: $DATA_DIR"
echo ""
echo "Next steps:"
echo "1. Edit $CONFIG_DIR/config.yml with your specific configuration"
echo "2. Restart services: systemctl restart pm-api pm-ml pm-data-collector"
echo "3. Access web interface: https://$(hostname)/dashboard"
echo "4. Check logs: journalctl -u pm-api -f"
echo ""
```

## 5. Monitoring & Observability

### 5.1 Health Check Endpoints

```typescript
// Health check implementation
import express from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { InfluxDB } from '@influxdata/influxdb-client';

const router = express.Router();

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    database: HealthStatus;
    redis: HealthStatus;
    influxdb: HealthStatus;
    ml_service: HealthStatus;
    opc_connections: HealthStatus;
  };
  performance: {
    uptime: number;
    memory_usage: number;
    cpu_usage: number;
  };
}

interface HealthStatus {
  status: 'ok' | 'error' | 'timeout';
  response_time_ms: number;
  error?: string;
  details?: any;
}

router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    checks: {
      database: await checkPostgreSQL(),
      redis: await checkRedis(),
      influxdb: await checkInfluxDB(),
      ml_service: await checkMLService(),
      opc_connections: await checkOPCConnections()
    },
    performance: {
      uptime: process.uptime(),
      memory_usage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpu_usage: process.cpuUsage().user / 1000000 // seconds
    }
  };

  // Determine overall health status
  const checks = Object.values(health.checks);
  const hasErrors = checks.some(check => check.status === 'error');
  const hasTimeouts = checks.some(check => check.status === 'timeout');

  if (hasErrors) {
    health.status = 'unhealthy';
  } else if (hasTimeouts) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
});

async function checkPostgreSQL(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    const result = await pool.query('SELECT 1');
    return {
      status: 'ok',
      response_time_ms: Date.now() - start,
      details: { connection_count: pool.totalCount }
    };
  } catch (error) {
    return {
      status: 'error',
      response_time_ms: Date.now() - start,
      error: error.message
    };
  }
}

async function checkMLService(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    const response = await fetch('http://localhost:8000/health', {
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      return {
        status: 'ok',
        response_time_ms: Date.now() - start
      };
    } else {
      return {
        status: 'error',
        response_time_ms: Date.now() - start,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      status: error.name === 'AbortError' ? 'timeout' : 'error',
      response_time_ms: Date.now() - start,
      error: error.message
    };
  }
}
```

### 5.2 Prometheus Metrics

```typescript
// metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// HTTP metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5, 10]
});

// Application metrics
export const sensorReadingsProcessed = new Counter({
  name: 'sensor_readings_processed_total',
  help: 'Total number of sensor readings processed',
  labelNames: ['equipment_id', 'sensor_type']
});

export const mlPredictionsGenerated = new Counter({
  name: 'ml_predictions_generated_total',
  help: 'Total number of ML predictions generated',
  labelNames: ['model_type', 'equipment_type']
});

export const activeEquipmentCount = new Gauge({
  name: 'active_equipment_count',
  help: 'Number of active equipment units',
  labelNames: ['equipment_type', 'location']
});

export const opcConnectionStatus = new Gauge({
  name: 'opc_connection_status',
  help: 'OPC-UA connection status (1=connected, 0=disconnected)',
  labelNames: ['endpoint', 'equipment_id']
});

// Database metrics
export const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  labelNames: ['database']
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5]
});

// Export all metrics
export { register };
```

### 5.3 Logging Configuration

```typescript
// logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
      service: 'predictive-maintenance-api'
    });
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'api' },
  transports: [
    // Console logging for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // File logging for production
    new DailyRotateFile({
      filename: '/var/log/predictive-maintenance/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    }),

    // Error-only log file
    new DailyRotateFile({
      filename: '/var/log/predictive-maintenance/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '90d'
    })
  ],

  // Handle uncaught exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      filename: '/var/log/predictive-maintenance/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: '30d'
    })
  ],

  // Handle unhandled rejections
  rejectionHandlers: [
    new DailyRotateFile({
      filename: '/var/log/predictive-maintenance/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: '30d'
    })
  ]
});

export default logger;
```

This comprehensive CI/CD pipeline and deployment guide provides a robust foundation for automated testing, building, and deploying the predictive maintenance system across different environments, with special focus on air-gapped production deployments required for semiconductor manufacturing facilities.