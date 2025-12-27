import { lazy, Suspense } from 'react';
import { FiLoader } from 'react-icons/fi';

// Lazy load heavy components
export const AIAnalyticsDashboard = lazy(() => import('./AIAnalyticsDashboard'));
export const CalendarView = lazy(() => import('./CalendarView'));
export const Charts = lazy(() => import('./Charts'));
export const AIAssistant = lazy(() => import('./AIAssistant'));
export const ExportImport = lazy(() => import('./ExportImport'));

// Loading component
const ComponentLoader = ({ name = 'Component' }) => (
  <div className="flex items-center justify-center py-12">
    <div className="flex items-center gap-3">
      <FiLoader className="animate-spin text-[var(--accent)]" size={24} />
      <span className="text-[var(--text-secondary)]">Loading {name}...</span>
    </div>
  </div>
);

// Wrapper component with Suspense
export const LazyWrapper = ({ children, fallback, name }) => (
  <Suspense fallback={fallback || <ComponentLoader name={name} />}>
    {children}
  </Suspense>
);

export default LazyWrapper;