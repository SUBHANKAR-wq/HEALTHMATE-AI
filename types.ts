export enum Language {
  EN = 'en',
  HI = 'hi',
}

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  type?: 'emergency';
  hospitalInfo?: string;
}