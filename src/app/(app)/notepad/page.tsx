import React from 'react';

const NotePadPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Note Pad</h1>
      <textarea
        className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Start writing your notes here..."
      ></textarea>
    </div>
  );
};

export default NotePadPage;