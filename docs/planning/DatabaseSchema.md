# Database Schema Design Document
## AI-Powered Predictive Maintenance Software

### Version 1.0 | Date: August 2025

## 1. Database Architecture Overview

### 1.1 Multi-Database Strategy
The system employs a polyglot persistence approach with specialized databases for different data types:

- **PostgreSQL 15+**: Relational data (equipment, users, configuration)
- **InfluxDB 2.7+**: Time-series sensor data and metrics
- **Redis 7.0+**: Caching, sessions, and real-time data buffering
- **SQLite**: Embedded local storage for air-gapped deployments

### 1.2 Database Separation Rationale
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │    InfluxDB     │    │     Redis       │
│   (Relational)  │    │  (Time-series)  │    │   (Caching)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Equipment     │    │ • Sensor Data   │    │ • Sessions      │
│ • Users         │    │ • Predictions   │    │ • Real-time     │
│ • Configuration │    │ • Metrics       │    │ • API Cache     │
│ • Alert Rules   │    │ • Aggregations  │    │ • Job Queues    │
│ • Audit Logs    │    │ • Events        │    │ • Rate Limits   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 2. PostgreSQL Schema Design

### 2.1 Core Manufacturing Schema

```sql
-- Create schemas for logical separation
CREATE SCHEMA IF NOT EXISTS manufacturing;
CREATE SCHEMA IF NOT EXISTS security; 
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Custom types and enums
CREATE TYPE manufacturing.equipment_type AS ENUM (
    'etcher', 'cvd', 'pvd', 'cmp', 'lithography', 'metrology', 'other'
);

CREATE TYPE manufacturing.operational_status AS ENUM (
    'online', 'offline', 'maintenance', 'error', 'idle', 'calibrating'
);

CREATE TYPE manufacturing.sensor_status AS ENUM (
    'active', 'inactive', 'fault', 'calibrating', 'disabled'
);

CREATE TYPE manufacturing.data_quality AS ENUM (
    'good', 'bad', 'uncertain', 'substitute'
);

CREATE TYPE security.alert_severity AS ENUM (
    'low', 'medium', 'high', 'critical'
);

CREATE TYPE security.alert_status AS ENUM (
    'active', 'acknowledged', 'resolved', 'suppressed'
);
```

### 2.2 Equipment Management Tables

```sql
-- Equipment table
CREATE TABLE manufacturing.equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    equipment_type manufacturing.equipment_type NOT NULL,
    location VARCHAR(255),
    description TEXT,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    installation_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    status manufacturing.operational_status DEFAULT 'offline',
    opc_endpoint VARCHAR(500),
    configuration JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT unique_equipment_name UNIQUE (name),
    CONSTRAINT valid_opc_endpoint CHECK (opc_endpoint IS NULL OR opc_endpoint ~ '^opc\.(tcp|https?)://.*'),
    CONSTRAINT future_maintenance CHECK (next_maintenance IS NULL OR next_maintenance >= CURRENT_DATE)
);

-- Indexes for equipment
CREATE INDEX idx_equipment_type ON manufacturing.equipment(equipment_type);
CREATE INDEX idx_equipment_status ON manufacturing.equipment(status);
CREATE INDEX idx_equipment_location ON manufacturing.equipment(location);
CREATE INDEX idx_equipment_updated_at ON manufacturing.equipment(updated_at);
CREATE INDEX idx_equipment_gin_config ON manufacturing.equipment USING GIN (configuration);
CREATE INDEX idx_equipment_gin_metadata ON manufacturing.equipment USING GIN (metadata);

-- Equipment sensors table
CREATE TABLE manufacturing.sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES manufacturing.equipment(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parameter_type VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    description TEXT,
    min_range DECIMAL(15,6),
    max_range DECIMAL(15,6),
    accuracy DECIMAL(8,6),
    resolution DECIMAL(12,8),
    sampling_rate INTEGER CHECK (sampling_rate > 0),
    opc_node_id VARCHAR(255),
    calibration_slope DECIMAL(12,8) DEFAULT 1.0,
    calibration_offset DECIMAL(12,8) DEFAULT 0.0,
    last_calibrated TIMESTAMP WITH TIME ZONE,
    calibration_certificate TEXT,
    status manufacturing.sensor_status DEFAULT 'active',
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_range CHECK (min_range IS NULL OR max_range IS NULL OR min_range < max_range),
    CONSTRAINT valid_sampling_rate CHECK (sampling_rate IS NULL OR sampling_rate BETWEEN 1 AND 100000),
    CONSTRAINT unique_sensor_per_equipment UNIQUE (equipment_id, name)
);

-- Indexes for sensors
CREATE INDEX idx_sensors_equipment_id ON manufacturing.sensors(equipment_id);
CREATE INDEX idx_sensors_parameter_type ON manufacturing.sensors(parameter_type);
CREATE INDEX idx_sensors_status ON manufacturing.sensors(status);
CREATE INDEX idx_sensors_opc_node_id ON manufacturing.sensors(opc_node_id) WHERE opc_node_id IS NOT NULL;

-- Equipment hierarchies (for complex manufacturing lines)
CREATE TABLE manufacturing.equipment_hierarchy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES manufacturing.equipment(id),
    child_id UUID NOT NULL REFERENCES manufacturing.equipment(id),
    relationship_type VARCHAR(50) NOT NULL, -- 'contains', 'feeds', 'controls'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT no_self_reference CHECK (parent_id != child_id),
    CONSTRAINT unique_relationship UNIQUE (parent_id, child_id, relationship_type)
);
```

### 2.3 User Management & Security

```sql
-- Users table
CREATE TABLE security.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'operator',
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'engineer', 'operator', 'viewer')),
    CONSTRAINT valid_failed_attempts CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 10)
);

-- User sessions
CREATE TABLE security.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Indexes for security tables
CREATE INDEX idx_users_username ON security.users(username);
CREATE INDEX idx_users_email ON security.users(email);
CREATE INDEX idx_users_role ON security.users(role);
CREATE INDEX idx_users_is_active ON security.users(is_active);
CREATE INDEX idx_sessions_user_id ON security.user_sessions(user_id);
CREATE INDEX idx_sessions_token ON security.user_sessions(session_token);
CREATE INDEX idx_sessions_expires_at ON security.user_sessions(expires_at);
```

### 2.4 Alert Management

```sql
-- Alert rules
CREATE TABLE security.alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    equipment_id UUID REFERENCES manufacturing.equipment(id) ON DELETE CASCADE, -- NULL for global rules
    sensor_id UUID REFERENCES manufacturing.sensors(id) ON DELETE CASCADE,     -- NULL for equipment-wide rules
    condition JSONB NOT NULL,
    severity security.alert_severity NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    actions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES security.users(id),
    updated_by UUID REFERENCES security.users(id),
    
    CONSTRAINT unique_rule_name UNIQUE (name)
);

-- Alert instances
CREATE TABLE security.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES security.alert_rules(id),
    equipment_id UUID NOT NULL REFERENCES manufacturing.equipment(id),
    sensor_id UUID REFERENCES manufacturing.sensors(id),
    severity security.alert_severity NOT NULL,
    status security.alert_status DEFAULT 'active',
    message TEXT NOT NULL,
    description TEXT,
    trigger_value DECIMAL(15,6),
    threshold_value DECIMAL(15,6),
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES security.users(id),
    acknowledgment_comment TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES security.users(id),
    resolution_comment TEXT,
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT valid_acknowledgment CHECK (acknowledged_at IS NULL OR acknowledged_at >= triggered_at),
    CONSTRAINT valid_resolution CHECK (resolved_at IS NULL OR resolved_at >= triggered_at),
    CONSTRAINT acknowledged_user CHECK (acknowledged_at IS NULL OR acknowledged_by IS NOT NULL),
    CONSTRAINT resolved_user CHECK (resolved_at IS NULL OR resolved_by IS NOT NULL)
);

-- Indexes for alerts
CREATE INDEX idx_alerts_equipment_id ON security.alerts(equipment_id);
CREATE INDEX idx_alerts_sensor_id ON security.alerts(sensor_id);
CREATE INDEX idx_alerts_severity ON security.alerts(severity);
CREATE INDEX idx_alerts_status ON security.alerts(status);
CREATE INDEX idx_alerts_triggered_at ON security.alerts(triggered_at);
CREATE INDEX idx_alerts_rule_id ON security.alerts(rule_id);
CREATE INDEX idx_alerts_composite ON security.alerts(equipment_id, status, triggered_at);
```

### 2.5 ML Model Management

```sql
-- ML models
CREATE TABLE analytics.ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL, -- 'anomaly_detection', 'rul_prediction', etc.
    version VARCHAR(50) NOT NULL,
    description TEXT,
    equipment_types manufacturing.equipment_type[] DEFAULT '{}',
    algorithm VARCHAR(100) NOT NULL,
    hyperparameters JSONB DEFAULT '{}',
    feature_columns JSONB NOT NULL,
    target_columns JSONB,
    model_path VARCHAR(500), -- Path to ONNX model file
    model_size_bytes BIGINT,
    training_data_period TSRANGE,
    training_completed_at TIMESTAMP WITH TIME ZONE,
    validation_metrics JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    is_deployed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES security.users(id),
    
    CONSTRAINT unique_model_version UNIQUE (name, version),
    CONSTRAINT valid_model_type CHECK (model_type IN ('anomaly_detection', 'rul_prediction', 'failure_prediction', 'performance_degradation')),
    CONSTRAINT valid_training_period CHECK (training_data_period IS NULL OR NOT isempty(training_data_period))
);

-- Model predictions log
CREATE TABLE analytics.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES analytics.ml_models(id),
    equipment_id UUID NOT NULL REFERENCES manufacturing.equipment(id),
    prediction_type VARCHAR(100) NOT NULL,
    predicted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    features JSONB NOT NULL,
    prediction_value DECIMAL(15,6),
    confidence_score DECIMAL(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    anomaly_score DECIMAL(4,3),
    processing_time_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT valid_prediction_type CHECK (prediction_type IN ('anomaly', 'rul', 'failure', 'performance'))
);

-- Indexes for ML tables
CREATE INDEX idx_models_type ON analytics.ml_models(model_type);
CREATE INDEX idx_models_active ON analytics.ml_models(is_active);
CREATE INDEX idx_models_equipment_types ON analytics.ml_models USING GIN (equipment_types);
CREATE INDEX idx_predictions_equipment_id ON analytics.predictions(equipment_id);
CREATE INDEX idx_predictions_model_id ON analytics.predictions(model_id);
CREATE INDEX idx_predictions_predicted_at ON analytics.predictions(predicted_at);
CREATE INDEX idx_predictions_type ON analytics.predictions(prediction_type);
```

### 2.6 Audit & Logging

```sql
-- Audit log table
CREATE TABLE audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES security.users(id),
    session_id UUID REFERENCES security.user_sessions(id),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- System events log
CREATE TABLE audit.system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL, -- 'security', 'system', 'business', 'error'
    severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    source VARCHAR(255), -- Component/service that generated the event
    user_id UUID REFERENCES security.users(id),
    equipment_id UUID REFERENCES manufacturing.equipment(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    CONSTRAINT valid_category CHECK (event_category IN ('security', 'system', 'business', 'error', 'audit'))
);

-- Indexes for audit tables
CREATE INDEX idx_audit_log_table_name ON audit.audit_log(table_name);
CREATE INDEX idx_audit_log_user_id ON audit.audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit.audit_log(timestamp);
CREATE INDEX idx_system_events_type ON audit.system_events(event_type);
CREATE INDEX idx_system_events_category ON audit.system_events(event_category);
CREATE INDEX idx_system_events_severity ON audit.system_events(severity);
CREATE INDEX idx_system_events_timestamp ON audit.system_events(timestamp);
```

## 3. InfluxDB Schema Design

### 3.1 Time-Series Data Organization

```python
# InfluxDB bucket organization
BUCKETS = {
    'sensor_data': {
        'retention': '90d',
        'description': 'Raw sensor readings'
    },
    'aggregated_1m': {
        'retention': '365d', 
        'description': '1-minute aggregated data'
    },
    'aggregated_1h': {
        'retention': '5y',
        'description': '1-hour aggregated data'
    },
    'predictions': {
        'retention': '365d',
        'description': 'ML prediction results'
    },
    'system_metrics': {
        'retention': '30d',
        'description': 'System performance metrics'
    }
}
```

### 3.2 Measurement Schemas

```python
# Sensor data measurement
SENSOR_DATA_SCHEMA = {
    'measurement': 'sensor_readings',
    'tags': [
        'equipment_id',    # UUID of equipment
        'equipment_type',  # Type of equipment
        'sensor_id',       # UUID of sensor
        'parameter_type',  # Type of parameter (temperature, pressure, etc.)
        'location',        # Physical location
        'unit'            # Unit of measurement
    ],
    'fields': [
        'value',          # Numeric sensor value
        'quality',        # Data quality indicator (0-100)
        'raw_value',      # Raw value before calibration (optional)
        'status_code'     # Sensor status code (optional)
    ],
    'time': 'timestamp'   # RFC3339 timestamp
}

# Example sensor data point
sensor_point = {
    'measurement': 'sensor_readings',
    'tags': {
        'equipment_id': 'eq_12345',
        'equipment_type': 'etcher',
        'sensor_id': 'temp_001',
        'parameter_type': 'temperature',
        'location': 'chamber_1',
        'unit': 'celsius'
    },
    'fields': {
        'value': 23.5,
        'quality': 100,
        'raw_value': 23.52,
        'status_code': 0
    },
    'time': '2025-08-07T10:30:00Z'
}
```

### 3.3 Prediction Results Schema

```python
# ML predictions measurement
PREDICTIONS_SCHEMA = {
    'measurement': 'ml_predictions',
    'tags': [
        'model_id',        # UUID of ML model
        'model_type',      # Type of prediction
        'equipment_id',    # Target equipment
        'equipment_type',  # Equipment type
        'prediction_type'  # Specific prediction category
    ],
    'fields': [
        'prediction',      # Predicted value
        'confidence',      # Confidence score (0-1)
        'anomaly_score',   # Anomaly score (0-1)
        'processing_time', # Inference time in ms
        'feature_count'    # Number of input features
    ],
    'time': 'predicted_at'
}

# Equipment status events
STATUS_EVENTS_SCHEMA = {
    'measurement': 'equipment_status',
    'tags': [
        'equipment_id',
        'equipment_type',
        'location',
        'status',          # New status
        'previous_status'  # Previous status
    ],
    'fields': [
        'duration_seconds', # Duration in previous status
        'operator_id',      # User who triggered change
        'reason_code'       # Reason for status change
    ],
    'time': 'changed_at'
}
```

### 3.4 Continuous Queries for Aggregation

```sql
-- 1-minute aggregation query
CREATE CONTINUOUS QUERY "cq_1m_aggregation" ON "manufacturing"
BEGIN
  SELECT 
    mean("value") AS "mean_value",
    min("value") AS "min_value", 
    max("value") AS "max_value",
    stddev("value") AS "stddev_value",
    count("value") AS "count",
    percentile("value", 95) AS "p95_value"
  INTO "manufacturing"."aggregated_1m"."sensor_readings_1m"
  FROM "manufacturing"."sensor_data"."sensor_readings"
  GROUP BY time(1m), "equipment_id", "sensor_id", "parameter_type"
END

-- 1-hour aggregation query
CREATE CONTINUOUS QUERY "cq_1h_aggregation" ON "manufacturing"
BEGIN
  SELECT 
    mean("mean_value") AS "mean_value",
    min("min_value") AS "min_value",
    max("max_value") AS "max_value", 
    mean("stddev_value") AS "avg_stddev",
    sum("count") AS "total_count"
  INTO "manufacturing"."aggregated_1h"."sensor_readings_1h"
  FROM "manufacturing"."aggregated_1m"."sensor_readings_1m"
  GROUP BY time(1h), "equipment_id", "sensor_id", "parameter_type"
END
```

### 3.5 Data Retention Policies

```sql
-- Retention policies for different data types
CREATE RETENTION POLICY "raw_data_90d" ON "manufacturing" DURATION 90d REPLICATION 1 DEFAULT
CREATE RETENTION POLICY "aggregated_1y" ON "manufacturing" DURATION 365d REPLICATION 1
CREATE RETENTION POLICY "aggregated_5y" ON "manufacturing" DURATION 1825d REPLICATION 1

-- Apply retention policies to buckets
ALTER RETENTION POLICY "raw_data_90d" ON "manufacturing" DEFAULT
```

## 4. Redis Schema Design

### 4.1 Key Naming Conventions

```python
REDIS_KEY_PATTERNS = {
    # User sessions
    'session': 'session:{user_id}:{session_token}',
    
    # API rate limiting
    'rate_limit': 'rate_limit:{endpoint}:{user_id}:{window}',
    
    # Real-time data cache
    'realtime': 'realtime:{equipment_id}:{sensor_id}',
    
    # Equipment status cache
    'equipment_status': 'equipment:{equipment_id}:status',
    
    # Alert notifications
    'alert_queue': 'alerts:queue:{severity}',
    
    # ML model cache
    'model_cache': 'ml:model:{model_id}:features',
    
    # System configuration
    'config': 'config:{component}:{version}',
    
    # Background job queues
    'job_queue': 'jobs:{queue_name}',
    'job_result': 'job:result:{job_id}',
    
    # API response cache
    'api_cache': 'api:{endpoint}:{params_hash}',
    
    # WebSocket connections
    'websocket': 'ws:connection:{user_id}:{connection_id}'
}
```

### 4.2 Data Structures and TTL

```python
# Session data structure
SESSION_DATA = {
    'key': 'session:{user_id}:{session_token}',
    'type': 'hash',
    'ttl': 28800,  # 8 hours
    'fields': {
        'user_id': 'uuid',
        'username': 'string',
        'role': 'string',
        'permissions': 'json_string',
        'created_at': 'timestamp',
        'last_activity': 'timestamp',
        'ip_address': 'string'
    }
}

# Real-time sensor data buffer
REALTIME_BUFFER = {
    'key': 'realtime:{equipment_id}:{sensor_id}',
    'type': 'sorted_set',
    'ttl': 3600,  # 1 hour
    'score': 'timestamp_ms',
    'value': 'json_sensor_reading'
}

# Equipment status cache
EQUIPMENT_STATUS = {
    'key': 'equipment:{equipment_id}:status',
    'type': 'hash',
    'ttl': 86400,  # 24 hours
    'fields': {
        'status': 'string',
        'last_update': 'timestamp',
        'sensor_count': 'integer',
        'alert_count': 'integer',
        'online_duration': 'seconds'
    }
}
```

## 5. Database Performance Optimization

### 5.1 PostgreSQL Optimization

```sql
-- Performance-oriented configurations
-- postgresql.conf settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

-- Connection pooling
max_connections = 200
shared_preload_libraries = 'pg_stat_statements'

-- Partitioning for large tables
CREATE TABLE audit.audit_log_y2025m08 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

-- Indexes for query optimization
CREATE INDEX CONCURRENTLY idx_sensors_readings_time_equip 
    ON manufacturing.sensors(equipment_id, updated_at) 
    WHERE status = 'active';

-- Partial indexes for common queries
CREATE INDEX idx_alerts_active_critical 
    ON security.alerts(equipment_id, triggered_at) 
    WHERE status = 'active' AND severity = 'critical';
```

### 5.2 InfluxDB Optimization

```python
# InfluxDB write optimization
INFLUX_WRITE_CONFIG = {
    'batch_size': 10000,
    'flush_interval': 1000,  # ms
    'max_retries': 3,
    'retry_interval': 1000,  # ms
    'compression': 'gzip',
    'consistency': 'one'
}

# Query optimization techniques
optimized_queries = {
    'time_range_limit': """
        SELECT mean(value) 
        FROM sensor_readings 
        WHERE time >= now() - 1h 
        AND equipment_id = 'eq_123'
        GROUP BY time(1m)
        LIMIT 1000
    """,
    
    'tag_filtering': """
        SELECT last(value)
        FROM sensor_readings 
        WHERE equipment_type = 'etcher'
        AND parameter_type = 'temperature'
        GROUP BY sensor_id
    """
}
```

### 5.3 Connection Pooling Configuration

```python
# PostgreSQL connection pool
DATABASE_CONFIG = {
    'postgresql': {
        'pool_size': 20,
        'max_overflow': 30,
        'pool_timeout': 30,
        'pool_recycle': 3600,
        'pool_pre_ping': True
    },
    'redis': {
        'connection_pool_size': 50,
        'max_connections': 100,
        'retry_on_timeout': True,
        'socket_connect_timeout': 5,
        'socket_timeout': 5
    }
}
```

## 6. Backup and Recovery Strategy

### 6.1 PostgreSQL Backup

```bash
#!/bin/bash
# PostgreSQL backup script

DB_NAME="predictive_maintenance"
BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Full database backup
pg_dump -h localhost -U postgres -d $DB_NAME \
    --verbose --format=custom --compress=9 \
    --file="$BACKUP_DIR/full_backup_$TIMESTAMP.dump"

# Schema-only backup
pg_dump -h localhost -U postgres -d $DB_NAME \
    --schema-only --format=plain \
    --file="$BACKUP_DIR/schema_$TIMESTAMP.sql"

# Data-only backup for critical tables
pg_dump -h localhost -U postgres -d $DB_NAME \
    --data-only --table=manufacturing.equipment \
    --table=manufacturing.sensors \
    --table=security.users \
    --format=custom \
    --file="$BACKUP_DIR/critical_data_$TIMESTAMP.dump"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

### 6.2 InfluxDB Backup

```bash
#!/bin/bash
# InfluxDB backup script

INFLUX_HOST="localhost"
INFLUX_PORT="8086"
INFLUX_TOKEN="your_admin_token"
BACKUP_DIR="/var/backups/influxdb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory
mkdir -p "$BACKUP_DIR/$TIMESTAMP"

# Backup all buckets
influx backup "$BACKUP_DIR/$TIMESTAMP" \
    --host "http://$INFLUX_HOST:$INFLUX_PORT" \
    --token "$INFLUX_TOKEN"

# Compress backup
tar -czf "$BACKUP_DIR/influx_backup_$TIMESTAMP.tar.gz" \
    -C "$BACKUP_DIR" "$TIMESTAMP"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/$TIMESTAMP"

# Cleanup old backups (keep 7 days for InfluxDB)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 6.3 Disaster Recovery Procedures

```sql
-- PostgreSQL recovery commands
-- Point-in-time recovery
pg_basebackup -h localhost -U postgres -D /var/lib/postgresql/recovery -Ft -z -P

-- Restore from backup
pg_restore -h localhost -U postgres -d predictive_maintenance_restored \
    --verbose --clean --if-exists full_backup_20250807_120000.dump

-- InfluxDB recovery
influx restore "/var/backups/influxdb/20250807_120000" \
    --host "http://localhost:8086" \
    --token "your_admin_token" \
    --org "manufacturing" \
    --new-bucket "sensor_data_restored"
```

This comprehensive database schema provides a robust foundation for managing all aspects of the predictive maintenance system, from equipment configuration to real-time sensor data storage and analysis.