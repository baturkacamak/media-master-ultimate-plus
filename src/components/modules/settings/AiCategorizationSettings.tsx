import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { updateAdvancedSettings } from '@store/slices/settingsSlice';
import { FormGroup, FormLabel, FormSelect, FormCheckbox, FormInput } from '../../ui';

/**
 * AI categorization settings component for the settings screen
 */
const AiCategorizationSettings: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { advancedSettings } = useSelector((state: RootState) => state.settings);

  // Local state
  const [enabled, setEnabled] = useState<boolean>(advancedSettings.enableAiCategorization);
  const [useLocalModel, setUseLocalModel] = useState<boolean>(advancedSettings.aiUseLocalModel);
  const [apiKey, setApiKey] = useState<string>(advancedSettings.aiApiKey);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(advancedSettings.aiConfidenceThreshold);
  const [maxTags, setMaxTags] = useState<number>(advancedSettings.aiMaxTags);
  const [includeDominantColors, setIncludeDominantColors] = useState<boolean>(advancedSettings.aiIncludeDominantColors);
  const [includeObjectDetection, setIncludeObjectDetection] = useState<boolean>(advancedSettings.aiIncludeObjectDetection);
  const [customCategories, setCustomCategories] = useState<string[]>(advancedSettings.aiCustomCategories);
  const [newCategory, setNewCategory] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

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

  // Handle enable state change
  const handleEnableChange = (enabled: boolean) => {
    setEnabled(enabled);
    dispatch(updateAdvancedSettings({ enableAiCategorization: enabled }));
  };

  // Handle use local model change
  const handleUseLocalModelChange = (useLocal: boolean) => {
    setUseLocalModel(useLocal);
    dispatch(updateAdvancedSettings({ aiUseLocalModel: useLocal }));
  };

  // Handle API key change
  const handleApiKeyChange = (apiKey: string) => {
    setApiKey(apiKey);
    dispatch(updateAdvancedSettings({ aiApiKey: apiKey }));
  };

  // Handle confidence threshold change
  const handleConfidenceThresholdChange = (threshold: number) => {
    setConfidenceThreshold(threshold);
    dispatch(updateAdvancedSettings({ aiConfidenceThreshold: threshold }));
  };

  // Handle max tags change
  const handleMaxTagsChange = (maxTags: number) => {
    setMaxTags(maxTags);
    dispatch(updateAdvancedSettings({ aiMaxTags: maxTags }));
  };

  // Handle include dominant colors change
  const handleIncludeDominantColorsChange = (include: boolean) => {
    setIncludeDominantColors(include);
    dispatch(updateAdvancedSettings({ aiIncludeDominantColors: include }));
  };

  // Handle include object detection change
  const handleIncludeObjectDetectionChange = (include: boolean) => {
    setIncludeObjectDetection(include);
    dispatch(updateAdvancedSettings({ aiIncludeObjectDetection: include }));
  };

  // Handle adding a custom category
  const handleAddCategory = async () => {
    if (newCategory.trim() && !customCategories.includes(newCategory.trim())) {
      const category = newCategory.trim();
      const updatedCategories = [...customCategories, category];

      try {
        await window.electronAPI.addCustomCategories([category]);
        setCustomCategories(updatedCategories);
        dispatch(updateAdvancedSettings({ aiCustomCategories: updatedCategories }));
        setNewCategory('');

        // Refresh available categories
        const result = await window.electronAPI.getCategories();
        if (result.success && result.categories) {
          setAvailableCategories(result.categories);
        }
      } catch (error) {
        console.error('Error adding custom category:', error);
      }
    }
  };

  // Handle removing a custom category
  const handleRemoveCategory = async (category: string) => {
    try {
      await window.electronAPI.removeCustomCategories([category]);
      const updatedCategories = customCategories.filter(c => c !== category);
      setCustomCategories(updatedCategories);
      dispatch(updateAdvancedSettings({ aiCustomCategories: updatedCategories }));

      // Refresh available categories
      const result = await window.electronAPI.getCategories();
      if (result.success && result.categories) {
        setAvailableCategories(result.categories);
      }
    } catch (error) {
      console.error('Error removing custom category:', error);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">{t('settings.aiCategorization')}</h3>

      <FormGroup>
        <FormCheckbox
          id="enableAiCategorization"
          checked={enabled}
          onChange={(e) => handleEnableChange(e.target.checked)}
          label={t('settings.enableAiCategorization')}
        />
      </FormGroup>

      {enabled && (
        <>
          {/* AI Model Selection */}
          <FormGroup>
            <FormLabel>{t('settings.aiModelType')}</FormLabel>
            <div className="flex space-x-4">
              <button
                className={`flex items-center px-4 py-2 rounded-md ${
                  useLocalModel
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                onClick={() => handleUseLocalModelChange(true)}
              >
                {t('settings.useLocalModel')}
              </button>

              <button
                className={`flex items-center px-4 py-2 rounded-md ${
                  !useLocalModel
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                onClick={() => handleUseLocalModelChange(false)}
              >
                {t('settings.useCloudApi')}
              </button>
            </div>
          </FormGroup>

          {/* API Key (only shown when using cloud API) */}
          {!useLocalModel && (
            <FormGroup>
              <FormLabel>{t('settings.aiApiKey')}</FormLabel>
              <FormInput
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={t('settings.aiApiKeyPlaceholder')}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('settings.aiApiKeyHelp')}
              </p>
            </FormGroup>
          )}

          {/* Confidence Threshold */}
          <FormGroup>
            <FormLabel>{t('settings.confidenceThreshold')}</FormLabel>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => handleConfidenceThresholdChange(parseFloat(e.target.value))}
                className="w-full mr-4"
              />
              <span className="w-12 text-center">{(confidenceThreshold * 100).toFixed(0)}%</span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('settings.confidenceThresholdHelp')}
            </p>
          </FormGroup>

          {/* Max Tags */}
          <FormGroup>
            <FormLabel>{t('settings.maxTags')}</FormLabel>
            <div className="flex items-center">
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={maxTags}
                onChange={(e) => handleMaxTagsChange(parseInt(e.target.value))}
                className="w-full mr-4"
              />
              <span className="w-12 text-center">{maxTags}</span>
            </div>
          </FormGroup>

          {/* Additional Options */}
          <FormGroup>
            <FormLabel>{t('settings.aiAdditionalOptions')}</FormLabel>
            <div className="space-y-2">
              <FormCheckbox
                id="includeDominantColors"
                checked={includeDominantColors}
                onChange={(e) => handleIncludeDominantColorsChange(e.target.checked)}
                label={t('settings.includeDominantColors')}
              />
              <FormCheckbox
                id="includeObjectDetection"
                checked={includeObjectDetection}
                onChange={(e) => handleIncludeObjectDetectionChange(e.target.checked)}
                label={t('settings.includeObjectDetection')}
              />
            </div>
          </FormGroup>

          {/* Custom Categories */}
          <FormGroup>
            <FormLabel>{t('settings.customCategories')}</FormLabel>
            <div className="flex space-x-2 mb-2">
              <FormInput
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder={t('settings.newCategoryPlaceholder')}
                className="flex-grow"
              />
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleAddCategory}
                disabled={!newCategory.trim()}
              >
                {t('common.add')}
              </button>
            </div>

            {/* Display existing custom categories */}
            {customCategories.length > 0 && (
              <div className="mt-2">
                <h4 className="font-medium mb-2">{t('settings.yourCustomCategories')}</h4>
                <div className="flex flex-wrap gap-2">
                  {customCategories.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
                    >
                      <span className="mr-2">{category}</span>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveCategory(category)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Categories */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">{t('settings.availableCategories')}</h4>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <div className="flex flex-wrap gap-2">
                  {availableCategories
                    .filter(category => !customCategories.includes(category))
                    .map((category, index) => (
                      <div
                        key={index}
                        className="bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded-full"
                      >
                        {category}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </FormGroup>
        </>
      )}
    </div>
  );
};

export default AiCategorizationSettings;