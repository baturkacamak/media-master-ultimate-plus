import React, { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toggleDarkMode } from '@store/slices/appSlice';

// Import icons
import {
  BiCategory,
  BiCog,
  BiFolder,
  BiHome,
  BiImageAlt,
  BiInfoCircle,
  BiMenu,
  BiMoon,
  BiSun, BiUserVoice,
  BiX,
} from 'react-icons/bi';

interface MainLayoutProps {
  children: ReactNode;
  appVersion: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, appVersion }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const darkMode = useSelector((state: RootState) => state.app.darkMode);

  // Navigation items
  const navItems = [
    { path: '/', label: t('nav.home'), icon: <BiHome size={24} /> },
    { path: '/organize', label: t('nav.organize'), icon: <BiImageAlt size={24} /> },
    { path: '/convert', label: t('nav.convert'), icon: <BiFolder size={24} /> },
    { path: '/categorize', label: t('nav.categorize'), icon: <BiCategory size={24} /> },
    { path: '/facerecognition', label: t('nav.faceRecognition'), icon: <BiUserVoice size={24} /> },
    { path: '/settings', label: t('nav.settings'), icon: <BiCog size={24} /> },
    { path: '/about', label: t('nav.about'), icon: <BiInfoCircle size={24} /> },
  ];

  // Set dark mode class on document
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Navigate to a route and close mobile menu
  const navigateTo = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`flex h-screen bg-gray-50 ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            {/* App logo */}
            <div className="flex items-center justify-center flex-shrink-0 px-4 mb-5">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                MEDIA MASTER
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <div
                  key={item.path}
                  className={`
                    ${
                    location.pathname === item.path
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                    group flex items-center px-2 py-2 text-base font-medium rounded-md cursor-pointer
                  `}
                  onClick={() => navigateTo(item.path)}
                >
                  <div className="mr-3">{item.icon}</div>
                  {item.label}
                </div>
              ))}
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="flex flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500 dark:text-gray-400">v{appVersion}</div>
              <button
                onClick={() => dispatch(toggleDarkMode())}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full"
              >
                {darkMode ? <BiSun size={20} /> : <BiMoon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navbar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              Media Master
            </span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className="p-2 mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full"
            >
              {darkMode ? <BiSun size={20} /> : <BiMoon size={20} />}
            </button>
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full"
            >
              {mobileMenuOpen ? <BiX size={24} /> : <BiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {navItems.map((item) => (
              <div
                key={item.path}
                className={`
                  ${
                  location.pathname === item.path
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }
                  group flex items-center px-2 py-2 text-base font-medium rounded-md cursor-pointer
                `}
                onClick={() => navigateTo(item.path)}
              >
                <div className="mr-3">{item.icon}</div>
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="relative flex-1 overflow-y-auto focus:outline-none pt-0 md:pt-0">
          <div className="py-6 md:py-6 px-4 md:px-6 h-full">
            {/* Page content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;