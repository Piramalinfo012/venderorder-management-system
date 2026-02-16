import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Footer from '../components/Footer';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-redirect to party-search on mount
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/admin' || location.pathname === '/admin/') {
      navigate('/party-search', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Navigation items configuration
  const navItems = [
    { name: 'Party Search', path: '/party-search' },
    { name: 'Pending Order', path: '/pending-order' },
    { name: 'Pending Stage', path: '/pending-stage' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'New Lead Calendar', path: '/new-lead-calendar' }
  ];

  // Check if current path is active
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 shadow-sm">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo/Brand - Left */}
            <div className="flex items-center gap-3">
              <img src="/PPPL.png" alt="PPPL Logo" className="h-8 w-auto object-contain" />
              <span className="text-lg sm:text-xl font-bold" style={{ color: '#1e40af' }}>
                Party Search System
              </span>
            </div>

            {/* Desktop Navigation Buttons */}
            <nav className="hidden sm:flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${isActive(item.path)
                      ? 'text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  style={isActive(item.path) ? { backgroundColor: '#1e40af' } : {}}
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: '#1e40af' }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-3 border-t border-gray-200 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-all ${isActive(item.path)
                      ? 'text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  style={isActive(item.path) ? { backgroundColor: '#1e40af' } : {}}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-14">
        <div className="w-full">
          <Outlet />
        </div>
      </main>

      {/* Fixed Footer */}
      <Footer />

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 sm:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Sidebar;