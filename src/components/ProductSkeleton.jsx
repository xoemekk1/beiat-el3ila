import React from 'react';

const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full flex flex-col">
      <div className="aspect-[4/5] bg-gray-200 animate-pulse w-full relative">
        <div className="absolute top-3 right-3 w-12 h-6 bg-gray-300 rounded-md"></div>
      </div>
      <div className="p-4 flex flex-col flex-grow space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="flex gap-1">
            <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
            <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
            <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
            <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
            <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
        </div>

        <div className="mt-auto flex justify-between items-center pt-2">
            <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;