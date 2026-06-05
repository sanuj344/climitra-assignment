import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Camera, FileText, LogOut, Search } from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'reviewer'] },
    { name: 'Capture Evidence', path: '/capture', icon: Camera, roles: ['operator', 'admin'] },
    { name: 'Documents', path: '/documents', icon: FileText, roles: ['admin', 'reviewer', 'operator'] },
    { name: 'Search', path: '/search', icon: Search, roles: ['admin', 'reviewer'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-indigo-600 tracking-tight">Climitra</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.filter(item => item.roles.includes(role || '')).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile nav could be added here */}

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
