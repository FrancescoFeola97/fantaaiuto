import { lazy, Suspense, ReactNode } from 'react'
import { LoadingScreen } from './ui/LoadingScreen'

// Lazy load heavy components
export const LazyDashboard = lazy(() => 
  import('./Dashboard').then(module => ({ default: module.Dashboard }))
)

export const LazyFormations = lazy(() => 
  import('./dashboard/Formations').then(module => ({ default: module.Formations }))
)

export const LazyDataImport = lazy(() => 
  import('./dashboard/DataImport').then(module => ({ default: module.DataImport }))
)

export const LazyLeagueManagement = lazy(() => 
  import('./leagues/LeagueManagement').then(module => ({ default: module.LeagueManagement }))
)

export const LazyParticipants = lazy(() => 
  import('./dashboard/Participants').then(module => ({ default: module.Participants }))
)

// Wrapper component with Suspense
interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <LoadingScreen /> 
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
)