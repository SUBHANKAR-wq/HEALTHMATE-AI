import React, { useState, useRef, useEffect } from 'react';
import ChatBubble from './components/ChatBubble';
import LanguageSelector from './components/LanguageSelector';
import ThemeToggler from './components/ThemeToggler';
import Disclaimer from './components/Disclaimer';
import { getHealthAdvice, findNearbyHospitals, getSummaryFromImage } from './services/geminiService';
import { ChatMessage, Language } from './types';

const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState<Language>(Language.EN);
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const welcomeMessageEN = "Hello! I'm your AI health assistant. How can I help you today? You can ask about symptoms, find nearby hospitals, or upload a medical report for a summary.";
    const welcomeMessageHI = "नमस्ते! मैं आपका AI स्वास्थ्य सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ? आप लक्षणों के बारे में पूछ सकते हैं, आस-पास के अस्पताल ढूंढ सकते हैं, या सारांश के लिए मेडिकल रिपोर्ट अपलोड कर सकते हैं।";
    
    useEffect(() => {
        setMessages([{ role: 'bot', content: language === Language.EN ? welcomeMessageEN : welcomeMessageHI }]);
    }, [language]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const botResponse = await getHealthAdvice(input, language);
            setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
        } catch (error) {
            console.error(error);
            const errorMessage = language === Language.EN ? "Sorry, something went wrong." : "क्षमा करें, कुछ गलत हो गया।";
            setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindHospitals = () => {
        if (isLoading) return;
        const userMessageContent = language === Language.EN ? "Finding nearby hospitals..." : "आस-पास के अस्पताल ढूंढ रहा हूँ...";
        setMessages(prev => [...prev, { role: 'user', content: userMessageContent }]);
        setIsLoading(true);

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const hospitalList = await findNearbyHospitals(latitude, longitude, language);
                setMessages(prev => [...prev, { role: 'bot', content: hospitalList }]);
            } catch (error) {
                console.error(error);
                const errorMessage = language === Language.EN ? "Could not fetch hospital data." : "अस्पताल का डेटा प्राप्त नहीं हो सका।";
                setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
            } finally {
                setIsLoading(false);
            }
        }, (error) => {
            console.error("Geolocation error:", error);
            const errorMessage = language === Language.EN ? "Could not get your location. Please enable location services." : "आपका स्थान प्राप्त नहीं हो सका। कृपया स्थान सेवाएं सक्षम करें।";
            setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
            setIsLoading(false);
        });
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || isLoading) return;

        const userMessageContent = language === Language.EN ? `Analyzing report: ${file.name}` : `रिपोर्ट का विश्लेषण किया जा रहा है: ${file.name}`;
        setMessages(prev => [...prev, { role: 'user', content: userMessageContent }]);
        setIsLoading(true);

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const summary = await getSummaryFromImage(base64String, file.type, language, "");
                setMessages(prev => [...prev, { role: 'bot', content: summary }]);
                setIsLoading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error(error);
            const errorMessage = language === Language.EN ? "Failed to process the image." : "छवि को संसाधित करने में विफल।";
            setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
            setIsLoading(false);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
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
                {messages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
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
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={language === Language.EN ? "Describe your symptoms..." : "अपने लक्षण बताएं..."}
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition-colors"
                        disabled={isLoading || !input.trim()}
                        aria-label="Send message"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </form>
                <div className="flex justify-center space-x-2 mt-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button onClick={triggerFileUpload} disabled={isLoading} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-green-800 transition-colors">
                        {language === Language.EN ? 'Upload Report' : 'रिपोर्ट अपलोड करें'}
                    </button>
                    <button onClick={handleFindHospitals} disabled={isLoading} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 dark:disabled:bg-purple-800 transition-colors">
                        {language === Language.EN ? 'Find Hospitals' : 'अस्पताल खोजें'}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default App;
