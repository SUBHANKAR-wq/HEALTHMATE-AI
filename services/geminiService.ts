import { Language } from '../types';

const getErrorResponse = (language: Language) => {
    if (language === Language.EN) {
        return "Sorry, I encountered an error trying to process your request. Please check your connection and try again.";
    } else {
        return "क्षमा करें, आपके अनुरोध को संसाधित करने का प्रयास करते समय मुझे एक त्रुटि हुई। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।";
    }
}

const callApi = async (action: string, payload: any, language: Language): Promise<{ success: boolean; data: string; }> => {
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
            return { success: false, data: getErrorResponse(language) };
        }

        const data = await response.json();
        if (data && typeof data.result === 'string') {
            return { success: true, data: data.result };
        } else {
            console.error("Invalid response format from API:", data);
            return { success: false, data: getErrorResponse(language) };
        }
    } catch (error) {
        console.error(`Error calling API for action ${action}:`, error);
        return { success: false, data: getErrorResponse(language) };
    }
};

export const getHealthAdvice = async (symptoms: string, language: Language): Promise<string> => {
    const response = await callApi('getHealthAdvice', { symptoms, language }, language);
    if (!response.success) {
        return language === Language.EN
            ? "Sorry, I couldn't provide health advice at the moment. Please try again."
            : "क्षमा करें, मैं अभी स्वास्थ्य सलाह नहीं दे सका। कृपया पुन: प्रयास करें।";
    }
    return response.data;
};

export const findNearbyHospitals = async (lat: number, lon: number, language: Language): Promise<string> => {
    const response = await callApi('findNearbyHospitals', { lat, lon, language }, language);
    if (!response.success) {
        return language === Language.EN
            ? "Sorry, I couldn't find hospitals at the moment. Please ensure location services are enabled and try again later."
            : "क्षमा करें, मैं अभी अस्पताल नहीं ढूंढ सका। कृपया सुनिश्चित करें कि स्थान सेवाएं सक्षम हैं और बाद में पुनः प्रयास करें।";
    }
    return response.data;
};

export const getSummaryFromImage = async (base64Data: string, mimeType: string, language: Language, textPrompt: string): Promise<string> => {
    const response = await callApi('getSummaryFromImage', { base64Data, mimeType, language, textPrompt }, language);
    if (!response.success) {
        return language === Language.EN
            ? "Sorry, I couldn't analyze the report. Please ensure the image is clear and try again."
            : "क्षमा करें, मैं रिपोर्ट का विश्लेषण नहीं कर सका। कृपया सुनिश्चित करें कि छवि स्पष्ट है और पुनः प्रयास करें।";
    }
    return response.data;
};

export const getTrendAnalysis = async (reports: Array<{ name: string; base64Data: string; mimeType: string }>, language: Language): Promise<string> => {
    const response = await callApi('getTrendAnalysis', { reports, language }, language);
    if (!response.success) {
        return language === Language.EN
            ? "Sorry, I couldn't perform the trend analysis. Please check the uploaded files and try again."
            : "क्षमा करें, मैं ट्रेंड विश्लेषण नहीं कर सका। कृपया अपलोड की गई फ़ाइलों की जांच करें और पुनः प्रयास करें।";
    }
    return response.data;
};
