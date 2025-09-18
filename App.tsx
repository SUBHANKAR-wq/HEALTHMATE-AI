import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatBubble from './components/ChatBubble';
import LanguageSelector from './components/LanguageSelector';
import ThemeToggler from './components/ThemeToggler';
import Disclaimer from './components/Disclaimer';
import EmergencyAlert from './components/EmergencyAlert';
import VoiceAssistantToggler from './components/VoiceAssistantToggler';
import { getHealthAdvice, findNearbyHospitals, getSummaryFromImage, getTrendAnalysis } from './services/geminiService';
import { ChatMessage, Language } from './types';

interface UploadedReport {
    name: string;
    base64Data: string;
    mimeType: string;
}

const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState<Language>(Language.EN);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [uploadedReports, setUploadedReports] = useState<UploadedReport[]>([]);
    const [isAssistantMode, setIsAssistantMode] = useState(false);
    const [autoSubmitTranscript, setAutoSubmitTranscript] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const speechRecognitionRef = useRef<any>(null);
    const stopRecognitionByUserRef = useRef(false);

    const welcomeMessageEN = "Hello! I'm your AI health assistant. How can I help you today? You can ask about symptoms, find nearby hospitals, or upload a medical report for a summary.";
    const welcomeMessageHI = "नमस्ते! मैं आपका AI स्वास्थ्य सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ? आप लक्षणों के बारे में पूछ सकते हैं, आस-पास के अस्पताल ढूंढ सकते हैं, या सारांश के लिए मेडिकल रिपोर्ट अपलोड कर सकते हैं।";
    
    useEffect(() => {
        setMessages([{ role: 'bot', content: language === Language.EN ? welcomeMessageEN : welcomeMessageHI }]);
    }, [language]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleToggleRecording = useCallback(() => {
        // If the assistant is speaking, cancel it before doing anything else.
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    
        const recognition = speechRecognitionRef.current;
        if (!recognition) return;
    
        if (isRecording) {
            stopRecognitionByUserRef.current = true;
            recognition.stop();
        } else {
            setInput('');
            recognition.lang = language === Language.EN ? 'en-US' : 'hi-IN';
            recognition.start();
            setIsRecording(true);
        }
    }, [isRecording, language]);

    const speak = useCallback((text: string) => {
        if (!isAssistantMode) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === Language.EN ? 'en-US' : 'hi-IN';
        
        utterance.onend = () => {
            if (isAssistantMode) {
                handleToggleRecording();
            }
        };

        window.speechSynthesis.speak(utterance);
    }, [isAssistantMode, language, handleToggleRecording]);

    const fetchHospitals = useCallback(async (): Promise<string> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                const errorMessage = language === Language.EN ? "Geolocation is not supported by your browser." : "जियोलोकेशन आपके ब्राउज़र द्वारा समर्थित नहीं है।";
                resolve(errorMessage);
                return;
            }

            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const hospitalList = await findNearbyHospitals(latitude, longitude, language);
                    resolve(hospitalList);
                } catch (error) {
                    console.error(error);
                    const errorMessage = language === Language.EN ? "Could not fetch hospital data." : "अस्पताल का डेटा प्राप्त नहीं हो सका।";
                    resolve(errorMessage);
                }
            }, (error) => {
                console.error("Geolocation error:", error);
                const errorMessage = language === Language.EN ? "Could not get your location. Please enable location services." : "आपका स्थान प्राप्त नहीं हो सका। कृपया स्थान सेवाएं सक्षम करें।";
                resolve(errorMessage);
            });
        });
    }, [language]);

    const handleSendMessage = useCallback(async (messageContent: string) => {
        if (!messageContent.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: messageContent };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const botResponse = await getHealthAdvice(messageContent, language);
            const isEmergency = botResponse.startsWith('**Category (Emergency)**') || botResponse.startsWith('**श्रेणी (आपातकालीन)**');

            if (isEmergency) {
                const hospitalList = await fetchHospitals();
                const emergencyMessage: ChatMessage = { role: 'bot', content: botResponse, type: 'emergency', hospitalInfo: hospitalList };
                setMessages(prev => [...prev, emergencyMessage]);
                speak(botResponse);
            } else {
                setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
                speak(botResponse);
            }
        } catch (error) {
            console.error(error);
            const errorMessage = language === Language.EN ? "Sorry, something went wrong." : "क्षमा करें, कुछ गलत हो गया।";
            setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
            speak(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, language, fetchHospitals, speak]);

    // Effect to setup speech recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language === Language.EN ? 'en-US' : 'hi-IN';
        speechRecognitionRef.current = recognition;

        let finalTranscript = '';
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
            finalTranscript = transcript;
            setInput(transcript);
        };

        recognition.onend = () => {
            setIsRecording(false);
            if (!stopRecognitionByUserRef.current && finalTranscript.trim()) {
                setAutoSubmitTranscript(finalTranscript);
            }
            stopRecognitionByUserRef.current = false;
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
        };

        return () => {
            recognition.abort();
        };
    }, [language]);

    // Effect to handle auto-submission from voice input
    useEffect(() => {
        if (autoSubmitTranscript) {
            handleSendMessage(autoSubmitTranscript);
            setAutoSubmitTranscript(null);
        }
    }, [autoSubmitTranscript, handleSendMessage]);

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSendMessage(input);
    };

    const handleFindHospitals = async () => {
        if (isLoading) return;
        const userMessageContent = language === Language.EN ? "Finding nearby hospitals..." : "आस-पास के अस्पताल ढूंढ रहा हूँ...";
        setMessages(prev => [...prev, { role: 'user', content: userMessageContent }]);
        setIsLoading(true);
        
        const hospitalList = await fetchHospitals();
        setMessages(prev => [...prev, { role: 'bot', content: hospitalList }]);
        setIsLoading(false);
        speak(hospitalList);
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || isLoading) return;
    
        setIsLoading(true);
        const userMessageContent = language === Language.EN ? `Uploading ${files.length} report(s)...` : `${files.length} रिपोर्ट अपलोड हो रही हैं...`;
        setMessages(prev => [...prev, { role: 'user', content: userMessageContent }]);
    
        try {
            const filePromises = Array.from(files).map(file => {
                return new Promise<UploadedReport>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        if (typeof reader.result === 'string') {
                            resolve({ name: file.name, base64Data: reader.result.split(',')[1], mimeType: file.type });
                        } else {
                            reject(new Error('Failed to read file.'));
                        }
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(file);
                });
            });
    
            const newReports = await Promise.all(filePromises);
            setUploadedReports(prev => [...prev, ...newReports]);
    
            const botMessageContent = language === Language.EN ? `${files.length} report(s) uploaded. Add more or click 'Analyze'.` : `${files.length} रिपोर्ट सफलतापूर्वक अपलोड हो गईं। और अपलोड करें या 'विश्लेषण करें' पर क्लिक करें।`;
            setMessages(prev => [...prev, { role: 'bot', content: botMessageContent }]);
            speak(botMessageContent);
        } catch (error) {
            console.error(error);
            const errorMessage = language === Language.EN ? "Failed to process files." : "फ़ाइलों को संसाधित करने में विफल।";
            setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
            speak(errorMessage);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleAnalyzeReports = async () => {
        if (uploadedReports.length === 0 || isLoading) return;
    
        let userMessageContent = uploadedReports.length === 1 
            ? language === Language.EN ? `Summarizing report: ${uploadedReports[0].name}` : `रिपोर्ट का सारांश दिया जा रहा है: ${uploadedReports[0].name}`
            : language === Language.EN ? `Analyzing trends for ${uploadedReports.length} reports...` : `${uploadedReports.length} रिपोर्ट के लिए ट्रेंड्स का विश्लेषण किया जा रहा है...`;
    
        setMessages(prev => [...prev, { role: 'user', content: userMessageContent }]);
        setIsLoading(true);
    
        try {
            let analysisResult: string;
            if (uploadedReports.length === 1) {
                const report = uploadedReports[0];
                analysisResult = await getSummaryFromImage(report.base64Data, report.mimeType, language, "");
            } else {
                analysisResult = await getTrendAnalysis(uploadedReports, language);
            }
            setMessages(prev => [...prev, { role: 'bot', content: analysisResult }]);
            speak(analysisResult);
        } catch (error) {
            console.error(error);
            const errorMessage = language === Language.EN ? "Failed to analyze reports." : "रिपोर्ट का विश्लेषण करने में विफल।";
            setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
            speak(errorMessage);
        } finally {
            setIsLoading(false);
            setUploadedReports([]);
        }
    };
    
    const triggerFileUpload = () => fileInputRef.current?.click();
    const handleLanguageChange = (lang: Language) => setLanguage(lang);

    const handleToggleAssistantMode = () => {
        const newMode = !isAssistantMode;
        setIsAssistantMode(newMode);

        if (!newMode) {
            window.speechSynthesis.cancel();
            if (isRecording) {
                stopRecognitionByUserRef.current = true;
                speechRecognitionRef.current.stop();
            }
        } else {
            const welcomeText = language === Language.EN 
                ? "Voice Assistant mode enabled. How can I help you?" 
                : "वॉइस असिस्टेंट मोड सक्षम हो गया है। मैं आपकी कैसे मदद कर सकती हूँ?";
            const utterance = new SpeechSynthesisUtterance(welcomeText);
            utterance.lang = language === Language.EN ? 'en-US' : 'hi-IN';
            // When the welcome message finishes, start listening.
            utterance.onend = () => {
                setTimeout(() => handleToggleRecording(), 100);
            };
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
            <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">AI Health Assistant</h1>
                <div className="flex items-center space-x-4">
                    <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
                    <ThemeToggler />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => msg.type === 'emergency' 
                    ? <EmergencyAlert key={index} message={msg} language={language} /> 
                    : <ChatBubble key={index} message={msg} />
                )}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start px-4 py-3 rounded-2xl shadow-md">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </main>

            <footer className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
                <Disclaimer language={language} />
                <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={language === Language.EN ? "Describe your symptoms..." : "अपने लक्षण बताएं..."}
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={handleToggleRecording}
                        className={`p-3 rounded-lg transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-gray-500 hover:bg-gray-600'} text-white disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed`}
                        disabled={isLoading || !speechRecognitionRef.current}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                    </button>
                    <button
                        type="submit"
                        className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition-colors"
                        disabled={isLoading || !input.trim()}
                        aria-label="Send message"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </form>

                {uploadedReports.length > 0 && (
                    <div className="my-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-sm font-semibold text-center mb-1">{language === Language.EN ? 'Staged Reports for Analysis' : 'विश्लेषण के लिए रिपोर्ट'}</h4>
                        <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 max-h-24 overflow-y-auto">
                            {uploadedReports.map((report, index) => (
                                <li key={index} className="truncate bg-gray-100 dark:bg-gray-700 p-1 rounded">
                                    {report.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex flex-wrap justify-center items-center gap-2 mt-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple />
                    <button onClick={triggerFileUpload} disabled={isLoading} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-green-800 transition-colors">
                        {language === Language.EN ? 'Upload Report(s)' : 'रिपोर्ट अपलोड करें'}
                    </button>
                    {uploadedReports.length > 0 && (
                        <>
                            <button onClick={handleAnalyzeReports} disabled={isLoading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 transition-colors">
                                {language === Language.EN ? `Analyze ${uploadedReports.length} Report(s)` : `${uploadedReports.length} रिपोर्ट का विश्लेषण करें`}
                            </button>
                            <button onClick={() => setUploadedReports([])} disabled={isLoading} className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors">
                                {language === Language.EN ? 'Clear' : 'साफ़ करें'}
                            </button>
                        </>
                    )}
                    <button onClick={handleFindHospitals} disabled={isLoading} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 dark:disabled:bg-purple-800 transition-colors">
                        {language === Language.EN ? 'Find Hospitals' : 'अस्पताल खोजें'}
                    </button>
                    <VoiceAssistantToggler
                        isAssistantMode={isAssistantMode}
                        onToggle={handleToggleAssistantMode}
                        language={language}
                    />
                </div>
            </footer>
        </div>
    );
};

export default App;