import { Language } from '../types';

const getErrorResponse = (language: Language) => {
    if (language === Language.EN) {
        return "Sorry, I encountered an error trying to process your request. Please check your connection and try again.";
    } else {
        return "क्षमा करें, आपके अनुरोध को संसाधित करने का प्रयास करते समय मुझे एक त्रुटि हुई। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।";
    }
}

const callApi = async (action: string, payload: any, language: Language): Promise<string> => {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
        });

        if (!response.ok) {
            console.error("API call failed:", response.status, await response.text());
            return getErrorResponse(language);
        }

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error(`Error calling API for action ${action}:`, error);
        return getErrorResponse(language);
    }
};

export const getHealthAdvice = async (symptoms: string, language: Language): Promise<string> => {
    return callApi('getHealthAdvice', { symptoms, language }, language);
};

export const findNearbyHospitals = async (lat: number, lon: number, language: Language): Promise<string> => {
    const result = await callApi('findNearbyHospitals', { lat, lon, language }, language);
    // Use a more specific error message if the API call itself fails, otherwise return result.
    if (result === getErrorResponse(language)) {
        if (language === Language.EN) {
            return "Sorry, I couldn't find hospitals at the moment. Please try again later.";
        } else {
            return "क्षमा करें, मैं अभी अस्पताल नहीं ढूंढ सका। कृपया बाद में दोबारा प्रयास करें।";
        }
    }
    return result;
};

export const getSummaryFromImage = async (base64Data: string, mimeType: string, language: Language, textPrompt: string): Promise<string> => {
    return callApi('getSummaryFromImage', { base64Data, mimeType, language, textPrompt }, language);
};

export const getTrendAnalysis = async (reports: Array<{ name: string; base64Data: string; mimeType: string }>, language: Language): Promise<string> => {
    return callApi('getTrendAnalysis', { reports, language }, language);
};
