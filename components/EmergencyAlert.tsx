import React from 'react';
import { ChatMessage, Language } from '../types';

interface EmergencyAlertProps {
    message: ChatMessage;
    language: Language;
}

const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ message, language }) => {
    const title = language === Language.EN ? 'EMERGENCY ALERT' : 'आपातकालीन चेतावनी';
    const callText = language === Language.EN ? 'Call 108 Immediately' : 'तुरंत 108 पर कॉल करें';
    const hospitalTitle = language === Language.EN ? 'Nearby Hospitals:' : 'आस-पास के अस्पताल:';
    const initialMessage = language === Language.EN ? 'Fetching hospital information...' : 'अस्पताल की जानकारी लाई जा रही है...';

    return (
        <div className="bg-red-100 dark:bg-red-900 border-2 border-red-500 dark:border-red-400 rounded-lg p-4 my-2 shadow-lg animate-pulse">
            <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400 mr-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">{title}</h2>
            </div>
            <p className="text-red-800 dark:text-red-200 mb-4 whitespace-pre-wrap">{message.content}</p>
            <div className="text-center mb-4">
                <a href="tel:108" className="inline-block px-6 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md">
                    {callText}
                </a>
            </div>
            <div className="mt-4 pt-4 border-t border-red-300 dark:border-red-700">
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">{hospitalTitle}</h3>
                <p className="text-red-800 dark:text-red-200 whitespace-pre-wrap">
                    {message.hospitalInfo || initialMessage}
                </p>
            </div>
        </div>
    );
};

export default EmergencyAlert;