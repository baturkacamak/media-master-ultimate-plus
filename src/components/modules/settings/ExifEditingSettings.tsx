import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { updateAdvancedSettings } from '@store/slices/settingsSlice';
import { FormGroup, FormLabel, FormSelect, FormCheckbox, FormInput } from '../../ui';

/**
 * EXIF editing settings component for the settings screen
 */
const ExifEditingSettings: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { advancedSettings } = useSelector((state: RootState) => state.settings);

  // Local state
  const [enabled, setEnabled] = useState<boolean>(advancedSettings.enableExifEdit);
  const [createBackup, setCreateBackup] = useState<boolean>(advancedSettings.exifCreateBackup);
  const [backupDir, setBackupDir] = useState<string>(advancedSettings.exifBackupDir || '');
  const [commandsText, setCommandsText] = useState<string>(advancedSettings.exifEditCommands || '');

  // Handle enable state change
  const handleEnableChange = (enabled: boolean) => {
    setEnabled(enabled);
    dispatch(updateAdvancedSettings({ enableExifEdit: enabled }));
  };

  // Handle create backup change
  const handleCreateBackupChange = (createBackup: boolean) => {
    setCreateBackup(createBackup);
    dispatch(updateAdvancedSettings({ exifCreateBackup: createBackup }));
  };

  // Handle backup directory change
  const handleBackupDirChange = (dir: string) => {
    setBackupDir(dir);
    dispatch(updateAdvancedSettings({ exifBackupDir: dir }));
  };

  // Handle selecting backup directory
  const handleSelectBackupDir = async () => {
    try {
      const dirPath = await window.electronAPI.selectDirectory({
        title: 'Select EXIF Backup Directory',
      });

      if (dirPath) {
        setBackupDir(dirPath);
        dispatch(updateAdvancedSettings({ exifBackupDir: dirPath }));
      }
    } catch (error) {
      console.error('Error selecting backup directory:', error);
    }
  };

  // Handle commands text change
  const handleCommandsTextChange = (text: string) => {
    setCommandsText(text);
    dispatch(updateAdvancedSettings({ exifEditCommands: text }));
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">EXIF Metadata Editing</h3>

      <FormGroup>
        <FormCheckbox
          id="enableExifEdit"
          checked={enabled}
          onChange={(e) => handleEnableChange(e.target.checked)}
          label="Enable EXIF Metadata Editing"
        />
      </FormGroup>

      {enabled && (
        <>
          {/* Backup settings */}
          <FormGroup>
            <FormLabel>Backup Settings</FormLabel>
            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
              <FormCheckbox
                id="exifCreateBackup"
                checked={createBackup}
                onChange={(e) => handleCreateBackupChange(e.target.checked)}
                label="Create backup of original files before editing"
              />

              {createBackup && (
                <div className="flex space-x-2">
                  <FormInput
                    type="text"
                    value={backupDir}
                    onChange={(e) => handleBackupDirChange(e.target.value)}
                    placeholder="Backup Directory Path"
                    className="flex-grow"
                  />
                  <button
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={handleSelectBackupDir}
                  >
                    Browse
                  </button>
                </div>
              )}
            </div>
          </FormGroup>

          {/* Common EXIF commands */}
          <FormGroup>
            <FormLabel>Common EXIF Commands</FormLabel>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                These are examples of common EXIF commands you can use to edit metadata:
              </p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">-Artist="John Doe"</code> - Set the Artist tag</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">-Copyright="© 2023 John Doe"</code> - Set Copyright</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">-DateTimeOriginal="2023:01:15 12:30:00"</code> - Set creation date</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">-Comment="My custom comment"</code> - Add a comment</li>
                <li><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">-gps:all=</code> - Remove all GPS data</li>
              </ul>
            </div>
          </FormGroup>

          {/* Custom EXIF commands */}
          <FormGroup>
            <FormLabel>Custom EXIF Edit Commands</FormLabel>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Add custom ExifTool commands to be used when editing files. Each command on a new line.
            </p>
            <textarea
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={commandsText}
              onChange={(e) => handleCommandsTextChange(e.target.value)}
              placeholder="-Artist=&quot;John Doe&quot;&#10;-Copyright=&quot;© 2023&quot;&#10;-Comment=&quot;My default comment&quot;"
            />
          </FormGroup>
        </>
      )}
    </div>
  );
};

export default ExifEditingSettings;