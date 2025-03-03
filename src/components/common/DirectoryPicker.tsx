import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FormGroup, FormLabel, FormInput } from '../ui';

interface DirectoryPickerProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBrowse: () => void;
  icon?: ReactNode;
  error?: string;
}

const DirectoryPicker: React.FC<DirectoryPickerProps> = ({
                                                           label,
                                                           placeholder,
                                                           value,
                                                           onChange,
                                                           onBrowse,
                                                           icon,
                                                           error,
                                                         }) => {
  const { t } = useTranslation();

  return (
    <FormGroup>
      <FormLabel>{label}</FormLabel>
      <div className="flex">
        <div className="relative flex-grow">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
              {icon}
            </div>
          )}
          <FormInput
            type="text"
            className={`${icon ? 'pl-10' : 'pl-3'} ${error ? 'border-red-500' : ''}`}
            placeholder={placeholder || label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={onBrowse}
        >
          {t('common.browse')}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </FormGroup>
  );
};

export default DirectoryPicker;