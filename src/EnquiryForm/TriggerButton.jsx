import React from "react";
import { Send } from "lucide-react";

const TriggerButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-[9999] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 group"
    >

      
      <div className="relative">
        <Send size={24} />
      </div>

      <div className="absolute bottom-full right-0 mb-3 w-48 bg-white text-gray-800 text-sm rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="font-bold text-purple-600 mb-1">Request a quote</div>
        <div className="text-gray-600">Fill the details here</div>
        <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white"></div>
      </div>
    </button>
  );
};

export default TriggerButton;
