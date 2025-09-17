
import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
    currentLanguage: Language;
    onLanguageChange: (language: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => {
    const inactiveClasses = "px-3 py-1 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors";
    const activeClasses = "px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md shadow";

    return (
        <div className="flex space-x-2">
            <button
                onClick={() => onLanguageChange(Language.EN)}
                className={currentLanguage === Language.EN ? activeClasses : inactiveClasses}
            >
                English
            </button>
            <button
                onClick={() => onLanguageChange(Language.HI)}
                className={currentLanguage === Language.HI ? activeClasses : inactiveClasses}
            >
                हिन्दी
            </button>
        </div>
    );
};

export default LanguageSelector;
