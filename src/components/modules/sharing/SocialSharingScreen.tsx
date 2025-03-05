import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  addHashtag,
  addMedia,
  authenticatePlatform,
  clearPostContent,
  clearShareResults,
  disconnectPlatform,
  fetchAvailablePlatforms,
  removeHashtag,
  removeMedia,
  setLinkInfo,
  setPostText,
  shareToMultiplePlatforms,
  togglePlatformSelection,
} from '@store/slices/sharingSlice';
import { showNotification } from '@store/slices/appSlice';
import { Button, Card, FormCheckbox, FormGroup, FormInput, FormLabel } from '../../ui';

// Import icons
import {
  BiCheck,
  BiHash,
  BiImage,
  BiLink,
  BiLogoFacebook,
  BiLogoInstagram,
  BiLogoLinkedinSquare,
  BiLogoPinterest,
  BiLogoTwitter,
  BiPlus,
  BiRefresh,
  BiShareAlt,
  BiTrash,
  BiX,
} from 'react-icons/bi';

/**
 * Social Sharing Screen Component
 *
 * Allows users to share media files to social media platforms
 */
const SocialSharingScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const {
    platforms,
    selectedPlatforms,
    postContent,
    isSharing,
    shareResults,
    error,
  } = useSelector((state: RootState) => state.sharing);

  // Local state
  const [text, setText] = useState('');
  const [newHashtag, setNewHashtag] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [mediaButtonLabel, setMediaButtonLabel] = useState(t('socialSharing.addImage'));

  // Load platforms on component mount
  useEffect(() => {
    dispatch(fetchAvailablePlatforms());
  }, [dispatch]);

  // Update local state when redux state changes
  useEffect(() => {
    setText(postContent.text || '');
    setLinkUrl(postContent.linkUrl || '');
    setLinkTitle(postContent.linkTitle || '');
    setLinkDescription(postContent.linkDescription || '');
  }, [postContent]);

  // Get platform icon based on ID
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

  // Handle platform authentication
  const handleAuthenticate = async (platformId: string) => {
    try {
      // In a real app, this would typically open a popup window for OAuth
      // For this example, we'll just simulate authentication
      await dispatch(authenticatePlatform({ platformId }));

      dispatch(showNotification({
        type: 'success',
        message: `Successfully connected to ${platformId}`,
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Failed to connect to ${platformId}`,
      }));
    }
  };

  // Handle platform disconnection
  const handleDisconnect = async (platformId: string) => {
    try {
      await dispatch(disconnectPlatform(platformId));

      dispatch(showNotification({
        type: 'success',
        message: `Successfully disconnected from ${platformId}`,
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Failed to disconnect from ${platformId}`,
      }));
    }
  };

  // Handle platform selection toggle
  const handleToggleSelection = (platformId: string) => {
    dispatch(togglePlatformSelection(platformId));
  };

  // Handle media selection
  const handleSelectMedia = async () => {
    try {
      const filePath = await window.electronAPI.selectFile({
        title: 'Select image to share',
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
        ],
      });

      if (filePath) {
        dispatch(addMedia(filePath));
        setMediaButtonLabel(t('socialSharing.addAnotherImage'));
      }
    } catch (error) {
      console.error('Error selecting media:', error);
    }
  };

  // Handle remove media
  const handleRemoveMedia = (mediaPath: string) => {
    dispatch(removeMedia(mediaPath));
    if ((postContent.media?.length || 0) <= 1) {
      setMediaButtonLabel(t('socialSharing.addImage'));
    }
  };

  // Handle adding hashtag
  const handleAddHashtag = () => {
    if (newHashtag.trim()) {
      dispatch(addHashtag(newHashtag.trim()));
      setNewHashtag('');
    }
  };

  // Handle removing hashtag
  const handleRemoveHashtag = (hashtag: string) => {
    dispatch(removeHashtag(hashtag));
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    dispatch(setPostText(e.target.value));
  };

  // Handle link info change
  const handleLinkInfoChange = () => {
    dispatch(setLinkInfo({
      url: linkUrl,
      title: linkTitle,
      description: linkDescription,
    }));
  };

  // Handle share action
  const handleShare = async () => {
    if (selectedPlatforms.length === 0) {
      dispatch(showNotification({
        type: 'warning',
        message: t('socialSharing.selectPlatformWarning'),
      }));
      return;
    }

    if (!text.trim() && (!postContent.media || postContent.media.length === 0)) {
      dispatch(showNotification({
        type: 'warning',
        message: t('socialSharing.contentWarning'),
      }));
      return;
    }

    try {
      // Clear previous results
      dispatch(clearShareResults());

      // Share to selected platforms
      const result = await dispatch(shareToMultiplePlatforms({
        platformIds: selectedPlatforms,
        content: postContent,
      })).unwrap();

      // Show notification based on results
      const successCount = result.results.filter(r => r.success).length;
      if (successCount === result.results.length) {
        dispatch(showNotification({
          type: 'success',
          message: t('socialSharing.shareSuccess', { count: successCount }),
        }));
      } else if (successCount > 0) {
        dispatch(showNotification({
          type: 'warning',
          message: t('socialSharing.sharePartial', { success: successCount, total: result.results.length }),
        }));
      } else {
        dispatch(showNotification({
          type: 'error',
          message: t('socialSharing.shareFailed'),
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error sharing: ${(error as Error).message}`,
      }));
    }
  };

  // Clear the post form
  const handleClear = () => {
    dispatch(clearPostContent());
    setText('');
    setLinkUrl('');
    setLinkTitle('');
    setLinkDescription('');
    setNewHashtag('');
    setMediaButtonLabel(t('socialSharing.addImage'));
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">{t('socialSharing.title')}</h1>

      {/* Connected Platforms */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('socialSharing.connectedPlatforms')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`
                                p-4 border rounded-lg
                                ${platform.enabled
                ? 'border-green-300 dark:border-green-700'
                : 'border-gray-300 dark:border-gray-700'}
                                ${selectedPlatforms.includes(platform.id)
                ? 'bg-blue-50 dark:bg-blue-900'
                : 'bg-white dark:bg-gray-800'}
                            `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                                    <span className="text-2xl mr-2">
                                        {getPlatformIcon(platform.id)}
                                    </span>
                  <span className="font-medium">
                                        {t(`socialSharing.platforms.${platform.id}`, platform.name)}
                                    </span>
                </div>

                {platform.enabled ? (
                  <span
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        <BiCheck className="mr-1" />
                    {t('socialSharing.connected')}
                                    </span>
                ) : (
                  <span
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                        <BiX className="mr-1" />
                    {t('socialSharing.notConnected')}
                                    </span>
                )}
              </div>

              <div className="flex space-x-2 mt-3">
                {platform.enabled ? (
                  <>
                    <FormCheckbox
                      id={`select-${platform.id}`}
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={() => handleToggleSelection(platform.id)}
                      label={t('socialSharing.select')}
                    />

                    <Button
                      variant="secondary"
                      className="ml-auto"
                      onClick={() => handleDisconnect(platform.id)}
                    >
                      <BiX className="mr-1" />
                      {t('socialSharing.disconnect')}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleAuthenticate(platform.id)}
                  >
                    <BiPlus className="mr-1" />
                    {t('socialSharing.connect')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {platforms.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">
              {t('socialSharing.noPlatformsAvailable')}
            </p>
          </div>
        )}

        {/* Refresh button */}
        <div className="flex justify-end mt-4">
          <Button
            variant="secondary"
            onClick={() => dispatch(fetchAvailablePlatforms())}
          >
            <BiRefresh className="mr-1" />
            {t('socialSharing.refreshPlatforms')}
          </Button>
        </div>
      </Card>

      {/* Create Post */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('socialSharing.createPost')}</h2>

        {/* Post Text */}
        <FormGroup>
          <FormLabel>{t('socialSharing.postText')}</FormLabel>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="What would you like to share?"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            rows={4}
          />
        </FormGroup>

        {/* Media */}
        <FormGroup>
          <FormLabel>{t('socialSharing.media')}</FormLabel>

          <div className="mb-2">
            <Button
              variant="secondary"
              onClick={handleSelectMedia}
            >
              <BiImage className="mr-1" />
              {mediaButtonLabel}
            </Button>
          </div>

          {postContent.media && postContent.media.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {postContent.media.map((mediaPath, index) => (
                <div
                  key={index}
                  className="relative border border-gray-300 dark:border-gray-700 p-2 rounded-md"
                >
                  <div className="max-w-full truncate text-sm">
                    {mediaPath}
                  </div>
                  <button
                    className="absolute top-1 right-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    onClick={() => handleRemoveMedia(mediaPath)}
                  >
                    <BiTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormGroup>

        {/* Hashtags */}
        <FormGroup>
          <FormLabel>{t('socialSharing.hashtags')}</FormLabel>

          <div className="flex space-x-2 mb-2">
            <FormInput
              type="text"
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              placeholder={t('socialSharing.addHashtag')}
              className="flex-grow"
            />
            <Button
              variant="secondary"
              onClick={handleAddHashtag}
              disabled={!newHashtag.trim()}
            >
              <BiHash className="mr-1" />
              {t('common.add')}
            </Button>
          </div>

          {postContent.hashtags && postContent.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {postContent.hashtags.map((hashtag, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-sm"
                >
                  <span className="mr-1">#</span>
                  {hashtag}
                  <button
                    className="ml-1 text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveHashtag(hashtag)}
                  >
                    <BiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormGroup>

        {/* Link */}
        <FormGroup>
          <FormLabel>{t('socialSharing.link')}</FormLabel>

          <div className="space-y-2">
            <FormInput
              type="text"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                handleLinkInfoChange();
              }}
              placeholder="https://example.com"
              className="w-full"
            />

            <FormInput
              type="text"
              value={linkTitle}
              onChange={(e) => {
                setLinkTitle(e.target.value);
                handleLinkInfoChange();
              }}
              placeholder={t('socialSharing.linkTitle')}
              className="w-full"
            />

            <FormInput
              type="text"
              value={linkDescription}
              onChange={(e) => {
                setLinkDescription(e.target.value);
                handleLinkInfoChange();
              }}
              placeholder={t('socialSharing.linkDescription')}
              className="w-full"
            />
          </div>
        </FormGroup>

        {/* Action buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            variant="secondary"
            onClick={handleClear}
          >
            <BiTrash className="mr-1" />
            {t('socialSharing.clear')}
          </Button>

          <Button
            variant="primary"
            onClick={handleShare}
            disabled={
              isSharing ||
              selectedPlatforms.length === 0 ||
              (!text.trim() && (!postContent.media || postContent.media.length === 0))
            }
          >
            <BiShareAlt className="mr-1" />
            {isSharing ? t('socialSharing.sharing') : t('socialSharing.shareNow')}
          </Button>
        </div>
      </Card>

      {/* Share Results */}
      {shareResults.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">{t('socialSharing.shareResults')}</h2>

          <div className="space-y-4">
            {shareResults.map((result, index) => (
              <div
                key={index}
                className={`
                                    p-4 border rounded-lg
                                    ${result.success
                  ? 'border-green-300 dark:border-green-700'
                  : 'border-red-300 dark:border-red-700'}
                                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                                        <span className="text-xl mr-2">
                                            {getPlatformIcon(result.platformId)}
                                        </span>
                    <span className="font-medium">
                                            {t(`socialSharing.platforms.${result.platformId}`,
                                              platforms.find(p => p.id === result.platformId)?.name || result.platformId)}
                                        </span>
                  </div>

                  {result.success ? (
                    <span
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            <BiCheck className="mr-1" />
                      {t('common.success')}
                                        </span>
                  ) : (
                    <span
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                            <BiX className="mr-1" />
                      {t('common.error')}
                                        </span>
                  )}
                </div>

                {result.success ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {result.postUrl && (
                      <div className="mt-2">
                        <a
                          href="#"
                          className="text-blue-600 dark:text-blue-400 flex items-center"
                          onClick={(e) => {
                            e.preventDefault();
                            // This should open the URL in the default browser
                            // In a real app, you'd use Electron's shell.openExternal
                            alert(`Would open: ${result.postUrl}`);
                          }}
                        >
                          <BiLink className="mr-1" />
                          {t('socialSharing.viewPost')}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                    {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SocialSharingScreen;