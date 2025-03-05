import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { updateSocialSharingSettings } from '@store/slices/settingsSlice';
import { fetchAvailablePlatforms } from '@store/slices/sharingSlice';
import { SocialPlatformConfig } from '@common/types';
import { FormGroup, FormLabel, FormSelect, FormCheckbox, FormInput } from '../../ui';

// Import icons
import {
  BiLogoFacebook,
  BiLogoTwitter,
  BiLogoInstagram,
  BiLogoLinkedinSquare,
  BiLogoPinterest,
  BiShareAlt,
  BiPlus,
  BiHash
} from 'react-icons/bi';

/**
 * Social sharing settings component for the settings screen
 */
const SocialSharingSettings: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { advancedSettings } = useSelector((state: RootState) => state.settings);
  const { platforms } = useSelector((state: RootState) => state.sharing);

  // Local state
  const [enabled, setEnabled] = useState<boolean>(advancedSettings.enableSocialSharing);
  const [autoShare, setAutoShare] = useState<boolean>(advancedSettings.socialAutoShare);
  const [defaultText, setDefaultText] = useState<string>(advancedSettings.socialDefaultText);
  const [defaultHashtags, setDefaultHashtags] = useState<string[]>(advancedSettings.socialDefaultHashtags);
  const [newHashtag, setNewHashtag] = useState<string>('');
  const [platformSettings, setPlatformSettings] = useState<SocialPlatformConfig[]>(
    advancedSettings.socialPlatforms || []
  );

  // Load platforms on component mount
  useEffect(() => {
    dispatch(fetchAvailablePlatforms());
  }, [dispatch]);

  // Update local state when redux state changes
  useEffect(() => {
    setPlatformSettings(platforms.map(platform => {
      const existingPlatform = advancedSettings.socialPlatforms?.find(p => p.id === platform.id);
      return {
        ...platform,
        apiKey: existingPlatform?.apiKey || '',
        apiSecret: existingPlatform?.apiSecret || '',
      };
    }));
  }, [platforms, advancedSettings.socialPlatforms]);

  // Handle enable state change
  const handleEnableChange = (enabled: boolean) => {
    setEnabled(enabled);
    dispatch(updateSocialSharingSettings({ enableSocialSharing: enabled }));
  };

  // Handle auto share change
  const handleAutoShareChange = (autoShare: boolean) => {
    setAutoShare(autoShare);
    dispatch(updateSocialSharingSettings({ socialAutoShare: autoShare }));
  };

  // Handle default text change
  const handleDefaultTextChange = (text: string) => {
    setDefaultText(text);
    dispatch(updateSocialSharingSettings({ socialDefaultText: text }));
  };

  // Handle platform API key change
  const handlePlatformApiKeyChange = (platformId: string, apiKey: string) => {
    const updatedPlatforms = platformSettings.map(platform => {
      if (platform.id === platformId) {
        return { ...platform, apiKey };
      }
      return platform;
    });

    setPlatformSettings(updatedPlatforms);
    dispatch(updateSocialSharingSettings({ socialPlatforms: updatedPlatforms }));
  };

  // Handle platform API secret change
  const handlePlatformApiSecretChange = (platformId: string, apiSecret: string) => {
    const updatedPlatforms = platformSettings.map(platform => {
      if (platform.id === platformId) {
        return { ...platform, apiSecret };
      }
      return platform;
    });

    setPlatformSettings(updatedPlatforms);
    dispatch(updateSocialSharingSettings({ socialPlatforms: updatedPlatforms }));
  };

  // Get platform icon
  const getPlatformIcon = (platformId: string) => {
    switch (platformId) {
      case 'facebook':
        return <BiLogoFacebook />;
      case 'twitter':
        return <BiLogoTwitter />;
      case 'instagram':
        return <BiLogoInstagram />;
      case 'linkedin':
        return <BiLogoLinkedinSquare />;
      case 'pinterest':
        return <BiLogoPinterest />;
      default:
        return <BiShareAlt />;
    }
  };

  // Handle adding a hashtag
  const handleAddHashtag = () => {
    if (newHashtag.trim() && !defaultHashtags.includes(newHashtag.trim())) {
      const updatedHashtags = [...defaultHashtags, newHashtag.trim()];
      setDefaultHashtags(updatedHashtags);
      dispatch(updateSocialSharingSettings({ socialDefaultHashtags: updatedHashtags }));
      setNewHashtag('');
    }
  };

  // Handle removing a hashtag
  const handleRemoveHashtag = (hashtag: string) => {
    const updatedHashtags = defaultHashtags.filter(tag => tag !== hashtag);
    setDefaultHashtags(updatedHashtags);
    dispatch(updateSocialSharingSettings({ socialDefaultHashtags: updatedHashtags }));
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">{t('socialSharing.settings.title')}</h3>

      <FormGroup>
        <FormCheckbox
          id="enableSocialSharing"
          checked={enabled}
          onChange={(e) => handleEnableChange(e.target.checked)}
          label={t('socialSharing.settings.enable')}
        />
      </FormGroup>

      {enabled && (
        <>
          {/* Platform API Credentials */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">{t('socialSharing.settings.platformSettings')}</h4>

            <div className="space-y-4">
              {platformSettings.map((platform) => (
                <div
                  key={platform.id}
                  className="p-4 border rounded-lg border-gray-300 dark:border-gray-700"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">
                      {getPlatformIcon(platform.id)}
                    </span>
                    <span className="font-medium">
                      {t(`socialSharing.platforms.${platform.id}`, platform.name)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <FormGroup>
                      <FormLabel>{t('socialSharing.settings.apiKey')}</FormLabel>
                      <FormInput
                        type="password"
                        value={platform.apiKey || ''}
                        onChange={(e) => handlePlatformApiKeyChange(platform.id, e.target.value)}
                        placeholder={`${platform.name} API Key`}
                      />
                    </FormGroup>

                    <FormGroup>
                      <FormLabel>{t('socialSharing.settings.apiSecret')}</FormLabel>
                      <FormInput
                        type="password"
                        value={platform.apiSecret || ''}
                        onChange={(e) => handlePlatformApiSecretChange(platform.id, e.target.value)}
                        placeholder={`${platform.name} API Secret`}
                      />
                    </FormGroup>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('socialSharing.settings.privacyNote')}
            </p>
          </div>

          {/* Auto-Share Settings */}
          <div className="mt-6">
            <h4 className="font-medium mb-2">{t('socialSharing.settings.autoShare')}</h4>

            <FormGroup>
              <FormCheckbox
                id="autoShareNew"
                checked={autoShare}
                onChange={(e) => handleAutoShareChange(e.target.checked)}
                label={t('socialSharing.settings.autoShareNew')}
              />
            </FormGroup>

            {autoShare && (
              <div className="mt-2 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                <FormGroup>
                  <FormLabel>{t('socialSharing.settings.autoShareDestinations')}</FormLabel>

                  <div className="space-y-2">
                    {platformSettings.map((platform) => (
                      <FormCheckbox
                        key={platform.id}
                        id={`autoShare-${platform.id}`}
                        checked={platform.enabled}
                        onChange={(e) => {
                          const updatedPlatforms = platformSettings.map(p =>
                            p.id === platform.id ? { ...p, enabled: e.target.checked } : p
                          );
                          setPlatformSettings(updatedPlatforms);
                          dispatch(updateSocialSharingSettings({ socialPlatforms: updatedPlatforms }));
                        }}
                        label={t(`socialSharing.platforms.${platform.id}`, platform.name)}
                      />
                    ))}
                  </div>
                </FormGroup>
              </div>
            )}
          </div>

          {/* Default Post Content */}
          <div className="mt-6">
            <h4 className="font-medium mb-2">{t('socialSharing.settings.defaultText')}</h4>

            <FormGroup>
              <textarea
                value={defaultText}
                onChange={(e) => handleDefaultTextChange(e.target.value)}
                placeholder={t('socialSharing.settings.defaultText')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>{t('socialSharing.settings.defaultHashtags')}</FormLabel>

              <div className="flex space-x-2 mb-2">
                <FormInput
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  placeholder={t('socialSharing.addHashtag')}
                  className="flex-grow"
                />
                <button
                  className="px-3 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={handleAddHashtag}
                  disabled={!newHashtag.trim()}
                >
                  <BiPlus />
                </button>
              </div>

              {defaultHashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {defaultHashtags.map((hashtag, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-sm"
                    >
                      <BiHash className="mr-1" />
                      {hashtag}
                      <button
                        className="ml-1 text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveHashtag(hashtag)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </FormGroup>
          </div>
        </>
      )}
    </div>
  );
};

export default SocialSharingSettings;