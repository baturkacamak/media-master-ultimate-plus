import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { updateAdvancedSettings } from '@store/slices/settingsSlice';
import { showNotification } from '@store/slices/appSlice';
import { connectToProvider, disconnectFromProvider } from '@store/slices/cloudStorageSlice';
import { CloudProvider } from '@common/types';
import { FormGroup, FormLabel, FormInput, FormCheckbox } from '../../ui';

/**
 * Cloud storage settings component for the settings screen
 */
const CloudStorageSettings: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { advancedSettings } = useSelector((state: RootState) => state.settings);
  const { availableProviders } = useSelector((state: RootState) => state.cloudStorage);

  // Local state
  const [enabled, setEnabled] = useState<boolean>(advancedSettings.enableCloudUpload);

  // Handle enable state change
  const handleEnableChange = (enabled: boolean) => {
    setEnabled(enabled);
    dispatch(updateAdvancedSettings({ enableCloudUpload: enabled }));
  };

  // Handle connect to provider
  const handleConnect = async (provider: CloudProvider) => {
    try {
      await dispatch(connectToProvider(provider));
      dispatch(showNotification({
        type: 'success',
        message: `Successfully connected to ${provider}`,
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Failed to connect to ${provider}: ${(error as Error).message}`,
      }));
    }
  };

  // Handle disconnect from provider
  const handleDisconnect = async (provider: CloudProvider) => {
    try {
      await dispatch(disconnectFromProvider(provider));
      dispatch(showNotification({
        type: 'success',
        message: `Disconnected from ${provider}`,
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Failed to disconnect from ${provider}: ${(error as Error).message}`,
      }));
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">{t('settings.cloudStorage')}</h3>

      <FormGroup>
        <FormCheckbox
          id="enableCloudUpload"
          checked={enabled}
          onChange={(e) => handleEnableChange(e.target.checked)}
          label={t('settings.enableCloudUpload')}
        />
      </FormGroup>

      {enabled && (
        <>
          <div className="mt-4">
            <h4 className="font-medium mb-2">{t('settings.cloudServices')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableProviders.map((provider) => (
                <div key={provider.id} className="p-4 border rounded-md border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full mr-2">
                      {provider.icon === 'google-drive' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                          <path d="M9 18l6-6-6-6"></path>
                        </svg>
                      )}
                      {provider.icon === 'dropbox' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                          <path d="M12 5l-8 5 8 5 8-5-8-5z"></path>
                          <path d="M4 10v6l8 5 8-5v-6"></path>
                        </svg>
                      )}
                      {provider.icon === 'onedrive' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                          <path d="M4 12v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-6"></path>
                          <path d="M22 12h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4"></path>
                          <path d="M18 16l2-2l-2-2"></path>
                        </svg>
                      )}
                    </div>
                    <h5 className="font-medium">{provider.name}</h5>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className={provider.isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                      {provider.isConnected ? t('settings.connected') : t('settings.notConnected')}
                    </span>
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        provider.isConnected
                          ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                      }`}
                      onClick={() => provider.isConnected ? handleDisconnect(provider.id as CloudProvider) : handleConnect(provider.id as CloudProvider)}
                    >
                      {provider.isConnected ? t('settings.disconnect') : t('settings.connect')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-2">{t('settings.cloudUploadSettings')}</h4>
            <FormGroup>
              <FormCheckbox
                id="preserveDirectoryStructure"
                checked={advancedSettings.preserveDirectoryStructure}
                onChange={(e) => dispatch(updateAdvancedSettings({ preserveDirectoryStructure: e.target.checked }))}
                label={t('settings.preserveDirectoryStructure')}
              />
            </FormGroup>
            <FormGroup>
              <FormCheckbox
                id="uploadAfterOrganizing"
                checked={advancedSettings.uploadAfterOrganizing}
                onChange={(e) => dispatch(updateAdvancedSettings({ uploadAfterOrganizing: e.target.checked }))}
                label={t('settings.uploadAfterOrganizing')}
              />
            </FormGroup>
          </div>
        </>
      )}
    </div>
  );
};

export default CloudStorageSettings;