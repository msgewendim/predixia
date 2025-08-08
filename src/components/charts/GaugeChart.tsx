import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'

interface GaugeChartProps {
  title?: string
  value: number
  min?: number
  max?: number
  unit?: string
  thresholds?: {
    warning: number
    danger: number
  }
  height?: number | string
}

export function GaugeChart({
  title,
  value,
  min = 0,
  max = 100,
  unit = '',
  thresholds = { warning: 70, danger: 90 },
  height = '300px'
}: GaugeChartProps) {
  const option: echarts.EChartsOption = {
    title: title ? {
      text: title,
      left: 'center'
    } : undefined,
    series: [
      {
        type: 'gauge',
        min,
        max,
        progress: {
          show: true,
          roundCap: true,
          width: 18,
          itemStyle: {
            color: value >= thresholds.danger 
              ? '#ff4d4f' 
              : value >= thresholds.warning 
                ? '#faad14' 
                : '#52c41a'
          }
        },
        pointer: {
          itemStyle: {
            color: 'auto'
          }
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [thresholds.warning / 100, '#52c41a'],
              [thresholds.danger / 100, '#faad14'],
              [1, '#ff4d4f']
            ]
          }
        },
        axisTick: {
          distance: -18,
          splitNumber: 5,
          lineStyle: {
            color: '#999',
            width: 2
          }
        },
        splitLine: {
          distance: -18,
          length: 14,
          lineStyle: {
            color: '#999',
            width: 3
          }
        },
        axisLabel: {
          color: '#999',
          distance: 25,
          fontSize: 14
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 18,
          itemStyle: {
            color: '#999'
          }
        },
        detail: {
          valueAnimation: true,
          fontSize: 30,
          offsetCenter: [0, '70%'],
          formatter: (value: number) => {
            if (unit === '%') {
              return `${value.toFixed(2)}${unit}`
            }
            return `${value}${unit}`
          },
          color: 'inherit'
        },
        data: [{
          value: value,
          name: title || ''
        }]
      }
    ]
  }

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      theme="dark"
      notMerge={true}
      opts={{ renderer: 'canvas' }}
    />
  )
}