import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { updateAdvancedSettings } from '@store/slices/settingsSlice';
import { FormGroup, FormLabel, FormSelect, FormCheckbox, FormInput } from '../../ui';

/**
 * Face recognition settings component for the settings screen
 */
const FaceRecognitionSettings: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { advancedSettings } = useSelector((state: RootState) => state.settings);

  // Local state
  const [enabled, setEnabled] = useState<boolean>(advancedSettings.enableFaceRecognition);
  const [useLocalModel, setUseLocalModel] = useState<boolean>(advancedSettings.faceUseLocalModel);
  const [apiKey, setApiKey] = useState<string>(advancedSettings.faceApiKey);
  const [minFaceSize, setMinFaceSize] = useState<number>(advancedSettings.faceMinSize);
  const [maxFaceSize, setMaxFaceSize] = useState<number>(advancedSettings.faceMaxSize);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(advancedSettings.faceConfidenceThreshold);
  const [recognitionThreshold, setRecognitionThreshold] = useState<number>(advancedSettings.faceRecognitionThreshold);
  const [enableLandmarks, setEnableLandmarks] = useState<boolean>(advancedSettings.faceEnableLandmarks);
  const [enableAttributes, setEnableAttributes] = useState<boolean>(advancedSettings.faceEnableAttributes);
  const [maxFacesPerImage, setMaxFacesPerImage] = useState<number>(advancedSettings.faceMaxPerImage);

  // Handle enable state change
  const handleEnableChange = (enabled: boolean) => {
    setEnabled(enabled);
    dispatch(updateAdvancedSettings({ enableFaceRecognition: enabled }));
  };

  // Handle use local model change
  const handleUseLocalModelChange = (useLocal: boolean) => {
    setUseLocalModel(useLocal);
    dispatch(updateAdvancedSettings({ faceUseLocalModel: useLocal }));
  };

  // Handle API key change
  const handleApiKeyChange = (apiKey: string) => {
    setApiKey(apiKey);
    dispatch(updateAdvancedSettings({ faceApiKey: apiKey }));
  };

  // Handle min face size change
  const handleMinFaceSizeChange = (size: number) => {
    setMinFaceSize(size);
    dispatch(updateAdvancedSettings({ faceMinSize: size }));
  };

  // Handle max face size change
  const handleMaxFaceSizeChange = (size: number) => {
    setMaxFaceSize(size);
    dispatch(updateAdvancedSettings({ faceMaxSize: size }));
  };

  // Handle confidence threshold change
  const handleConfidenceThresholdChange = (threshold: number) => {
    setConfidenceThreshold(threshold);
    dispatch(updateAdvancedSettings({ faceConfidenceThreshold: threshold }));
  };

  // Handle recognition threshold change
  const handleRecognitionThresholdChange = (threshold: number) => {
    setRecognitionThreshold(threshold);
    dispatch(updateAdvancedSettings({ faceRecognitionThreshold: threshold }));
  };

  // Handle enable landmarks change
  const handleEnableLandmarksChange = (enabled: boolean) => {
    setEnableLandmarks(enabled);
    dispatch(updateAdvancedSettings({ faceEnableLandmarks: enabled }));
  };

  // Handle enable attributes change
  const handleEnableAttributesChange = (enabled: boolean) => {
    setEnableAttributes(enabled);
    dispatch(updateAdvancedSettings({ faceEnableAttributes: enabled }));
  };

  // Handle max faces per image change
  const handleMaxFacesPerImageChange = (max: number) => {
    setMaxFacesPerImage(max);
    dispatch(updateAdvancedSettings({ faceMaxPerImage: max }));
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Face Recognition</h3>

      <FormGroup>
        <FormCheckbox
          id="enableFaceRecognition"
          checked={enabled}
          onChange={(e) => handleEnableChange(e.target.checked)}
          label="Enable Face Recognition"
        />
      </FormGroup>

      {enabled && (
        <>
          {/* Model Selection */}
          <FormGroup>
            <FormLabel>Model Type</FormLabel>
            <div className="flex space-x-4">
              <button
                className={`flex items-center px-4 py-2 rounded-md ${
                  useLocalModel
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                onClick={() => handleUseLocalModelChange(true)}
              >
                Use Local Model
              </button>

              <button
                className={`flex items-center px-4 py-2 rounded-md ${
                  !useLocalModel
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                onClick={() => handleUseLocalModelChange(false)}
              >
                Use Cloud API
              </button>
            </div>
          </FormGroup>

          {/* API Key (only shown when using cloud API) */}
          {!useLocalModel && (
            <FormGroup>
              <FormLabel>API Key</FormLabel>
              <FormInput
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Enter your API key here"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                API key is required for cloud-based face recognition
              </p>
            </FormGroup>
          )}

          {/* Face Detection Settings */}
          <FormGroup>
            <FormLabel>Face Detection Settings</FormLabel>
            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
              {/* Min Face Size */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm">Minimum Face Size (pixels)</label>
                  <span className="text-sm">{minFaceSize}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={minFaceSize}
                  onChange={(e) => handleMinFaceSizeChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Max Face Size */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm">Maximum Face Size (pixels, 0 = no limit)</label>
                  <span className="text-sm">{maxFaceSize}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={maxFaceSize}
                  onChange={(e) => handleMaxFaceSizeChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Detection Confidence Threshold */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm">Detection Confidence Threshold</label>
                  <span className="text-sm">{(confidenceThreshold * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => handleConfidenceThresholdChange(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Recognition Confidence Threshold */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm">Recognition Confidence Threshold</label>
                  <span className="text-sm">{(recognitionThreshold * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={recognitionThreshold}
                  onChange={(e) => handleRecognitionThresholdChange(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Max Faces Per Image */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm">Maximum Faces Per Image</label>
                  <span className="text-sm">{maxFacesPerImage}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={maxFacesPerImage}
                  onChange={(e) => handleMaxFacesPerImageChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Additional options */}
              <div className="space-y-2">
                <FormCheckbox
                  id="enableLandmarks"
                  checked={enableLandmarks}
                  onChange={(e) => handleEnableLandmarksChange(e.target.checked)}
                  label="Detect Facial Landmarks (eyes, nose, mouth)"
                />
                <FormCheckbox
                  id="enableAttributes"
                  checked={enableAttributes}
                  onChange={(e) => handleEnableAttributesChange(e.target.checked)}
                  label="Detect Face Attributes (age, gender, emotions)"
                />
              </div>
            </div>
          </FormGroup>
        </>
      )}
    </div>
  );
};

export default FaceRecognitionSettings;