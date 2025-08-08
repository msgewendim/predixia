# System Architecture Document
## AI-Powered Predictive Maintenance Software

### Version 1.0 | Date: August 2025

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TAURI DESKTOP APPLICATION                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   React UI      │  │  WebView Bridge │  │   Rust Backend  │  │
│  │   (Frontend)    │◄─┤   (IPC Layer)   │─►│   (Core Engine) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Python ML     │  │   Node.js APIs  │  │   Database      │  │
│  │   Services      │  │   (REST/GraphQL)│  │   (PostgreSQL/  │  │
│  │   (ONNX/PyTorch)│  │                 │  │    InfluxDB)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Components

**Frontend Layer (React + TypeScript)**
- Real-time dashboard components
- Equipment monitoring interfaces
- Alert management system
- Data visualization components
- Configuration management UI

**Backend Layer (Rust + Tauri)**
- System resource management
- File system operations
- Hardware interface layer
- Security and encryption
- Process management

**Services Layer (Node.js + Python)**
- AI/ML inference engine
- Data processing pipeline
- Protocol adapters
- API gateway
- Background job processing

## 2. Detailed Component Architecture

### 2.1 Frontend Architecture (React)

```typescript
src/
├── components/
│   ├── common/           # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   ├── equipment/        # Equipment monitoring
│   ├── alerts/          # Alert management
│   └── charts/          # Data visualization
├── hooks/               # Custom React hooks
├── services/           # API service layer
├── stores/             # State management (Zustand)
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── assets/             # Static assets
```

**State Management Strategy**
```typescript
// Zustand stores for different domains
interface AppStore {
  // Equipment state
  equipment: EquipmentState[];
  
  // Real-time data
  sensorData: SensorDataMap;
  
  // Alert management
  alerts: Alert[];
  
  // User preferences
  userSettings: UserSettings;
}

// Real-time data updates via WebSocket
const useWebSocket = () => {
  const { updateSensorData, addAlert } = useAppStore();
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/realtime');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sensor_data') {
        updateSensorData(data.payload);
      } else if (data.type === 'alert') {
        addAlert(data.payload);
      }
    };
  }, []);
};
```

### 2.2 Backend Architecture (Rust + Tauri)

```rust
// Main application structure
src/
├── main.rs              # Application entry point
├── commands/            # Tauri command handlers
│   ├── data.rs         # Data operations
│   ├── equipment.rs    # Equipment management
│   ├── ml.rs           # ML model operations
│   └── system.rs       # System operations
├── services/           # Core business logic
│   ├── data_service.rs # Data processing
│   ├── opc_service.rs  # OPC-UA client
│   ├── ml_service.rs   # ML inference
│   └── security_service.rs # Security operations
├── models/             # Data models
├── utils/              # Utility functions
└── config/             # Configuration management
```

**Core Service Implementation**
```rust
// OPC-UA client service
#[derive(Debug)]
pub struct OpcUaService {
    client: Arc<Mutex<Client>>,
    subscriptions: HashMap<String, Subscription>,
}

impl OpcUaService {
    pub async fn connect(&mut self, endpoint: &str) -> Result<(), Box<dyn Error>> {
        let mut client = self.client.lock().await;
        client.connect_to_endpoint(endpoint, SecurityPolicy::None).await?;
        Ok(())
    }
    
    pub async fn subscribe_to_variables(
        &mut self, 
        variables: Vec<String>
    ) -> Result<(), Box<dyn Error>> {
        // Implementation for variable subscription
        Ok(())
    }
}

// ML inference service
#[derive(Debug)]
pub struct MLService {
    session: Arc<Mutex<ort::Session>>,
    model_config: ModelConfig,
}

impl MLService {
    pub async fn predict(&self, input: &[f32]) -> Result<PredictionResult, Box<dyn Error>> {
        let session = self.session.lock().await;
        let input_tensor = ndarray::Array1::from_vec(input.to_vec());
        let outputs = session.run(vec![input_tensor.into_dyn()])?;
        
        // Process outputs and return prediction
        Ok(PredictionResult::new(outputs))
    }
}
```

### 2.3 Services Architecture (Node.js + Python)

**Node.js API Service**
```javascript
// Express.js API structure
src/
├── app.js              # Application setup
├── routes/             # API routes
│   ├── equipment.js    # Equipment endpoints
│   ├── data.js        # Data endpoints
│   ├── ml.js          # ML endpoints
│   └── alerts.js      # Alert endpoints
├── middleware/         # Custom middleware
├── services/          # Business logic
├── models/            # Database models
└── utils/             # Utility functions

// WebSocket server for real-time data
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  // Subscribe to data streams
  const dataSubscription = dataStream.subscribe((data) => {
    ws.send(JSON.stringify({
      type: 'sensor_data',
      payload: data
    }));
  });
  
  ws.on('close', () => {
    dataSubscription.unsubscribe();
  });
});
```

**Python ML Service**
```python
# FastAPI ML service structure
src/
├── main.py             # FastAPI application
├── models/             # ML model definitions
│   ├── lstm_model.py   # LSTM implementation
│   ├── isolation_forest.py # Anomaly detection
│   └── feature_engineering.py # Feature processing
├── services/           # ML services
│   ├── inference.py    # Model inference
│   ├── training.py     # Model training
│   └── preprocessing.py # Data preprocessing
├── utils/              # Utility functions
└── config/             # Configuration

# ONNX model inference
import onnxruntime as ort
from typing import List, Dict, Any

class InferenceService:
    def __init__(self, model_path: str):
        self.session = ort.InferenceSession(model_path)
        
    async def predict(self, features: List[float]) -> Dict[str, Any]:
        inputs = {self.session.get_inputs()[0].name: [features]}
        outputs = self.session.run(None, inputs)
        
        return {
            'prediction': outputs[0][0],
            'confidence': outputs[1][0] if len(outputs) > 1 else None,
            'timestamp': datetime.utcnow().isoformat()
        }
```

## 3. Data Architecture

### 3.1 Database Design

**Time-Series Data (InfluxDB)**
```sql
-- Measurement schema
sensor_data
  - time (timestamp)
  - equipment_id (tag)
  - sensor_id (tag)
  - parameter_name (tag)
  - value (field)
  - quality (field)
  - unit (tag)

-- Prediction results
predictions
  - time (timestamp)
  - equipment_id (tag)
  - model_id (tag)
  - prediction_value (field)
  - confidence_score (field)
  - anomaly_score (field)
```

**Relational Data (PostgreSQL)**
```sql
-- Equipment configuration
CREATE TABLE equipment (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert definitions
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    equipment_id UUID REFERENCES equipment(id),
    condition JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL,
    enabled BOOLEAN DEFAULT true
);

-- User management
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    permissions JSONB
);
```

### 3.2 Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Equipment     │───►│  OPC-UA Client  │───►│  Data Ingestion │
│   (Sensors)     │    │   (Rust)        │    │    Pipeline     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Storage  │◄───│  Data Validation│◄───│  Real-time      │
│  (InfluxDB +    │    │   & Cleansing   │    │  Processing     │
│   PostgreSQL)   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Alert Engine   │◄───│   ML Inference  │◄───│  Feature        │
│                 │    │    (Python)     │    │  Engineering    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React UI (Dashboard)                        │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Security Architecture

### 4.1 Authentication & Authorization

```rust
// JWT-based authentication
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    sub: String,        // User ID
    role: String,       // User role
    permissions: Vec<String>,
    exp: usize,         // Expiration
}

// Role-based access control
pub enum Permission {
    ViewDashboard,
    ConfigureAlerts,
    ManageEquipment,
    AdminAccess,
}

pub fn check_permission(user_role: &str, required: Permission) -> bool {
    match (user_role, required) {
        ("admin", _) => true,
        ("operator", Permission::ViewDashboard) => true,
        ("engineer", Permission::ConfigureAlerts) => true,
        _ => false,
    }
}
```

### 4.2 Data Encryption

```rust
// AES-256 encryption for sensitive data
use aes_gcm::{Aes256Gcm, Key, Nonce};

pub struct DataEncryption {
    cipher: Aes256Gcm,
}

impl DataEncryption {
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>, Box<dyn Error>> {
        let nonce = Nonce::from_slice(b"unique nonce");
        let ciphertext = self.cipher.encrypt(nonce, plaintext)?;
        Ok(ciphertext)
    }
}
```

## 5. Performance Optimization

### 5.1 Memory Management

```rust
// Efficient data structures for high-frequency data
use ring_channel::RingReceiver;

pub struct SensorDataBuffer {
    buffer: RingReceiver<SensorReading>,
    max_size: usize,
}

impl SensorDataBuffer {
    pub fn push(&mut self, reading: SensorReading) {
        if self.buffer.len() >= self.max_size {
            // Remove oldest reading
            self.buffer.try_recv();
        }
        self.buffer.try_send(reading).ok();
    }
}
```

### 5.2 Caching Strategy

```typescript
// React Query for client-side caching
import { useQuery } from '@tanstack/react-query';

const useEquipmentData = (equipmentId: string) => {
  return useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => api.getEquipment(equipmentId),
    staleTime: 30000, // 30 seconds
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

// Redis caching for API responses
const redis = require('redis');
const client = redis.createClient();

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```

## 6. Deployment Architecture

### 6.1 Air-Gapped Deployment

```bash
# Build script for air-gapped deployment
#!/bin/bash

# Build Tauri application
npm run tauri build

# Package all dependencies
mkdir -p deployment/
cp -r target/release/ deployment/app/
cp -r services/ deployment/
cp -r database/ deployment/

# Create offline installer
tar -czf predictive-maintenance-v1.0.tar.gz deployment/

# Generate checksums
sha256sum predictive-maintenance-v1.0.tar.gz > checksums.txt
```

### 6.2 Installation Architecture

```bash
# Installation script
#!/bin/bash

# Verify checksums
sha256sum -c checksums.txt

# Install system dependencies
sudo apt-get update
sudo apt-get install -y postgresql influxdb redis-server

# Setup application
tar -xzf predictive-maintenance-v1.0.tar.gz
cd deployment/

# Initialize database
psql -U postgres -f database/schema.sql

# Start services
systemctl start postgresql
systemctl start influxdb
systemctl start redis-server

# Install application
./install.sh
```

## 7. Monitoring & Observability

### 7.1 Application Metrics

```rust
// Prometheus metrics
use prometheus::{Counter, Histogram, Gauge, register_counter};

lazy_static! {
    static ref SENSOR_READINGS_TOTAL: Counter = register_counter!(
        "sensor_readings_total", "Total number of sensor readings processed"
    ).unwrap();
    
    static ref PREDICTION_LATENCY: Histogram = register_histogram!(
        "prediction_latency_seconds", "Time taken for ML predictions"
    ).unwrap();
}

// Usage in code
SENSOR_READINGS_TOTAL.inc();
let _timer = PREDICTION_LATENCY.start_timer();
```

### 7.2 Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      ml_service: await checkMLService(),
      opc_connection: await checkOPCConnection(),
    }
  };
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'ok');
  res.status(isHealthy ? 200 : 503).json(health);
});
```