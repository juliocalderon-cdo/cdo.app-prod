import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useDownloadManager, DownloadManagerContext } from './hooks/useDownloadManager';
import { useAuth, AuthContext, useAuthContext } from './hooks/useAuth';
import Home from './components/Home';
import { Dashboard } from './components/Dashboard';
import DownloadView from './components/DownloadView';
import ReportHub from './components/ReportHub';
import ReportView from './components/ReportView';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { HomeIcon, ChartIcon, UsersIcon, LogoutIcon, UserIcon } from './components/Icons';
import { UserRole } from './types';


// --- START: Responsive Hook ---
// A robust hook that uses ResizeObserver to reliably detect container width,
// which is crucial for handling Chrome DevTools' faulty viewport reporting inside iframes.
const useResponsive = () => {
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    // Use ResizeObserver for reliability inside iframes
    const resizeObserver = new ResizeObserver(entries => {
      // We only have one entry, which is our #root element
      if (entries[0]) {
        const { width } = entries[0].contentRect;
        // Use a standard breakpoint (md: 768px) to switch layouts
        setIsMobileLayout(width < 768);
      }
    });

    resizeObserver.observe(rootEl);

    // Cleanup observer on component unmount
    return () => resizeObserver.disconnect();
  }, []); // Empty dependency array ensures this runs only once on mount

  return isMobileLayout;
};
// --- END: Responsive Hook ---


interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    isMobile?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isMobile = false }: NavItemProps) => {
    const baseClasses = "flex items-center rounded-md font-medium transition-colors";
    const mobileClasses = "flex-col justify-center w-24 h-full pt-4 text-base";
    const desktopClasses = "flex-row justify-start gap-3 px-3 py-2 text-sm";

    const activeClasses = isMobile ? "text-sky-400" : "bg-zinc-700 text-sky-300";
    const inactiveClasses = isMobile ? "text-zinc-400 hover:text-sky-400" : "text-zinc-400 hover:bg-zinc-700";

    return (
        <NavLink
            to={to}
            end={to === "/"}
            className={({ isActive }: {isActive: boolean}) => `${baseClasses} ${isMobile ? mobileClasses : desktopClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {icon}
            <span className={isMobile ? 'mt-2' : 'inline'}>{label}</span>
        </NavLink>
    );
};

// --- START: Navigation Components ---
const SidebarNav: React.FC = () => {
    const { currentUser, logout, isAuthLoading } = useAuthContext();
    return (
         <nav className="flex flex-col justify-between w-64 bg-zinc-800 shadow-lg p-4">
            <div>
                <div className="mb-8 flex items-center justify-start pl-2 h-12">
                    <img src="https://gdn.com.uy/wp-content/uploads/2024/07/image-62-e1721071072224-scaled-300x79.png" alt="GDNuy Logo" className="h-auto w-auto max-h-12" />
                </div>
                <div className="flex flex-col justify-start gap-2">
                    <NavItem to="/" icon={<HomeIcon className="w-6 h-6"/>} label="Inicio" />
                    <NavItem to="/reports" icon={<ChartIcon className="w-6 h-6"/>} label="Reportes" />
                    {currentUser?.role === UserRole.ADMIN && (
                        <NavItem to="/users" icon={<UsersIcon className="w-6 h-6"/>} label="Usuarios" />
                    )}
                </div>
            </div>

            <div className="p-2 border-t border-zinc-700">
                {currentUser && (
                    <div className="flex flex-col items-start gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-1 bg-zinc-700 rounded-full">
                                <UserIcon className="w-5 h-5 text-zinc-300"/>
                            </div>
                            <div className="block overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate" title={currentUser.name}>{currentUser.name}</p>
                                <p className="text-xs text-zinc-400 truncate" title={currentUser.username}>{currentUser.username}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            disabled={isAuthLoading}
                            className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        >
                            <LogoutIcon className="w-6 h-6"/>
                            <span className="inline">{isAuthLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

const BottomNav: React.FC = () => {
    const { currentUser, logout, isAuthLoading } = useAuthContext();
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-24 bg-zinc-800 shadow-[0_-2px_5px_rgba(0,0,0,0.1)] z-40">
            <div className="flex justify-around items-center h-full max-w-lg mx-auto">
                <NavItem to="/" icon={<HomeIcon className="w-8 h-8"/>} label="Inicio" isMobile={true}/>
                <NavItem to="/reports" icon={<ChartIcon className="w-8 h-8"/>} label="Reportes" isMobile={true}/>
                {currentUser?.role === UserRole.ADMIN && (
                    <NavItem to="/users" icon={<UsersIcon className="w-8 h-8"/>} label="Usuarios" isMobile={true}/>
                )}
                <button 
                    onClick={logout}
                    disabled={isAuthLoading}
                    className="flex flex-col items-center justify-center w-24 h-full pt-4 text-zinc-400 hover:text-sky-400 rounded-md transition-colors disabled:opacity-50"
                >
                    <LogoutIcon className="w-8 h-8"/>
                    <span className="text-base mt-2">{isAuthLoading ? 'Saliendo...' : 'Salir'}</span>
                </button>
            </div>
        </nav>
    );
};
// --- END: Navigation Components ---

// --- START: Updated Layout Component ---
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
    const isMobile = useResponsive();
    const isDesktop = !isMobile;

    return (
        <div className={`relative flex-1 ${isDesktop ? 'flex' : 'flex flex-col'}`}>
            {isDesktop ? <SidebarNav /> : null}
            
            <main className={`flex-1 overflow-y-auto min-h-0 text-zinc-200 ${isMobile ? 'pb-28' : ''}`}>
                {children}
            </main>

            {isMobile ? <BottomNav /> : null}
        </div>
    );
};
// --- END: Updated Layout Component ---

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) => {
    const { currentUser, isAuthLoading } = useAuthContext();
    const location = useLocation();

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <svg className="animate-spin h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/" replace />; // Or to an "unauthorized" page
    }

    return <>{children}</>;
};

const AppContent: React.FC = () => {
    const downloadManager = useDownloadManager();

    return (
        <DownloadManagerContext.Provider value={downloadManager}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                    path="/" 
                    element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} 
                />
                <Route 
                    path="/imports" 
                    element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} 
                />
                <Route 
                    path="/download/:taskId" 
                    element={<ProtectedRoute><Layout><DownloadView /></Layout></ProtectedRoute>} 
                />
                <Route 
                    path="/reports" 
                    element={<ProtectedRoute><Layout><ReportHub /></Layout></ProtectedRoute>} 
                />
                <Route 
                    path="/reports/imports" 
                    element={<ProtectedRoute><Layout><ReportView /></Layout></ProtectedRoute>} 
                />
                <Route path="/users" element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <Layout><UserManagement /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </DownloadManagerContext.Provider>
    );
}

const App: React.FC = () => {
    const authManager = useAuth();
    return (
        <AuthContext.Provider value={authManager}>
            <AppContent />
        </AuthContext.Provider>
    );
};


export default App;