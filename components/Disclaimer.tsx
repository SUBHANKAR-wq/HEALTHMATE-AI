
import React from 'react';
import { Language } from '../types';

interface DisclaimerProps {
    language: Language;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ language }) => {
    const text = language === Language.EN 
        ? "This is for informational purposes only and is not a substitute for professional medical advice."
        : "यह केवल सूचनात्मक उद्देश्यों के लिए है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है।";

    return (
        <p className="px-4 pb-2 text-xs text-center text-gray-500 dark:text-gray-400">
            {text}
        </p>
    );
};

export default Disclaimer;
