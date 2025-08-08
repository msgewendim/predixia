import { create } from 'zustand'
import { Machine, Alert, PerformanceMetric } from '../types/machine'

interface MachineStore {
  machines: Machine[]
  alerts: Alert[]
  performanceHistory: PerformanceMetric[]
  systemHealth: number
  predictionAccuracy: number
  selectedMachineId: string | null
  setSelectedMachineId: (id: string | null) => void
}

// Generate dummy performance data for the last 24 hours
const generatePerformanceData = (): PerformanceMetric[] => {
  const data: PerformanceMetric[] = []
  const now = Date.now()
  const hours24 = 24 * 60 * 60 * 1000

  for (let i = 0; i < 288; i++) { // Data point every 5 minutes
    data.push({
      timestamp: now - hours24 + (i * 5 * 60 * 1000),
      value: 75 + Math.random() * 20 + Math.sin(i / 12) * 5
    })
  }
  return data
}

// Dummy machines data
const dummyMachines: Machine[] = [
  {
    id: 'M001',
    name: 'CNC Mill Alpha',
    type: 'CNC Machine',
    status: 'online',
    health: 98.5,
    utilization: 85.2,
    lastMaintenance: '2024-03-15',
    nextMaintenance: '2024-04-15',
    location: 'Production Line A',
    parameters: [
      {
        id: 'P001',
        name: 'Spindle Speed',
        value: 8500,
        unit: 'RPM',
        min: 0,
        max: 12000,
        critical: 11000,
        warning: 10000,
        timestamp: new Date().toISOString()
      },
      {
        id: 'P002',
        name: 'Temperature',
        value: 65,
        unit: '°C',
        min: 0,
        max: 100,
        critical: 85,
        warning: 75,
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    id: 'M002',
    name: 'Robotic Arm Beta',
    type: 'Robot',
    status: 'maintenance',
    health: 75.8,
    utilization: 0,
    lastMaintenance: '2024-03-18',
    nextMaintenance: '2024-03-20',
    location: 'Assembly Line B',
    parameters: [
      {
        id: 'P003',
        name: 'Joint Speed',
        value: 45,
        unit: 'deg/s',
        min: 0,
        max: 180,
        critical: 160,
        warning: 140,
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    id: 'M003',
    name: 'Laser Cutter Gamma',
    type: 'Laser System',
    status: 'error',
    health: 45.2,
    utilization: 0,
    lastMaintenance: '2024-02-28',
    nextMaintenance: '2024-03-21',
    location: 'Production Line C',
    parameters: [
      {
        id: 'P004',
        name: 'Laser Power',
        value: 950,
        unit: 'W',
        min: 0,
        max: 1000,
        critical: 980,
        warning: 900,
        timestamp: new Date().toISOString()
      }
    ]
  }
]

// Dummy alerts
const dummyAlerts: Alert[] = [
  {
    id: 'A001',
    machineId: 'M003',
    machineName: 'Laser Cutter Gamma',
    title: 'Critical Temperature Warning',
    description: 'Machine temperature exceeds safe operating range',
    severity: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    acknowledged: false
  },
  {
    id: 'A002',
    machineId: 'M002',
    machineName: 'Robotic Arm Beta',
    title: 'Scheduled Maintenance',
    description: 'Regular maintenance check required',
    severity: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    acknowledged: true
  },
  {
    id: 'A003',
    machineId: 'M001',
    machineName: 'CNC Mill Alpha',
    title: 'Performance Optimization',
    description: 'Slight decrease in cutting efficiency detected',
    severity: 'low',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    acknowledged: false
  }
]

export const useMachineStore = create<MachineStore>((set) => ({
  machines: dummyMachines,
  alerts: dummyAlerts,
  performanceHistory: generatePerformanceData(),
  systemHealth: 89.5,
  predictionAccuracy: 94.8,
  selectedMachineId: null,
  setSelectedMachineId: (id) => set({ selectedMachineId: id })
}))