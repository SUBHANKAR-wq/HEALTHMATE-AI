import React from 'react';
import { Language } from '../types';

interface VoiceAssistantTogglerProps {
    isAssistantMode: boolean;
    onToggle: () => void;
    language: Language;
}

const VoiceAssistantToggler: React.FC<VoiceAssistantTogglerProps> = ({ isAssistantMode, onToggle, language }) => {
    const label = language === Language.EN ? 'Voice Assistant' : 'वॉइस असिस्टेंट';
    const ariaLabel = isAssistantMode 
        ? language === Language.EN ? "Disable Voice Assistant" : "वॉइस असिस्टेंट अक्षम करें"
        : language === Language.EN ? "Enable Voice Assistant" : "वॉइस असिस्टेंट सक्षम करें";

    return (
        <button 
            onClick={onToggle} 
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors flex items-center space-x-2 ${isAssistantMode ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-gray-500 hover:bg-gray-600'}`}
            aria-label={ariaLabel}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
            <span className="relative flex h-3 w-3">
                {isAssistantMode && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isAssistantMode ? 'bg-green-400' : 'bg-red-500'}`}></span>
            </span>
            <span>{label}</span>
        </button>
    );
};

export default VoiceAssistantToggler;