
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Language } from '../types';
import { 
    SYSTEM_PROMPT_EN, SYSTEM_PROMPT_HI, 
    SUMMARY_PROMPT_EN, SUMMARY_PROMPT_HI, 
    TREND_ANALYSIS_PROMPT_EN, TREND_ANALYSIS_PROMPT_HI 
} from '../constants';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set");
        return res.status(500).json({ error: 'Server configuration error: API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const { action, payload } = req.body;

    try {
        let result: string;
        switch (action) {
            case 'getHealthAdvice': {
                const { symptoms, language } = payload;
                const systemInstruction = language === Language.EN ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_HI;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [{ text: symptoms }] },
                    config: {
                        systemInstruction: systemInstruction,
                        temperature: 0.5,
                        topP: 0.95,
                        topK: 64,
                    }
                });
                result = response.text;
                break;
            }
            case 'findNearbyHospitals': {
                const { lat, lon, language } = payload;
                const promptEN = `List up to 5 nearby hospitals or medical clinics based on this location: latitude ${lat}, longitude ${lon}. Provide just the names and a brief description or address. Do not add any conversational text before or after the list. Format the output clearly.`;
                const promptHI = `इस स्थान के आधार पर 5 आस-पास के अस्पतालों या चिकित्सा क्लीनिकों की सूची बनाएं: अक्षांश ${lat}, देशांतर ${lon}। केवल नाम और एक संक्षिप्त विवरण या पता प्रदान करें। सूची से पहले या बाद में कोई भी संवादात्मक पाठ न जोड़ें। आउटपुट को स्पष्ट रूप से प्रारूपित करें।`;
                const prompt = language === Language.EN ? promptEN : promptHI;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [{ text: prompt }] },
                    config: {
                        temperature: 0.3,
                    }
                });
                result = response.text;
                break;
            }
            case 'getSummaryFromImage': {
                const { base64Data, mimeType, language, textPrompt } = payload;
                const systemInstruction = language === Language.EN ? SUMMARY_PROMPT_EN : SUMMARY_PROMPT_HI;
                const defaultPrompt = language === Language.EN ? "Summarize this medical report." : "इस मेडिकल रिपोर्ट का सारांश दें।";
                const imagePart = { inlineData: { mimeType, data: base64Data } };
                const textPart = { text: textPrompt || defaultPrompt };
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [imagePart, textPart] },
                    config: { systemInstruction }
                });
                result = response.text;
                break;
            }
            case 'getTrendAnalysis': {
                const { reports, language } = payload;
                const systemInstruction = language === Language.EN ? TREND_ANALYSIS_PROMPT_EN : TREND_ANALYSIS_PROMPT_HI;
                const textPart = {
                    text: language === Language.EN 
                        ? `Analyze the trends in the following ${reports.length} medical reports. The file names are: ${reports.map((r: any) => r.name).join(', ')}`
                        : `${reports.length} मेडिकल रिपोर्ट में ट्रेंड्स का विश्लेषण करें। फ़ाइल नाम हैं: ${reports.map((r: any) => r.name).join(', ')}`
                };
                const imageParts = reports.map((report: any) => ({
                    inlineData: {
                        mimeType: report.mimeType,
                        data: report.base64Data,
                    },
                }));
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [textPart, ...imageParts] },
                    config: { systemInstruction }
                });
                result = response.text;
                break;
            }
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
        res.status(200).json({ result });
    } catch (error) {
        console.error(`Error in action "${action}":`, error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}
