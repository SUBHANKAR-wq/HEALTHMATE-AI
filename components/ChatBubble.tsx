
import React from 'react';
import { ChatMessage } from '../types';

interface ChatBubbleProps {
    message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    const bubbleClasses = isUser
        ? 'bg-blue-600 text-white self-end'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start';
    
    const wrapperClasses = isUser ? 'flex justify-end' : 'flex justify-start';

    return (
        <div className={wrapperClasses}>
            <div className={`max-w-md lg:max-w-xl px-4 py-3 rounded-2xl shadow-md ${bubbleClasses}`}>
                 <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
};

export default ChatBubble;
