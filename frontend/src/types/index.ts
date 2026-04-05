export type ChatPath = 'news' | 'trends' | 'projects' | 'followup';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  isLoading?: boolean;
}
