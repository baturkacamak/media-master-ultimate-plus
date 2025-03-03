import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
    loadProfiles,
    loadProfile,
    saveProfile,
    setCurrentProfile,
    updateAdvancedSettings,
    resetAdvancedSettings,
} from '@store/slices/settingsSlice';
import { setLanguage, showNotification } from '@store/slices/appSlice';

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

const SettingsScreen: React.FC = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();

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
            <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4">{t('settings.profiles')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Load Profile */}
                    <div>
                        <label className="form-label">{t('settings.loadProfile')}</label>
                        <div className="flex space-x-2">
                            <select
                                className="form-select flex-grow"
                                value={currentProfile}
                                onChange={(e) => handleLoadProfile(e.target.value)}
                                disabled={isLoading}
                            >
                                {profiles.map((profile) => (
                                    <option key={profile} value={profile}>
                                        {profile}
                                    </option>
                                ))}
                            </select>
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
                        <label className="form-label">{t('settings.saveProfile')}</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                className="form-input flex-grow"
                                placeholder={t('settings.newProfileName')}
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                disabled={isLoading}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveProfile}
                                disabled={isLoading || !newProfileName.trim()}
                            >
                                <BiSave />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">{t('settings.general')}</h2>

                    {/* Language */}
                    <div className="form-group">
                        <label className="form-label">{t('settings.language')}</label>
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
                    </div>
                </div>
            )}

            {/* Advanced Settings */}
            {activeTab === 'advanced' && (
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">{t('settings.advanced')}</h2>

                    {/* AI and Geo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Geo Tagging */}
                        <div className="form-group">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="enableGeoTagging"
                                    className="form-checkbox"
                                    checked={localSettings.enableGeoTagging}
                                    onChange={(e) => handleSettingChange('enableGeoTagging', e.target.checked)}
                                />
                                <label htmlFor="enableGeoTagging" className="ml-2 form-label">
                                    {t('settings.geoTagging')}
                                </label>
                            </div>
                        </div>

                        {/* AI Categorization */}
                        <div className="form-group">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="enableAiCategorization"
                                    className="form-checkbox"
                                    checked={localSettings.enableAiCategorization}
                                    onChange={(e) => handleSettingChange('enableAiCategorization', e.target.checked)}
                                />
                                <label htmlFor="enableAiCategorization" className="ml-2 form-label">
                                    {t('settings.aiCategorization')}
                                </label>
                            </div>

                            {localSettings.enableAiCategorization && (
                                <input
                                    type="text"
                                    className="form-input mt-2"
                                    placeholder={t('settings.aiApiKey')}
                                    value={localSettings.aiApiKey}
                                    onChange={(e) => handleSettingChange('aiApiKey', e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Conversion and Face Recognition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Format Conversion */}
                        <div className="form-group">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="enableFormatConversion"
                                    className="form-checkbox"
                                    checked={localSettings.enableFormatConversion}
                                    onChange={(e) => handleSettingChange('enableFormatConversion', e.target.checked)}
                                />
                                <label htmlFor="enableFormatConversion" className="ml-2 form-label">
                                    {t('settings.formatConversion')}
                                </label>
                            </div>

                            {localSettings.enableFormatConversion && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('settings.convertFrom')}
                                        value={localSettings.convertFormatFrom}
                                        onChange={(e) => handleSettingChange('convertFormatFrom', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('settings.convertTo')}
                                        value={localSettings.convertFormatTo}
                                        onChange={(e) => handleSettingChange('convertFormatTo', e.target.value)}
                                    />
                                    <div className="col-span-2">
                                        <label className="form-label text-sm">{t('settings.quality')}</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="100"
                                            value={localSettings.convertQuality}
                                            onChange={(e) => handleSettingChange('convertQuality', parseInt(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                            <span>1</span>
                                            <span>{localSettings.convertQuality}</span>
                                            <span>100</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Face Recognition */}
                        <div className="form-group">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="enableFaceRecognition"
                                    className="form-checkbox"
                                    checked={localSettings.enableFaceRecognition}
                                    onChange={(e) => handleSettingChange('enableFaceRecognition', e.target.checked)}
                                />
                                <label htmlFor="enableFaceRecognition" className="ml-2 form-label">
                                    {t('settings.faceRecognition')}
                                </label>
                            </div>

                            {localSettings.enableFaceRecognition && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded-md mt-2">
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        Face recognition requires additional software to be installed.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Video Processing and Web Interface */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Video Processing */}
                        <div className="form-group">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="enableVideoProcessing"
                                    className="form-checkbox"
                                    checked={localSettings.enableVideoProcessing}
                                    onChange={(e) => handleSettingChange('enableVideoProcessing', e.target.checked)}
                                />
                                <label htmlFor="enableVideoProcessing" className="ml-2 form-label">
                                    {t('settings.videoProcessing')}
                                </label>
                            </div>
                        </div>

                        {/* Web Interface */}
                        <div className="form-group">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="enableWebInterface"
                                    className="form-checkbox"
                                    checked={localSettings.enableWebInterface}
                                    onChange={(e) => handleSettingChange('enableWebInterface', e.target.checked)}
                                />
                                <label htmlFor="enableWebInterface" className="ml-2 form-label">
                                    {t('settings.webInterface')}
                                </label>
                            </div>

                            {localSettings.enableWebInterface && (
                                <div className="flex items-center mt-2">
                                    <label htmlFor="webPort" className="mr-2 text-sm">
                                        {t('settings.webPort')}:
                                    </label>
                                    <input
                                        type="number"
                                        id="webPort"
                                        className="form-input w-24"
                                        value={localSettings.webPort}
                                        onChange={(e) => handleSettingChange('webPort', parseInt(e.target.value))}
                                        min="1024"
                                        max="65535"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Encryption and Visualization */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Encryption */}
                        <div className="form-group">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="enableEncryption"
                                    className="form-checkbox"
                                    checked={localSettings.enableEncryption}
                                    onChange={(e) => handleSettingChange('enableEncryption', e.target.checked)}
                                />
                                <label htmlFor="enableEncryption" className="ml-2 form-label">
                                    {t('settings.encryption')}
                                </label>
                            </div>

                            {localSettings.enableEncryption && (
                                <div className="mt-2">
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder={t('settings.password')}
                                        value={localSettings.encryptionPassword}
                                        onChange={(e) => handleSettingChange('encryptionPassword', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Visualization */}
                        <div className="form-group">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="enableVisualization"
                                    className="form-checkbox"
                                    checked={localSettings.enableVisualization}
                                    onChange={(e) => handleSettingChange('enableVisualization', e.target.checked)}
                                />
                                <label htmlFor="enableVisualization" className="ml-2 form-label">
                                    {t('settings.visualization')}
                                </label>
                            </div>

                            {localSettings.enableVisualization && (
                                <select
                                    className="form-select mt-2"
                                    value={localSettings.visualizationType}
                                    onChange={(e) => handleSettingChange('visualizationType', e.target.value)}
                                >
                                    <option value="timeline">Timeline</option>
                                    <option value="map">Map</option>
                                    <option value="statistics">Statistics</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Parallel Processing */}
                    <div className="form-group mb-6">
                        <label htmlFor="parallelJobs" className="form-label">
                            {t('settings.parallelJobs')}
                        </label>
                        <div className="flex items-center">
                            <input
                                type="range"
                                id="parallelJobs"
                                min="1"
                                max="8"
                                value={localSettings.parallelJobs}
                                onChange={(e) => handleSettingChange('parallelJobs', parseInt(e.target.value))}
                                className="w-full"
                            />
                            <span className="ml-2 text-gray-700 dark:text-gray-300 min-w-[2rem] text-center">
                {localSettings.parallelJobs}
              </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
                <button
                    className="btn btn-secondary"
                    onClick={handleResetSettings}
                >
                    <BiReset className="mr-2" />
                    {t('settings.resetSettings')}
                </button>

                <button
                    className="btn btn-primary"
                    onClick={handleSaveSettings}
                >
                    <BiSave className="mr-2" />
                    {t('settings.saveChanges')}
                </button>
            </div>
        </div>
    );
};

export default SettingsScreen;