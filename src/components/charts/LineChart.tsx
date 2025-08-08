import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'

interface LineChartProps {
  title?: string
  data: Array<[number | string, number]>
  xAxisLabel?: string
  yAxisLabel?: string
  loading?: boolean
  height?: number | string
  smooth?: boolean
}

export function LineChart({
  title,
  data,
  xAxisLabel,
  yAxisLabel,
  loading = false,
  height = '300px',
  smooth = false
}: LineChartProps) {
  const option: echarts.EChartsOption = {
    title: title ? {
      text: title,
      left: 'center'
    } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '8%',
      right: '3%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      name: xAxisLabel,
      nameLocation: 'middle',
      nameGap: 35,
      axisLabel: {
        formatter: (value: number) => {
          const date = new Date(value)
          return date.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        rotate: 45,
        margin: 20
      },
      splitNumber: 6
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel,
      nameLocation: 'middle',
      nameGap: 50
    },
    series: [
      {
        type: 'line',
        data: data,
        smooth: smooth,
        showSymbol: false,
        animation: false,
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      showLoading={loading}
      theme="dark"
      notMerge={true}
      opts={{ renderer: 'canvas' }}
    />
  )
}