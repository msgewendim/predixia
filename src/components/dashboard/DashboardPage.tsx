import { Card, Row, Col, Typography } from 'antd'
import { StatusCard } from '../cards/StatusCard'
import { ResponsiveChart } from '../charts/ResponsiveChart'
import { AlertList } from '../alerts/AlertList'
import { useMachineStore } from '../../store/machineStore'

const { Title } = Typography

export function DashboardPage() {
  const {
    machines,
    alerts,
    performanceHistory,
    systemHealth,
    predictionAccuracy
  } = useMachineStore()

  // Calculate average machine utilization
  const averageUtilization = machines.reduce((sum, machine) => sum + machine.utilization, 0) / machines.length

  // Count alerts by severity
  const alertCounts = alerts.reduce(
    (acc, alert) => {
      acc[alert.severity]++
      return acc
    },
    { high: 0, medium: 0, low: 0 }
  )

  // Determine overall system status
  const getSystemStatus = () => {
    if (systemHealth < 50) return 'error'
    if (systemHealth < 80) return 'warning'
    return 'normal'
  }

  // Format alerts for display
  const formattedAlerts = alerts.map(alert => ({
    id: alert.id,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    timestamp: alert.timestamp,
    machine: alert.machineName
  }))

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Title level={2} style={{  marginTop: '8px' }}>Dashboard Overview</Title>
      
      {/* Status Cards */}
      <Row gutter={[16, 16]} className="dashboard-row">
        <Col xs={24} sm={12} lg={6}>
          <StatusCard
            title="System Health"
            status={getSystemStatus()}
            value={`${systemHealth.toFixed(2)}%`}
            description={getSystemStatus() === 'normal' ? 'All systems operational' : 'Attention required'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatusCard
            title="Active Alerts"
            status={alertCounts.high > 0 ? 'error' : alertCounts.medium > 0 ? 'warning' : 'normal'}
            value={alerts.length.toString()}
            description={`${alertCounts.high} critical, ${alertCounts.medium} warnings`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatusCard
            title="Machine Utilization"
            status={averageUtilization < 50 ? 'warning' : 'normal'}
            value={`${averageUtilization.toFixed(2)}%`}
            description={averageUtilization < 50 ? 'Below target' : 'Optimal performance'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatusCard
            title="Prediction Accuracy"
            status={predictionAccuracy < 90 ? 'warning' : 'normal'}
            value={`${predictionAccuracy.toFixed(2)}%`}
            description="ML model performance"
          />
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} className="dashboard-row">
        <Col xs={24} lg={16}>
          <ResponsiveChart
            title="Performance Trends"
            type="line"
            lineChartProps={{
              data: performanceHistory.map(p => [p.timestamp, p.value]),
              xAxisLabel: "Time",
              yAxisLabel: "Performance (%)",
              smooth: true
            }}
            defaultWidth={100}
            minWidth={60}
            maxWidth={100}
          />
        </Col>
        <Col xs={24} lg={8}>
          <ResponsiveChart
            title="System Load"
            type="gauge"
            gaugeChartProps={{
              value: averageUtilization,
              thresholds: { warning: 60, danger: 80 },
              unit: "%"
            }}
            defaultWidth={100}
            minWidth={50}
            maxWidth={100}
          />
        </Col>
      </Row>

      {/* Alerts Section */}
      <Row gutter={[16, 16]} className="dashboard-row">
        <Col xs={24}>
          <Card title="Recent Alerts">
            <AlertList alerts={formattedAlerts} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}