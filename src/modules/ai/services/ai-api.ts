
interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface PendingAction {
  id: string;
  type: string;
  description: string;
  [key: string]: any;
}

export interface AIResponse {
  content: string;
  action?: 'query' | 'navigate' | 'text' | 'confirm_action';
  navigateTo?: string;
  pendingAction?: PendingAction;
}

// Получаем токен из localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export class AIService {
  private static readonly API_URL = `${import.meta.env.VITE_API_URL || ''}/ai/message`.replace(/([^:]\/)\/+/g, '$1');
  private static readonly CONFIRM_URL = `${import.meta.env.VITE_API_URL || ''}/ai/confirm`.replace(/([^:]\/)\/+/g, '$1');

  static async sendMessage(
    messages: any[],
    currentPage?: string,
    imageFile?: File,
    sessionId?: string,
  ): Promise<AIResponse> {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (imageFile) {
        const formData = new FormData();

        formData.append(
          'messages',
          JSON.stringify(
            messages.map((msg) => ({
              text: msg.text,
              sender: msg.sender === 'ai' || msg.sender === 'assistant' ? 'assistant' : 'user'
            })),
          ),
        );

        // formData.append('model', 'gemini-2.0-flash');

        if (currentPage) {
          formData.append('currentPage', currentPage);
        }

        if (sessionId) {
          formData.append('sessionId', sessionId);
        }

        formData.append('image', imageFile, imageFile.name);

        const response = await fetch(this.API_URL, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Требуется авторизация');
          }
          if (response.status === 403) {
            throw new Error('Доступ запрещён. Только для администраторов.');
          }
          throw new Error(
            `HTTP error! status: ${response.status}. ${response.statusText}`,
          );
        }

        const data: AIResponse = await response.json();
        return data;
      } else {
        headers['Content-Type'] = 'application/json';

        const requestData: any = {
          messages: messages.map((msg) => ({
            text: msg.text,
            sender: msg.sender === 'ai' || msg.sender === 'assistant' ? 'assistant' : 'user'
          }))
        };

        if (currentPage) {
          requestData.currentPage = currentPage;
        }

        if (sessionId) {
          requestData.sessionId = sessionId;
        }

        const response = await fetch(this.API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Требуется авторизация');
          }
          if (response.status === 403) {
            throw new Error('Доступ запрещён. Только для администраторов.');
          }
          throw new Error(
            `HTTP error! status: ${response.status}. ${response.statusText}`,
          );
        }

        const data: AIResponse = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error calling AI API through backend:', error);
      throw error;
    }
  }

  /**
   * Подтверждение действия (оплата, создание, обновление)
   */
  static async confirmAction(pendingAction: PendingAction): Promise<AIResponse> {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(this.CONFIRM_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ pendingAction }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AIResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error confirming action:', error);
      throw error;
    }
  }
}
