import { useState, useEffect } from 'react'
import { Layout, Typography, Space, Button } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store/appStore'

const { Header } = Layout
const { Title } = Typography

interface HeaderProps {
  title: string
}

export function AppHeader({ title }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { isSidebarCollapsed } = useAppStore()
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide header
        setIsVisible(false)
      } else {
        // Scrolling up - show header
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  return (
    <Header
      style={{
        width: `calc(100% - ${isSidebarCollapsed ? 80 : 250}px)`,
        marginLeft: `${isSidebarCollapsed ? 80 : 250}px`,
        background: 'var(--header-bg)', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--header-border)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '64px',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Title level={4} style={{ color: 'var(--header-text)', margin: 0 }}>
        {title}
      </Title>
      
      <Space>
        <div style={{ position: 'relative' }}>
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{
              fontSize: '16px',
              width: 40,
              height: 40,
              color: 'var(--header-text)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: 'var(--error)',
              color: '#fff',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            3
          </div>
        </div>
      </Space>
    </Header>
  )
} 