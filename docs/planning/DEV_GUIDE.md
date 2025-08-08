# Development Guidelines & Code Standards
## AI-Powered Predictive Maintenance Software

### Version 1.0 | Date: August 2025

## 1. Overview & Principles

### 1.1 Development Philosophy
Our development approach prioritizes **reliability**, **performance**, and **maintainability** for critical semiconductor manufacturing environments where system failures can cost $100,000+ per hour.

**Core Principles:**
- **Safety First**: Code must be defensive and handle failures gracefully
- **Performance Critical**: Every line of code impacts manufacturing efficiency
- **Type Safety**: Leverage strong typing to prevent runtime errors
- **Testability**: All code must be thoroughly testable
- **Documentation**: Clear, comprehensive documentation is mandatory
- **Security**: Security considerations in every design decision

### 1.2 Technology Standards
- **Frontend**: TypeScript 5.0+, React 18+, Strict mode enabled
- **Backend**: Rust 1.70+ with clippy, Node.js 18+ LTS
- **ML Services**: Python 3.10+, Type hints mandatory
- **Databases**: PostgreSQL 15+, InfluxDB 2.7+, Redis 7.0+
- **Testing**: 90%+ code coverage minimum
- **Formatting**: Automated formatting with Prettier, Black, rustfmt

## 2. Git Workflow & Branching Strategy

### 2.1 Branch Structure
```
main
├── develop
│   ├── feature/TICKET-123-sensor-calibration
│   ├── feature/TICKET-124-ml-model-update
│   └── bugfix/TICKET-125-memory-leak-fix
├── release/v1.2.0
└── hotfix/v1.1.1-critical-security-fix
```

### 2.2 Branching Rules

**Branch Types:**
- `main`: Production-ready code only
- `develop`: Integration branch for next release
- `feature/*`: New features and enhancements
- `bugfix/*`: Bug fixes for existing features
- `release/*`: Release preparation and stabilization
- `hotfix/*`: Critical fixes for production issues

**Naming Conventions:**
```bash
# Feature branches
feature/TICKET-123-short-description
feature/TICKET-124-add-opc-ua-support

# Bug fix branches
bugfix/TICKET-125-fix-memory-leak
bugfix/TICKET-126-correct-calculation-error

# Release branches
release/v1.2.0
release/v2.0.0-beta.1

# Hotfix branches
hotfix/v1.1.1-security-patch
hotfix/v1.1.2-critical-bug-fix
```

### 2.3 Commit Standards

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples:**
```bash
feat(sensors): add OPC-UA certificate validation

Implement X.509 certificate validation for OPC-UA connections
to ensure secure communication with manufacturing equipment.

Closes #123

fix(ml): resolve memory leak in prediction pipeline

Fixed memory leak in batch processing that caused gradual
memory consumption increase over 24+ hour periods.

- Added proper cleanup of tensor objects
- Implemented garbage collection hints
- Added memory monitoring alerts

Fixes #124

perf(database): optimize sensor data query performance

Improved query performance by 80% through:
- Added composite index on (equipment_id, timestamp)
- Implemented query result caching
- Optimized batch insert operations

Benchmark results show reduction from 500ms to 100ms
for typical dashboard queries.

Closes #125
```

### 2.4 Pull Request Process

**PR Template:**
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Security Checklist
- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] Authentication/authorization verified
- [ ] Security tests passed

## Performance Impact
- [ ] No performance degradation
- [ ] Performance improvement measured
- [ ] Memory usage assessed
- [ ] Database impact evaluated

## Documentation
- [ ] Code comments updated
- [ ] API documentation updated
- [ ] User documentation updated
- [ ] README updated if needed

## Deployment
- [ ] Database migrations included
- [ ] Configuration changes documented
- [ ] Deployment instructions provided
- [ ] Rollback plan documented
```

**Review Requirements:**
- **Required Reviews**: Minimum 2 approvals for `main`, 1 for `develop`
- **Security Review**: Required for security-related changes
- **Performance Review**: Required for performance-critical changes
- **Architecture Review**: Required for significant architectural changes

## 3. TypeScript/React Standards

### 3.1 TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"],
      "@/services/*": ["services/*"],
      "@/types/*": ["types/*"],
      "@/utils/*": ["utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "dist"]
}
```

### 3.2 Code Style Guidelines

```typescript
// ✅ Good: Comprehensive type definitions
interface SensorReading {
  readonly id: string;
  readonly sensorId: string;
  readonly equipmentId: string;
  readonly timestamp: Date;
  readonly value: number;
  readonly quality: DataQuality;
  readonly unit: string;
  readonly metadata?: Record<string, unknown>;
}

// ✅ Good: Specific enum values
enum DataQuality {
  GOOD = 'good',
  BAD = 'bad',
  UNCERTAIN = 'uncertain',
  SUBSTITUTE = 'substitute'
}

// ✅ Good: Function with proper error handling
async function processSensorData(
  readings: readonly SensorReading[]
): Promise<Result<ProcessedReading[], ProcessingError>> {
  try {
    const processedReadings = await Promise.all(
      readings.map(async (reading) => {
        const validated = validateReading(reading);
        if (!validated.success) {
          throw new ValidationError(validated.error);
        }
        
        return {
          ...reading,
          calibratedValue: applyCalibratetion(reading.value),
          features: extractFeatures(reading),
        };
      })
    );
    
    return { success: true, data: processedReadings };
  } catch (error) {
    logger.error('Sensor data processing failed', { error, readingsCount: readings.length });
    return { 
      success: false, 
      error: error instanceof ProcessingError ? error : new UnknownError(error) 
    };
  }
}

// ✅ Good: React component with proper types
interface EquipmentDashboardProps {
  readonly equipmentId: string;
  readonly refreshInterval?: number;
  readonly onAlertGenerated?: (alert: Alert) => void;
}

const EquipmentDashboard: React.FC<EquipmentDashboardProps> = ({
  equipmentId,
  refreshInterval = 5000,
  onAlertGenerated
}) => {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // ✅ Good: Proper cleanup and dependency management
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const result = await equipmentService.getEquipment(equipmentId, {
          signal: controller.signal
        });
        
        if (result.success) {
          setEquipment(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    fetchEquipment();
    const interval = setInterval(fetchEquipment, refreshInterval);
    
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [equipmentId, refreshInterval]);
  
  // ✅ Good: Early returns for loading/error states
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  }
  
  if (!equipment) {
    return <EmptyState message="Equipment not found" />;
  }
  
  return (
    <div className="equipment-dashboard">
      <EquipmentHeader equipment={equipment} />
      <SensorGrid sensors={equipment.sensors} />
      <AlertPanel 
        alerts={equipment.alerts} 
        onAlertAcknowledged={onAlertGenerated}
      />
    </div>
  );
};

// ✅ Good: Custom hook with proper error handling
function useWebSocket(url: string): {
  readonly isConnected: boolean;
  readonly lastMessage: WebSocketMessage | null;
  readonly sendMessage: (message: WebSocketMessage) => void;
  readonly error: Error | null;
} {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      logger.warn('Attempted to send message on closed WebSocket connection');
    }
  }, []);
  
  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    
    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        setLastMessage(message);
      } catch (err) {
        logger.error('Failed to parse WebSocket message', { error: err, data: event.data });
      }
    };
    
    ws.onerror = (event) => {
      setError(new Error('WebSocket connection error'));
      setIsConnected(false);
    };
    
    ws.onclose = () => {
      setIsConnected(false);
    };
    
    return () => {
      ws.close();
    };
  }, [url]);
  
  return { isConnected, lastMessage, sendMessage, error };
}
```

### 3.3 ESLint Configuration

```json
// .eslintrc.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'react-hooks/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    
    // React specific
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    
    // General
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

## 4. Rust Standards

### 4.1 Rust Project Structure

```
src-tauri/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── lib.rs
│   ├── commands/          # Tauri command handlers
│   │   ├── mod.rs
│   │   ├── equipment.rs
│   │   ├── sensors.rs
│   │   └── ml.rs
│   ├── services/          # Business logic
│   │   ├── mod.rs
│   │   ├── opc_service.rs
│   │   ├── data_service.rs
│   │   └── ml_service.rs
│   ├── models/            # Data models
│   │   ├── mod.rs
│   │   ├── equipment.rs
│   │   └── sensor.rs
│   ├── error.rs           # Error types
│   ├── config.rs          # Configuration
│   └── utils/             # Utilities
└── tests/                 # Integration tests
```

### 4.2 Rust Code Standards

```rust
// ✅ Good: Comprehensive error handling with thiserror
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SensorError {
    #[error("Sensor not found: {sensor_id}")]
    NotFound { sensor_id: String },
    
    #[error("Invalid sensor reading: {reason}")]
    InvalidReading { reason: String },
    
    #[error("OPC-UA connection failed: {source}")]
    OpcConnectionFailed {
        #[from]
        source: opcua::Error,
    },
    
    #[error("Database error: {source}")]
    DatabaseError {
        #[from]
        source: sqlx::Error,
    },
}

// ✅ Good: Result type for error handling
pub type SensorResult<T> = Result<T, SensorError>;

// ✅ Good: Proper struct definition with documentation
/// Represents a sensor reading from manufacturing equipment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensorReading {
    /// Unique identifier for the sensor
    pub sensor_id: String,
    
    /// Equipment that owns this sensor
    pub equipment_id: String,
    
    /// Timestamp when the reading was taken
    pub timestamp: chrono::DateTime<chrono::Utc>,
    
    /// The measured value
    pub value: f64,
    
    /// Quality indicator for the reading
    pub quality: DataQuality,
    
    /// Unit of measurement
    pub unit: String,
    
    /// Optional metadata
    #[serde(default)]
    pub metadata: std::collections::HashMap<String, serde_json::Value>,
}

impl SensorReading {
    /// Validates that the sensor reading is within acceptable ranges
    pub fn validate(&self) -> SensorResult<()> {
        if self.sensor_id.is_empty() {
            return Err(SensorError::InvalidReading {
                reason: "sensor_id cannot be empty".to_string(),
            });
        }
        
        if self.equipment_id.is_empty() {
            return Err(SensorError::InvalidReading {
                reason: "equipment_id cannot be empty".to_string(),
            });
        }
        
        if !self.value.is_finite() {
            return Err(SensorError::InvalidReading {
                reason: format!("value must be finite, got: {}", self.value),
            });
        }
        
        Ok(())
    }
    
    /// Applies calibration to the raw sensor value
    pub fn apply_calibration(&mut self, slope: f64, offset: f64) -> SensorResult<()> {
        if !slope.is_finite() || !offset.is_finite() {
            return Err(SensorError::InvalidReading {
                reason: "calibration parameters must be finite".to_string(),
            });
        }
        
        self.value = self.value * slope + offset;
        Ok(())
    }
}

// ✅ Good: Async service with proper error handling
#[derive(Debug)]
pub struct SensorService {
    db_pool: sqlx::PgPool,
    opc_client: Arc<Mutex<opcua::Client>>,
}

impl SensorService {
    pub fn new(db_pool: sqlx::PgPool, opc_client: opcua::Client) -> Self {
        Self {
            db_pool,
            opc_client: Arc::new(Mutex::new(opc_client)),
        }
    }
    
    /// Retrieves sensor readings for the specified time range
    pub async fn get_readings(
        &self,
        sensor_id: &str,
        start_time: chrono::DateTime<chrono::Utc>,
        end_time: chrono::DateTime<chrono::Utc>,
    ) -> SensorResult<Vec<SensorReading>> {
        let readings = sqlx::query_as!(
            SensorReading,
            r#"
            SELECT 
                sensor_id,
                equipment_id,
                timestamp,
                value,
                quality as "quality: DataQuality",
                unit,
                metadata
            FROM sensor_readings 
            WHERE sensor_id = $1 
                AND timestamp BETWEEN $2 AND $3
            ORDER BY timestamp ASC
            "#,
            sensor_id,
            start_time,
            end_time
        )
        .fetch_all(&self.db_pool)
        .await?;
        
        Ok(readings)
    }
    
    /// Stores a batch of sensor readings
    pub async fn store_readings(
        &self,
        readings: &[SensorReading],
    ) -> SensorResult<()> {
        if readings.is_empty() {
            return Ok(());
        }
        
        // Validate all readings first
        for reading in readings {
            reading.validate()?;
        }
        
        let mut tx = self.db_pool.begin().await?;
        
        for reading in readings {
            sqlx::query!(
                r#"
                INSERT INTO sensor_readings (
                    sensor_id, equipment_id, timestamp, value, quality, unit, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                "#,
                reading.sensor_id,
                reading.equipment_id,
                reading.timestamp,
                reading.value,
                reading.quality as DataQuality,
                reading.unit,
                reading.metadata
            )
            .execute(&mut *tx)
            .await?;
        }
        
        tx.commit().await?;
        
        tracing::info!(
            "Stored {} sensor readings",
            readings.len()
        );
        
        Ok(())
    }
}

// ✅ Good: Proper testing structure
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_sensor_reading_validation() {
        let mut reading = SensorReading {
            sensor_id: "temp_001".to_string(),
            equipment_id: "eq_001".to_string(),
            timestamp: chrono::Utc::now(),
            value: 23.5,
            quality: DataQuality::Good,
            unit: "celsius".to_string(),
            metadata: std::collections::HashMap::new(),
        };
        
        // Valid reading should pass
        assert!(reading.validate().is_ok());
        
        // Empty sensor ID should fail
        reading.sensor_id = String::new();
        assert!(reading.validate().is_err());
        
        // Invalid value should fail
        reading.sensor_id = "temp_001".to_string();
        reading.value = f64::NAN;
        assert!(reading.validate().is_err());
    }
    
    #[tokio::test]
    async fn test_sensor_service_store_readings() {
        // Test implementation
    }
}
```

### 4.3 Cargo Configuration

```toml
# Cargo.toml
[package]
name = "predictive-maintenance"
version = "1.0.0"
description = "AI-Powered Predictive Maintenance Software"
authors = ["Your Team <team@company.com>"]
license = "MIT"
repository = "https://github.com/company/predictive-maintenance"
edition = "2021"
rust-version = "1.70"

[dependencies]
tauri = { version = "2.0", features = ["shell-open", "fs-all", "window-all"] }
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sqlx = { version = "0.7", features = ["postgres", "runtime-tokio-rustls", "chrono", "uuid"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
thiserror = "1.0"
anyhow = "1.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

[dev-dependencies]
tokio-test = "0.4"
tempfile = "3.0"

# Performance optimizations
[profile.release]
debug = false
lto = true
codegen-units = 1
panic = "abort"
strip = true

[profile.dev]
debug = true
split-debuginfo = "unpacked"
```

## 5. Python Standards

### 5.1 Python Code Standards

```python
"""
ML Service for Predictive Maintenance
Handles model training, inference, and evaluation.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Protocol, Union
import warnings

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field, validator
from sklearn.preprocessing import StandardScaler

# ✅ Good: Comprehensive type hints
logger = logging.getLogger(__name__)

class SensorReading(BaseModel):
    """Represents a sensor reading from manufacturing equipment."""
    
    sensor_id: str = Field(..., description="Unique identifier for the sensor")
    equipment_id: str = Field(..., description="Equipment that owns this sensor")
    timestamp: datetime = Field(..., description="When the reading was taken")
    value: float = Field(..., description="The measured value")
    quality: str = Field(..., description="Quality indicator")
    unit: str = Field(..., description="Unit of measurement")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    @validator('value')
    def validate_value(cls, v: float) -> float:
        """Ensure the value is finite."""
        if not np.isfinite(v):
            raise ValueError(f"Value must be finite, got: {v}")
        return v
    
    @validator('sensor_id', 'equipment_id', 'quality', 'unit')
    def validate_non_empty_strings(cls, v: str) -> str:
        """Ensure string fields are not empty."""
        if not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

@dataclass
class PredictionResult:
    """Result of ML model prediction."""
    
    model_id: str
    equipment_id: str
    prediction: float
    confidence: float
    anomaly_score: Optional[float] = None
    features: List[float] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self) -> None:
        """Validate prediction result after initialization."""
        if not 0 <= self.confidence <= 1:
            raise ValueError(f"Confidence must be between 0 and 1, got: {self.confidence}")
        
        if self.anomaly_score is not None and not 0 <= self.anomaly_score <= 1:
            raise ValueError(f"Anomaly score must be between 0 and 1, got: {self.anomaly_score}")

class ModelProtocol(Protocol):
    """Protocol for ML models."""
    
    def predict(self, features: np.ndarray) -> np.ndarray:
        """Generate predictions from features."""
        ...
    
    def predict_proba(self, features: np.ndarray) -> np.ndarray:
        """Generate prediction probabilities."""
        ...

class FeatureExtractor:
    """Extracts features from sensor data for ML models."""
    
    def __init__(self, window_size: int = 100, overlap: float = 0.5) -> None:
        """
        Initialize feature extractor.
        
        Args:
            window_size: Size of the sliding window for feature extraction
            overlap: Overlap between consecutive windows (0.0 to 1.0)
        """
        if window_size <= 0:
            raise ValueError("Window size must be positive")
        if not 0 <= overlap < 1:
            raise ValueError("Overlap must be between 0 and 1")
            
        self.window_size = window_size
        self.overlap = overlap
        self.scaler = StandardScaler()
        
    def extract_statistical_features(self, data: np.ndarray) -> Dict[str, float]:
        """
        Extract statistical features from time series data.
        
        Args:
            data: Time series data array
            
        Returns:
            Dictionary of statistical features
            
        Raises:
            ValueError: If data is empty or contains invalid values
        """
        if len(data) == 0:
            raise ValueError("Data array cannot be empty")
        
        if not np.all(np.isfinite(data)):
            warnings.warn("Data contains non-finite values, filtering them out")
            data = data[np.isfinite(data)]
            
        if len(data) == 0:
            raise ValueError("No valid data points after filtering")
        
        features = {
            'mean': float(np.mean(data)),
            'std': float(np.std(data)),
            'variance': float(np.var(data)),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'range': float(np.ptp(data)),
            'skewness': float(self._calculate_skewness(data)),
            'kurtosis': float(self._calculate_kurtosis(data)),
            'rms': float(np.sqrt(np.mean(data**2))),
        }
        
        # Add percentiles
        for percentile in [25, 50, 75, 90, 95, 99]:
            features[f'p{percentile}'] = float(np.percentile(data, percentile))
        
        return features
    
    def _calculate_skewness(self, data: np.ndarray) -> float:
        """Calculate skewness of the data."""
        mean = np.mean(data)
        std = np.std(data)
        
        if std == 0:
            return 0.0
            
        return np.mean(((data - mean) / std) ** 3)
    
    def _calculate_kurtosis(self, data: np.ndarray) -> float:
        """Calculate kurtosis of the data."""
        mean = np.mean(data)
        std = np.std(data)
        
        if std == 0:
            return 0.0
            
        return np.mean(((data - mean) / std) ** 4) - 3.0

class MLModelService:
    """Service for managing ML models and predictions."""
    
    def __init__(
        self, 
        model_path: Path,
        feature_extractor: FeatureExtractor,
        confidence_threshold: float = 0.8
    ) -> None:
        """
        Initialize ML model service.
        
        Args:
            model_path: Path to the trained model file
            feature_extractor: Feature extractor instance
            confidence_threshold: Minimum confidence for predictions
        """
        self.model_path = model_path
        self.feature_extractor = feature_extractor
        self.confidence_threshold = confidence_threshold
        self.model: Optional[ModelProtocol] = None
        self._model_metadata: Dict[str, Any] = {}
        
    async def load_model(self) -> None:
        """Load the ML model from disk."""
        try:
            # This would load the actual model (ONNX, PyTorch, etc.)
            logger.info(f"Loading model from {self.model_path}")
            
            # Simulate async model loading
            await asyncio.sleep(0.1)
            
            self._model_metadata = {
                'model_path': str(self.model_path),
                'loaded_at': datetime.utcnow().isoformat(),
                'version': '1.0.0'
            }
            
            logger.info("Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    async def predict_anomaly(
        self, 
        sensor_readings: List[SensorReading]
    ) -> List[PredictionResult]:
        """
        Predict anomalies in sensor readings.
        
        Args:
            sensor_readings: List of sensor readings to analyze
            
        Returns:
            List of prediction results
            
        Raises:
            ValueError: If no model is loaded or readings are invalid
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        if not sensor_readings:
            return []
        
        results: List[PredictionResult] = []
        
        # Group readings by equipment
        equipment_readings: Dict[str, List[SensorReading]] = {}
        for reading in sensor_readings:
            equipment_id = reading.equipment_id
            if equipment_id not in equipment_readings:
                equipment_readings[equipment_id] = []
            equipment_readings[equipment_id].append(reading)
        
        # Process each equipment separately
        for equipment_id, readings in equipment_readings.items():
            try:
                # Extract features
                values = np.array([r.value for r in readings])
                features = self.feature_extractor.extract_statistical_features(values)
                feature_vector = np.array(list(features.values())).reshape(1, -1)
                
                # Normalize features
                feature_vector = self.feature_extractor.scaler.transform(feature_vector)
                
                # Make prediction (simplified for example)
                prediction = np.random.random()  # Replace with actual model
                confidence = np.random.random()
                anomaly_score = prediction if prediction > 0.5 else 1 - prediction
                
                result = PredictionResult(
                    model_id=self._model_metadata.get('version', 'unknown'),
                    equipment_id=equipment_id,
                    prediction=float(prediction),
                    confidence=float(confidence),
                    anomaly_score=float(anomaly_score),
                    features=feature_vector.flatten().tolist(),
                    metadata={
                        'feature_names': list(features.keys()),
                        'reading_count': len(readings),
                        'time_span_seconds': (readings[-1].timestamp - readings[0].timestamp).total_seconds()
                    }
                )
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Prediction failed for equipment {equipment_id}: {e}")
                # Continue processing other equipment
                continue
        
        return results

# ✅ Good: Proper async context manager
class AsyncMLService:
    """Async context manager for ML service."""
    
    def __init__(self, service: MLModelService) -> None:
        self.service = service
        
    async def __aenter__(self) -> MLModelService:
        await self.service.load_model()
        return self.service
        
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        # Cleanup if needed
        pass

# ✅ Good: Comprehensive testing
import pytest
from unittest.mock import Mock, patch

class TestFeatureExtractor:
    """Test cases for FeatureExtractor."""
    
    @pytest.fixture
    def extractor(self) -> FeatureExtractor:
        return FeatureExtractor(window_size=100, overlap=0.5)
    
    def test_extract_statistical_features_valid_data(self, extractor: FeatureExtractor) -> None:
        """Test feature extraction with valid data."""
        data = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
        features = extractor.extract_statistical_features(data)
        
        assert 'mean' in features
        assert 'std' in features
        assert features['mean'] == pytest.approx(3.0)
        assert features['min'] == 1.0
        assert features['max'] == 5.0
    
    def test_extract_statistical_features_empty_data(self, extractor: FeatureExtractor) -> None:
        """Test feature extraction with empty data."""
        data = np.array([])
        
        with pytest.raises(ValueError, match="Data array cannot be empty"):
            extractor.extract_statistical_features(data)
    
    def test_extract_statistical_features_nan_data(self, extractor: FeatureExtractor) -> None:
        """Test feature extraction with NaN values."""
        data = np.array([1.0, np.nan, 3.0, np.inf, 5.0])
        
        with pytest.warns(UserWarning, match="Data contains non-finite values"):
            features = extractor.extract_statistical_features(data)
        
        # Should only use finite values: [1.0, 3.0, 5.0]
        assert features['mean'] == pytest.approx(3.0)

@pytest.mark.asyncio
class TestMLModelService:
    """Test cases for MLModelService."""
    
    @pytest.fixture
    def service(self, tmp_path: Path) -> MLModelService:
        model_path = tmp_path / "model.onnx"
        model_path.touch()  # Create empty file
        
        extractor = FeatureExtractor()
        return MLModelService(model_path, extractor)
    
    async def test_load_model_success(self, service: MLModelService) -> None:
        """Test successful model loading."""
        await service.load_model()
        assert 'loaded_at' in service._model_metadata
    
    async def test_predict_anomaly_no_model(self, service: MLModelService) -> None:
        """Test prediction without loaded model."""
        readings = [
            SensorReading(
                sensor_id="temp_001",
                equipment_id="eq_001", 
                timestamp=datetime.utcnow(),
                value=23.5,
                quality="good",
                unit="celsius"
            )
        ]
        
        with pytest.raises(ValueError, match="Model not loaded"):
            await service.predict_anomaly(readings)
```

### 5.2 Python Configuration Files

```ini
# setup.cfg
[metadata]
name = predictive-maintenance-ml
version = 1.0.0
description = ML services for predictive maintenance
long_description = file: README.md
long_description_content_type = text/markdown
author = Your Team
author_email = team@company.com
license = MIT
classifiers =
    Development Status :: 5 - Production/Stable
    Programming Language :: Python :: 3
    Programming Language :: Python :: 3.10
    Programming Language :: Python :: 3.11

[options]
packages = find:
python_requires = >=3.10
install_requires =
    fastapi>=0.100.0
    uvicorn>=0.22.0
    pydantic>=2.0.0
    numpy>=1.24.0
    pandas>=2.0.0
    scikit-learn>=1.3.0
    onnxruntime>=1.15.0

[options.extras_require]
dev =
    pytest>=7.4.0
    pytest-asyncio>=0.21.0
    pytest-cov>=4.1.0
    black>=23.0.0
    isort>=5.12.0
    mypy>=1.4.0
    flake8>=6.0.0

[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --strict-markers --strict-config --cov=src --cov-report=term-missing
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests

[mypy]
python_version = 3.10
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
disallow_incomplete_defs = True
check_untyped_defs = True
disallow_untyped_decorators = True
strict_optional = True
warn_redundant_casts = True
warn_unused_ignores = True
warn_no_return = True

[flake8]
max-line-length = 88
extend-ignore = E203, W503
```

```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py310']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
)/
'''

[tool.isort]
profile = "black"
multi_line_output = 3
line_length = 88
known_first_party = ["predictive_maintenance"]

[tool.coverage.run]
source = ["src"]
omit = ["tests/*", "*/migrations/*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
]
```

## 6. Testing Standards

### 6.1 Testing Strategy

**Testing Pyramid:**
- **Unit Tests (80%)**: Fast, isolated tests for individual functions/classes
- **Integration Tests (15%)**: Test component interactions
- **End-to-End Tests (5%)**: Full system workflow tests

**Coverage Requirements:**
- **Minimum Overall Coverage**: 90%
- **Critical Path Coverage**: 100%
- **New Code Coverage**: 95%

### 6.2 Test Organization

```
tests/
├── unit/
│   ├── frontend/
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   ├── backend/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   └── ml/
│       ├── models/
│       ├── features/
│       └── services/
├── integration/
│   ├── api/
│   ├── database/
│   └── services/
├── e2e/
│   ├── critical_paths/
│   ├── user_workflows/
│   └── performance/
└── fixtures/
    ├── sample_data/
    └── test_configs/
```

This comprehensive development guide ensures consistent, high-quality code across all team members and provides clear standards for contributing to the predictive maintenance system.