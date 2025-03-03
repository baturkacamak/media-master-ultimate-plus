import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
    setSourcePath,
    setDestinationPath,
    setOperation,
    setPattern,
    setRecursive,
    setConflicts,
    setOptions,
    organizeFiles,
    updateProgress,
    resetProgress,
} from '@store/slices/organizeSlice';
import { showNotification } from '@store/slices/appSlice';
import { PatternOption } from '@common/types';

// Import components
import DirectoryPicker from '../../common/DirectoryPicker';
import ProgressIndicator from '../../common/ProgressIndicator';

// Import icons
import {
    BiFolder,
    BiArrowToRight,
    BiCopy,
    BiMove,
    BiRefresh,
    BiCheckCircle,
    BiErrorCircle,
    BiInfoCircle,
    BiChevronDown,
    BiChevronUp,
} from 'react-icons/bi';

const OrganizeScreen: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    // Redux state
    const {
        sourcePath,
        destinationPath,
        operation,
        pattern,
        recursive,
        conflicts,
        options,
        progress,
    } = useSelector((state: RootState) => state.organize);

    // Local state
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedPatternOption, setSelectedPatternOption] = useState('yearMonthDay');

    // List of predefined patterns
    const patternOptions: PatternOption[] = [
        { code: 'yearMonthDay', description: t('organize.patterns.yearMonthDay'), example: '%Y/%m/%d' },
        { code: 'yearMonth', description: t('organize.patterns.yearMonth'), example: '%Y/%m' },
        { code: 'year', description: t('organize.patterns.year'), example: '%Y' },
        { code: 'yearMonthDayHour', description: t('organize.patterns.yearMonthDayHour'), example: '%Y/%m/%d/%H' },
        { code: 'eventBased', description: t('organize.patterns.eventBased'), example: '%e/%Y-%m-%d' },
        { code: 'custom', description: t('organize.patterns.custom'), example: pattern },
    ];

    // Effect to update pattern based on selected option
    useEffect(() => {
        const selected = patternOptions.find(option => option.code === selectedPatternOption);
        if (selected && selected.code !== 'custom') {
            dispatch(setPattern(selected.example));
        }
    }, [selectedPatternOption, dispatch]);

    // Handle source directory selection
    const handleSelectSource = async () => {
        try {
            const path = await window.electronAPI.selectDirectory({
                title: t('organize.source'),
            });

            if (path) {
                dispatch(setSourcePath(path));
            }
        } catch (error) {
            console.error('Error selecting source directory:', error);
        }
    };

    // Handle destination directory selection
    const handleSelectDestination = async () => {
        try {
            const path = await window.electronAPI.selectDirectory({
                title: t('organize.destination'),
            });

            if (path) {
                dispatch(setDestinationPath(path));
            }
        } catch (error) {
            console.error('Error selecting destination directory:', error);
        }
    };

    // Handle pattern change for custom pattern
    const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setPattern(e.target.value));
        setSelectedPatternOption('custom');
    };

    // Handle options change
    const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        dispatch(setOptions({ [name]: checked }));
    };

    // Start organizing files
    const handleStartOrganizing = async () => {
        // Validate inputs
        if (!sourcePath) {
            dispatch(showNotification({
                type: 'error',
                message: t('organize.noSourceSelected'),
            }));
            return;
        }

        if (!destinationPath) {
            dispatch(showNotification({
                type: 'error',
                message: t('organize.noDestinationSelected'),
            }));
            return;
        }

        // Reset progress
        dispatch(resetProgress());

        // Set up event listeners for progress updates
        const removeProgressListener = window.electronAPI.on('files:progress', (data) => {
            dispatch(updateProgress({
                currentFile: data.file,
                processed: data.processed,
                total: data.total,
                percentage: data.percentage,
            }));
        });

        const removeCompleteListener = window.electronAPI.on('files:complete', (data) => {
            dispatch(updateProgress({
                isRunning: false,
                total: data.total,
                succeeded: data.succeeded,
                skipped: data.skipped,
                errors: data.errors,
                percentage: 100,
            }));

            removeProgressListener();
            removeCompleteListener();
            removeErrorListener();
        });

        const removeErrorListener = window.electronAPI.on('files:error', (data) => {
            console.error('Error during file processing:', data);
        });

        // Start organizing files
        dispatch(organizeFiles());
    };

    // Cancel organizing operation
    const handleCancel = () => {
        // TODO: Implement cancel operation
        dispatch(resetProgress());
    };

    // Render progress section
    const renderProgress = () => {
        if (!progress.isRunning && progress.processed === 0) {
            return null;
        }

        return (
            <div className="card mt-6">
                <h2 className="text-xl font-semibold mb-4">
                    {progress.isRunning ? t('organize.processing') : t('organize.completed')}
                </h2>

                <ProgressIndicator
                    percentage={progress.percentage}
                    isComplete={!progress.isRunning && progress.processed > 0}
                />

                {progress.currentFile && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {t('organize.processingFile')}: {progress.currentFile}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold">{progress.processed}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t('organize.filesProcessed')}</div>
                    </div>

                    <div className="text-center p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">{progress.succeeded}</div>
                        <div className="text-sm text-green-600 dark:text-green-400">{t('organize.filesSucceeded')}</div>
                    </div>

                    <div className="text-center p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{progress.skipped}</div>
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">{t('organize.filesSkipped')}</div>
                    </div>

                    <div className="text-center p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">{progress.errors}</div>
                        <div className="text-sm text-red-600 dark:text-red-400">{t('organize.filesError')}</div>
                    </div>
                </div>

                {progress.isRunning && (
                    <button
                        className="btn btn-danger mt-4"
                        onClick={handleCancel}
                    >
                        {t('organize.cancel')}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6">{t('organize.title')}</h1>

            <div className="card">
                {/* Source and Destination */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <DirectoryPicker
                        label={t('organize.source')}
                        placeholder={t('organize.source')}
                        value={sourcePath}
                        onChange={(value) => dispatch(setSourcePath(value))}
                        onBrowse={handleSelectSource}
                        icon={<BiFolder />}
                    />

                    <DirectoryPicker
                        label={t('organize.destination')}
                        placeholder={t('organize.destination')}
                        value={destinationPath}
                        onChange={(value) => dispatch(setDestinationPath(value))}
                        onBrowse={handleSelectDestination}
                        icon={<BiFolder />}
                    />
                </div>

                {/* Operation Type */}
                <div className="form-group">
                    <label className="form-label">{t('organize.operation')}</label>
                    <div className="flex space-x-4">
                        <button
                            className={`flex items-center px-4 py-2 rounded-md ${
                                operation === 'move'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                            onClick={() => dispatch(setOperation('move'))}
                        >
                            <BiMove className="mr-2" />
                            {t('organize.move')}
                        </button>

                        <button
                            className={`flex items-center px-4 py-2 rounded-md ${
                                operation === 'copy'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                            onClick={() => dispatch(setOperation('copy'))}
                        >
                            <BiCopy className="mr-2" />
                            {t('organize.copy')}
                        </button>
                    </div>
                </div>

                {/* Organization Pattern */}
                <div className="form-group">
                    <label className="form-label">{t('organize.pattern')}</label>
                    <div className="flex flex-col md:flex-row md:space-x-4">
                        <select
                            className="form-select mb-2 md:mb-0 md:w-1/3"
                            value={selectedPatternOption}
                            onChange={(e) => setSelectedPatternOption(e.target.value)}
                        >
                            {patternOptions.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.description}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            className="form-input md:w-2/3"
                            value={pattern}
                            onChange={handlePatternChange}
                            placeholder="%Y/%m/%d"
                        />
                    </div>

                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {t('organize.previewPattern', { pattern: pattern })}
                    </div>

                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>{t('organize.patternExplanation')}</div>
                        <ul className="list-disc pl-5 mt-1">
                            {t('organize.patternExplanationItems', { returnObjects: true }).map((item: string, index: number) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Conflict Resolution */}
                <div className="form-group">
                    <label className="form-label">{t('organize.conflicts')}</label>
                    <div className="flex flex-wrap gap-4">
                        <button
                            className={`px-4 py-2 rounded-md ${
                                conflicts === 'rename'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                            onClick={() => dispatch(setConflicts('rename'))}
                        >
                            {t('organize.rename')}
                        </button>

                        <button
                            className={`px-4 py-2 rounded-md ${
                                conflicts === 'skip'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                            onClick={() => dispatch(setConflicts('skip'))}
                        >
                            {t('organize.skip')}
                        </button>

                        <button
                            className={`px-4 py-2 rounded-md ${
                                conflicts === 'overwrite'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                            onClick={() => dispatch(setConflicts('overwrite'))}
                        >
                            {t('organize.overwrite')}
                        </button>
                    </div>
                </div>

                {/* Basic Options */}
                <div className="form-group">
                    <label className="form-label">{t('organize.options')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="recursive"
                                name="recursive"
                                className="form-checkbox"
                                checked={recursive}
                                onChange={(e) => dispatch(setRecursive(e.target.checked))}
                            />
                            <label htmlFor="recursive" className="ml-2 text-gray-700 dark:text-gray-300">
                                {t('organize.recursive')}
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="createBackup"
                                name="createBackup"
                                className="form-checkbox"
                                checked={options.createBackup}
                                onChange={handleOptionChange}
                            />
                            <label htmlFor="createBackup" className="ml-2 text-gray-700 dark:text-gray-300">
                                {t('organize.backup')}
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="skipDuplicates"
                                name="skipDuplicates"
                                className="form-checkbox"
                                checked={options.skipDuplicates}
                                onChange={handleOptionChange}
                            />
                            <label htmlFor="skipDuplicates" className="ml-2 text-gray-700 dark:text-gray-300">
                                {t('organize.skipDuplicates')}
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="organizeByType"
                                name="organizeByType"
                                className="form-checkbox"
                                checked={options.organizeByType}
                                onChange={handleOptionChange}
                            />
                            <label htmlFor="organizeByType" className="ml-2 text-gray-700 dark:text-gray-300">
                                {t('organize.byType')}
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="organizeByCamera"
                                name="organizeByCamera"
                                className="form-checkbox"
                                checked={options.organizeByCamera}
                                onChange={handleOptionChange}
                            />
                            <label htmlFor="organizeByCamera" className="ml-2 text-gray-700 dark:text-gray-300">
                                {t('organize.byCamera')}
                            </label>
                        </div>
                    </div>
                </div>

                {/* Advanced Options Toggle */}
                <button
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    {showAdvanced ? <BiChevronUp className="mr-1" /> : <BiChevronDown className="mr-1" />}
                    {t('organize.advancedOptions')}
                </button>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                        {/* Advanced options will be added here */}
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            <BiInfoCircle className="inline-block mr-2" />
                            Advanced options are available in the settings screen
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <div className="mt-6">
                    <button
                        className="btn btn-primary w-full md:w-auto"
                        onClick={handleStartOrganizing}
                        disabled={progress.isRunning}
                    >
                        {progress.isRunning ? (
                            <>
                                <BiRefresh className="inline-block mr-2 spinner" />
                                {t('common.processing')}
                            </>
                        ) : (
                            <>
                                {operation === 'move' ? <BiMove className="inline-block mr-2" /> : <BiCopy className="inline-block mr-2" />}
                                {t('organize.startOrganizing')}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Progress Section */}
            {renderProgress()}
        </div>
    );
};

export default OrganizeScreen;