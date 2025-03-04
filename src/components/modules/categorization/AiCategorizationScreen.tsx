import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { showNotification } from '@store/slices/appSlice';
import {
  CategorizationResult,
  CategoryTag,
  BatchCategorizationResult
} from '@common/types';
import { Button, Card, FormGroup, FormLabel, FormSelect, FormCheckbox } from '../../ui';
import ProgressIndicator from '../../common/ProgressIndicator';

// Import icons
import {
  BiImage,
  BiRefresh,
  BiInfoCircle,
  BiError,
  BiCheckCircle,
  BiReset,
  BiCog,
  BiCategory,
  BiFilterAlt,
  BiSearch,
  BiExport,
  BiImport,
  BiTag
} from 'react-icons/bi';

/**
 * AI Categorization screen component - allows users to analyze and categorize media files
 */
const AiCategorizationScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { advancedSettings } = useSelector((state: RootState) => state.settings);

  // Local state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<CategorizationResult[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(
    advancedSettings.aiConfidenceThreshold
  );

  // Load available categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await window.electronAPI.getCategories();
        if (result.success && result.categories) {
          setAvailableCategories(result.categories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Handle file selection
  const handleSelectFiles = async () => {
    try {
      const filePath = await window.electronAPI.selectFile({
        title: 'Select files to categorize',
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }
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
    setResults(results.filter(r => r.filePath !== filePath));
  };

  // Start the categorization process
  const handleStartCategorization = async () => {
    if (selectedFiles.length === 0) {
      dispatch(showNotification({
        type: 'error',
        message: 'Please select at least one file to categorize',
      }));
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      // Configure AI settings
      await window.electronAPI.configureAi({
        useLocalModel: advancedSettings.aiUseLocalModel,
        apiKey: advancedSettings.aiApiKey,
        confidenceThreshold: confidenceThreshold,
        maxTags: advancedSettings.aiMaxTags,
        includeDominantColors: advancedSettings.aiIncludeDominantColors,
        includeObjectDetection: advancedSettings.aiIncludeObjectDetection,
      });

      // Set up event listeners for progress updates
      const removeProgressListener = window.electronAPI.on('ai:progress', (data) => {
        setProgress(data.percentage);
      });

      const removeCompleteListener = window.electronAPI.on('ai:complete', () => {
        setIsProcessing(false);
        removeProgressListener();
        removeCompleteListener();
        removeErrorListener();
      });

      const removeErrorListener = window.electronAPI.on('ai:error', (error) => {
        console.error('Error during categorization:', error);
        dispatch(showNotification({
          type: 'error',
          message: `Error during categorization: ${error.message}`,
        }));
      });

      // Start categorization
      const result = await window.electronAPI.categorizeImages(selectedFiles);

      if (result.success && result.results) {
        setResults(result.results);
        dispatch(showNotification({
          type: 'success',
          message: `Successfully categorized ${result.results.length} file(s)`,
        }));
      } else {
        dispatch(showNotification({
          type: 'error',
          message: result.error || 'Failed to categorize files',
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error during categorization: ${(error as Error).message}`,
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter results based on selected category and search term
  const filteredResults = results.filter(result => {
    // Filter by category if one is selected
    if (filterCategory && result.primaryCategory !== filterCategory) {
      return false;
    }

    // Filter by search term if one is entered
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        result.tags.some(tag => tag.name.toLowerCase().includes(lowerSearchTerm)) ||
        (result.primaryCategory && result.primaryCategory.toLowerCase().includes(lowerSearchTerm)) ||
        result.filePath.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return true;
  });

  // Export results to JSON file
  const exportResults = () => {
    try {
      // Create a data URL for the JSON content
      const jsonString = JSON.stringify(results, null, 2);
      const dataUrl = `data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`;

      // Create a link and trigger a download
      const downloadLink = document.createElement('a');
      downloadLink.setAttribute('href', dataUrl);
      downloadLink.setAttribute('download', 'categorization-results.json');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Error exporting results:', error);
      dispatch(showNotification({
        type: 'error',
        message: `Failed to export results: ${(error as Error).message}`,
      }));
    }
  };

  // Reset the form and clear results
  const handleReset = () => {
    setSelectedFiles([]);
    setResults([]);
    setFilterCategory('');
    setSearchTerm('');
  };

  // Render a color swatch for a dominant color
  const renderColorSwatch = (color: string) => (
    <div
      className="w-6 h-6 rounded-full inline-block mr-1"
      style={{ backgroundColor: color }}
      title={color}
    ></div>
  );

  // Render a tag pill
  const renderTagPill = (tag: CategoryTag) => (
    <div
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 mb-2"
      style={{
        backgroundColor: getTagBackgroundColor(tag.confidence),
        color: getTagTextColor(tag.confidence)
      }}
      title={`Confidence: ${(tag.confidence * 100).toFixed(1)}%`}
    >
      <BiTag className="mr-1" />
      {tag.name}
    </div>
  );

  // Get background color based on confidence level
  const getTagBackgroundColor = (confidence: number) => {
    if (confidence >= 0.9) return '#dbeafe'; // blue-100
    if (confidence >= 0.7) return '#dcfce7'; // green-100
    if (confidence >= 0.5) return '#fef9c3'; // yellow-100
    return '#fee2e2'; // red-100
  };

  // Get text color based on confidence level
  const getTagTextColor = (confidence: number) => {
    if (confidence >= 0.9) return '#1e40af'; // blue-800
    if (confidence >= 0.7) return '#166534'; // green-800
    if (confidence >= 0.5) return '#854d0e'; // yellow-800
    return '#991b1b'; // red-800
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">
        <BiCategory className="inline-block mr-2" />
        {t('categorization.title')}
      </h1>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('categorization.selectFiles')}</h2>

        {/* File selection */}
        <div className="mb-4">
          <Button
            variant="primary"
            onClick={handleSelectFiles}
            disabled={isProcessing}
          >
            <BiImage className="mr-2" />
            {t('categorization.selectImages')}
          </Button>
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">{t('categorization.selectedFiles')}</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 max-h-32 overflow-y-auto">
              <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="py-2 flex justify-between items-center">
                    <span className="truncate">{file}</span>
                    <button
                      onClick={() => handleRemoveFile(file)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isProcessing}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">{t('categorization.options')}</h2>

        {/* Confidence threshold */}
        <FormGroup>
          <FormLabel>{t('categorization.confidenceThreshold')}</FormLabel>
          <div className="flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              className="w-full mr-4"
              disabled={isProcessing}
            />
            <span className="w-12 text-center">{(confidenceThreshold * 100).toFixed(0)}%</span>
          </div>
        </FormGroup>

        {/* Action buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isProcessing}
          >
            <BiReset className="mr-2" />
            {t('common.reset')}
          </Button>

          <Button
            variant="primary"
            onClick={handleStartCategorization}
            disabled={isProcessing || selectedFiles.length === 0}
          >
            {isProcessing ? (
              <>
                <BiRefresh className="mr-2 animate-spin" />
                {t('categorization.processing')}
              </>
            ) : (
              <>
                <BiCog className="mr-2" />
                {t('categorization.startCategorization')}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Progress display */}
      {isProcessing && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('categorization.processing')}</h2>
          <ProgressIndicator
            percentage={progress}
            showPercentage={true}
            height={8}
          />
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card className="mb-6 flex-grow overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              <BiCheckCircle className="inline-block mr-2 text-green-500" />
              {t('categorization.results')}
            </h2>

            <Button
              variant="secondary"
              onClick={exportResults}
              disabled={isProcessing}
            >
              <BiExport className="mr-2" />
              {t('categorization.export')}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="flex-grow">
              <FormLabel>{t('categorization.search')}</FormLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <BiSearch className="text-gray-500" />
                </div>
                <input
                  type="text"
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('categorization.searchPlaceholder')}
                />
              </div>
            </div>

            <div>
              <FormLabel>{t('categorization.filterByCategory')}</FormLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <BiFilterAlt className="text-gray-500" />
                </div>
                <select
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">{t('categorization.allCategories')}</option>
                  {availableCategories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.map((result, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <div className="p-4">
                  <h3 className="font-medium mb-2 truncate" title={result.filePath}>
                    {path.basename(result.filePath)}
                  </h3>

                  {/* Primary Category */}
                  {result.primaryCategory && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('categorization.primaryCategory')}:
                      </span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        {result.primaryCategory}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('categorization.tags')}:
                    </div>
                    <div>
                      {result.tags
                        .filter(tag => tag.confidence >= confidenceThreshold)
                        .map((tag, tagIndex) => (
                          <React.Fragment key={tagIndex}>
                            {renderTagPill(tag)}
                          </React.Fragment>
                        ))}

                      {result.tags.filter(tag => tag.confidence >= confidenceThreshold).length === 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                          {t('categorization.noTagsAboveThreshold')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dominant Colors */}
                  {result.dominantColors && result.dominantColors.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('categorization.dominantColors')}:
                      </div>
                      <div>
                        {result.dominantColors.map((color, colorIndex) => (
                          <React.Fragment key={colorIndex}>
                            {renderColorSwatch(color)}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* No results after filtering */}
          {filteredResults.length === 0 && (
            <div className="text-center py-8">
              <BiInfoCircle className="mx-auto text-gray-400 text-4xl mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('categorization.noResultsFound')}
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AiCategorizationScreen;

// Helper for getting path basename in the renderer
const path = {
  basename: (filePath: string) => {
    return filePath.split(/[\\/]/).pop() || filePath;
  }
};