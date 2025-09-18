import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Language } from '../types';
import { SYSTEM_PROMPT_EN, SYSTEM_PROMPT_HI, SUMMARY_PROMPT_EN, SUMMARY_PROMPT_HI, TREND_ANALYSIS_PROMPT_EN, TREND_ANALYSIS_PROMPT_HI } from '../constants';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getErrorResponse = (language: Language) => {
    if (language === Language.EN) {
        return "Sorry, I encountered an error trying to process your request. Please check your connection or API key and try again.";
    } else {
        return "क्षमा करें, आपके अनुरोध को संसाधित करने का प्रयास करते समय मुझे एक त्रुटि हुई। कृपया अपना कनेक्शन या एपीआई कुंजी जांचें और पुनः प्रयास करें।";
    }
}

export const getHealthAdvice = async (symptoms: string, language: Language): Promise<string> => {
    try {
        const systemInstruction = language === Language.EN ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_HI;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: symptoms,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
                topP: 0.95,
                topK: 64,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return getErrorResponse(language);
    }
};

export const findNearbyHospitals = async (lat: number, lon: number, language: Language): Promise<string> => {
    const promptEN = `List up to 5 nearby hospitals or medical clinics based on this location: latitude ${lat}, longitude ${lon}. Provide just the names and a brief description or address. Do not add any conversational text before or after the list. Format the output clearly.`;
    const promptHI = `इस स्थान के आधार पर 5 आस-पास के अस्पतालों या चिकित्सा क्लीनिकों की सूची बनाएं: अक्षांश ${lat}, देशांतर ${lon}। केवल नाम और एक संक्षिप्त विवरण या पता प्रदान करें। सूची से पहले या बाद में कोई भी संवादात्मक पाठ न जोड़ें। आउटपुट को स्पष्ट रूप से प्रारूपित करें।`;
    const prompt = language === Language.EN ? promptEN : promptHI;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error finding hospitals:", error);
        if (language === Language.EN) {
            return "Sorry, I couldn't find hospitals at the moment. Please try again later.";
        } else {
            return "क्षमा करें, मैं अभी अस्पताल नहीं ढूंढ सका। कृपया बाद में दोबारा प्रयास करें।";
        }
    }
};

export const getSummaryFromImage = async (base64Data: string, mimeType: string, language: Language, textPrompt: string): Promise<string> => {
    try {
        const systemInstruction = language === Language.EN ? SUMMARY_PROMPT_EN : SUMMARY_PROMPT_HI;
        const defaultPrompt = language === Language.EN ? "Summarize this medical report." : "इस मेडिकल रिपोर्ट का सारांश दें।";

        const imagePart = {
            inlineData: {
                mimeType,
                data: base64Data,
            },
        };

        const textPart = {
            text: textPrompt || defaultPrompt,
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for summary:", error);
        return getErrorResponse(language);
    }
};

export const getTrendAnalysis = async (reports: Array<{ name: string; base64Data: string; mimeType: string }>, language: Language): Promise<string> => {
    try {
        const systemInstruction = language === Language.EN ? TREND_ANALYSIS_PROMPT_EN : TREND_ANALYSIS_PROMPT_HI;
        
        const textPart = {
            text: language === Language.EN 
                ? `Analyze the trends in the following ${reports.length} medical reports. The file names are: ${reports.map(r => r.name).join(', ')}`
                : `${reports.length} मेडिकल रिपोर्ट में ट्रेंड्स का विश्लेषण करें। फ़ाइल नाम हैं: ${reports.map(r => r.name).join(', ')}`
        };

        const imageParts = reports.map(report => ({
            inlineData: {
                mimeType: report.mimeType,
                data: report.base64Data,
            },
        }));

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, ...imageParts] },
            config: {
                systemInstruction,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for trend analysis:", error);
        return getErrorResponse(language);
    }
};