import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
  <div
    className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden"
    role="progressbar"
    aria-valuenow={progress}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label="File processing progress"
  >
    <div
      className="bg-brand-secondary h-full rounded-full transition-all duration-300 ease-linear flex items-center justify-center text-white text-xs font-bold"
      style={{ width: `${progress}%` }}
    >
      {progress > 10 && `${progress}%`}
    </div>
  </div>
);

export default ProgressBar;
