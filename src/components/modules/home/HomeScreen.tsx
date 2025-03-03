import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setSourcePath, setDestinationPath } from '@store/slices/organizeSlice';

// Import icons
import { BiFolder, BiImageAlt, BiCog, BiInfoCircle } from 'react-icons/bi';

const HomeScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Quick start function - select source directory and go to organize
    const handleQuickStart = async () => {
        try {
            const sourcePath = await window.electronAPI.selectDirectory({
                title: t('home.selectSourceDirectory'),
            });

            if (sourcePath) {
                dispatch(setSourcePath(sourcePath));

                // Try to get destination directory
                const destinationPath = await window.electronAPI.selectDirectory({
                    title: t('home.selectDestinationDirectory'),
                });

                if (destinationPath) {
                    dispatch(setDestinationPath(destinationPath));
                    navigate('/organize');
                }
            }
        } catch (error) {
            console.error('Error selecting directories:', error);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="text-center mb-10 mt-4 md:mt-0">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    {t('home.welcome')}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {t('home.subtitle')}
                </p>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
                    onClick={handleQuickStart}
                >
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mb-4">
                        <BiImageAlt size={30} className="text-blue-600 dark:text-blue-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                        {t('home.quickStart')}
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-300">
                        {t('home.quickStartDesc')}
                    </p>
                </div>

                <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
                    onClick={() => navigate('/settings')}
                >
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full mb-4">
                        <BiCog size={30} className="text-green-600 dark:text-green-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                        {t('home.settings')}
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-300">
                        {t('home.settingsDesc')}
                    </p>
                </div>
            </div>

            {/* Features overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    {t('home.features')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FeatureItem
                        title={t('home.featureOrganize')}
                        description={t('home.featureOrganizeDesc')}
                    />
                    <FeatureItem
                        title={t('home.featureDatePattern')}
                        description={t('home.featureDatePatternDesc')}
                    />
                    <FeatureItem
                        title={t('home.featureMetadata')}
                        description={t('home.featureMetadataDesc')}
                    />
                    <FeatureItem
                        title={t('home.featureDuplicates')}
                        description={t('home.featureDuplicatesDesc')}
                    />
                    <FeatureItem
                        title={t('home.featureAI')}
                        description={t('home.featureAIDesc')}
                    />
                    <FeatureItem
                        title={t('home.featureCustomize')}
                        description={t('home.featureCustomizeDesc')}
                    />
                </div>
            </div>

            {/* Recent activity - placeholder for future */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex-grow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    {t('home.recentActivity')}
                </h2>

                <div className="flex flex-col items-center justify-center h-40">
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('home.noRecentActivity')}
                    </p>
                </div>
            </div>
        </div>
    );
};

interface FeatureItemProps {
    title: string;
    description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ title, description }) => {
    return (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>
    );
};

export default HomeScreen;