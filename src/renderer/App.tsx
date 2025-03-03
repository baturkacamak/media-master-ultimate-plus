import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Components
import MainLayout from '../components/layouts/MainLayout';
import HomeScreen from '../components/modules/home/HomeScreen';
import OrganizeScreen from '../components/modules/organize/OrganizeScreen';
import SettingsScreen from '../components/modules/settings/SettingsScreen';
import AboutScreen from '../components/modules/about/AboutScreen';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [appVersion, setAppVersion] = useState<string>('');

  // Get app version
  useEffect(() => {
    const getVersion = async () => {
      try {
        const version = await window.electronAPI.getAppVersion();
        setAppVersion(version);
      } catch (error) {
        console.error('Failed to get app version:', error);
      }
    };

    getVersion();
  }, []);

  return (
    <Router>
      <MainLayout appVersion={appVersion}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/organize" element={<OrganizeScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/about" element={<AboutScreen />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;