# API Specification Document
## AI-Powered Predictive Maintenance Software

### Version 1.0 | Date: August 2025

## 1. API Overview

### 1.1 Architecture
The API follows a microservices architecture with the following components:
- **Main API Gateway**: Port 3000 (Node.js/Express)
- **ML Inference API**: Port 8000 (Python/FastAPI)
- **Real-time WebSocket**: Port 8080
- **Database Services**: PostgreSQL (5432), InfluxDB (8086), Redis (6379)

### 1.2 Authentication
All API endpoints require JWT-based authentication except `/auth/login` and health check endpoints.

**Authentication Header:**
```
Authorization: Bearer <jwt_token>
```

### 1.3 Base URLs
- Production: `https://api.predictive-maintenance.local`
- Development: `http://localhost:3000`
- ML Services: `http://localhost:8000`

## 2. Data Models

### 2.1 Core Models

```typescript
// Equipment Model
interface Equipment {
  id: string;                    // UUID
  name: string;                  // Equipment name
  type: EquipmentType;          // Equipment type enum
  location: string;             // Physical location
  status: OperationalStatus;    // Current status
  opcEndpoint?: string;         // OPC-UA endpoint URL
  configuration: EquipmentConfig; // JSON configuration
  sensors: Sensor[];            // Associated sensors
  createdAt: string;           // ISO 8601 timestamp
  updatedAt: string;           // ISO 8601 timestamp
}

enum EquipmentType {
  ETCHER = "etcher",
  CVD = "cvd",
  PVD = "pvd", 
  CMP = "cmp",
  LITHOGRAPHY = "lithography",
  METROLOGY = "metrology"
}

enum OperationalStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  MAINTENANCE = "maintenance",
  ERROR = "error",
  IDLE = "idle"
}

// Sensor Model
interface Sensor {
  id: string;                   // UUID
  equipmentId: string;         // Parent equipment ID
  name: string;                // Sensor name
  parameterType: string;       // Type of parameter measured
  unit: string;                // Unit of measurement
  minRange: number;            // Minimum value range
  maxRange: number;            // Maximum value range
  samplingRate: number;        // Sampling rate in Hz
  opcNodeId?: string;          // OPC-UA node identifier
  calibration: CalibrationData;
  status: SensorStatus;
}

interface CalibrationData {
  slope: number;
  offset: number;
  lastCalibrated: string;
  calibrationCertificate?: string;
}

enum SensorStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  FAULT = "fault",
  CALIBRATING = "calibrating"
}

// Sensor Reading Model
interface SensorReading {
  sensorId: string;            // Sensor identifier
  equipmentId: string;         // Equipment identifier
  timestamp: string;           // ISO 8601 timestamp
  value: number;               // Sensor value
  quality: DataQuality;        // Data quality indicator
  unit: string;                // Unit of measurement
  metadata?: Record<string, any>; // Additional metadata
}

enum DataQuality {
  GOOD = "good",
  BAD = "bad",
  UNCERTAIN = "uncertain",
  SUBSTITUTE = "substitute"
}

// Alert Model
interface Alert {
  id: string;                  // UUID
  equipmentId: string;         // Associated equipment
  ruleId: string;             // Alert rule that triggered
  severity: AlertSeverity;     // Alert severity level
  status: AlertStatus;         // Current status
  message: string;             // Alert message
  description?: string;        // Detailed description
  triggeredAt: string;         // ISO 8601 timestamp
  acknowledgedAt?: string;     // Acknowledgment timestamp
  acknowledgedBy?: string;     // User who acknowledged
  resolvedAt?: string;         // Resolution timestamp
  metadata: Record<string, any>; // Additional context
}

enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium", 
  HIGH = "high",
  CRITICAL = "critical"
}

enum AlertStatus {
  ACTIVE = "active",
  ACKNOWLEDGED = "acknowledged",
  RESOLVED = "resolved",
  SUPPRESSED = "suppressed"
}

// ML Prediction Model
interface Prediction {
  id: string;                  // UUID
  equipmentId: string;         // Target equipment
  modelId: string;            // ML model used
  predictionType: PredictionType;
  value: number;              // Predicted value
  confidence: number;         // Confidence score (0-1)
  anomalyScore?: number;      // Anomaly score if applicable
  features: number[];         // Input features used
  timestamp: string;          // Prediction timestamp
  metadata: Record<string, any>;
}

enum PredictionType {
  ANOMALY_DETECTION = "anomaly_detection",
  REMAINING_USEFUL_LIFE = "remaining_useful_life",
  FAILURE_PREDICTION = "failure_prediction",
  PERFORMANCE_DEGRADATION = "performance_degradation"
}
```

## 3. REST API Endpoints

### 3.1 Authentication Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "mfaToken": "string" // Optional for 2FA
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "refreshToken": "refresh_token_string",
    "expiresIn": 28800, // seconds
    "user": {
      "id": "uuid",
      "username": "string", 
      "email": "string",
      "role": "admin|operator|engineer|viewer",
      "permissions": ["string"]
    }
  }
}
```

#### POST /auth/refresh
Refresh JWT token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

#### POST /auth/logout
Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

### 3.2 Equipment Management

#### GET /api/equipment
Get all equipment with optional filtering.

**Query Parameters:**
- `type`: Filter by equipment type
- `status`: Filter by operational status
- `location`: Filter by location
- `limit`: Number of items (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "equipment": [Equipment],
    "total": 123,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /api/equipment/:id
Get specific equipment by ID.

**Path Parameters:**
- `id`: Equipment UUID

**Response:**
```json
{
  "success": true,
  "data": Equipment
}
```

#### POST /api/equipment
Create new equipment.

**Request Body:**
```json
{
  "name": "string",
  "type": "EquipmentType",
  "location": "string",
  "opcEndpoint": "string", // optional
  "configuration": {} // JSON object
}
```

#### PUT /api/equipment/:id
Update existing equipment.

**Path Parameters:**
- `id`: Equipment UUID

**Request Body:** Same as POST (partial updates allowed)

#### DELETE /api/equipment/:id
Delete equipment (soft delete).

**Path Parameters:**
- `id`: Equipment UUID

### 3.3 Sensor Management

#### GET /api/equipment/:equipmentId/sensors
Get all sensors for specific equipment.

**Path Parameters:**
- `equipmentId`: Equipment UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "sensors": [Sensor],
    "total": 25
  }
}
```

#### POST /api/equipment/:equipmentId/sensors
Add sensor to equipment.

**Request Body:**
```json
{
  "name": "string",
  "parameterType": "string",
  "unit": "string",
  "minRange": 0,
  "maxRange": 100,
  "samplingRate": 1000,
  "opcNodeId": "string" // optional
}
```

#### PUT /api/sensors/:id
Update sensor configuration.

**Path Parameters:**
- `id`: Sensor UUID

#### DELETE /api/sensors/:id
Remove sensor.

**Path Parameters:**
- `id`: Sensor UUID

### 3.4 Real-Time Data

#### GET /api/data/current/:equipmentId
Get current sensor readings for equipment.

**Path Parameters:**
- `equipmentId`: Equipment UUID

**Query Parameters:**
- `sensors`: Comma-separated sensor IDs (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "equipmentId": "uuid",
    "timestamp": "2025-08-07T10:30:00Z",
    "readings": [SensorReading]
  }
}
```

#### GET /api/data/historical
Get historical sensor data.

**Query Parameters:**
- `equipmentId`: Equipment UUID
- `sensorIds`: Comma-separated sensor IDs
- `startTime`: ISO 8601 timestamp
- `endTime`: ISO 8601 timestamp  
- `aggregation`: `raw|1m|5m|15m|1h|1d` (default: raw)
- `limit`: Max data points (default: 1000)

**Response:**
```json
{
  "success": true,
  "data": {
    "series": [
      {
        "sensorId": "uuid",
        "name": "Temperature Sensor 1",
        "unit": "°C",
        "data": [
          {
            "timestamp": "2025-08-07T10:30:00Z",
            "value": 23.5,
            "quality": "good"
          }
        ]
      }
    ],
    "totalPoints": 1000,
    "aggregation": "1m"
  }
}
```

#### POST /api/data/import
Import historical data from CSV.

**Request Body (multipart/form-data):**
- `file`: CSV file
- `equipmentId`: Equipment UUID
- `config`: Import configuration JSON

**Import Config Example:**
```json
{
  "delimiter": ",",
  "hasHeader": true,
  "timestampColumn": 0,
  "timestampFormat": "yyyy-MM-dd HH:mm:ss",
  "sensorMappings": {
    "1": "sensor_uuid_1",
    "2": "sensor_uuid_2"
  }
}
```

### 3.5 Alert Management

#### GET /api/alerts
Get alerts with filtering and pagination.

**Query Parameters:**
- `equipmentId`: Filter by equipment
- `severity`: Filter by severity level
- `status`: Filter by alert status
- `startTime`: Filter alerts after timestamp
- `endTime`: Filter alerts before timestamp
- `limit`: Pagination limit (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [Alert],
    "total": 150,
    "summary": {
      "active": 12,
      "acknowledged": 3,
      "resolved": 135
    }
  }
}
```

#### GET /api/alerts/:id
Get specific alert details.

#### POST /api/alerts/:id/acknowledge
Acknowledge an alert.

**Request Body:**
```json
{
  "comment": "string" // optional
}
```

#### POST /api/alerts/:id/resolve
Resolve an alert.

**Request Body:**
```json
{
  "resolution": "string",
  "comment": "string" // optional
}
```

#### GET /api/alert-rules
Get alert rules configuration.

#### POST /api/alert-rules
Create new alert rule.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "equipmentId": "uuid", // optional, null for global rules
  "condition": {
    "parameter": "string",
    "operator": "gt|lt|eq|ne|between",
    "threshold": "number|[number, number]",
    "duration": 30 // seconds
  },
  "severity": "AlertSeverity",
  "actions": [
    {
      "type": "notification|email|webhook",
      "config": {} // Action-specific configuration
    }
  ]
}
```

### 3.6 ML Predictions

#### GET /api/predictions/:equipmentId
Get predictions for equipment.

**Path Parameters:**
- `equipmentId`: Equipment UUID

**Query Parameters:**
- `type`: Prediction type filter
- `startTime`: Time range start
- `endTime`: Time range end
- `limit`: Max results (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [Prediction],
    "summary": {
      "anomalies": 5,
      "avgConfidence": 0.87,
      "lastUpdate": "2025-08-07T10:30:00Z"
    }
  }
}
```

#### POST /api/predictions/batch
Request batch prediction for multiple equipment.

**Request Body:**
```json
{
  "equipmentIds": ["uuid"],
  "predictionTypes": ["PredictionType"],
  "timeRange": {
    "startTime": "2025-08-07T09:00:00Z",
    "endTime": "2025-08-07T10:00:00Z"
  }
}
```

### 3.7 ML Model Management

#### GET /api/models
Get available ML models.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "LSTM Anomaly Detector",
      "type": "anomaly_detection",
      "version": "1.2.0",
      "status": "active",
      "accuracy": 0.94,
      "lastTrained": "2025-08-01T12:00:00Z",
      "equipmentTypes": ["etcher", "cvd"]
    }
  ]
}
```

#### POST /api/models/:id/retrain
Trigger model retraining.

**Path Parameters:**
- `id`: Model UUID

**Request Body:**
```json
{
  "trainingPeriod": {
    "startTime": "2025-07-01T00:00:00Z",
    "endTime": "2025-08-01T00:00:00Z"
  },
  "equipmentIds": ["uuid"], // optional, specific equipment
  "hyperparameters": {} // optional overrides
}
```

### 3.8 System Configuration

#### GET /api/config
Get system configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "dataRetention": {
      "raw": "7d",
      "aggregated": "90d",
      "predictions": "365d"
    },
    "sampling": {
      "defaultRate": 1000,
      "maxRate": 10000
    },
    "ml": {
      "inferenceInterval": 60,
      "retrainingThreshold": 0.1
    }
  }
}
```

#### PUT /api/config
Update system configuration.

## 4. WebSocket API

### 4.1 Connection
**WebSocket URL:** `ws://localhost:8080/realtime`

**Authentication:** Send JWT token in initial message:
```json
{
  "type": "auth",
  "token": "jwt_token"
}
```

### 4.2 Event Types

#### Subscription Management
```json
// Subscribe to equipment data
{
  "type": "subscribe",
  "channel": "equipment",
  "equipmentIds": ["uuid1", "uuid2"]
}

// Subscribe to specific sensors
{
  "type": "subscribe", 
  "channel": "sensors",
  "sensorIds": ["uuid1", "uuid2"]
}

// Subscribe to alerts
{
  "type": "subscribe",
  "channel": "alerts",
  "severity": ["high", "critical"] // optional filter
}

// Unsubscribe
{
  "type": "unsubscribe",
  "channel": "equipment"
}
```

#### Real-time Data Events
```json
// Sensor data update
{
  "type": "sensor_data",
  "data": {
    "equipmentId": "uuid",
    "readings": [SensorReading]
  }
}

// Equipment status change
{
  "type": "equipment_status",
  "data": {
    "equipmentId": "uuid",
    "status": "OperationalStatus",
    "timestamp": "2025-08-07T10:30:00Z"
  }
}

// New alert
{
  "type": "alert_created",
  "data": Alert
}

// Alert status change
{
  "type": "alert_updated", 
  "data": {
    "alertId": "uuid",
    "status": "AlertStatus",
    "changes": {
      "acknowledgedBy": "username",
      "acknowledgedAt": "timestamp"
    }
  }
}

// ML prediction
{
  "type": "prediction",
  "data": Prediction
}

// System notification
{
  "type": "system_notification",
  "data": {
    "level": "info|warning|error",
    "message": "string",
    "timestamp": "2025-08-07T10:30:00Z"
  }
}
```

## 5. ML Inference API (FastAPI)

### 5.1 Base URL
`http://localhost:8000`

### 5.2 Endpoints

#### POST /predict/anomaly
Detect anomalies in sensor data.

**Request Body:**
```json
{
  "equipmentId": "uuid",
  "features": [1.2, 3.4, 5.6], // Feature vector
  "modelId": "uuid", // optional
  "timestamp": "2025-08-07T10:30:00Z"
}
```

**Response:**
```json
{
  "prediction": {
    "isAnomaly": true,
    "anomalyScore": 0.85,
    "confidence": 0.92,
    "threshold": 0.7
  },
  "modelInfo": {
    "modelId": "uuid",
    "version": "1.2.0",
    "trainingDate": "2025-08-01T12:00:00Z"
  },
  "processingTime": 0.012 // seconds
}
```

#### POST /predict/rul
Predict remaining useful life.

**Request Body:**
```json
{
  "equipmentId": "uuid",
  "timeSeriesData": [
    {
      "timestamp": "2025-08-07T10:00:00Z",
      "features": [1.2, 3.4, 5.6]
    }
  ],
  "predictionHorizon": 168 // hours
}
```

#### POST /models/train
Trigger model training.

**Request Body:**
```json
{
  "modelType": "anomaly_detection|rul_prediction",
  "equipmentType": "etcher",
  "trainingData": {
    "startTime": "2025-07-01T00:00:00Z",
    "endTime": "2025-08-01T00:00:00Z"
  },
  "hyperparameters": {
    "epochs": 100,
    "batchSize": 32,
    "learningRate": 0.001
  }
}
```

#### GET /models/:id/metrics
Get model performance metrics.

**Response:**
```json
{
  "metrics": {
    "accuracy": 0.94,
    "precision": 0.91,
    "recall": 0.87,
    "f1Score": 0.89,
    "rocAuc": 0.96
  },
  "confusionMatrix": [[850, 45], [32, 73]],
  "lastEvaluation": "2025-08-05T14:00:00Z"
}
```

## 6. Error Handling

### 6.1 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "EQUIPMENT_NOT_FOUND",
    "message": "Equipment with ID 'abc123' not found",
    "details": {
      "requestId": "req_123456",
      "timestamp": "2025-08-07T10:30:00Z",
      "path": "/api/equipment/abc123"
    }
  }
}
```

### 6.2 HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Unprocessable Entity
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

### 6.3 Common Error Codes
- `INVALID_CREDENTIALS`: Authentication failed
- `TOKEN_EXPIRED`: JWT token expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `EQUIPMENT_NOT_FOUND`: Equipment ID doesn't exist
- `SENSOR_NOT_FOUND`: Sensor ID doesn't exist
- `INVALID_TIME_RANGE`: Invalid date/time parameters
- `DATA_VALIDATION_ERROR`: Request data validation failed
- `ML_MODEL_ERROR`: ML inference/training error
- `OPC_CONNECTION_ERROR`: OPC-UA connection issues
- `DATABASE_ERROR`: Database operation failed

## 7. Rate Limiting

### 7.1 Limits by Endpoint Category
- **Authentication**: 10 requests/minute per IP
- **General API**: 1000 requests/minute per user
- **Real-time Data**: 10,000 requests/minute per user
- **File Upload**: 5 requests/minute per user
- **ML Inference**: 100 requests/minute per user

### 7.2 Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1625097600
X-RateLimit-RetryAfter: 60
```

## 8. Versioning

### 8.1 API Versioning Strategy
- **URL Path**: `/api/v1/equipment`
- **Header**: `Accept: application/vnd.api+json;version=1`

### 8.2 Backward Compatibility
- Maintain support for previous major version
- 6-month deprecation notice for breaking changes
- Semantic versioning for API releases

This comprehensive API specification provides the complete interface definition for all client-server interactions in the predictive maintenance system.