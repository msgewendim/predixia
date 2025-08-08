export type MachineStatus = 'online' | 'offline' | 'maintenance' | 'error'

export interface Machine {
  id: string
  name: string
  type: string
  status: MachineStatus
  health: number
  utilization: number
  lastMaintenance: string
  nextMaintenance: string
  location: string
  parameters: MachineParameter[]
}

export interface MachineParameter {
  id: string
  name: string
  value: number
  unit: string
  min: number
  max: number
  critical: number
  warning: number
  timestamp: string
}

export interface Alert {
  id: string
  machineId: string
  machineName: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  timestamp: string
  acknowledged: boolean
}

export interface PerformanceMetric {
  timestamp: number
  value: number
}