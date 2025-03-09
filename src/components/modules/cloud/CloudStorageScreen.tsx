import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  initializeCloudStorage,
  setActiveProvider,
  listFiles,
  createFolder,
  uploadFiles,
  setCurrentFolder,
  CloudFile
} from '@store/slices/cloudStorageSlice';
import { showNotification } from '@store/slices/appSlice';
import { UploadOptions } from '@common/types';
import { Button, Card, FormGroup, FormInput } from '../../ui';
import ProgressIndicator from '../../common/ProgressIndicator';

const CloudStorageScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const {
    availableProviders,
    activeProvider,
    currentFolderId,
    files,
    folderHistory,
    uploading,
    uploadProgress,
    isLoading
  } = useSelector((state: RootState) => state.cloudStorage);

  // Local state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);

  // Initialize cloud storage on component mount
  useEffect(() => {
    dispatch(initializeCloudStorage());
  }, [dispatch]);

  // Load files when active provider or current folder changes
  useEffect(() => {
    if (activeProvider) {
      dispatch(listFiles({ provider: activeProvider, folderId: currentFolderId || undefined }));
    }
  }, [dispatch, activeProvider, currentFolderId]);

  // Handle provider selection
  const handleProviderChange = (provider: string | null) => {
    dispatch(setActiveProvider(provider));
  };

  // Handle folder navigation
  const handleFolderClick = (folder: CloudFile) => {
    dispatch(setCurrentFolder({ id: folder.id, name: folder.name }));
  };

  // Handle folder history navigation
  const handleNavigateToFolder = (index: number) => {
    const folder = folderHistory[index];
    dispatch(setCurrentFolder({ id: folder.id, name: folder.name }));
  };

  // Handle file selection
  const handleSelectFiles = async () => {
    try {
      const filePath = await window.electronAPI.selectFile({
        title: 'Select files to upload',
        properties: ['openFile', 'multiSelections'],
      });

      if (filePath) {
        // Convert to array if single file
        const filePaths = Array.isArray(filePath) ? filePath : [filePath];
        setSelectedFiles(filePaths);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  };

  // Handle creating new folder
  const handleCreateFolder = async () => {
    if (!activeProvider || !newFolderName.trim()) return;

    setCreatingFolder(true);

    try {
      await dispatch(createFolder({
        provider: activeProvider,
        folderName: newFolderName.trim(),
        parentFolderId: currentFolderId || undefined
      }));

      setNewFolderName('');
      dispatch(showNotification({
        type: 'success',
        message: `Folder "${newFolderName}" created successfully`,
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Failed to create folder: ${(error as Error).message}`,
      }));
    } finally {
      setCreatingFolder(false);
    }
  };

  // Handle file upload
  const handleUploadFiles = async () => {
    if (!activeProvider || selectedFiles.length === 0) return;

    const options: UploadOptions = {
      folderId: currentFolderId || undefined,
      preserveDirectoryStructure: false
    };

    try {
      await dispatch(uploadFiles({
        provider: activeProvider,
        filePaths: selectedFiles,
        options
      }));

      setSelectedFiles([]);
      dispatch(showNotification({
        type: 'success',
        message: `Files uploaded successfully`,
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Failed to upload files: ${(error as Error).message}`,
      }));
    }
  };

  // Render connected providers
  const connectedProviders = availableProviders.filter(p => p.isConnected);

  // Helper for human-readable file size
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">{t('cloud.title')}</h1>

      {/* Provider Selection */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('cloud.selectProvider')}</h2>

        {connectedProviders.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-md">
            <p>{t('cloud.noConnectedProviders')}</p>
            <p className="mt-2">
              <Button
                variant="secondary"
                onClick={() => window.location.hash = '#/settings'}
              >
                {t('cloud.goToSettings')}
              </Button>
            </p>
          </div>
        ) : (
          <div className="flex space-x-4">
            {connectedProviders.map((provider) => (
              <button
                key={provider.id}
                className={`flex items-center px-4 py-2 rounded-md ${
                  activeProvider === provider.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                onClick={() => handleProviderChange(provider.id as string)}
              >
                {provider.name}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* File Explorer */}
      {activeProvider && (
        <Card className="flex-grow overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('cloud.fileExplorer')}</h2>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={handleSelectFiles}
                disabled={uploading}
              >
                {t('cloud.selectFiles')}
              </Button>
              {selectedFiles.length > 0 && (
                <Button
                  variant="primary"
                  onClick={handleUploadFiles}
                  disabled={uploading}
                >
                  {t('cloud.uploadFiles')}
                </Button>
              )}
            </div>
          </div>

          {/* Breadcrumb navigation */}
          <div className="flex items-center bg-gray-50 dark:bg-gray-700 p-2 rounded-md mb-4 overflow-x-auto">
            {folderHistory.map((folder, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="mx-2 text-gray-400">/</span>
                )}
                <button
                  className={`text-sm ${
                    index === folderHistory.length - 1
                      ? 'font-medium text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                  onClick={() => handleNavigateToFolder(index)}
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* New folder input */}
          <div className="flex mb-4">
            <FormInput
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={t('cloud.newFolderName')}
              className="mr-2"
              disabled={creatingFolder}
            />
            <Button
              variant="secondary"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || creatingFolder}
            >
              {t('cloud.createFolder')}
            </Button>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mb-4">
              <ProgressIndicator
                percentage={uploadProgress.percentage}
                isComplete={uploadProgress.processed === uploadProgress.total && uploadProgress.total > 0}
                showPercentage={true}
                height={8}
              />
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t('cloud.uploadingProgress', {
                  processed: uploadProgress.processed,
                  total: uploadProgress.total
                })}
              </div>
            </div>
          )}

          {/* Selected files */}
          {selectedFiles.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">{t('cloud.selectedFiles')}</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-md max-h-32 overflow-y-auto">
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="py-1 px-2 flex items-center justify-between">
                      <span className="truncate text-sm">{file}</span>
                      <button
                        className="text-red-500 hover:text-red-700 ml-2"
                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                        disabled={uploading}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Files list */}
          <div className="flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : files.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                {t('cloud.noFiles')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Folders first, then files */}
                {files
                  .sort((a, b) => {
                    // Sort by folder/file first, then by name
                    if (a.isFolder && !b.isFolder) return -1;
                    if (!a.isFolder && b.isFolder) return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((file) => (
                    <div
                      key={file.id}
                      className={`
                        p-3 rounded-md border border-gray-200 dark:border-gray-700
                        ${file.isFolder ? 'hover:bg-blue-50 dark:hover:bg-blue-900 cursor-pointer' : ''}
                      `}
                      onClick={file.isFolder ? () => handleFolderClick(file) : undefined}
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          {file.isFolder ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-medium truncate">{file.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {file.isFolder ? (
                              t('cloud.folder')
                            ) : (
                              formatFileSize(file.size)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CloudStorageScreen;