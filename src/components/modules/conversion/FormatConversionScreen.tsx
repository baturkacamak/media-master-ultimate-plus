import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { showNotification } from '@store/slices/appSlice';
import { updateAdvancedSettings } from '@store/slices/settingsSlice';
import { AvailableFormats, BatchFormatConversionResult } from '@common/types';
import { Button, Card, FormGroup, FormLabel, FormInput, FormSelect, FormCheckbox } from '../../ui';
import ProgressIndicator from '../../common/ProgressIndicator';

// Import icons
import {
  BiImage,
  BiVideo,
  BiFile,
  BiRefresh,
  BiInfoCircle,
  BiError,
  BiCheckCircle,
  BiReset,
  BiCog
} from 'react-icons/bi';

/**
 * Format conversion screen component - allows users to convert media files between formats
 */
const FormatConversionScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { advancedSettings } = useSelector((state: RootState) => state.settings);

  // Local state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>(advancedSettings.convertFormatTo);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'lossless'>('high');
  const [deleteOriginal, setDeleteOriginal] = useState<boolean>(advancedSettings.deleteOriginalAfterConversion);
  const [resizeEnabled, setResizeEnabled] = useState<boolean>(false);
  const [resizeWidth, setResizeWidth] = useState<number | null>(advancedSettings.resizeWidth);
  const [resizeHeight, setResizeHeight] = useState<number | null>(advancedSettings.resizeHeight);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(advancedSettings.maintainAspectRatio);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [conversionResult, setConversionResult] = useState<BatchFormatConversionResult | null>(null);
  const [availableFormats, setAvailableFormats] = useState<AvailableFormats>({ image: [], video: [] });

  // Load available formats on component mount
  useEffect(() => {
    const loadFormats = async () => {
      try {
        const result = await window.electronAPI.getAvailableFormats();
        if (result.success && result.formats) {
          setAvailableFormats(result.formats);
        }
      } catch (error) {
        console.error('Error loading available formats:', error);
      }
    };

    loadFormats();
  }, []);

  // Handle file selection
  const handleSelectFiles = async () => {
    try {
      const filePath = await window.electronAPI.selectFile({
        title: 'Select files to convert',
        filters: [
          { name: 'Media Files', extensions: [...availableFormats.image, ...availableFormats.video] },
          { name: 'Images', extensions: availableFormats.image },
          { name: 'Videos', extensions: availableFormats.video },
        ],
      });

      if (filePath) {
        // Add to selected files if it's not already there
        if (!selectedFiles.includes(filePath)) {
          setSelectedFiles([...selectedFiles, filePath]);
        }
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  };

  // Handle removal of a file from the list
  const handleRemoveFile = (filePath: string) => {
    setSelectedFiles(selectedFiles.filter(f => f !== filePath));
  };

  // Handle starting the conversion process
  const handleStartConversion = async () => {
    if (selectedFiles.length === 0) {
      dispatch(showNotification({
        type: 'error',
        message: 'Please select at least one file to convert',
      }));
      return;
    }

    try {
      setIsConverting(true);
      setProgress(0);
      setConversionResult(null);

      // Configure conversion options
      const options = {
        targetFormat,
        quality,
        deleteOriginal,
        ...(resizeEnabled && resizeWidth && resizeHeight ? {
          resizeWidth,
          resizeHeight,
          maintainAspectRatio,
        } : {}),
      };

      // Start conversion
      const result = await window.electronAPI.convertFiles(selectedFiles, options);

      // Update progress
      setProgress(100);
      setConversionResult(result);

      // Show notification
      if (result.success) {
        dispatch(showNotification({
          type: 'success',
          message: `Successfully converted ${result.converted} file(s)`,
        }));

        // Save settings
        dispatch(updateAdvancedSettings({
          convertFormatTo: targetFormat,
          deleteOriginalAfterConversion: deleteOriginal,
          resizeWidth: resizeEnabled ? resizeWidth : null,
          resizeHeight: resizeEnabled ? resizeHeight : null,
          maintainAspectRatio,
        }));
      } else {
        dispatch(showNotification({
          type: 'error',
          message: result.error || 'Failed to convert files',
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error during conversion: ${(error as Error).message}`,
      }));
    } finally {
      setIsConverting(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setSelectedFiles([]);
    setTargetFormat(advancedSettings.convertFormatTo);
    setQuality('high');
    setDeleteOriginal(advancedSettings.deleteOriginalAfterConversion);
    setResizeEnabled(false);
    setResizeWidth(advancedSettings.resizeWidth);
    setResizeHeight(advancedSettings.resizeHeight);
    setMaintainAspectRatio(advancedSettings.maintainAspectRatio);
    setConversionResult(null);
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Format Conversion</h1>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Files</h2>

        {/* File selection */}
        <div className="mb-4">
          <Button variant="primary" onClick={handleSelectFiles} disabled={isConverting}>
            <BiFile className="mr-2" />
            Select Files
          </Button>
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Selected Files:</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 max-h-32 overflow-y-auto">
              <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="py-2 flex justify-between items-center">
                    <span className="truncate">{file}</span>
                    <button
                      onClick={() => handleRemoveFile(file)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isConverting}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">Conversion Settings</h2>

        {/* Target format */}
        <FormGroup>
          <FormLabel>Target Format</FormLabel>
          <FormSelect
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            disabled={isConverting}
          >
            <optgroup label="Image Formats">
              {availableFormats.image.map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </optgroup>
            <optgroup label="Video Formats">
              {availableFormats.video.map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </optgroup>
          </FormSelect>
        </FormGroup>

        {/* Quality setting */}
        <FormGroup>
          <FormLabel>Quality</FormLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['low', 'medium', 'high', 'lossless'].map((q) => (
              <button
                key={q}
                className={`px-4 py-2 rounded-md ${
                  quality === q
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setQuality(q as 'low' | 'medium' | 'high' | 'lossless')}
                disabled={isConverting}
              >
                {q.charAt(0).toUpperCase() + q.slice(1)}
              </button>
            ))}
          </div>
        </FormGroup>

        {/* Additional options */}
        <FormGroup>
          <FormCheckbox
            id="deleteOriginal"
            checked={deleteOriginal}
            onChange={(e) => setDeleteOriginal(e.target.checked)}
            label="Delete original file after conversion"
            disabled={isConverting}
          />
        </FormGroup>

        {/* Resize options */}
        <FormGroup>
          <div className="flex items-center mb-2">
            <FormCheckbox
              id="resizeEnabled"
              checked={resizeEnabled}
              onChange={(e) => setResizeEnabled(e.target.checked)}
              disabled={isConverting}
            />
            <FormLabel className="ml-2 mb-0">Resize</FormLabel>
          </div>

          {resizeEnabled && (
            <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2 mb-2">
                <div>
                  <FormLabel>Width</FormLabel>
                  <FormInput
                    type="number"
                    value={resizeWidth || ''}
                    onChange={(e) => setResizeWidth(e.target.value ? parseInt(e.target.value) : null)}
                    min="1"
                    disabled={isConverting}
                    className="w-24"
                  />
                </div>
                <div>
                  <FormLabel>Height</FormLabel>
                  <FormInput
                    type="number"
                    value={resizeHeight || ''}
                    onChange={(e) => setResizeHeight(e.target.value ? parseInt(e.target.value) : null)}
                    min="1"
                    disabled={isConverting}
                    className="w-24"
                  />
                </div>
              </div>

              <FormCheckbox
                id="maintainAspectRatio"
                checked={maintainAspectRatio}
                onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                label="Maintain aspect ratio"
                disabled={isConverting}
              />
            </div>
          )}
        </FormGroup>

        {/* Action buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isConverting}
          >
            <BiReset className="mr-2" />
            Reset
          </Button>

          <Button
            variant="primary"
            onClick={handleStartConversion}
            disabled={isConverting || selectedFiles.length === 0}
          >
            {isConverting ? (
              <>
                <BiRefresh className="mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <BiCog className="mr-2" />
                Start Conversion
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Progress and Results */}
      {(isConverting || conversionResult) && (
        <Card>
          {isConverting && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Converting Files</h2>
              <ProgressIndicator
                percentage={progress}
                showPercentage={true}
                height={8}
              />
            </div>
          )}

          {conversionResult && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                {conversionResult.success ? (
                  <>
                    <BiCheckCircle className="mr-2 text-green-500" />
                    Conversion Complete
                  </>
                ) : (
                  <>
                    <BiError className="mr-2 text-red-500" />
                    Conversion Failed
                  </>
                )}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md text-center">
                  <div className="text-2xl font-bold">
                    {selectedFiles.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Files
                  </div>
                </div>

                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-md text-center">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {conversionResult.converted}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Successfully Converted
                  </div>
                </div>

                <div className="bg-red-100 dark:bg-red-900 p-4 rounded-md text-center">
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {conversionResult.failed}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Failed
                  </div>
                </div>
              </div>

              {conversionResult.targetPaths.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Converted Files:</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 max-h-40 overflow-y-auto">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                      {conversionResult.targetPaths.map((file, index) => (
                        <li key={index} className="py-2">
                          {file}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {!conversionResult.success && conversionResult.error && (
                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md mt-4">
                  <h3 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                    <BiInfoCircle className="mr-2" />
                    Error Details
                  </h3>
                  <div className="text-red-700 dark:text-red-300">
                    {conversionResult.error}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default FormatConversionScreen;