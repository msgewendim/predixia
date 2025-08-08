import { List, Tag, Typography, Space } from 'antd'
import { WarningOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

export type AlertSeverity = 'high' | 'medium' | 'low'

export interface Alert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  timestamp: string
  machine: string
}

interface AlertListProps {
  alerts: Alert[]
  loading?: boolean
}

export function AlertList({ alerts, loading = false }: AlertListProps) {
  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'high':
        return '#ff4d4f'
      case 'medium':
        return '#faad14'
      case 'low':
        return '#52c41a'
    }
  }

  const getSeverityTag = (severity: AlertSeverity) => (
    <Tag color={getSeverityColor(severity)} icon={<WarningOutlined />}>
      {severity.toUpperCase()}
    </Tag>
  )

  return (
    <List
      itemLayout="horizontal"
      dataSource={alerts}
      loading={loading}
      renderItem={(alert) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space>
                {getSeverityTag(alert.severity)}
                <Text>{alert.title}</Text>
              </Space>
            }
            description={
              <Space direction="vertical" size="small">
                <Text type="secondary">{alert.description}</Text>
                <Space size="large">
                  <Text type="secondary">
                    <ClockCircleOutlined /> {alert.timestamp}
                  </Text>
                  <Text type="secondary">{alert.machine}</Text>
                </Space>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  )
}