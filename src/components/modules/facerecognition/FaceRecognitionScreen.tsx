import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { showNotification } from '@store/slices/appSlice';
import { updateAdvancedSettings } from '@store/slices/settingsSlice';
import {
  FaceRecognitionResult,
  FaceDetection,
  Person,
  BatchFaceRecognitionResult
} from '@common/types';
import { Button, Card, FormGroup, FormLabel, FormInput, FormSelect, FormCheckbox } from '../../ui';
import ProgressIndicator from '../../common/ProgressIndicator';

// Import icons
import {
  BiImage,
  BiRefresh,
  BiUser,
  BiUserPlus,
  BiUserX,
  BiUserVoice,
  BiAnalyse,
  BiBookmark,
  BiReset,
  BiSave,
  BiCheck,
  BiPencil,
  BiTrash,
  BiPlus,
  BiMinus,
  BiFilter,
  BiSearch,
  BiExport,
} from 'react-icons/bi';

/**
 * Face Recognition screen component
 */
const FaceRecognitionScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { advancedSettings } = useSelector((state: RootState) => state.settings);

  // Local state
  const [activeTab, setActiveTab] = useState<'recognize' | 'people'>('recognize');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<FaceRecognitionResult[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [editingPerson, setEditingPerson] = useState<boolean>(false);
  const [newPersonName, setNewPersonName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFace, setSelectedFace] = useState<{result: FaceRecognitionResult, face: FaceDetection} | null>(null);
  const [assigningFace, setAssigningFace] = useState<boolean>(false);

  // Load people on component mount
  useEffect(() => {
    loadPeople();
  }, []);

  // Load people from the database
  const loadPeople = async () => {
    try {
      const result = await window.electronAPI.getAllPeople();
      if (result.success && result.people) {
        setPeople(result.people);
      }
    } catch (error) {
      console.error('Error loading people:', error);
      dispatch(showNotification({
        type: 'error',
        message: `Error loading people: ${(error as Error).message}`
      }));
    }
  };

  // Handle file selection
  const handleSelectFiles = async () => {
    try {
      const filePath = await window.electronAPI.selectFile({
        title: 'Select images to process',
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }
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

  // Start face recognition process
  const handleStartRecognition = async () => {
    if (selectedFiles.length === 0) {
      dispatch(showNotification({
        type: 'error',
        message: 'Please select at least one image to process'
      }));
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setResults([]);

      // Configure face recognition options
      await window.electronAPI.configureFaceRecognition({
        minFaceSize: advancedSettings.faceMinSize,
        maxFaceSize: advancedSettings.faceMaxSize,
        confidenceThreshold: advancedSettings.faceConfidenceThreshold,
        recognitionThreshold: advancedSettings.faceRecognitionThreshold,
        enableLandmarks: advancedSettings.faceEnableLandmarks,
        enableAttributes: advancedSettings.faceEnableAttributes,
        maxFacesPerImage: advancedSettings.faceMaxPerImage,
        useLocalModel: advancedSettings.faceUseLocalModel,
        apiKey: advancedSettings.faceApiKey,
      });

      // Set up event listeners for progress updates
      const removeProgressListener = window.electronAPI.on('face:progress', (data) => {
        setProgress(data.percentage);
      });

      const removeCompleteListener = window.electronAPI.on('face:complete', () => {
        setIsProcessing(false);
        removeProgressListener();
        removeCompleteListener();
        removeErrorListener();

        // Reload people after processing to reflect any updates
        loadPeople();
      });

      const removeErrorListener = window.electronAPI.on('face:error', (error) => {
        console.error('Error during face recognition:', error);
        dispatch(showNotification({
          type: 'error',
          message: `Error during face recognition: ${error.message}`
        }));
      });

      // Start face recognition
      const result = await window.electronAPI.processFaceBatch(selectedFiles);

      if (result.success && result.results) {
        setResults(result.results);
        dispatch(showNotification({
          type: 'success',
          message: `Successfully processed ${result.results.length} image(s)`
        }));
      } else {
        dispatch(showNotification({
          type: 'error',
          message: result.error || 'Failed to process images'
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error during face recognition: ${(error as Error).message}`
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset the form and clear results
  const handleReset = () => {
    setSelectedFiles([]);
    setResults([]);
    setSelectedFace(null);
    setAssigningFace(false);
  };

  // Create a new person
  const handleCreatePerson = async () => {
    if (!newPersonName.trim()) {
      dispatch(showNotification({
        type: 'error',
        message: 'Please enter a name for the new person'
      }));
      return;
    }

    try {
      const result = await window.electronAPI.createOrUpdatePerson({ name: newPersonName });
      if (result.success && result.person) {
        setPeople([...people, result.person]);
        setNewPersonName('');
        dispatch(showNotification({
          type: 'success',
          message: `Successfully created person "${newPersonName}"`
        }));
      } else {
        dispatch(showNotification({
          type: 'error',
          message: result.error || 'Failed to create person'
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error creating person: ${(error as Error).message}`
      }));
    }
  };

  // Update a person
  const handleUpdatePerson = async () => {
    if (!selectedPerson) return;
    if (!newPersonName.trim()) {
      dispatch(showNotification({
        type: 'error',
        message: 'Please enter a name for the person'
      }));
      return;
    }

    try {
      const result = await window.electronAPI.createOrUpdatePerson({
        id: selectedPerson.id,
        name: newPersonName
      });

      if (result.success && result.person) {
        setPeople(people.map(p => p.id === result.person!.id ? result.person! : p));
        setSelectedPerson(result.person);
        setEditingPerson(false);
        dispatch(showNotification({
          type: 'success',
          message: `Successfully updated person "${newPersonName}"`
        }));
      } else {
        dispatch(showNotification({
          type: 'error',
          message: result.error || 'Failed to update person'
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error updating person: ${(error as Error).message}`
      }));
    }
  };

  // Delete a person
  const handleDeletePerson = async () => {
    if (!selectedPerson) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedPerson.name}?`)) {
      return;
    }

    try {
      const result = await window.electronAPI.deletePerson(selectedPerson.id);
      if (result.success) {
        setPeople(people.filter(p => p.id !== selectedPerson.id));
        setSelectedPerson(null);
        dispatch(showNotification({
          type: 'success',
          message: `Successfully deleted person "${selectedPerson.name}"`
        }));
      } else {
        dispatch(showNotification({
          type: 'error',
          message: result.error || 'Failed to delete person'
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error deleting person: ${(error as Error).message}`
      }));
    }
  };

  // Start face assignment process
  const handleAssignFace = (result: FaceRecognitionResult, face: FaceDetection) => {
    setSelectedFace({ result, face });
    setAssigningFace(true);
  };

  // Confirm face assignment
  const handleConfirmAssignFace = async (personId: string) => {
    if (!selectedFace) return;

    try {
      const result = await window.electronAPI.addFaceToPerson(
        personId,
        selectedFace.result.filePath,
        selectedFace.face.boundingBox
      );

      if (result.success && result.person) {
        setPeople(people.map(p => p.id === result.person!.id ? result.person! : p));
        setAssigningFace(false);
        setSelectedFace(null);
        dispatch(showNotification({
          type: 'success',
          message: `Successfully added face to ${result.person.name}`
        }));
      } else {
        dispatch(showNotification({
          type: 'error',
          message: result.error || 'Failed to assign face'
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error assigning face: ${(error as Error).message}`
      }));
    }
  };

  // Remove face from person
  const handleRemoveFace = async (personId: string, faceId: string) => {
    try {
      const result = await window.electronAPI.removeFaceFromPerson(personId, faceId);
      if (result.success && result.person) {
        setPeople(people.map(p => p.id === result.person!.id ? result.person! : p));
        if (selectedPerson && selectedPerson.id === personId) {
          setSelectedPerson(result.person);
        }
        dispatch(showNotification({
          type: 'success',
          message: 'Successfully removed face'
        }));
      } else {
        dispatch(showNotification({
          type: 'error',
          message: result.error || 'Failed to remove face'
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: `Error removing face: ${(error as Error).message}`
      }));
    }
  };

  // Export results to JSON
  const handleExportResults = () => {
    if (results.length === 0) return;

    try {
      // Create a data URL for the JSON content
      const jsonString = JSON.stringify(results, null, 2);
      const dataUrl = `data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`;

      // Create a link and trigger a download
      const downloadLink = document.createElement('a');
      downloadLink.setAttribute('href', dataUrl);
      downloadLink.setAttribute('download', 'face-recognition-results.json');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Error exporting results:', error);
      dispatch(showNotification({
        type: 'error',
        message: `Failed to export results: ${(error as Error).message}`
      }));
    }
  };

  // Filter people by search term
  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render tabs
  const renderTabs = () => (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      <button
        className={`px-4 py-2 font-medium ${
          activeTab === 'recognize'
            ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
        }`}
        onClick={() => setActiveTab('recognize')}
      >
        <BiAnalyse className="inline-block mr-2" />
        Face Recognition
      </button>
      <button
        className={`px-4 py-2 font-medium ${
          activeTab === 'people'
            ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
        }`}
        onClick={() => setActiveTab('people')}
      >
        <BiUser className="inline-block mr-2" />
        People Management
      </button>
    </div>
  );

  // Render face recognition tab
  const renderRecognizeTab = () => (
    <div>
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Images</h2>

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

        {/* Action buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isProcessing}
          >
            <BiReset className="mr-2" />
            Reset
          </Button>

          <Button
            variant="primary"
            onClick={handleStartRecognition}
            disabled={isProcessing || selectedFiles.length === 0}
          >
            {isProcessing ? (
              <>
                <BiRefresh className="mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <BiAnalyse className="mr-2" />
                Start Recognition
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Progress display */}
      {isProcessing && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Processing Images</h2>
          <ProgressIndicator
            percentage={progress}
            showPercentage={true}
            height={8}
          />
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Recognition Results
            </h2>
            <Button
              variant="secondary"
              onClick={handleExportResults}
              disabled={isProcessing}
            >
              <BiExport className="mr-2" />
              Export Results
            </Button>
          </div>

          <div className="space-y-6">
            {results.map((result, index) => (
              <Card key={index} className="mb-4">
                <h3 className="font-medium mb-2 truncate">{result.filePath}</h3>
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md mb-4">
                  <div className="text-sm">
                    <span className="font-medium">Image size:</span> {result.imageWidth} x {result.imageHeight} pixels
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Faces detected:</span> {result.faces.length}
                  </div>
                </div>

                {result.faces.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {result.faces.map((face, faceIndex) => (
                      <div key={faceIndex} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                        <div className="mb-2">
                          <div className="font-medium">Face #{faceIndex + 1}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Confidence: {(face.confidence * 100).toFixed(1)}%
                          </div>
                        </div>

                        {/* Face details */}
                        <div className="space-y-2 mb-3">
                          {/* Position */}
                          <div className="text-sm">
                            Position: {face.boundingBox.x}, {face.boundingBox.y}, {face.boundingBox.width}x{face.boundingBox.height}
                          </div>

                          {/* Recognized person */}
                          {face.personId && face.personName && (
                            <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-2 rounded-md">
                              <BiUser className="inline-block mr-1" />
                              Recognized as <span className="font-medium">{face.personName}</span>
                              {face.matchConfidence && (
                                <div className="text-xs">
                                  Match confidence: {(face.matchConfidence * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          )}

                          {/* Attributes */}
                          {face.attributes && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md text-sm">
                              {face.attributes.age && (
                                <div>Age: ~{Math.round(face.attributes.age)} years</div>
                              )}
                              {face.attributes.gender && (
                                <div>Gender: {face.attributes.gender}</div>
                              )}
                              {face.attributes.emotion && (
                                <div>Emotion: {face.attributes.emotion}</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-2 flex justify-end">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAssignFace(result, face)}
                            disabled={isProcessing}
                          >
                            <BiUserPlus className="mr-1" />
                            Assign to Person
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No faces detected in this image
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Face assignment dialog */}
      {assigningFace && selectedFace && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-4">Assign Face to Person</h2>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Selected Face:</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                <div className="text-sm">
                  <div>From: {selectedFace.result.filePath}</div>
                  <div>
                    Position: {selectedFace.face.boundingBox.x}, {selectedFace.face.boundingBox.y},
                    {selectedFace.face.boundingBox.width}x{selectedFace.face.boundingBox.height}
                  </div>
                  <div>Confidence: {(selectedFace.face.confidence * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Select Person:</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-md max-h-60 overflow-y-auto">
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                  {people.map((person) => (
                    <li
                      key={person.id}
                      className="py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer rounded-md"
                      onClick={() => handleConfirmAssignFace(person.id)}
                    >
                      <div className="font-medium">{person.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {person.faceIds.length} face(s) | {person.imageCount} image(s)
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setAssigningFace(false);
                  setSelectedFace(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  // Open create person dialog
                  setActiveTab('people');
                  setAssigningFace(false);
                }}
              >
                <BiUserPlus className="mr-1" />
                Create New Person
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render people management tab
  const renderPeopleTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left panel - Person list */}
      <div className="md:col-span-1">
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">People</h2>

          {/* Search box */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <BiSearch className="text-gray-500" />
              </div>
              <input
                type="text"
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search people..."
              />
            </div>
          </div>

          {/* People list */}
          {filteredPeople.length > 0 ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md max-h-96 overflow-y-auto">
              <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredPeople.map((person) => (
                  <li
                    key={person.id}
                    className={`py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer rounded-md ${
                      selectedPerson?.id === person.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                    onClick={() => setSelectedPerson(person)}
                  >
                    <div className="font-medium">{person.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {person.faceIds.length} face(s) | {person.imageCount} image(s)
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No people match your search' : 'No people created yet'}
            </div>
          )}

          {/* Create new person form */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2">Create New Person</h3>
            <div className="flex space-x-2">
              <FormInput
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Enter name"
                className="flex-grow"
              />
              <Button
                variant="primary"
                onClick={handleCreatePerson}
                disabled={!newPersonName.trim()}
              >
                <BiUserPlus className="mr-1" />
                Create
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Right panel - Person details */}
      <div className="md:col-span-2">
        {selectedPerson ? (
          <Card>
            {/* Person header */}
            <div className="flex justify-between mb-4">
              {editingPerson ? (
                <div className="flex space-x-2 items-center">
                  <FormInput
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder="Enter name"
                    className="w-64"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleUpdatePerson}
                    disabled={!newPersonName.trim()}
                  >
                    <BiCheck className="mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingPerson(false);
                      setNewPersonName(selectedPerson.name);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <h2 className="text-xl font-semibold">
                  {selectedPerson.name}
                </h2>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingPerson(true);
                    setNewPersonName(selectedPerson.name);
                  }}
                  disabled={editingPerson}
                >
                  <BiPencil className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeletePerson}
                  disabled={editingPerson}
                >
                  <BiTrash className="mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Person metadata */}
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">Created:</span> {new Date(selectedPerson.dateCreated).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Modified:</span> {new Date(selectedPerson.dateModified).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Face Samples:</span> {selectedPerson.faceIds.length}
              </div>
              <div>
                <span className="font-medium">Images:</span> {selectedPerson.imageCount}
              </div>
            </div>

            {/* Face samples */}
            <h3 className="font-medium mb-2">Face Samples</h3>
            {selectedPerson.faceIds.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedPerson.faceIds.map((faceId, index) => (
                  <div key={faceId} className="border border-gray-200 dark:border-gray-700 rounded-md p-2 flex flex-col">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Face #{index + 1}
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleRemoveFace(selectedPerson.id, faceId)}
                      >
                        <BiMinus className="mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md">
                No face samples added yet
              </div>
            )}

            {/* Add face hint */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
              <p>
                <BiInfoCircle className="inline-block mr-1" />
                To add face samples, use the Face Recognition tab to detect faces and assign them to this person.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <BiUser className="mx-auto text-4xl mb-2" />
              <p>Select a person to view details</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">
        <BiUserVoice className="inline-block mr-2" />
        Face Recognition
      </h1>

      {renderTabs()}

      {activeTab === 'recognize' && renderRecognizeTab()}
      {activeTab === 'people' && renderPeopleTab()}
    </div>
  );
};

export default FaceRecognitionScreen;