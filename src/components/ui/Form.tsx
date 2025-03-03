import React, { InputHTMLAttributes, SelectHTMLAttributes, LabelHTMLAttributes } from 'react';

// FormGroup
interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ children, className = '' }) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

// FormLabel
interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const FormLabel: React.FC<FormLabelProps> = ({ children, className = '', ...props }) => {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

// FormInput
interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Add any custom props here
}

export const FormInput: React.FC<FormInputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${className}`}
      {...props}
    />
  );
};

// FormSelect
interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({ children, className = '', ...props }) => {
  return (
    <select
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

// FormCheckbox
interface FormCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({ label, className = '', id, ...props }) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={id}
        className={`h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 dark:bg-gray-700 ${className}`}
        {...props}
      />
      {label && (
        <label htmlFor={id} className="ml-2 text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
    </div>
  );
};