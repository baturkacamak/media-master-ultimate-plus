import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '@/store';
import {
    loadProfiles,
    loadProfile,
    saveProfile,
    setCurrentProfile,
    updateAdvancedSettings,
    resetAdvancedSettings,
} from '@store/slices/settingsSlice';
import { setLanguage, showNotification } from '@store/slices/appSlice';
import { Button, Card, FormGroup, FormLabel, FormInput, FormSelect, FormCheckbox } from '../../ui';

// Import icons
import {
    BiSave,
    BiReset,
    BiPlus,
    BiTrash,
    BiRefresh,
    BiLock,
    BiGlobe,
    BiCloudUpload,
    BiCog,
    BiCamera,
    BiVideo,
    BiServer,
    BiShareAlt,
    BiPalette,
    BiFace,
} from 'react-icons/bi';
import FormatConversionSettings from '@components/modules/settings/FormatConversionSettings';
import AiCategorizationSettings from '@components/modules/settings/AiCategorizationSettings';

const SettingsScreen: React.FC = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();

    // Redux state
    const {
        profiles,
        currentProfile,
        advancedSettings,
        isLoading,
        error
    } = useSelector((state: RootState) => state.settings);

    const darkMode = useSelector((state: RootState) => state.app.darkMode);

    // Local state
    const [newProfileName, setNewProfileName] = useState('');
    const [localSettings, setLocalSettings] = useState(advancedSettings);
    const [activeTab, setActiveTab] = useState('general');

    // Load profiles on component mount
    useEffect(() => {
        dispatch(loadProfiles());
    }, [dispatch]);

    // Update local settings when redux state changes
    useEffect(() => {
        setLocalSettings(advancedSettings);
    }, [advancedSettings]);

    // Handle loading a profile
    const handleLoadProfile = async (profileName: string) => {
        try {
            await dispatch(loadProfile(profileName));
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    // Handle saving current settings as a profile
    const handleSaveProfile = async () => {
        if (!newProfileName.trim()) {
            dispatch(showNotification({
                type: 'error',
                message: 'Please enter a profile name',
            }));
            return;
        }

        try {
            await dispatch(saveProfile({
                profileName: newProfileName,
                config: {
                    advancedSettings: localSettings,
                },
            }));

            dispatch(showNotification({
                type: 'success',
                message: t('settings.settingsSaved'),
            }));

            setNewProfileName('');
        } catch (error) {
            console.error('Error saving profile:', error);
            dispatch(showNotification({
                type: 'error',
                message: t('settings.settingsError'),
            }));
        }
    };

    // Handle saving current settings
    const handleSaveSettings = async () => {
        try {
            // Update redux state with local settings
            dispatch(updateAdvancedSettings(localSettings));

            // Save to current profile
            await dispatch(saveProfile({
                profileName: currentProfile,
                config: {
                    advancedSettings: localSettings,
                },
            }));

            dispatch(showNotification({
                type: 'success',
                message: t('settings.settingsSaved'),
            }));
        } catch (error) {
            console.error('Error saving settings:', error);
            dispatch(showNotification({
                type: 'error',
                message: t('settings.settingsError'),
            }));
        }
    };

    // Handle resetting settings to default
    const handleResetSettings = () => {
        dispatch(resetAdvancedSettings());
    };

    // Handle changing a setting
    const handleSettingChange = (key: string, value: any) => {
        setLocalSettings({
            ...localSettings,
            [key]: value,
        });
    };

    // Handle changing language
    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        dispatch(setLanguage(lang));
    };

    return (
      <div className="h-full flex flex-col">
          <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

          {/* Configuration Profiles */}
          <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('settings.profiles')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Load Profile */}
                  <div>
                      <FormLabel>{t('settings.loadProfile')}</FormLabel>
                      <div className="flex space-x-2">
                          <FormSelect
                            className="flex-grow"
                            value={currentProfile}
                            onChange={(e) => handleLoadProfile(e.target.value)}
                            disabled={isLoading}
                          >
                              {profiles.map((profile) => (
                                <option key={profile} value={profile}>
                                    {profile}
                                </option>
                              ))}
                          </FormSelect>
                          <button
                            className="btn btn-secondary"
                            onClick={() => dispatch(loadProfiles())}
                            disabled={isLoading}
                          >
                              <BiRefresh />
                          </button>
                      </div>
                  </div>

                  {/* Save Profile */}
                  <div>
                      <FormLabel>{t('settings.saveProfile')}</FormLabel>
                      <div className="flex space-x-2">
                          <FormInput
                            type="text"
                            className="flex-grow"
                            placeholder={t('settings.newProfileName')}
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            disabled={isLoading}
                          />
                          <Button
                            variant="primary"
                            onClick={handleSaveProfile}
                            disabled={isLoading || !newProfileName.trim()}
                          >
                              <BiSave />
                          </Button>
                      </div>
                  </div>
              </div>
          </Card>

          {/* Settings Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'general'
                    ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('general')}
              >
                  {t('settings.general')}
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'advanced'
                    ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('advanced')}
              >
                  {t('settings.advanced')}
              </button>
          </div>

          {/* General Settings */}
          {activeTab === 'general' && (
            <Card>
                <h2 className="text-xl font-semibold mb-4">{t('settings.general')}</h2>

                {/* Language */}
                <FormGroup>
                    <FormLabel>{t('settings.language')}</FormLabel>
                    <div className="flex space-x-4">
                        <button
                          className={`flex items-center px-4 py-2 rounded-md ${
                            i18n.language === 'en'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                          onClick={() => handleLanguageChange('en')}
                        >
                            <BiGlobe className="mr-2" />
                            {t('settings.languages.en')}
                        </button>

                        <button
                          className={`flex items-center px-4 py-2 rounded-md ${
                            i18n.language === 'tr'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                          onClick={() => handleLanguageChange('tr')}
                        >
                            <BiGlobe className="mr-2" />
                            {t('settings.languages.tr')}
                        </button>
                    </div>
                </FormGroup>
            </Card>
          )}

          {/* Advanced Settings - Burada diğer gelişmiş ayar bileşenleri olacak (kısaltıldı) */}
          {activeTab === 'advanced' && (
            <Card>
                <h2 className="text-xl font-semibold mb-4">{t('settings.advanced')}</h2>
                {/* AI Categorization Settings */}
                <AiCategorizationSettings />

                {/* Format Conversion Settings */}
                <FormatConversionSettings />
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
              <Button
                variant="secondary"
                onClick={handleResetSettings}
              >
                  <BiReset className="mr-2" />
                  {t('settings.resetSettings')}
              </Button>

              <Button
                variant="primary"
                onClick={handleSaveSettings}
              >
                  <BiSave className="mr-2" />
                  {t('settings.saveChanges')}
              </Button>
          </div>
      </div>
    );
};

export default SettingsScreen;