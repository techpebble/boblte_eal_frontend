import React from 'react';

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-[9999] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-blue-500"></div>
        <span className="text-white mt-4 text-lg font-semibold">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
