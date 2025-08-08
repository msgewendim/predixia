import { ThemeConfig } from 'antd'

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: 'var(--primary)',
    colorSuccess: 'var(--success)',
    colorWarning: 'var(--warning)',
    colorError: 'var(--error)',
    colorInfo: 'var(--primary)',
    
    // Background colors
    colorBgContainer: 'var(--content-bg)',
    colorBgElevated: 'var(--card-bg)',
    colorBgLayout: 'var(--content-bg)',
    colorBgSpotlight: 'var(--card-bg)',
    
    // Text colors
    colorText: 'var(--content-text)',
    colorTextSecondary: 'var(--gray-600)',
    colorTextTertiary: 'var(--gray-500)',
    colorTextQuaternary: 'var(--gray-400)',
    
    // Border colors
    colorBorder: 'var(--content-border)',
    colorBorderSecondary: 'var(--content-border)',
    
    // Shadow
    boxShadow: 'var(--card-shadow)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  },
  components: {
    Layout: {
      headerBg: 'var(--header-bg)',
      bodyBg: 'var(--content-bg)',
      triggerBg: 'var(--gray-800)'
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemColor: 'var(--sidebar-text)',
      itemSelectedColor: 'var(--primary)',
      itemSelectedBg: 'rgba(37, 99, 235, 0.1)',
      itemHoverColor: 'var(--primary)',
      itemHoverBg: 'rgba(255, 255, 255, 0.08)'
    },
    Card: {
      colorBgContainer: 'var(--card-bg)',
      colorBorderSecondary: 'var(--card-border)'
    },
    Table: {
      colorBgContainer: 'var(--card-bg)',
      colorFillAlter: 'rgba(0, 0, 0, 0.02)',
      colorBorderSecondary: 'var(--content-border)'
    },
    Input: {
      colorBgContainer: 'var(--content-bg)',
      colorBorder: 'var(--content-border)'
    },
    Button: {
      colorBgContainer: 'var(--content-bg)',
      colorBorder: 'var(--content-border)'
    }
  }
}

// ECharts theme configuration
export const echartsTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    color: 'rgba(255, 255, 255, 0.85)'
  },
  title: {
    textStyle: {
      color: 'rgba(255, 255, 255, 0.85)'
    },
    subtextStyle: {
      color: 'rgba(255, 255, 255, 0.45)'
    }
  },
  line: {
    itemStyle: {
      borderWidth: 2
    },
    symbolSize: 4,
    symbol: 'circle',
    smooth: false
  },
  radar: {
    itemStyle: {
      borderWidth: 2
    },
    symbolSize: 4,
    symbol: 'circle',
    smooth: false
  },
  bar: {
    itemStyle: {
      barBorderWidth: 0,
      barBorderColor: '#ccc'
    }
  },
  pie: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  scatter: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  boxplot: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  parallel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  sankey: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  funnel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  gauge: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    }
  },
  candlestick: {
    itemStyle: {
      color: '#eb5454',
      color0: '#47b262',
      borderColor: '#eb5454',
      borderColor0: '#47b262',
      borderWidth: 1
    }
  },
  graph: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc'
    },
    lineStyle: {
      width: 1,
      color: '#aaa'
    },
    symbolSize: 4,
    symbol: 'circle',
    smooth: false,
    color: [
      '#1890ff',
      '#52c41a',
      '#faad14',
      '#eb2f96',
      '#722ed1',
      '#13c2c2',
      '#2f54eb',
      '#fa8c16'
    ],
    label: {
      color: '#eeeeee'
    }
  },
  map: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5
    },
    label: {
      color: '#000'
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1
      },
      label: {
        color: 'rgb(100,0,0)'
      }
    }
  },
  geo: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5
    },
    label: {
      color: '#000'
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1
      },
      label: {
        color: 'rgb(100,0,0)'
      }
    }
  }
}