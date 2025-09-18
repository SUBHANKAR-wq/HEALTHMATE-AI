
import React from 'react';
import { ChatMessage } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ChatBubbleProps {
    message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    const bubbleClasses = isUser
        ? 'bg-blue-600 text-white self-end'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start';
    
    const wrapperClasses = isUser ? 'flex justify-end' : 'flex justify-start';

    const renderContent = () => {
        if (isUser) {
            return <p className="whitespace-pre-wrap">{message.content}</p>;
        }
        
        // For bot messages, parse markdown and sanitize
        const rawMarkup = marked.parse(message.content, { async: false }) as string;
        const sanitizedMarkup = DOMPurify.sanitize(rawMarkup);
        
        return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedMarkup }} />;
    };

    return (
        <div className={wrapperClasses}>
            <div className={`max-w-md lg:max-w-xl px-4 py-3 rounded-2xl shadow-md ${bubbleClasses}`}>
                 {renderContent()}
            </div>
        </div>
    );
};

export default ChatBubble;
