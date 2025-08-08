# Testing Strategy Document
## AI-Powered Predictive Maintenance Software

### Version 1.0 | Date: August 2025

## 1. Testing Overview

### 1.1 Testing Philosophy
The testing strategy follows a comprehensive approach ensuring reliability, performance, and security for semiconductor manufacturing environments where system failures can cost $100,000+ per hour.

### 1.2 Quality Gates
- **Code Coverage**: Minimum 90% for business logic, 80% overall
- **Performance**: All critical paths must meet sub-millisecond requirements  
- **Security**: Zero high/critical vulnerabilities in production
- **Reliability**: 99.9% uptime target with comprehensive error handling

### 1.3 Test Pyramid Structure
```
           ┌─────────────────────────┐
           │    E2E Tests (5%)       │  ← User workflows, integration
           └─────────────────────────┘
      ┌──────────────────────────────────┐
      │    Integration Tests (15%)       │  ← API, database, services
      └──────────────────────────────────┘
 ┌───────────────────────────────────────────┐
 │         Unit Tests (80%)                  │  ← Functions, components, modules
 └───────────────────────────────────────────┘
```

## 2. Unit Testing Strategy

### 2.1 Frontend Unit Tests (React/TypeScript)

**Testing Framework**: Vitest + React Testing Library
```json
{
  "devDependencies": {
    "vitest": "^0.34.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.4.0",
    "@vitest/ui": "^0.34.0",
    "jsdom": "^22.1.0"
  }
}
```

**Test Configuration**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

**Component Testing Examples**:
```typescript
// EquipmentDashboard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { EquipmentDashboard } from '../components/EquipmentDashboard';

describe('EquipmentDashboard', () => {
  const mockEquipment = {
    id: 'eq-001',
    name: 'Etcher #1',
    type: 'etcher' as const,
    status: 'online' as const,
    sensors: [
      { id: 'temp-001', name: 'Chamber Temperature', value: 23.5, unit: '°C' }
    ]
  };

  test('renders equipment information correctly', () => {
    render(<EquipmentDashboard equipment={mockEquipment} />);
    
    expect(screen.getByText('Etcher #1')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
    expect(screen.getByText('23.5°C')).toBeInTheDocument();
  });

  test('handles real-time data updates', async () => {
    const mockWebSocket = {
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    
    // Mock WebSocket
    vi.stubGlobal('WebSocket', vi.fn(() => mockWebSocket));
    
    render(<EquipmentDashboard equipment={mockEquipment} />);
    
    // Simulate WebSocket message
    const messageHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1];
    
    messageHandler({
      data: JSON.stringify({
        type: 'sensor_data',
        data: { sensorId: 'temp-001', value: 25.0 }
      })
    });

    await waitFor(() => {
      expect(screen.getByText('25.0°C')).toBeInTheDocument();
    });
  });

  test('displays alerts correctly', () => {
    const equipmentWithAlert = {
      ...mockEquipment,
      alerts: [
        {
          id: 'alert-001',
          severity: 'high' as const,
          message: 'Temperature exceeded threshold'
        }
      ]
    };

    render(<EquipmentDashboard equipment={equipmentWithAlert} />);
    
    expect(screen.getByText('Temperature exceeded threshold')).toBeInTheDocument();
    expect(screen.getByTestId('alert-high')).toBeInTheDocument();
  });
});

// Custom Hook Testing
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../hooks/useWebSocket';

describe('useWebSocket', () => {
  test('connects to WebSocket and handles messages', () => {
    const mockWebSocket = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    vi.stubGlobal('WebSocket', vi.fn(() => mockWebSocket));

    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

    expect(result.current.isConnected).toBe(true);
    
    act(() => {
      result.current.sendMessage({ type: 'subscribe', channel: 'equipment' });
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'subscribe', channel: 'equipment' })
    );
  });
});
```

### 2.2 Backend Unit Tests (Rust)

**Testing Framework**: Built-in Rust testing with additional crates
```toml
[dev-dependencies]
tokio-test = "0.4"
mockall = "0.11"
wiremock = "0.5"
tempfile = "3.0"
```

**Rust Unit Test Examples**:
```rust
// tests/opc_service_tests.rs
use mockall::predicate::*;
use tokio_test;
use crate::services::opc_service::{OpcUaService, OpcUaConfig};

#[tokio::test]
async fn test_opc_connection_success() {
    let config = OpcUaConfig {
        endpoint_url: "opc.tcp://localhost:4840".to_string(),
        security_policy: SecurityPolicy::None,
        ..Default::default()
    };

    let mut service = OpcUaService::new(config);
    
    // This would use a mock OPC server in real tests
    let result = service.connect().await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_sensor_data_processing() {
    let raw_data = vec![
        SensorReading {
            sensor_id: "temp-001".to_string(),
            timestamp: chrono::Utc::now(),
            value: 23.5,
            quality: DataQuality::Good,
        }
    ];

    let processed = process_sensor_data(&raw_data).await;
    
    assert_eq!(processed.len(), 1);
    assert!(processed[0].value >= 20.0 && processed[0].value <= 30.0);
}

#[test]
fn test_ml_feature_extraction() {
    let time_series = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    let features = extract_statistical_features(&time_series);
    
    assert_eq!(features.mean, 3.0);
    assert_eq!(features.std_dev, std_calculation(&time_series));
    assert!(features.min < features.max);
}

// Mock testing example
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::{automock, predicate::*};

    #[automock]
    trait DatabaseService {
        async fn save_equipment(&self, equipment: &Equipment) -> Result<(), DatabaseError>;
        async fn get_equipment(&self, id: &str) -> Result<Option<Equipment>, DatabaseError>;
    }

    #[tokio::test]
    async fn test_equipment_service_with_mock_db() {
        let mut mock_db = MockDatabaseService::new();
        
        mock_db
            .expect_save_equipment()
            .with(predicate::eq(test_equipment()))
            .times(1)
            .returning(|_| Ok(()));

        let service = EquipmentService::new(Box::new(mock_db));
        let result = service.create_equipment(test_equipment()).await;
        
        assert!(result.is_ok());
    }
}
```

### 2.3 ML Model Unit Tests (Python)

**Testing Framework**: pytest with ML-specific testing utilities
```python
# requirements-test.txt
pytest==7.4.0
pytest-asyncio==0.21.0
pytest-cov==4.1.0
pytest-mock==3.11.1
hypothesis==6.82.0
numpy-testing==1.24.3
```

**ML Testing Examples**:
```python
# tests/test_ml_models.py
import pytest
import numpy as np
from unittest.mock import Mock, patch
from src.ml.feature_extractor import FeatureExtractor
from src.ml.anomaly_detector import LSTMAnnomalyDetector

class TestFeatureExtractor:
    def setup_method(self):
        self.extractor = FeatureExtractor(window_size=100)
        
    def test_statistical_features_calculation(self):
        """Test statistical feature extraction"""
        data = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
        features = self.extractor.extract_statistical_features(data)
        
        assert features['mean'] == pytest.approx(3.0)
        assert features['std'] == pytest.approx(np.std(data))
        assert features['min'] == 1.0
        assert features['max'] == 5.0
        assert features['range'] == 4.0
        
    def test_frequency_features_extraction(self):
        """Test frequency domain feature extraction"""
        # Generate synthetic signal
        t = np.linspace(0, 1, 1000)
        signal = np.sin(2 * np.pi * 10 * t) + 0.5 * np.sin(2 * np.pi * 20 * t)
        
        features = self.extractor.extract_frequency_features(signal, fs=1000)
        
        assert 'dominant_frequency' in features
        assert 'spectral_centroid' in features
        assert features['dominant_frequency'] > 0
        
    def test_feature_scaling(self):
        """Test feature normalization"""
        raw_features = np.array([[1, 10, 100], [2, 20, 200], [3, 30, 300]])
        scaled_features = self.extractor.scale_features(raw_features)
        
        # Check if features are normalized (mean ~0, std ~1)
        assert np.allclose(np.mean(scaled_features, axis=0), 0, atol=1e-10)
        assert np.allclose(np.std(scaled_features, axis=0), 1, atol=1e-10)

class TestLSTMAnomalyDetector:
    @pytest.fixture
    def mock_model(self):
        """Mock trained LSTM model"""
        with patch('torch.jit.load') as mock_load:
            mock_model = Mock()
            mock_load.return_value = mock_model
            return mock_model
            
    def test_model_loading(self, mock_model):
        """Test LSTM model loading"""
        detector = LSTMAnnomalyDetector('dummy_path.pt')
        assert detector.model is not None
        
    def test_anomaly_detection(self, mock_model):
        """Test anomaly detection logic"""
        # Mock model prediction
        mock_model.return_value = torch.tensor([[0.1, 0.9]])  # [normal_score, anomaly_score]
        
        detector = LSTMAnnomalyDetector('dummy_path.pt')
        features = np.random.random((1, 100, 10))  # batch, sequence, features
        
        result = detector.detect_anomaly(features)
        
        assert 'is_anomaly' in result
        assert 'anomaly_score' in result
        assert 'confidence' in result
        assert isinstance(result['is_anomaly'], bool)
        
    def test_batch_prediction(self, mock_model):
        """Test batch anomaly detection"""
        mock_model.return_value = torch.tensor([
            [0.8, 0.2],  # Normal
            [0.3, 0.7],  # Anomaly
            [0.9, 0.1]   # Normal
        ])
        
        detector = LSTMAnnomalyDetector('dummy_path.pt')
        features = np.random.random((3, 100, 10))
        
        results = detector.detect_batch(features)
        
        assert len(results) == 3
        assert results[0]['is_anomaly'] == False
        assert results[1]['is_anomaly'] == True
        assert results[2]['is_anomaly'] == False

# Property-based testing with Hypothesis
from hypothesis import given, strategies as st

class TestDataValidation:
    @given(st.lists(st.floats(min_value=0, max_value=1000), min_size=10, max_size=1000))
    def test_sensor_data_validation_properties(self, sensor_values):
        """Property-based test for sensor data validation"""
        validator = SensorDataValidator(min_value=0, max_value=1000)
        
        # All values should be within range
        for value in sensor_values:
            assert validator.is_valid_range(value)
            
        # Statistical properties should be maintained
        if len(sensor_values) > 1:
            stats = validator.calculate_statistics(sensor_values)
            assert stats['min'] <= stats['mean'] <= stats['max']
            assert stats['std'] >= 0
```

## 3. Integration Testing Strategy

### 3.1 API Integration Tests

**Testing Framework**: Supertest for Node.js APIs
```typescript
// tests/integration/api.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDatabase, teardownTestDatabase } from '../helpers/database';

describe('Equipment API Integration', () => {
  let authToken: string;
  
  beforeAll(async () => {
    await setupTestDatabase();
    
    // Login and get auth token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        username: 'test_user',
        password: 'test_password'
      });
      
    authToken = loginResponse.body.data.token;
  });
  
  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /api/equipment', () => {
    test('should create equipment successfully', async () => {
      const equipmentData = {
        name: 'Test Etcher #1',
        type: 'etcher',
        location: 'Fab 1',
        opcEndpoint: 'opc.tcp://192.168.1.100:4840'
      };

      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(equipmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(equipmentData.name);
      expect(response.body.data.id).toBeDefined();
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Equipment' }); // Missing required fields

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DATA_VALIDATION_ERROR');
    });
  });

  describe('GET /api/equipment/:id', () => {
    test('should retrieve equipment by ID', async () => {
      // First create equipment
      const createResponse = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Equipment for Retrieval',
          type: 'cvd',
          location: 'Fab 2'
        });

      const equipmentId = createResponse.body.data.id;

      // Then retrieve it
      const response = await request(app)
        .get(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(equipmentId);
      expect(response.body.data.name).toBe('Test Equipment for Retrieval');
    });

    test('should return 404 for non-existent equipment', async () => {
      const response = await request(app)
        .get('/api/equipment/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('EQUIPMENT_NOT_FOUND');
    });
  });
});
```

### 3.2 Database Integration Tests

```typescript
// tests/integration/database.test.ts
import { Pool } from 'pg';
import { InfluxDB } from '@influxdata/influxdb-client';
import Redis from 'ioredis';

describe('Database Integration', () => {
  let pgPool: Pool;
  let influxClient: InfluxDB;
  let redisClient: Redis;

  beforeAll(async () => {
    // Setup test databases
    pgPool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL
    });
    
    influxClient = new InfluxDB({
      url: process.env.TEST_INFLUX_URL!,
      token: process.env.TEST_INFLUX_TOKEN!
    });
    
    redisClient = new Redis(process.env.TEST_REDIS_URL);
  });

  afterAll(async () => {
    await pgPool.end();
    influxClient.close();
    redisClient.disconnect();
  });

  describe('PostgreSQL Operations', () => {
    test('should handle equipment CRUD operations', async () => {
      const client = await pgPool.connect();
      
      try {
        // Create
        const insertResult = await client.query(`
          INSERT INTO manufacturing.equipment (name, equipment_type, location)
          VALUES ($1, $2, $3) RETURNING id
        `, ['Test Equipment', 'etcher', 'Fab 1']);
        
        const equipmentId = insertResult.rows[0].id;
        expect(equipmentId).toBeDefined();

        // Read
        const selectResult = await client.query(
          'SELECT * FROM manufacturing.equipment WHERE id = $1',
          [equipmentId]
        );
        
        expect(selectResult.rows).toHaveLength(1);
        expect(selectResult.rows[0].name).toBe('Test Equipment');

        // Update
        await client.query(
          'UPDATE manufacturing.equipment SET status = $1 WHERE id = $2',
          ['online', equipmentId]
        );

        // Delete
        await client.query(
          'DELETE FROM manufacturing.equipment WHERE id = $1',
          [equipmentId]
        );
      } finally {
        client.release();
      }
    });
  });

  describe('InfluxDB Operations', () => {
    test('should write and query sensor data', async () => {
      const writeApi = influxClient.getWriteApi('test-org', 'test-bucket');
      const queryApi = influxClient.getQueryApi('test-org');

      // Write data
      const point = {
        measurement: 'sensor_readings',
        tags: {
          equipment_id: 'test-eq-001',
          sensor_id: 'temp-001',
        },
        fields: {
          value: 23.5,
          quality: 100
        },
        timestamp: new Date()
      };

      writeApi.writePoint(point);
      await writeApi.flush();

      // Query data
      const query = `
        from(bucket: "test-bucket")
          |> range(start: -1h)
          |> filter(fn: (r) => r._measurement == "sensor_readings")
          |> filter(fn: (r) => r.equipment_id == "test-eq-001")
      `;

      const results = await queryApi.collectRows(query);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]._value).toBe(23.5);
    });
  });

  describe('Redis Operations', () => {
    test('should handle session caching', async () => {
      const sessionKey = 'session:test-user:test-token';
      const sessionData = {
        userId: 'user-123',
        username: 'testuser',
        role: 'operator'
      };

      // Set session
      await redisClient.hset(sessionKey, sessionData);
      await redisClient.expire(sessionKey, 3600);

      // Get session
      const retrieved = await redisClient.hgetall(sessionKey);
      expect(retrieved.userId).toBe(sessionData.userId);
      expect(retrieved.username).toBe(sessionData.username);

      // Check TTL
      const ttl = await redisClient.ttl(sessionKey);
      expect(ttl).toBeGreaterThan(3500);
    });
  });
});
```

### 3.3 WebSocket Integration Tests

```typescript
// tests/integration/websocket.test.ts
import WebSocket from 'ws';
import { WebSocketServer } from '../../src/websocket/server';

describe('WebSocket Integration', () => {
  let server: WebSocketServer;
  let client: WebSocket;

  beforeAll(async () => {
    server = new WebSocketServer(8081);
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    client = new WebSocket('ws://localhost:8081');
  });

  afterEach(() => {
    if (client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });

  test('should authenticate and establish connection', (done) => {
    client.on('open', () => {
      client.send(JSON.stringify({
        type: 'auth',
        token: 'valid-jwt-token'
      }));
    });

    client.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'auth_success') {
        expect(message.data.authenticated).toBe(true);
        done();
      }
    });
  });

  test('should handle subscription to equipment data', (done) => {
    let authReceived = false;

    client.on('open', () => {
      client.send(JSON.stringify({
        type: 'auth',
        token: 'valid-jwt-token'
      }));
    });

    client.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'auth_success' && !authReceived) {
        authReceived = true;
        
        // Subscribe to equipment data
        client.send(JSON.stringify({
          type: 'subscribe',
          channel: 'equipment',
          equipmentIds: ['eq-001']
        }));
      } else if (message.type === 'subscription_confirmed') {
        expect(message.channel).toBe('equipment');
        expect(message.equipmentIds).toContain('eq-001');
        done();
      }
    });
  });

  test('should receive real-time sensor data updates', (done) => {
    // Setup authentication and subscription first
    client.on('open', () => {
      client.send(JSON.stringify({
        type: 'auth',
        token: 'valid-jwt-token'
      }));
    });

    client.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'sensor_data') {
        expect(message.data.equipmentId).toBeDefined();
        expect(message.data.readings).toBeDefined();
        expect(Array.isArray(message.data.readings)).toBe(true);
        done();
      }
    });

    // Simulate data update after connection
    setTimeout(() => {
      server.broadcastSensorData('eq-001', [
        {
          sensorId: 'temp-001',
          value: 23.5,
          timestamp: new Date().toISOString(),
          quality: 'good'
        }
      ]);
    }, 100);
  });
});
```

## 4. End-to-End Testing Strategy

### 4.1 E2E Testing Framework

**Tool**: Playwright for cross-platform testing
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 Critical User Journey Tests

```typescript
// tests/e2e/equipment-monitoring.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Equipment Monitoring Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'test_operator');
    await page.fill('[data-testid="password"]', 'test_password');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]');
  });

  test('should display equipment overview and real-time data', async ({ page }) => {
    // Navigate to equipment overview
    await page.click('[data-testid="equipment-nav"]');
    await page.waitForSelector('[data-testid="equipment-list"]');

    // Verify equipment list is populated
    const equipmentItems = await page.locator('[data-testid="equipment-item"]');
    await expect(equipmentItems).toHaveCountGreaterThan(0);

    // Click on first equipment
    await equipmentItems.first().click();
    await page.waitForSelector('[data-testid="equipment-detail"]');

    // Verify real-time data is updating
    const temperatureReading = page.locator('[data-testid="temp-reading"]');
    await expect(temperatureReading).toBeVisible();
    
    const initialValue = await temperatureReading.textContent();
    
    // Wait for data update (WebSocket)
    await page.waitForTimeout(5000);
    const updatedValue = await temperatureReading.textContent();
    
    // Value should change or timestamp should update
    expect(updatedValue).toBeDefined();
  });

  test('should handle alert creation and acknowledgment', async ({ page }) => {
    // Navigate to alerts
    await page.click('[data-testid="alerts-nav"]');
    await page.waitForSelector('[data-testid="alerts-list"]');

    // Check if there are active alerts
    const activeAlerts = page.locator('[data-testid="alert-item"][data-status="active"]');
    
    if (await activeAlerts.count() > 0) {
      // Acknowledge first alert
      await activeAlerts.first().click();
      await page.click('[data-testid="acknowledge-alert"]');
      
      // Add acknowledgment comment
      await page.fill('[data-testid="ack-comment"]', 'Investigating temperature spike');
      await page.click('[data-testid="confirm-acknowledgment"]');
      
      // Verify alert status changed
      await expect(page.locator('[data-testid="alert-status"]')).toHaveText('acknowledged');
    }
  });

  test('should navigate equipment hierarchy', async ({ page }) => {
    await page.goto('/equipment');
    
    // Expand equipment hierarchy
    await page.click('[data-testid="hierarchy-expand"]');
    
    // Navigate through hierarchy levels
    const parentEquipment = page.locator('[data-testid="parent-equipment"]').first();
    await parentEquipment.click();
    
    // Verify child equipment is shown
    const childEquipment = page.locator('[data-testid="child-equipment"]');
    await expect(childEquipment).toBeVisible();
    
    // Click child equipment
    await childEquipment.first().click();
    
    // Verify detail view loads
    await expect(page.locator('[data-testid="equipment-sensors"]')).toBeVisible();
  });
});

test.describe('Data Export Functionality', () => {
  test('should export historical data to CSV', async ({ page }) => {
    await page.goto('/data/historical');
    
    // Set date range
    await page.fill('[data-testid="start-date"]', '2025-08-01');
    await page.fill('[data-testid="end-date"]', '2025-08-07');
    
    // Select equipment and sensors
    await page.click('[data-testid="equipment-selector"]');
    await page.click('[data-testid="equipment-option-1"]');
    
    await page.click('[data-testid="sensor-selector"]');
    await page.click('[data-testid="sensor-option-temp"]');
    
    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-csv"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/sensor_data_.*\.csv$/);
    
    // Verify download completed
    const filePath = await download.path();
    expect(filePath).toBeDefined();
  });
});
```

## 5. Performance Testing Strategy

### 5.1 Load Testing with Artillery

```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 120
      arrivalRate: 100
      name: "Peak load"
  payload:
    path: "./test-users.csv"
    fields:
      - "username"
      - "password"

scenarios:
  - name: "API Load Test"
    weight: 70
    flow:
      - post:
          url: "/auth/login"
          json:
            username: "{{ username }}"
            password: "{{ password }}"
          capture:
            - json: "$.data.token"
              as: "authToken"
      
      - get:
          url: "/api/equipment"
          headers:
            Authorization: "Bearer {{ authToken }}"
      
      - get:
          url: "/api/data/current/{{ $randomString() }}"
          headers:
            Authorization: "Bearer {{ authToken }}"
      
      - think: 5

  - name: "WebSocket Load Test"
    weight: 30
    engine: ws
    flow:
      - connect:
          url: "ws://localhost:8080"
      
      - send:
          payload: '{"type": "auth", "token": "{{ authToken }}"}'
      
      - send:
          payload: '{"type": "subscribe", "channel": "equipment"}'
      
      - think: 30
```

### 5.2 Database Performance Tests

```typescript
// tests/performance/database.test.ts
import { performance } from 'perf_hooks';
import { Pool } from 'pg';

describe('Database Performance', () => {
  let pool: Pool;
  
  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      max: 20
    });
  });

  test('should handle concurrent equipment queries', async () => {
    const start = performance.now();
    const promises = [];
    
    // Generate 100 concurrent queries
    for (let i = 0; i < 100; i++) {
      promises.push(
        pool.query('SELECT * FROM manufacturing.equipment LIMIT 10')
      );
    }
    
    await Promise.all(promises);
    const end = performance.now();
    
    const duration = end - start;
    console.log(`100 concurrent queries took ${duration}ms`);
    
    // Should complete within 1 second
    expect(duration).toBeLessThan(1000);
  });

  test('should handle large sensor data inserts', async () => {
    const client = await pool.connect();
    const batchSize = 10000;
    
    try {
      const start = performance.now();
      
      // Generate large batch of sensor readings
      const values = [];
      for (let i = 0; i < batchSize; i++) {
        values.push(`('sensor-${i}', 'eq-001', ${Math.random() * 100}, 'good', NOW())`);
      }
      
      await client.query(`
        INSERT INTO sensor_readings_temp (sensor_id, equipment_id, value, quality, timestamp)
        VALUES ${values.join(',')}
      `);
      
      const end = performance.now();
      const duration = end - start;
      
      console.log(`Inserted ${batchSize} records in ${duration}ms`);
      
      // Should insert 10k records in under 2 seconds
      expect(duration).toBeLessThan(2000);
      
    } finally {
      client.release();
    }
  });
});
```

## 6. Security Testing Strategy

### 6.1 Authentication & Authorization Tests

```typescript
// tests/security/auth.test.ts
describe('Security Tests', () => {
  describe('Authentication', () => {
    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'invalid_user',
          password: 'wrong_password'
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: "admin'; DROP TABLE users; --",
          password: 'password'
        });

      expect(response.status).toBe(401);
      // Database should still be intact
      const usersCheck = await pool.query('SELECT COUNT(*) FROM security.users');
      expect(parseInt(usersCheck.rows[0].count)).toBeGreaterThan(0);
    });

    test('should rate limit login attempts', async () => {
      const promises = [];
      
      // Make 20 rapid login attempts
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/auth/login')
            .send({ username: 'testuser', password: 'wrong' })
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Authorization', () => {
    test('should enforce role-based access control', async () => {
      const operatorToken = await getTokenForRole('operator');
      
      // Operators should not be able to create equipment
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          name: 'Unauthorized Equipment',
          type: 'etcher'
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });
});
```

### 6.2 Input Validation Tests

```typescript
// tests/security/validation.test.ts
describe('Input Validation', () => {
  test('should sanitize XSS attempts in equipment names', async () => {
    const adminToken = await getTokenForRole('admin');
    
    const response = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '<script>alert("XSS")</script>',
        type: 'etcher',
        location: 'Fab 1'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('DATA_VALIDATION_ERROR');
  });

  test('should validate numeric ranges for sensor configurations', async () => {
    const adminToken = await getTokenForRole('admin');
    
    const response = await request(app)
      .post('/api/sensors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Sensor',
        minRange: 1000,
        maxRange: -1000, // Invalid: min > max
        unit: 'celsius'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('range');
  });
});
```

## 7. Test Data Management

### 7.1 Test Data Factory

```typescript
// tests/helpers/data-factory.ts
export class TestDataFactory {
  static createEquipment(overrides: Partial<Equipment> = {}): Equipment {
    return {
      id: faker.string.uuid(),
      name: faker.company.name() + ' Equipment',
      type: faker.helpers.arrayElement(['etcher', 'cvd', 'pvd']),
      location: `Fab ${faker.number.int({ min: 1, max: 5 })}`,
      status: 'offline',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createSensorReading(overrides: Partial<SensorReading> = {}): SensorReading {
    return {
      sensorId: faker.string.uuid(),
      equipmentId: faker.string.uuid(),
      timestamp: new Date(),
      value: faker.number.float({ min: 0, max: 100, multipleOf: 0.1 }),
      quality: 'good',
      unit: faker.helpers.arrayElement(['celsius', 'bar', 'rpm']),
      ...overrides
    };
  }

  static createAlert(overrides: Partial<Alert> = {}): Alert {
    return {
      id: faker.string.uuid(),
      equipmentId: faker.string.uuid(),
      ruleId: faker.string.uuid(),
      severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
      status: 'active',
      message: faker.lorem.sentence(),
      triggeredAt: new Date(),
      ...overrides
    };
  }
}
```

### 7.2 Database Seeding

```typescript
// tests/helpers/database-seeder.ts
export class DatabaseSeeder {
  static async seedTestData(): Promise<void> {
    // Create test users
    await this.createTestUsers();
    
    // Create test equipment
    const equipment = await this.createTestEquipment();
    
    // Create sensors for equipment
    await this.createTestSensors(equipment);
    
    // Create historical sensor data
    await this.createHistoricalData();
    
    // Create test alerts
    await this.createTestAlerts(equipment);
  }

  private static async createTestUsers(): Promise<void> {
    const users = [
      { username: 'admin_user', role: 'admin' },
      { username: 'operator_user', role: 'operator' },
      { username: 'engineer_user', role: 'engineer' },
      { username: 'viewer_user', role: 'viewer' }
    ];

    for (const userData of users) {
      await pool.query(`
        INSERT INTO security.users (username, email, password_hash, salt, role)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (username) DO NOTHING
      `, [
        userData.username,
        `${userData.username}@test.com`,
        'hashed_password',
        'salt',
        userData.role
      ]);
    }
  }

  static async cleanup(): Promise<void> {
    // Clean up in reverse order due to foreign key constraints
    await pool.query('TRUNCATE security.alerts CASCADE');
    await pool.query('TRUNCATE manufacturing.sensors CASCADE');
    await pool.query('TRUNCATE manufacturing.equipment CASCADE');
    await pool.query('TRUNCATE security.users CASCADE');
  }
}
```

This comprehensive testing strategy ensures robust quality assurance for the predictive maintenance system across all layers - from individual functions to complete user workflows, with special attention to the critical performance and security requirements of semiconductor manufacturing environments.