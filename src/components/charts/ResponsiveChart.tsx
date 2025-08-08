import { useState } from 'react'
import { Card, Button, Space, Typography } from 'antd'
import { ExpandOutlined, CompressOutlined } from '@ant-design/icons'
import { LineChart } from './LineChart'
import { GaugeChart } from './GaugeChart'

const { Text } = Typography

interface ResponsiveChartProps {
  title: string
  type: 'line' | 'gauge'
  lineChartProps?: {
    data: Array<[number | string, number]>
    xAxisLabel?: string
    yAxisLabel?: string
    smooth?: boolean
  }
  gaugeChartProps?: {
    value: number
    thresholds?: { warning: number; danger: number }
    unit?: string
  }
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
}

export function ResponsiveChart({
  title,
  type,
  lineChartProps,
  gaugeChartProps,
  defaultWidth = 100,
  minWidth = 50,
  maxWidth = 100
}: ResponsiveChartProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
    if (!isExpanded) {
      setWidth(100)
    } else {
      setWidth(defaultWidth)
    }
  }

  return (
    <Card
      title={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>{title}</Text>
          <Button
            type="text"
            icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={toggleExpanded}
            size="small"
          />
        </Space>
      }
      style={{ width: `${width}%` }}
    >      
      <div>
        {type === 'line' && lineChartProps && (
          <LineChart
            data={lineChartProps.data}
            xAxisLabel={lineChartProps.xAxisLabel}
            yAxisLabel={lineChartProps.yAxisLabel}
            smooth={lineChartProps.smooth}
            height="100%"
          />
        )}
        
        {type === 'gauge' && gaugeChartProps && (
          <GaugeChart
            value={gaugeChartProps.value}
            thresholds={gaugeChartProps.thresholds}
            unit={gaugeChartProps.unit}
            height="100%"
          />
        )}
      </div>
    </Card>
  )
} 