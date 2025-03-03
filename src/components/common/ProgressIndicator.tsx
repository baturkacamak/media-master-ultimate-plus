import React from 'react';
import { BiCheckCircle } from 'react-icons/bi';

interface ProgressIndicatorProps {
    percentage: number;
    isComplete?: boolean;
    showPercentage?: boolean;
    height?: number;
    color?: string;
    bgColor?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
                                                                 percentage,
                                                                 isComplete = false,
                                                                 showPercentage = true,
                                                                 height = 8,
                                                                 color = 'bg-blue-500',
                                                                 bgColor = 'bg-gray-200',
                                                             }) => {
    // Ensure percentage is between 0 and 100
    const validPercentage = Math.max(0, Math.min(100, percentage));

    return (
        <div className="w-full">
            <div className="relative">
                <div
                    className={`w-full rounded-full ${bgColor} dark:bg-gray-700`}
                    style={{ height: `${height}px` }}
                >
                    <div
                        className={`rounded-full transition-all duration-300 ease-in-out ${color} ${
                            isComplete ? 'bg-green-500' : color
                        }`}
                        style={{
                            width: `${validPercentage}%`,
                            height: `${height}px`,
                        }}
                    ></div>
                </div>

                {isComplete && (
                    <div className="absolute top-1/2 right-0 transform -translate-y-1/2 text-green-500 dark:text-green-400">
                        <BiCheckCircle size={20} />
                    </div>
                )}
            </div>

            {showPercentage && (
                <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>{isComplete ? 'Complete' : 'Progress'}</span>
                    <span>{Math.round(validPercentage)}%</span>
                </div>
            )}
        </div>
    );
};

export default ProgressIndicator;