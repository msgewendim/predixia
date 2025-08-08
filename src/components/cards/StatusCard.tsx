import { Card, Badge, Space, Typography } from 'antd'
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

export type Status = 'normal' | 'warning' | 'error' | 'offline'

interface StatusCardProps {
  title: string
  status: Status
  value: string | number
  description?: string
  loading?: boolean
}

export function StatusCard({
  title,
  status,
  value,
  description,
  loading = false
}: StatusCardProps) {
  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'normal':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'offline':
        return <CloseCircleOutlined style={{ color: '#8c8c8c' }} />
    }
  }

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'normal':
        return 'success'
      case 'warning':
        return 'warning'
      case 'error':
        return 'error'
      case 'offline':
        return 'default'
    }
  }

  return (
    <Card loading={loading}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space>
          {getStatusIcon(status)}
          <Text>{title}</Text>
        </Space>
        <Text strong style={{ fontSize: '24px' }}>{value}</Text>
        {description && (
          <Badge status={getStatusColor(status)} text={description} />
        )}
      </Space>
    </Card>
  )
}