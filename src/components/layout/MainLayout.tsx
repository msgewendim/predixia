import { useState, useEffect } from 'react'
import { Layout, Menu, Button, Avatar, Typography } from 'antd'
import {
  DashboardOutlined,
  MonitorOutlined,
  SearchOutlined,
  LineChartOutlined,
  BarChartOutlined,
  SettingOutlined,
  FileTextOutlined,
  WarningOutlined,
  UserOutlined,
  ToolOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { AppHeader } from './Header'
import { useAppStore } from '../../store/appStore'

const { Sider, Content } = Layout
const { Title, Text } = Typography

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard Overview'
  },
  {
    key: '/monitoring',
    icon: <MonitorOutlined />,
    label: 'Machine Monitoring'
  },
  {
    key: '/root-cause',
    icon: <SearchOutlined />,
    label: 'Root Cause Analysis'
  },
  {
    key: '/predictions',
    icon: <LineChartOutlined />,
    label: 'Predictions & Forecasts'
  },
  {
    key: '/visualizations',
    icon: <BarChartOutlined />,
    label: 'Data Visualizations'
  },
  {
    key: '/parameters',
    icon: <ToolOutlined />,
    label: 'Machine Parameters'
  },
  {
    key: '/reports',
    icon: <FileTextOutlined />,
    label: 'Reports'
  },
  {
    key: '/alerts',
    icon: <WarningOutlined />,
    label: 'Alerts & Notifications'
  },
  {
    key: '/customers',
    icon: <UserOutlined />,
    label: 'Customer Management'
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Settings'
  }
]

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useAppStore()

  const [selectedKey, setSelectedKey] = useState('/dashboard')

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarCollapsed(!isSidebarCollapsed)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isSidebarCollapsed, setIsSidebarCollapsed])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={isSidebarCollapsed}
        width={isSidebarCollapsed ? 80 : 250}
        style={{
          background: 'var(--sidebar-bg)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 1000
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Company Logo/Name and Toggle */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--sidebar-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'space-between'
            }}
          >
            {!isSidebarCollapsed ? (
              <>
                <Title level={3} style={{ color: 'var(--sidebar-text)', margin: 0 }}>
                  Predixia
                </Title>
                <Button
                  type="text"
                  icon={isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={toggleSidebar}
                  style={{
                    fontSize: '16px',
                    width: 32,
                    height: 32,
                    color: 'var(--sidebar-text)'
                  }}
                />
              </>
            ) : (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={toggleSidebar}
                style={{
                  fontSize: '16px',
                  width: 32,
                  height: 32,
                  color: 'var(--sidebar-text)'
                }}
              />
            )}
          </div>

          {/* Navigation Menu */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[selectedKey]}
              style={{
                background: 'transparent',
                border: 'none',
                height: '100%'
              }}
              items={menuItems}
              onClick={({ key }) => {
                setSelectedKey(key)
              }}
            />
          </div>

          {/* User Section at Bottom */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid var(--sidebar-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
            }}
          >
            <Avatar
              size={isSidebarCollapsed ? 32 : 40}
              style={{ backgroundColor: 'var(--primary)' }}
              icon={<UserOutlined />}
            />
            {!isSidebarCollapsed && (
              <div style={{ marginLeft: '12px' }}>
                <Text style={{ color: 'var(--sidebar-text)', display: 'block', fontSize: '14px' }}>
                  Admin User
                </Text>
                <Text style={{ color: 'var(--gray-400)', fontSize: '12px' }}>
                  Administrator
                </Text>
              </div>
            )}
          </div>
        </div>
      </Sider>

      {/* Main Layout */}
      <Layout style={{ 
        marginLeft: isSidebarCollapsed ? 80 : 250, 
        transition: 'margin-left 0.2s',
        paddingTop: '64px'
      }}>
        {/* Fixed Header */}
        <AppHeader title="Machine Analytics Platform" />

        {/* Content */}
        <Content
          style={{
            // margin: '24px',
            padding: '24px',
            background: 'var(--content-bg)',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
            color: 'var(--content-text)'
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}