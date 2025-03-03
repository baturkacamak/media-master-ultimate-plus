import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card } from '../../ui';

// Import icons
import {
    BiInfoCircle,
    BiCodeAlt,
    BiBookContent,
    BiSupport,
    BiGitBranch,
    BiCog,
    BiLike,
    BiLinkExternal,
} from 'react-icons/bi';

const AboutScreen: React.FC = () => {
    const { t } = useTranslation();
    const appVersion = useSelector((state: RootState) => state.app.appVersion);

    return (
      <div className="h-full flex flex-col">
          <h1 className="text-2xl font-bold mb-6">{t('about.title')}</h1>

          {/* App Info */}
          <Card className="mb-6">
              <div className="flex flex-col md:flex-row items-center mb-6">
                  <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                      <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <BiCog className="text-blue-600 dark:text-blue-300" size={48} />
                      </div>
                  </div>

                  <div>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                          MEDIA MASTER - Ultimate Media Organizer Plus
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                          {t('about.version')}: {appVersion}
                      </p>
                      <p className="mt-2 text-gray-600 dark:text-gray-300">
                          {t('about.description')}
                      </p>
                  </div>
              </div>
          </Card>

          {/* Features */}
          <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <BiInfoCircle className="mr-2" />
                  {t('about.features')}
              </h2>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {t('about.featureList', { returnObjects: true }).map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                        <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                        <span>{feature}</span>
                    </li>
                  ))}
              </ul>
          </Card>

          {/* Third-Party Libraries */}
          <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <BiCodeAlt className="mr-2" />
                  {t('about.thirdParty')}
              </h2>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {t('about.libraries', { returnObjects: true }).map((library: string, index: number) => (
                    <li key={index} className="flex items-start">
                        <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
                        <span>{library}</span>
                    </li>
                  ))}
              </ul>
          </Card>

          {/* License and Support */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <BiBookContent className="mr-2" />
                      {t('about.license')}
                  </h2>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {t('about.licenseType')}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('about.developer')}: MEDIA MASTER Team
                  </p>
              </Card>

              <Card>
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <BiSupport className="mr-2" />
                      {t('about.contactSupport')}
                  </h2>

                  <div className="space-y-2">
                      <a
                        href="#"
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        onClick={(e) => {
                            e.preventDefault();
                            // Open external link or show contact info
                        }}
                      >
                          <BiLinkExternal className="mr-2" />
                          {t('about.reportIssue')}
                      </a>

                      <a
                        href="#"
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        onClick={(e) => {
                            e.preventDefault();
                            // Check for updates
                        }}
                      >
                          <BiGitBranch className="mr-2" />
                          {t('about.checkUpdates')}
                      </a>
                  </div>
              </Card>
          </div>

          {/* Encourage feedback */}
          <Card className="bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-800 text-center p-6">
              <BiLike className="inline-block text-blue-600 dark:text-blue-300 mb-2" size={32} />
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                  Thank you for using MEDIA MASTER - Ultimate Media Organizer Plus!
              </p>
              <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                  We hope it helps you organize your media files efficiently.
              </p>
          </Card>
      </div>
    );
};

export default AboutScreen;