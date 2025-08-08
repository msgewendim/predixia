# Performance Optimization Guide
## AI-Powered Predictive Maintenance Software

### Version 1.0 | Date: August 2025

## 1. Performance Requirements & Targets

### 1.1 Critical Performance Metrics
For semiconductor manufacturing where equipment downtime costs $100,000+ per hour, performance is mission-critical:

**Response Time Requirements:**
- **UI Interactions**: <100ms for all user interface operations
- **API Endpoints**: <50ms for GET requests, <200ms for POST/PUT requests
- **Real-time Data Processing**: <1ms latency for sensor data ingestion
- **ML Inference**: <500ms for anomaly detection predictions
- **Database Queries**: <10ms for simple queries, <100ms for complex analytics

**Throughput Requirements:**
- **Sensor Data Ingestion**: 10M+ readings per second per equipment line
- **Concurrent Users**: 100+ simultaneous operators without degradation
- **API Requests**: 10,000+ requests per minute sustained load
- **WebSocket Connections**: 500+ concurrent real-time connections

**Resource Utilization Targets:**
- **Memory Usage**: <500MB for desktop application, <2GB for services
- **CPU Usage**: <30% during normal operations, <70% during peak load
- **Disk I/O**: <80% utilization to prevent bottlenecks
- **Network Bandwidth**: <50% of available capacity for headroom

## 2. Frontend Performance Optimization

### 2.1 React Component Optimization

```typescript
// Optimized Dashboard Component with Performance Best Practices
import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { debounce, throttle } from 'lodash';

// Memoized sensor reading component to prevent unnecessary re-renders
const SensorReading = memo<{
  sensor: SensorData;
  isSelected: boolean;
  onSelect: (sensorId: string) => void;
}>(({ sensor, isSelected, onSelect }) => {
  const handleSelect = useCallback(() => {
    onSelect(sensor.id);
  }, [sensor.id, onSelect]);

  return (
    <div 
      className={`sensor-item ${isSelected ? 'selected' : ''}`}
      onClick={handleSelect}
    >
      <span className="sensor-name">{sensor.name}</span>
      <span className="sensor-value">{sensor.value.toFixed(2)}</span>
      <span className="sensor-unit">{sensor.unit}</span>
    </div>
  );
});

// High-performance dashboard with virtualization
const EquipmentDashboard: React.FC<{
  equipmentId: string;
  sensorData: SensorData[];
}> = ({ equipmentId, sensorData }) => {
  const [selectedSensors, setSelectedSensors] = useState<Set<string>>(new Set());
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  // Memoize filtered and sorted sensor data
  const processedSensorData = useMemo(() => {
    return sensorData
      .filter(sensor => sensor.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sensorData]);

  // Debounced search to prevent excessive filtering
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useMemo(
    () => debounce((term: string) => setSearchTerm(term), 300),
    []
  );

  // Throttled chart update to prevent excessive re-renders
  const throttledChartUpdate = useMemo(
    () => throttle((newData: ChartDataPoint[]) => {
      setChartData(prev => {
        // Keep only last 1000 points for performance
        const combined = [...prev, ...newData];
        return combined.slice(-1000);
      });
    }, 100),
    []
  );

  // Optimized WebSocket handling with connection pooling
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8080/equipment/${equipmentId}`);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'sensor_update') {
            throttledChartUpdate(data.readings);
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      ws.onclose = () => {
        // Reconnect with exponential backoff
        setTimeout(connectWebSocket, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000));
      };

      webSocketRef.current = ws;
    };

    connectWebSocket();

    return () => {
      webSocketRef.current?.close();
    };
  }, [equipmentId, throttledChartUpdate]);

  // Virtualized list for large sensor datasets
  const renderSensorItem = useCallback(({ index, style }: any) => {
    const sensor = processedSensorData[index];
    return (
      <div style={style}>
        <SensorReading
          sensor={sensor}
          isSelected={selectedSensors.has(sensor.id)}
          onSelect={handleSensorSelect}
        />
      </div>
    );
  }, [processedSensorData, selectedSensors]);

  const handleSensorSelect = useCallback((sensorId: string) => {
    setSelectedSensors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sensorId)) {
        newSet.delete(sensorId);
      } else {
        newSet.add(sensorId);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="equipment-dashboard">
      <div className="sensor-list-container">
        <input
          type="text"
          placeholder="Search sensors..."
          onChange={(e) => debouncedSearch(e.target.value)}
        />
        
        <List
          height={600}
          itemCount={processedSensorData.length}
          itemSize={60}
          width="100%"
        >
          {renderSensorItem}
        </List>
      </div>

      <div className="chart-container" ref={chartRef}>
        <OptimizedChart 
          data={chartData}
          selectedSensors={selectedSensors}
        />
      </div>
    </div>
  );
};

// High-performance chart component using Canvas for better performance
const OptimizedChart: React.FC<{
  data: ChartDataPoint[];
  selectedSensors: Set<string>;
}> = memo(({ data, selectedSensors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Filter data for selected sensors
    const filteredData = data.filter(point => 
      selectedSensors.size === 0 || selectedSensors.has(point.sensorId)
    );

    if (filteredData.length === 0) return;

    // Calculate scales
    const timeRange = {
      min: Math.min(...filteredData.map(d => d.timestamp)),
      max: Math.max(...filteredData.map(d => d.timestamp))
    };

    const valueRange = {
      min: Math.min(...filteredData.map(d => d.value)),
      max: Math.max(...filteredData.map(d => d.value))
    };

    // Draw axes
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw data lines
    const sensorGroups = filteredData.reduce((groups, point) => {
      if (!groups[point.sensorId]) {
        groups[point.sensorId] = [];
      }
      groups[point.sensorId].push(point);
      return groups;
    }, {} as Record<string, ChartDataPoint[]>);

    Object.entries(sensorGroups).forEach(([sensorId, points], index) => {
      ctx.strokeStyle = `hsl(${index * 60}, 70%, 50%)`;
      ctx.lineWidth = 2;
      ctx.beginPath();

      points.forEach((point, i) => {
        const x = padding + (point.timestamp - timeRange.min) / (timeRange.max - timeRange.min) * chartWidth;
        const y = canvas.height - padding - (point.value - valueRange.min) / (valueRange.max - valueRange.min) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });
  }, [data, selectedSensors]);

  useEffect(() => {
    const animate = () => {
      drawChart();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawChart]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      style={{ width: '100%', height: '100%' }}
    />
  );
});
```

### 2.2 State Management Optimization

```typescript
// Optimized Zustand store with performance considerations
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppStore {
  // Equipment data
  equipment: Map<string, Equipment>;
  
  // Sensor data with circular buffer for memory efficiency
  sensorData: Map<string, CircularBuffer<SensorReading>>;
  
  // UI state
  selectedEquipment: string | null;
  selectedSensors: Set<string>;
  
  // Loading states
  loadingStates: Map<string, boolean>;
  
  // Actions
  addEquipment: (equipment: Equipment) => void;
  updateSensorData: (sensorId: string, reading: SensorReading) => void;
  selectEquipment: (equipmentId: string | null) => void;
  batchUpdateSensorData: (updates: SensorDataUpdate[]) => void;
}

// Circular buffer implementation for memory-efficient sensor data storage
class CircularBuffer<T> {
  private buffer: T[];
  private head = 0;
  private size = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  add(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  getAll(): T[] {
    if (this.size === 0) return [];
    
    const result = new Array(this.size);
    for (let i = 0; i < this.size; i++) {
      const index = (this.head - this.size + i + this.capacity) % this.capacity;
      result[i] = this.buffer[index];
    }
    return result;
  }

  getLast(count: number): T[] {
    const all = this.getAll();
    return all.slice(-count);
  }
}

const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      equipment: new Map(),
      sensorData: new Map(),
      selectedEquipment: null,
      selectedSensors: new Set(),
      loadingStates: new Map(),

      addEquipment: (equipment) =>
        set((state) => {
          state.equipment.set(equipment.id, equipment);
        }),

      updateSensorData: (sensorId, reading) =>
        set((state) => {
          if (!state.sensorData.has(sensorId)) {
            state.sensorData.set(sensorId, new CircularBuffer(1000)); // Keep last 1000 readings
          }
          state.sensorData.get(sensorId)!.add(reading);
        }),

      selectEquipment: (equipmentId) =>
        set((state) => {
          state.selectedEquipment = equipmentId;
          state.selectedSensors.clear(); // Reset sensor selection
        }),

      // Batch updates for better performance
      batchUpdateSensorData: (updates) =>
        set((state) => {
          updates.forEach(({ sensorId, reading }) => {
            if (!state.sensorData.has(sensorId)) {
              state.sensorData.set(sensorId, new CircularBuffer(1000));
            }
            state.sensorData.get(sensorId)!.add(reading);
          });
        })
    }))
  )
);

// Performance-optimized selectors
export const useEquipmentData = (equipmentId: string) =>
  useAppStore(
    useCallback(
      (state) => state.equipment.get(equipmentId),
      [equipmentId]
    )
  );

export const useSensorData = (sensorId: string, count: number = 100) =>
  useAppStore(
    useCallback(
      (state) => state.sensorData.get(sensorId)?.getLast(count) || [],
      [sensorId, count]
    )
  );
```

## 3. Backend Performance Optimization

### 3.1 Rust Backend Optimization

```rust
// High-performance sensor data processing in Rust
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, mpsc};
use crossbeam_channel::{bounded, Receiver, Sender};
use rayon::prelude::*;

#[derive(Clone)]
pub struct SensorReading {
    pub sensor_id: String,
    pub equipment_id: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub value: f64,
    pub quality: DataQuality,
}

// Lock-free ring buffer for high-frequency data
pub struct LockFreeRingBuffer<T> {
    buffer: Vec<std::sync::atomic::AtomicPtr<T>>,
    head: std::sync::atomic::AtomicUsize,
    tail: std::sync::atomic::AtomicUsize,
    capacity: usize,
}

impl<T> LockFreeRingBuffer<T> {
    pub fn new(capacity: usize) -> Self {
        let mut buffer = Vec::with_capacity(capacity);
        for _ in 0..capacity {
            buffer.push(std::sync::atomic::AtomicPtr::new(std::ptr::null_mut()));
        }

        Self {
            buffer,
            head: std::sync::atomic::AtomicUsize::new(0),
            tail: std::sync::atomic::AtomicUsize::new(0),
            capacity,
        }
    }

    pub fn push(&self, item: T) -> Result<(), T> {
        let item_ptr = Box::into_raw(Box::new(item));
        let head = self.head.load(std::sync::atomic::Ordering::Acquire);
        let next_head = (head + 1) % self.capacity;
        
        if next_head == self.tail.load(std::sync::atomic::Ordering::Acquire) {
            // Buffer is full
            unsafe { Box::from_raw(item_ptr) }; // Clean up
            return Err(unsafe { *Box::from_raw(item_ptr) });
        }

        self.buffer[head].store(item_ptr, std::sync::atomic::Ordering::Release);
        self.head.store(next_head, std::sync::atomic::Ordering::Release);
        Ok(())
    }

    pub fn pop(&self) -> Option<T> {
        let tail = self.tail.load(std::sync::atomic::Ordering::Acquire);
        if tail == self.head.load(std::sync::atomic::Ordering::Acquire) {
            return None; // Buffer is empty
        }

        let item_ptr = self.buffer[tail].load(std::sync::atomic::Ordering::Acquire);
        if item_ptr.is_null() {
            return None;
        }

        self.buffer[tail].store(std::ptr::null_mut(), std::sync::atomic::Ordering::Release);
        self.tail.store((tail + 1) % self.capacity, std::sync::atomic::Ordering::Release);

        Some(unsafe { *Box::from_raw(item_ptr) })
    }
}

// High-performance data processing pipeline
pub struct DataProcessingPipeline {
    ingestion_buffer: Arc<LockFreeRingBuffer<SensorReading>>,
    processing_pool: rayon::ThreadPool,
    batch_size: usize,
    flush_interval: std::time::Duration,
}

impl DataProcessingPipeline {
    pub fn new(buffer_capacity: usize, worker_threads: usize) -> Self {
        let processing_pool = rayon::ThreadPoolBuilder::new()
            .num_threads(worker_threads)
            .build()
            .expect("Failed to create thread pool");

        Self {
            ingestion_buffer: Arc::new(LockFreeRingBuffer::new(buffer_capacity)),
            processing_pool,
            batch_size: 1000,
            flush_interval: std::time::Duration::from_millis(100),
        }
    }

    pub async fn start_processing(&self) -> Result<(), Box<dyn std::error::Error>> {
        let buffer = Arc::clone(&self.ingestion_buffer);
        let batch_size = self.batch_size;
        let flush_interval = self.flush_interval;

        // Spawn processing task
        tokio::spawn(async move {
            let mut batch = Vec::with_capacity(batch_size);
            let mut last_flush = std::time::Instant::now();

            loop {
                // Collect batch of readings
                while batch.len() < batch_size {
                    if let Some(reading) = buffer.pop() {
                        batch.push(reading);
                    } else {
                        tokio::time::sleep(std::time::Duration::from_micros(100)).await;
                        break;
                    }
                }

                // Process batch if we have data or if flush interval elapsed
                if !batch.is_empty() && 
                   (batch.len() >= batch_size || last_flush.elapsed() >= flush_interval) {
                    
                    let batch_to_process = std::mem::take(&mut batch);
                    Self::process_batch(batch_to_process).await;
                    last_flush = std::time::Instant::now();
                }

                tokio::time::sleep(std::time::Duration::from_millis(1)).await;
            }
        });

        Ok(())
    }

    async fn process_batch(readings: Vec<SensorReading>) {
        // Parallel processing using Rayon
        let processed_readings: Vec<ProcessedReading> = readings
            .into_par_iter()
            .map(|reading| {
                // Apply calibration, validation, and feature extraction
                ProcessedReading {
                    sensor_id: reading.sensor_id,
                    equipment_id: reading.equipment_id,
                    timestamp: reading.timestamp,
                    calibrated_value: Self::apply_calibration(reading.value),
                    features: Self::extract_features(&reading),
                    anomaly_score: Self::calculate_anomaly_score(&reading),
                }
            })
            .collect();

        // Batch write to database
        if let Err(e) = Self::batch_write_to_database(processed_readings).await {
            eprintln!("Database write error: {}", e);
        }
    }

    fn apply_calibration(raw_value: f64) -> f64 {
        // High-performance calibration using SIMD when possible
        raw_value * 1.0 + 0.0 // Simplified for example
    }

    fn extract_features(reading: &SensorReading) -> Vec<f32> {
        // Feature extraction for ML models
        vec![
            reading.value as f32,
            (reading.value as f32).powf(2.0),
            (reading.value as f32).ln(),
        ]
    }

    fn calculate_anomaly_score(reading: &SensorReading) -> f32 {
        // Simple anomaly scoring - would use ML model in practice
        if reading.value.abs() > 100.0 { 0.8 } else { 0.1 }
    }

    async fn batch_write_to_database(readings: Vec<ProcessedReading>) -> Result<(), sqlx::Error> {
        // Use prepared statements and connection pooling for optimal performance
        // Implementation would use actual database connection
        Ok(())
    }

    pub fn ingest_reading(&self, reading: SensorReading) -> Result<(), SensorReading> {
        self.ingestion_buffer.push(reading)
    }
}

// Memory-mapped file storage for ultra-high performance
pub struct MemoryMappedStorage {
    file: std::fs::File,
    mmap: memmap2::MmapMut,
    header: *mut StorageHeader,
}

#[repr(C)]
struct StorageHeader {
    version: u32,
    record_count: u64,
    next_write_offset: u64,
}

impl MemoryMappedStorage {
    pub fn new(file_path: &str, initial_size: usize) -> Result<Self, Box<dyn std::error::Error>> {
        let file = std::fs::OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .open(file_path)?;

        file.set_len(initial_size as u64)?;

        let mmap = unsafe { memmap2::MmapOptions::new().map_mut(&file)? };
        let header = mmap.as_ptr() as *mut StorageHeader;

        // Initialize header if new file
        unsafe {
            if (*header).version == 0 {
                (*header).version = 1;
                (*header).record_count = 0;
                (*header).next_write_offset = std::mem::size_of::<StorageHeader>() as u64;
            }
        }

        Ok(Self { file, mmap, header })
    }

    pub fn write_reading(&mut self, reading: &SensorReading) -> Result<(), Box<dyn std::error::Error>> {
        let serialized = bincode::serialize(reading)?;
        let write_offset = unsafe { (*self.header).next_write_offset } as usize;

        if write_offset + serialized.len() + 8 > self.mmap.len() {
            // Need to grow the file
            self.grow_file()?;
        }

        // Write length prefix
        let len_bytes = (serialized.len() as u64).to_le_bytes();
        self.mmap[write_offset..write_offset + 8].copy_from_slice(&len_bytes);

        // Write data
        self.mmap[write_offset + 8..write_offset + 8 + serialized.len()]
            .copy_from_slice(&serialized);

        unsafe {
            (*self.header).record_count += 1;
            (*self.header).next_write_offset += 8 + serialized.len() as u64;
        }

        Ok(())
    }

    fn grow_file(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let current_size = self.file.metadata()?.len();
        let new_size = current_size * 2;
        
        self.file.set_len(new_size)?;
        
        // Remap the file
        drop(std::mem::replace(&mut self.mmap, unsafe { 
            memmap2::MmapOptions::new().map_mut(&self.file)? 
        }));
        
        self.header = self.mmap.as_ptr() as *mut StorageHeader;
        
        Ok(())
    }
}
```

### 3.2 Database Performance Optimization

```sql
-- PostgreSQL performance optimization

-- Connection pooling configuration
-- postgresql.conf
max_connections = 200
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 64MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 16MB

-- Enable query optimization
shared_preload_libraries = 'pg_stat_statements, pg_hint_plan'
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all

-- Partitioning strategy for large tables
CREATE TABLE manufacturing.sensor_readings (
    id BIGSERIAL,
    sensor_id UUID NOT NULL,
    equipment_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    value DECIMAL(15,6) NOT NULL,
    quality manufacturing.data_quality NOT NULL,
    metadata JSONB
) PARTITION BY RANGE (timestamp);

-- Monthly partitions for sensor data
CREATE TABLE manufacturing.sensor_readings_2025_08 
PARTITION OF manufacturing.sensor_readings
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE manufacturing.sensor_readings_2025_09 
PARTITION OF manufacturing.sensor_readings  
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

-- Optimized indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_sensor_readings_equipment_time 
ON manufacturing.sensor_readings_2025_08 (equipment_id, timestamp DESC);

CREATE INDEX CONCURRENTLY idx_sensor_readings_sensor_time
ON manufacturing.sensor_readings_2025_08 (sensor_id, timestamp DESC);

-- Partial indexes for active data
CREATE INDEX CONCURRENTLY idx_sensor_readings_recent_quality
ON manufacturing.sensor_readings_2025_08 (equipment_id, timestamp DESC)
WHERE quality = 'good' AND timestamp > NOW() - INTERVAL '24 hours';

-- Function-based index for time-based queries
CREATE INDEX CONCURRENTLY idx_sensor_readings_hour_bucket
ON manufacturing.sensor_readings_2025_08 (
    equipment_id, 
    date_trunc('hour', timestamp),
    sensor_id
);

-- Materialized views for aggregated data
CREATE MATERIALIZED VIEW manufacturing.sensor_readings_hourly AS
SELECT 
    equipment_id,
    sensor_id,
    date_trunc('hour', timestamp) as hour,
    COUNT(*) as reading_count,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    STDDEV(value) as stddev_value,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY value) as p95_value
FROM manufacturing.sensor_readings
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY equipment_id, sensor_id, date_trunc('hour', timestamp);

CREATE UNIQUE INDEX ON manufacturing.sensor_readings_hourly (equipment_id, sensor_id, hour);

-- Automatic refresh of materialized views
CREATE OR REPLACE FUNCTION refresh_sensor_aggregates()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY manufacturing.sensor_readings_hourly;
    REFRESH MATERIALIZED VIEW CONCURRENTLY manufacturing.sensor_readings_daily;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 5 minutes
SELECT cron.schedule('refresh-aggregates', '*/5 * * * *', 'SELECT refresh_sensor_aggregates();');

-- High-performance bulk insert function
CREATE OR REPLACE FUNCTION bulk_insert_sensor_readings(
    readings JSONB
) RETURNS void AS $$
DECLARE
    reading_record RECORD;
BEGIN
    -- Use COPY for maximum insert performance
    FOR reading_record IN 
        SELECT * FROM jsonb_to_recordset(readings) AS x(
            sensor_id UUID,
            equipment_id UUID,
            timestamp TIMESTAMP WITH TIME ZONE,
            value DECIMAL(15,6),
            quality TEXT
        )
    LOOP
        INSERT INTO manufacturing.sensor_readings (
            sensor_id, equipment_id, timestamp, value, quality
        ) VALUES (
            reading_record.sensor_id,
            reading_record.equipment_id,
            reading_record.timestamp,
            reading_record.value,
            reading_record.quality::manufacturing.data_quality
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Connection pooling with PgBouncer configuration
-- pgbouncer.ini
[databases]
predictive_maintenance = host=localhost port=5432 dbname=predictive_maintenance

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 10
reserve_pool_timeout = 5
max_db_connections = 100
max_user_connections = 100
server_round_robin = 1
ignore_startup_parameters = extra_float_digits
server_reset_query = DISCARD ALL
server_check_query = SELECT 1
server_check_delay = 30
```

### 3.3 InfluxDB Performance Tuning

```python
# InfluxDB optimization for time-series data
from influxdb_client import InfluxDBClient, Point, WriteOptions
from influxdb_client.client.write_api import ASYNCHRONOUS
import asyncio
from typing import List
import time

class OptimizedInfluxDBWriter:
    def __init__(self, url: str, token: str, org: str, bucket: str):
        self.client = InfluxDBClient(url=url, token=token, org=org)
        
        # Optimized write options for high throughput
        write_options = WriteOptions(
            batch_size=10000,           # Large batches for efficiency
            flush_interval=1000,        # 1 second flush interval
            jitter_interval=100,        # Add jitter to prevent thundering herd
            retry_interval=5000,        # 5 second retry interval
            max_retries=3,              # Maximum retry attempts
            max_retry_delay=30000,      # Maximum retry delay
            exponential_base=2          # Exponential backoff base
        )
        
        self.write_api = self.client.write_api(write_options=write_options)
        self.query_api = self.client.query_api()
        
        # Buffer for batching writes
        self.write_buffer = []
        self.buffer_lock = asyncio.Lock()
        self.max_buffer_size = 10000
        
    async def write_sensor_reading(self, reading: dict) -> None:
        """Write single sensor reading to buffer"""
        point = Point("sensor_readings") \
            .tag("equipment_id", reading["equipment_id"]) \
            .tag("sensor_id", reading["sensor_id"]) \
            .tag("parameter_type", reading["parameter_type"]) \
            .tag("location", reading.get("location", "unknown")) \
            .field("value", float(reading["value"])) \
            .field("quality", int(reading.get("quality", 100))) \
            .time(reading["timestamp"])
            
        async with self.buffer_lock:
            self.write_buffer.append(point)
            
            if len(self.write_buffer) >= self.max_buffer_size:
                await self._flush_buffer()
    
    async def write_sensor_readings_batch(self, readings: List[dict]) -> None:
        """Write batch of sensor readings"""
        points = []
        for reading in readings:
            point = Point("sensor_readings") \
                .tag("equipment_id", reading["equipment_id"]) \
                .tag("sensor_id", reading["sensor_id"]) \
                .tag("parameter_type", reading["parameter_type"]) \
                .field("value", float(reading["value"])) \
                .field("quality", int(reading.get("quality", 100))) \
                .time(reading["timestamp"])
            points.append(point)
        
        # Write directly for large batches
        try:
            self.write_api.write(bucket=self.bucket, record=points)
        except Exception as e:
            print(f"Write error: {e}")
            # Could implement retry logic here
    
    async def _flush_buffer(self) -> None:
        """Flush the write buffer"""
        if not self.write_buffer:
            return
            
        points_to_write = self.write_buffer.copy()
        self.write_buffer.clear()
        
        try:
            self.write_api.write(bucket=self.bucket, record=points_to_write)
        except Exception as e:
            print(f"Buffer flush error: {e}")
            # Re-add failed points to buffer for retry
            self.write_buffer.extend(points_to_write)
    
    async def start_periodic_flush(self, interval: float = 1.0) -> None:
        """Start periodic buffer flushing"""
        while True:
            await asyncio.sleep(interval)
            async with self.buffer_lock:
                await self._flush_buffer()
    
    def optimized_query(self, equipment_id: str, start_time: str, window: str = "1m") -> str:
        """Generate optimized Flux query with downsampling"""
        query = f'''
            from(bucket: "{self.bucket}")
              |> range(start: {start_time})
              |> filter(fn: (r) => r._measurement == "sensor_readings")
              |> filter(fn: (r) => r.equipment_id == "{equipment_id}")
              |> filter(fn: (r) => r._field == "value")
              |> aggregateWindow(every: {window}, fn: mean, createEmpty: false)
              |> yield(name: "mean")
        '''
        return query
    
    async def query_with_caching(self, query: str, cache_key: str, ttl: int = 300) -> List[dict]:
        """Execute query with Redis caching"""
        # Check cache first
        cached_result = await self.redis_client.get(cache_key)
        if cached_result:
            return json.loads(cached_result)
        
        # Execute query
        tables = self.query_api.query(query)
        result = []
        
        for table in tables:
            for record in table.records:
                result.append({
                    'time': record.get_time(),
                    'value': record.get_value(),
                    'equipment_id': record.values.get('equipment_id'),
                    'sensor_id': record.values.get('sensor_id')
                })
        
        # Cache result
        await self.redis_client.setex(
            cache_key, 
            ttl, 
            json.dumps(result, default=str)
        )
        
        return result

# InfluxDB configuration optimization
INFLUX_CONFIG = {
    'data-dir': '/var/lib/influxdb2',
    'engine-path': '/var/lib/influxdb2/engine',
    'bolt-path': '/var/lib/influxdb2/influxd.bolt',
    
    # Storage engine optimization
    'storage-cache-max-memory-size': '1073741824',  # 1GB
    'storage-cache-snapshot-memory-size': '26214400',  # 25MB
    'storage-cache-snapshot-write-cold-duration': '10m',
    'storage-compact-full-write-cold-duration': '4h',
    'storage-compact-throughput-burst': '50MB',
    'storage-max-concurrent-compactions': '3',
    'storage-max-index-log-file-size': '1048576',  # 1MB
    'storage-series-id-set-cache-size': '100',
    
    # Query optimization
    'query-concurrency': '10',
    'query-initial-memory-bytes': '0',
    'query-max-memory-bytes': '0',  # Unlimited
    'query-memory-bytes': '9223372036854775807',
    'query-queue-size': '10',
    
    # Write optimization  
    'storage-wal-fsync-delay': '0s',
    'storage-write-timeout': '10s'
}
```

## 4. Memory Management & Resource Optimization

### 4.1 Memory Pool Implementation

```rust
// Custom memory pool for high-frequency allocations
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicPtr, AtomicUsize, Ordering};
use std::sync::Mutex;

pub struct MemoryPool {
    pools: Vec<Mutex<Vec<*mut u8>>>,
    chunk_sizes: Vec<usize>,
    allocated_bytes: AtomicUsize,
    allocation_count: AtomicUsize,
}

impl MemoryPool {
    pub fn new() -> Self {
        let chunk_sizes = vec![64, 128, 256, 512, 1024, 2048, 4096, 8192];
        let mut pools = Vec::new();
        
        for _ in &chunk_sizes {
            pools.push(Mutex::new(Vec::new()));
        }
        
        Self {
            pools,
            chunk_sizes,
            allocated_bytes: AtomicUsize::new(0),
            allocation_count: AtomicUsize::new(0),
        }
    }
    
    pub fn allocate(&self, size: usize) -> Option<*mut u8> {
        // Find appropriate pool
        let pool_index = self.chunk_sizes.iter()
            .position(|&chunk_size| chunk_size >= size)?;
        
        let chunk_size = self.chunk_sizes[pool_index];
        
        // Try to get from pool first
        if let Ok(mut pool) = self.pools[pool_index].try_lock() {
            if let Some(ptr) = pool.pop() {
                self.allocation_count.fetch_add(1, Ordering::Relaxed);
                return Some(ptr);
            }
        }
        
        // Allocate new chunk if pool is empty
        let layout = Layout::from_size_align(chunk_size, 8).ok()?;
        let ptr = unsafe { System.alloc(layout) };
        
        if !ptr.is_null() {
            self.allocated_bytes.fetch_add(chunk_size, Ordering::Relaxed);
            self.allocation_count.fetch_add(1, Ordering::Relaxed);
            Some(ptr)
        } else {
            None
        }
    }
    
    pub fn deallocate(&self, ptr: *mut u8, size: usize) {
        let pool_index = self.chunk_sizes.iter()
            .position(|&chunk_size| chunk_size >= size);
            
        if let Some(index) = pool_index {
            if let Ok(mut pool) = self.pools[index].try_lock() {
                pool.push(ptr);
                self.allocation_count.fetch_sub(1, Ordering::Relaxed);
                return;
            }
        }
        
        // Fallback to system deallocation
        let chunk_size = self.chunk_sizes.get(pool_index.unwrap_or(0))
            .copied()
            .unwrap_or(size);
        let layout = Layout::from_size_align(chunk_size, 8).unwrap();
        unsafe { System.dealloc(ptr, layout) };
        
        self.allocated_bytes.fetch_sub(chunk_size, Ordering::Relaxed);
        self.allocation_count.fetch_sub(1, Ordering::Relaxed);
    }
    
    pub fn get_stats(&self) -> MemoryStats {
        MemoryStats {
            allocated_bytes: self.allocated_bytes.load(Ordering::Relaxed),
            allocation_count: self.allocation_count.load(Ordering::Relaxed),
            pool_utilization: self.pools.iter().enumerate()
                .map(|(i, pool)| {
                    let size = pool.try_lock().map(|p| p.len()).unwrap_or(0);
                    (self.chunk_sizes[i], size)
                })
                .collect()
        }
    }
}

#[derive(Debug)]
pub struct MemoryStats {
    pub allocated_bytes: usize,
    pub allocation_count: usize,
    pub pool_utilization: Vec<(usize, usize)>,
}
```

### 4.2 Garbage Collection Optimization

```typescript
// Memory management for Node.js services
class MemoryManager {
  private gcMetrics = {
    lastGC: Date.now(),
    gcCount: 0,
    heapUsedBefore: 0,
    heapUsedAfter: 0
  };

  constructor() {
    this.setupGCMonitoring();
    this.startMemoryCleanup();
  }

  private setupGCMonitoring(): void {
    // Monitor garbage collection
    const v8 = require('v8');
    
    setInterval(() => {
      const heapStats = v8.getHeapStatistics();
      const heapSpaceStats = v8.getHeapSpaceStatistics();
      
      // Log memory statistics
      logger.info('Memory statistics', {
        heapUsed: Math.round(heapStats.used_heap_size / 1024 / 1024),
        heapTotal: Math.round(heapStats.total_heap_size / 1024 / 1024),
        heapLimit: Math.round(heapStats.heap_size_limit / 1024 / 1024),
        externalMemory: Math.round(process.memoryUsage().external / 1024 / 1024),
        spaces: heapSpaceStats.map(space => ({
          name: space.space_name,
          used: Math.round(space.space_used_size / 1024 / 1024),
          available: Math.round(space.space_available_size / 1024 / 1024)
        }))
      });

      // Trigger GC if memory usage is high
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      
      if (heapUsedMB > 1000) { // 1GB threshold
        logger.warn('High memory usage detected, triggering GC', {
          heapUsedMB,
          rss: memoryUsage.rss / 1024 / 1024
        });
        
        this.triggerGC();
      }
    }, 30000); // Every 30 seconds
  }

  private triggerGC(): void {
    const before = process.memoryUsage();
    
    if (global.gc) {
      global.gc();
      
      const after = process.memoryUsage();
      const freedMB = (before.heapUsed - after.heapUsed) / 1024 / 1024;
      
      logger.info('Manual GC completed', {
        freedMemoryMB: Math.round(freedMB),
        heapBeforeMB: Math.round(before.heapUsed / 1024 / 1024),
        heapAfterMB: Math.round(after.heapUsed / 1024 / 1024)
      });
      
      this.gcMetrics = {
        lastGC: Date.now(),
        gcCount: this.gcMetrics.gcCount + 1,
        heapUsedBefore: before.heapUsed,
        heapUsedAfter: after.heapUsed
      };
    }
  }

  private startMemoryCleanup(): void {
    // Clean up old cached data periodically
    setInterval(() => {
      this.cleanupExpiredCaches();
      this.cleanupOldConnections();
      this.cleanupTempFiles();
    }, 60000); // Every minute
  }

  private cleanupExpiredCaches(): void {
    // Clean up Redis expired keys
    const redis = require('./redis-client');
    
    // Remove keys that haven't been accessed recently
    redis.eval(`
      local keys = redis.call('keys', 'cache:*')
      local removed = 0
      for i=1,#keys do
        local ttl = redis.call('ttl', keys[i])
        if ttl > 0 and ttl < 300 then  -- Less than 5 minutes
          redis.call('del', keys[i])
          removed = removed + 1
        end
      end
      return removed
    `, 0).then((removed: number) => {
      if (removed > 0) {
        logger.info('Cleaned up expired cache entries', { removed });
      }
    });
  }

  private cleanupOldConnections(): void {
    // Clean up database connection pools
    const pool = require('./database').pool;
    
    // Remove idle connections
    if (pool.idleCount > pool.options.min) {
      const connectionsToRemove = Math.min(
        pool.idleCount - pool.options.min,
        Math.floor(pool.idleCount * 0.1) // Remove 10% of idle connections
      );
      
      for (let i = 0; i < connectionsToRemove; i++) {
        pool.removeIdle();
      }
      
      logger.info('Cleaned up idle database connections', {
        removed: connectionsToRemove,
        remaining: pool.idleCount
      });
    }
  }

  private cleanupTempFiles(): void {
    const fs = require('fs').promises;
    const path = require('path');
    
    const tempDir = '/tmp/predictive-maintenance';
    
    fs.readdir(tempDir).then(async (files) => {
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        try {
          const stats = await fs.stat(filePath);
          const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
          
          if (ageHours > 1) { // Files older than 1 hour
            await fs.unlink(filePath);
            logger.debug('Removed temporary file', { file: filePath, ageHours });
          }
        } catch (error) {
          // File might have been removed already
        }
      }
    }).catch(error => {
      logger.error('Error cleaning temp files', { error: error.message });
    });
  }

  getMemoryMetrics() {
    const usage = process.memoryUsage();
    return {
      heap: {
        used: Math.round(usage.heapUsed / 1024 / 1024),
        total: Math.round(usage.heapTotal / 1024 / 1024)
      },
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      gc: this.gcMetrics
    };
  }
}
```

This comprehensive performance optimization guide provides detailed strategies for maximizing system performance across all layers of the predictive maintenance application, from frontend rendering to backend data processing and database operations.