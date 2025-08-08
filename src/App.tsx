import { ConfigProvider, theme } from 'antd'
import { MainLayout } from './components/layout/MainLayout'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { darkTheme } from './theme'
import './styles/responsive.css'
import './styles/colors.css'

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        ...darkTheme
      }}
    >
      <MainLayout>
        <DashboardPage />
      </MainLayout>
    </ConfigProvider>
  )
}

export default App
