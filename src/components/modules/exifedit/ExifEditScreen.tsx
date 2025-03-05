import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { showNotification } from '@store/slices/appSlice';
import { ExifField, ExifEditOperation } from '@common/types';
import { Button, Card, FormGroup, FormLabel, FormInput, FormSelect, FormCheckbox } from '../../ui';
import ProgressIndicator from '../../common/ProgressIndicator';

// Import icons
import {
  BiImage,
  BiRefresh,
  BiInfoCircle,
  BiError,
  BiCheckCircle,
  BiReset,
  BiTag,
  BiSave,
  BiExport,
  BiImport,
  BiCog,
  BiCalendar,
  BiMapAlt,
  BiCopyright,
  BiPencil,
  BiTrash,
  BiPlus,
} from 'react-icons/bi';

/**
 * EXIF Editing screen component
 */
const ExifEditScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { advancedSettings } = useSelector((state: RootState) => state.settings);

  // Local state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [exifFields, setExifFields] = useState<ExifField[]>([]);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [exiftoolAvailable, setExiftoolAvailable] = useState<boolean>(true);
  const [editResult, setEditResult] = useState<{
    success: boolean;
    editedFiles: string[];
    failedFiles: Record<string, string>;
  } | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [templates, setTemplates] = useState<Record<string, Omit<ExifEditOperation, 'filePath'>[]>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [createBackup, setCreateBackup] = useState<boolean>(advancedSettings.exifCreateBackup);
  const [backupDir, setBackupDir] = useState<string>(advancedSettings.exifBackupDir || '');
  const [showAllFields, setShowAllFields] = useState<boolean>(false);

  // Handle file selection
  const handleSelectFiles = async () => {
    try {
      const filePath = await window.electronAPI.selectFile({
        title: 'Select files to edit EXIF metadata',
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'webp'] }
        ],
      });

      if (filePath) {
        // Add to selected files if it's not already there
        if (!selectedFiles.includes(filePath)) {
          const newSelectedFiles = [...selectedFiles, filePath];
          setSelectedFiles(newSelectedFiles);

          // If no current file is selected, set this one
          if (!currentFile) {
            setCurrentFile(filePath);
            loadExifData(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  };

  // Load EXIF data for the current file
  const loadExifData = async (filePath: string) => {
    setIsLoading(true);
    setExifFields([]);
    setEditedFields({});

    try {
      const result = await window.electronAPI.getExifCommonFields(filePath);

      if (result.success && result.fields) {
        setExifFields(result.fields);
      } else {
        dispatch(showNotification({
          type: 'error',
          message: result.error || 'Failed to load EXIF metadata'
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error loading EXIF metadata: ${(error as Error).message}`
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle switching to another file
  const handleFileChange = (filePath: string) => {
    // Check if there are unsaved changes
    if (Object.keys(editedFields).length > 0) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to switch files?')) {
        return;
      }
    }

    setCurrentFile(filePath);
    loadExifData(filePath);
  };

  // Handle removal of a file from the list
  const handleRemoveFile = (filePath: string) => {
    const newSelectedFiles = selectedFiles.filter(f => f !== filePath);
    setSelectedFiles(newSelectedFiles);

    // If the current file is being removed, switch to another file
    if (currentFile === filePath) {
      if (newSelectedFiles.length > 0) {
        setCurrentFile(newSelectedFiles[0]);
        loadExifData(newSelectedFiles[0]);
      } else {
        setCurrentFile(null);
        setExifFields([]);
        setEditedFields({});
      }
    }
  };

  // Handle EXIF field editing
  const handleEditField = (tag: string, value: string) => {
    setEditedFields({
      ...editedFields,
      [tag]: value
    });
  };

  // Handle saving EXIF changes to the current file
  const handleSaveChanges = async () => {
    if (!currentFile) return;

    try {
      setIsProcessing(true);

      // Create operations from edited fields
      const operations: ExifEditOperation[] = Object.entries(editedFields).map(([tag, value]) => ({
        filePath: currentFile,
        tag,
        value,
        operation: value.trim() === '' ? 'remove' : 'set'
      }));

      if (operations.length === 0) {
        dispatch(showNotification({
          type: 'warning',
          message: 'No changes to save'
        }));
        setIsProcessing(false);
        return;
      }

      const options = {
        createBackup,
        backupDir: backupDir || undefined
      };

      // Edit one file at a time
      const result = await window.electronAPI.batchEditExif(operations, options);

      if (result.success) {
        dispatch(showNotification({
          type: 'success',
          message: 'EXIF metadata updated successfully'
        }));

        // Reload the data to show updated values
        loadExifData(currentFile);
        setEditedFields({});
      } else {
        dispatch(showNotification({
          type: 'error',
          message: result.error || 'Failed to update EXIF metadata'
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error updating EXIF metadata: ${(error as Error).message}`
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle applying changes to all selected files
  const handleApplyToAll = async () => {
    if (selectedFiles.length <= 1 || Object.keys(editedFields).length === 0) return;

    if (!window.confirm(`Apply these changes to all ${selectedFiles.length} selected files?`)) {
      return;
    }

    try {
      setIsProcessing(true);

      // Create template from edited fields
      const template: Omit<ExifEditOperation, 'filePath'>[] = Object.entries(editedFields).map(([tag, value]) => ({
        tag,
        value,
        operation: value.trim() === '' ? 'remove' : 'set'
      }));

      const options = {
        createBackup,
        backupDir: backupDir || undefined
      };

      // Apply template to all files
      const result = await window.electronAPI.applyExifTemplate(selectedFiles, template, options);

      setEditResult(result);

      if (result.success) {
        dispatch(showNotification({
          type: 'success',
          message: `Applied changes to ${result.editedFiles.length} files successfully`
        }));

        // Reload the data to show updated values
        if (currentFile) {
          loadExifData(currentFile);
        }
        setEditedFields({});
      } else {
        dispatch(showNotification({
          type: 'warning',
          message: `Applied changes with some issues (${Object.keys(result.failedFiles).length} failures)`
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error applying changes: ${(error as Error).message}`
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle saving the current edits as a template
  const handleSaveTemplate = () => {
    if (Object.keys(editedFields).length === 0) {
      dispatch(showNotification({
        type: 'warning',
        message: 'No changes to save as template'
      }));
      return;
    }

    if (!templateName.trim()) {
      dispatch(showNotification({
        type: 'error',
        message: 'Please enter a template name'
      }));
      return;
    }

    // Create template from edited fields
    const template: Omit<ExifEditOperation, 'filePath'>[] = Object.entries(editedFields).map(([tag, value]) => ({
      tag,
      value,
      operation: value.trim() === '' ? 'remove' : 'set'
    }));

    // Update templates
    setTemplates({
      ...templates,
      [templateName]: template
    });

    setTemplateName('');

    dispatch(showNotification({
      type: 'success',
      message: `Template "${templateName}" saved successfully`
    }));
  };

  // Handle loading a template
  const handleLoadTemplate = () => {
    if (!selectedTemplate) return;

    const template = templates[selectedTemplate];
    if (!template) return;

    // Convert template to edited fields
    const newEditedFields: Record<string, string> = {};
    template.forEach(op => {
      newEditedFields[op.tag] = op.value;
    });

    setEditedFields(newEditedFields);
  };

  // Handle deleting a template
  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;

    if (!window.confirm(`Delete template "${selectedTemplate}"?`)) {
      return;
    }

    const newTemplates = { ...templates };
    delete newTemplates[selectedTemplate];

    setTemplates(newTemplates);
    setSelectedTemplate('');

    dispatch(showNotification({
      type: 'success',
      message: `Template "${selectedTemplate}" deleted`
    }));
  };

  // Handle selecting backup directory
  const handleSelectBackupDir = async () => {
    try {
      const dirPath = await window.electronAPI.selectDirectory({
        title: 'Select EXIF Backup Directory',
      });

      if (dirPath) {
        setBackupDir(dirPath);
      }
    } catch (error) {
      console.error('Error selecting backup directory:', error);
    }
  };

  // Reset the form and clear selections
  const handleReset = () => {
    // Check if there are unsaved changes
    if (Object.keys(editedFields).length > 0) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to reset?')) {
        return;
      }
    }

    setSelectedFiles([]);
    setCurrentFile(null);
    setExifFields([]);
    setEditedFields({});
  };

  // Clear current edits
  const handleClearEdits = () => {
    if (Object.keys(editedFields).length > 0) {
      if (!window.confirm('Are you sure you want to clear all edits?')) {
        return;
      }
    }

    setEditedFields({});
  };

  // Export templates to JSON file
  const handleExportTemplates = () => {
    if (Object.keys(templates).length === 0) {
      dispatch(showNotification({
        type: 'warning',
        message: 'No templates to export'
      }));
      return;
    }

    try {
      // Create a data URL for the JSON content
      const jsonString = JSON.stringify(templates, null, 2);
      const dataUrl = `data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`;

      // Create a link and trigger a download
      const downloadLink = document.createElement('a');
      downloadLink.setAttribute('href', dataUrl);
      downloadLink.setAttribute('download', 'exif-templates.json');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      dispatch(showNotification({
        type: 'success',
        message: 'Templates exported successfully'
      }));
    } catch (error) {
      console.error('Error exporting templates:', error);
      dispatch(showNotification({
        type: 'error',
        message: `Failed to export templates: ${(error as Error).message}`
      }));
    }
  };

  // Import templates from JSON file
  const handleImportTemplates = async () => {
    try {
      const filePath = await window.electronAPI.selectFile({
        title: 'Select templates JSON file',
        filters: [
          { name: 'JSON Files', extensions: ['json'] }
        ],
      });

      if (!filePath) return;

      // Read the file content
      const fileContent = await fetch(filePath);
      const jsonData = await fileContent.json();

      if (typeof jsonData !== 'object') {
        throw new Error('Invalid templates file format');
      }

      // Merge with existing templates
      setTemplates({
        ...templates,
        ...jsonData
      });

      dispatch(showNotification({
        type: 'success',
        message: 'Templates imported successfully'
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Failed to import templates: ${(error as Error).message}`
      }));
    }
  };

  // Group fields by category for better organization
  const groupedFields = React.useMemo(() => {
    const groups: Record<string, ExifField[]> = {
      'Date/Time': [],
      'Camera': [],
      'Exposure': [],
      'GPS': [],
      'Copyright': [],
      'Description': [],
      'Other': []
    };

    exifFields.forEach(field => {
      switch (field.tag) {
        case 'DateTimeOriginal':
        case 'CreateDate':
        case 'ModifyDate':
          groups['Date/Time'].push(field);
          break;

        case 'Make':
        case 'Model':
        case 'LensModel':
          groups['Camera'].push(field);
          break;

        case 'ISO':
        case 'ExposureTime':
        case 'FNumber':
        case 'FocalLength':
          groups['Exposure'].push(field);
          break;

        case 'GPSLatitude':
        case 'GPSLongitude':
          groups['GPS'].push(field);
          break;

        case 'Copyright':
        case 'Artist':
          groups['Copyright'].push(field);
          break;

        case 'ImageDescription':
        case 'UserComment':
          groups['Description'].push(field);
          break;

        default:
          groups['Other'].push(field);
      }
    });

    // Filter out empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, fields]) => fields.length > 0)
    );
  }, [exifFields]);

  // Decide which fields to show based on showAllFields flag
  const fieldsToShow = React.useMemo(() => {
    if (showAllFields) {
      return exifFields;
    } else {
      // Show only fields from main categories
      return [
        ...groupedFields['Date/Time'] || [],
        ...groupedFields['Camera'] || [],
        ...groupedFields['GPS'] || [],
        ...groupedFields['Description'] || []
      ];
    }
  }, [showAllFields, groupedFields, exifFields]);

  // Register event listeners for progress updates
  useEffect(() => {
    const removeProgressListener = window.electronAPI.on('exif:progress', (data) => {
      setProgress(data.percentage);
    });

    const removeCompleteListener = window.electronAPI.on('exif:complete', () => {
      setProgress(100);
    });

    const checkExifTool = async () => {
      try {
        const result = await window.electronAPI.isExifToolAvailable();
        setExiftoolAvailable(result.available);
      } catch (error) {
        console.error('Error checking ExifTool availability:', error);
        setExiftoolAvailable(false);
      }
    };

    checkExifTool();

    return () => {
      removeProgressListener();
      removeCompleteListener();
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">
        <BiTag className="inline-block mr-2" />
        EXIF Metadata Editor
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - File selection */}
        <div className="md:col-span-1">
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Files</h2>

            {/* File selection */}
            <div className="mb-4">
              <Button
                variant="primary"
                onClick={handleSelectFiles}
                disabled={isProcessing}
              >
                <BiImage className="mr-2" />
                Select Images
              </Button>
            </div>

            {/* Selected files list */}
            {selectedFiles.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Selected Files:</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 max-h-80 overflow-y-auto">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={index}
                        className={`py-2 px-2 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          currentFile === file ? 'bg-blue-50 dark:bg-blue-900' : ''
                        }`}
                        onClick={() => handleFileChange(file)}
                      >
                        <span className="truncate">{path.basename(file)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(file);
                          }}
                          className="text-red-500 hover:text-red-700 ml-2"
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

            {/* Templates */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-medium mb-3">EXIF Templates</h3>

              {/* Save Template */}
              <div className="mb-4">
                <div className="flex space-x-2 mb-2">
                  <FormInput
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template Name"
                    className="flex-grow text-sm"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim() || Object.keys(editedFields).length === 0}
                  >
                    <BiSave className="mr-1" />
                    Save
                  </Button>
                </div>
              </div>

              {/* Load Template */}
              {Object.keys(templates).length > 0 && (
                <div className="mb-4">
                  <div className="flex space-x-2 mb-2">
                    <FormSelect
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="flex-grow text-sm"
                    >
                      <option value="">Select Template</option>
                      {Object.keys(templates).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </FormSelect>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleLoadTemplate}
                      disabled={!selectedTemplate}
                    >
                      Load
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteTemplate}
                      disabled={!selectedTemplate}
                    >
                      <BiTrash />
                    </Button>
                  </div>
                </div>
              )}

              {/* Import/Export Templates */}
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleImportTemplates}
                  disabled={isProcessing}
                >
                  <BiImport className="mr-1" />
                  Import
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportTemplates}
                  disabled={isProcessing || Object.keys(templates).length === 0}
                >
                  <BiExport className="mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Backup Options */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-medium mb-3">Backup Options</h3>

              <FormCheckbox
                id="createBackup"
                checked={createBackup}
                onChange={(e) => setCreateBackup(e.target.checked)}
                label="Create backup before editing"
                className="mb-2"
              />

              {createBackup && (
                <div className="flex space-x-2">
                  <FormInput
                    type="text"
                    value={backupDir}
                    onChange={(e) => setBackupDir(e.target.value)}
                    placeholder="Backup Directory"
                    className="flex-grow"
                    disabled={!createBackup}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSelectBackupDir}
                    disabled={!createBackup}
                  >
                    Browse
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Main content - EXIF editing */}
        <div className="md:col-span-2">
          {currentFile ? (
            <Card>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Edit EXIF Metadata</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {path.basename(currentFile)}
                  </p>
                </div>

                <FormCheckbox
                  id="showAllFields"
                  checked={showAllFields}
                  onChange={(e) => setShowAllFields(e.target.checked)}
                  label="Show all fields"
                />
              </div>

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-center py-8">
                  <BiRefresh className="animate-spin text-4xl text-blue-500" />
                </div>
              )}

              {/* EXIF fields */}
              {!isLoading && fieldsToShow.length > 0 && (
                <div className="space-y-6">
                  {Object.entries(groupedFields).map(([group, fields]) => (
                    // Only show groups that have fields to display
                    fields.some(field => showAllFields || fieldsToShow.includes(field)) && (
                      <div key={group} className="mb-4">
                        <h3 className="font-medium mb-2 flex items-center">
                          {group === 'Date/Time' && <BiCalendar className="mr-1" />}
                          {group === 'GPS' && <BiMapAlt className="mr-1" />}
                          {group === 'Copyright' && <BiCopyright className="mr-1" />}
                          {group}
                        </h3>

                        <div className="grid grid-cols-1 gap-3">
                          {fields.map(field => (
                            (showAllFields || fieldsToShow.includes(field)) && (
                              <div key={field.tag} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                                <div className="flex justify-between mb-1">
                                  <span className="font-medium">{field.description}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{field.tag}</span>
                                </div>

                                {field.editable ? (
                                  field.type === 'date' ? (
                                    <FormInput
                                      type="datetime-local"
                                      value={editedFields[field.tag] !== undefined ? editedFields[field.tag] : field.value}
                                      onChange={(e) => handleEditField(field.tag, e.target.value)}
                                      className="w-full"
                                    />
                                  ) : field.type === 'gps' ? (
                                    <FormInput
                                      type="text"
                                      value={editedFields[field.tag] !== undefined ? editedFields[field.tag] : field.value}
                                      onChange={(e) => handleEditField(field.tag, e.target.value)}
                                      placeholder="e.g. 40.7128, -74.0060"
                                      className="w-full"
                                    />
                                  ) : field.type === 'select' && field.options ? (
                                    <FormSelect
                                      value={editedFields[field.tag] !== undefined ? editedFields[field.tag] : field.value}
                                      onChange={(e) => handleEditField(field.tag, e.target.value)}
                                      className="w-full"
                                    >
                                      <option value="">-- Select --</option>
                                      {field.options.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </FormSelect>
                                  ) : (
                                    <FormInput
                                      type={field.type === 'number' ? 'number' : 'text'}
                                      value={editedFields[field.tag] !== undefined ? editedFields[field.tag] : field.value}
                                      onChange={(e) => handleEditField(field.tag, e.target.value)}
                                      className="w-full"
                                    />
                                  )
                                ) : (
                                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                                    {field.value || <span className="text-gray-400 dark:text-gray-500">Not set</span>}
                                  </div>
                                )}

                                {editedFields[field.tag] !== undefined && (
                                  <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                    <BiPencil className="inline-block mr-1" />
                                    Edited
                                  </div>
                                )}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* No fields message */}
              {!isLoading && fieldsToShow.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BiInfoCircle className="mx-auto text-4xl mb-2" />
                  <p>No EXIF metadata found in this file or unsupported file format.</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap justify-end space-x-2 mt-6">
                <Button
                  variant="secondary"
                  onClick={handleClearEdits}
                  disabled={isProcessing || Object.keys(editedFields).length === 0}
                >
                  <BiReset className="mr-1" />
                  Clear Edits
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleApplyToAll}
                  disabled={isProcessing || selectedFiles.length <= 1 || Object.keys(editedFields).length === 0}
                >
                  <BiSave className="mr-1" />
                  Apply to All Files
                </Button>

                <Button
                  variant="primary"
                  onClick={handleSaveChanges}
                  disabled={isProcessing || Object.keys(editedFields).length === 0}
                >
                  <BiSave className="mr-1" />
                  Save Changes
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center py-8">
                <BiImage className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Select a file to edit EXIF metadata
                </p>
              </div>
            </Card>
          )}

          {/* Progress indicator */}
          {isProcessing && (
            <Card className="mt-6">
              <h3 className="font-medium mb-2">Processing...</h3>
              <ProgressIndicator
                percentage={progress}
                showPercentage={true}
                height={8}
              />
            </Card>
          )}

          {/* Results */}
          {editResult && (
            <Card className="mt-6">
              <h3 className="font-medium mb-2 flex items-center">
                {editResult.success ? (
                  <>
                    <BiCheckCircle className="mr-2 text-green-500" />
                    Changes Applied
                  </>
                ) : (
                  <>
                    <BiError className="mr-2 text-yellow-500" />
                    Completed with Issues
                  </>
                )}
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center">
                  <div className="text-lg font-semibold">{editResult.editedFiles.length + Object.keys(editResult.failedFiles).length}</div>
                  <div className="text-sm">Total Files</div>
                </div>

                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-md text-center">
                  <div className="text-lg font-semibold text-green-700 dark:text-green-300">{editResult.editedFiles.length}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Succeeded</div>
                </div>

                <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md text-center">
                  <div className="text-lg font-semibold text-red-700 dark:text-red-300">{Object.keys(editResult.failedFiles).length}</div>
                  <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
                </div>
              </div>

              {Object.keys(editResult.failedFiles).length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Failed Files:</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md max-h-40 overflow-y-auto">
                    {Object.entries(editResult.failedFiles).map(([file, error]) => (
                      <div key={file} className="mb-1 text-sm">
                        <span className="font-medium">{path.basename(file)}:</span> {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper for file path operations
const path = {
  basename: (filePath: string) => {
    return filePath.split(/[\\/]/).pop() || filePath;
  }
};

export default ExifEditScreen;