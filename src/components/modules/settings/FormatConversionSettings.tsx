import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { updateAdvancedSettings } from '@store/slices/settingsSlice';
import { AvailableFormats } from '@common/types';
import { FormGroup, FormLabel, FormSelect, FormCheckbox, FormInput } from '../../ui';

/**
 * Format conversion settings component for the settings screen
 */
const FormatConversionSettings: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { advancedSettings } = useSelector((state: RootState) => state.settings);

  // Local state
  const [enabled, setEnabled] = useState<boolean>(advancedSettings.enableFormatConversion);
  const [sourceFormat, setSourceFormat] = useState<string>(advancedSettings.convertFormatFrom);
  const [targetFormat, setTargetFormat] = useState<string>(advancedSettings.convertFormatTo);
  const [quality, setQuality] = useState<number>(advancedSettings.convertQuality);
  const [deleteOriginal, setDeleteOriginal] = useState<boolean>(advancedSettings.deleteOriginalAfterConversion);
  const [resizeWidth, setResizeWidth] = useState<number | null>(advancedSettings.resizeWidth);
  const [resizeHeight, setResizeHeight] = useState<number | null>(advancedSettings.resizeHeight);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(advancedSettings.maintainAspectRatio);
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

  // Handle enable state change
  const handleEnableChange = (enabled: boolean) => {
    setEnabled(enabled);
    dispatch(updateAdvancedSettings({ enableFormatConversion: enabled }));
  };

  // Handle source format change
  const handleSourceFormatChange = (format: string) => {
    setSourceFormat(format);
    dispatch(updateAdvancedSettings({ convertFormatFrom: format }));
  };

  // Handle target format change
  const handleTargetFormatChange = (format: string) => {
    setTargetFormat(format);
    dispatch(updateAdvancedSettings({ convertFormatTo: format }));
  };

  // Handle quality change
  const handleQualityChange = (quality: number) => {
    setQuality(quality);
    dispatch(updateAdvancedSettings({ convertQuality: quality }));
  };

  // Handle delete original change
  const handleDeleteOriginalChange = (deleteOriginal: boolean) => {
    setDeleteOriginal(deleteOriginal);
    dispatch(updateAdvancedSettings({ deleteOriginalAfterConversion: deleteOriginal }));
  };

  // Handle resize width change
  const handleResizeWidthChange = (width: number | null) => {
    setResizeWidth(width);
    dispatch(updateAdvancedSettings({ resizeWidth: width }));
  };

  // Handle resize height change
  const handleResizeHeightChange = (height: number | null) => {
    setResizeHeight(height);
    dispatch(updateAdvancedSettings({ resizeHeight: height }));
  };

  // Handle maintain aspect ratio change
  const handleMaintainAspectRatioChange = (maintain: boolean) => {
    setMaintainAspectRatio(maintain);
    dispatch(updateAdvancedSettings({ maintainAspectRatio: maintain }));
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">{t('settings.formatConversion')}</h3>

      <FormGroup>
        <FormCheckbox
          id="enableFormatConversion"
          checked={enabled}
          onChange={(e) => handleEnableChange(e.target.checked)}
          label={t('settings.enableFormatConversion')}
        />
      </FormGroup>

      {enabled && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Format */}
            <FormGroup>
              <FormLabel>{t('settings.convertFrom')}</FormLabel>
              <FormSelect
                value={sourceFormat}
                onChange={(e) => handleSourceFormatChange(e.target.value)}
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

            {/* Target Format */}
            <FormGroup>
              <FormLabel>{t('settings.convertTo')}</FormLabel>
              <FormSelect
                value={targetFormat}
                onChange={(e) => handleTargetFormatChange(e.target.value)}
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
          </div>

          {/* Conversion Quality */}
          <FormGroup>
            <FormLabel>{t('settings.quality')}</FormLabel>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={quality}
                onChange={(e) => handleQualityChange(parseInt(e.target.value))}
                className="w-full mr-4"
              />
              <span className="w-12 text-center">{quality}%</span>
            </div>
          </FormGroup>

          {/* Delete Original */}
          <FormGroup>
            <FormCheckbox
              id="deleteOriginalAfterConversion"
              checked={deleteOriginal}
              onChange={(e) => handleDeleteOriginalChange(e.target.checked)}
              label="Delete original files after conversion"
            />
          </FormGroup>

          {/* Resize Options */}
          <FormGroup>
            <FormLabel>Resize Options</FormLabel>
            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4 mb-2">
                <div>
                  <FormLabel>Width</FormLabel>
                  <FormInput
                    type="number"
                    value={resizeWidth || ''}
                    onChange={(e) => handleResizeWidthChange(e.target.value ? parseInt(e.target.value) : null)}
                    min="1"
                    placeholder="Optional"
                    className="w-32"
                  />
                </div>
                <div>
                  <FormLabel>Height</FormLabel>
                  <FormInput
                    type="number"
                    value={resizeHeight || ''}
                    onChange={(e) => handleResizeHeightChange(e.target.value ? parseInt(e.target.value) : null)}
                    min="1"
                    placeholder="Optional"
                    className="w-32"
                  />
                </div>
              </div>

              <FormCheckbox
                id="maintainAspectRatio"
                checked={maintainAspectRatio}
                onChange={(e) => handleMaintainAspectRatioChange(e.target.checked)}
                label="Maintain aspect ratio"
              />
            </div>
          </FormGroup>
        </>
      )}
    </div>
  );
};

export default FormatConversionSettings;