
interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface PendingAction {
  id: string;
  type: string;
  description: string;
  [key: string]: any;
}

export interface Qwen3Response {
  content: string;
  action?: 'query' | 'navigate' | 'text' | 'confirm_action';
  navigateTo?: string;
  pendingAction?: PendingAction;
}

// Получаем токен из localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export class Qwen3ApiService {
  private static readonly API_URL = `${import.meta.env.VITE_API_URL || ''}/qwen3-chat/chat`.replace(/([^:]\/)\/+/g, '$1');
  private static readonly CONFIRM_URL = `${import.meta.env.VITE_API_URL || ''}/qwen3-chat/confirm`.replace(/([^:]\/)\/+/g, '$1');

  static async sendMessage(
    messages: ChatMessage[],
    currentPage?: string,
    imageFile?: File,
    sessionId?: string,
  ): Promise<Qwen3Response> {
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
              ...msg,
              timestamp: msg.timestamp.toISOString(),
            })),
          ),
        );

        formData.append('model', 'qwen-vl-max');

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

        const data: Qwen3Response = await response.json();
        return data;
      } else {
        headers['Content-Type'] = 'application/json';

        const requestData: any = {
          messages: messages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
          model: 'qwen-plus',
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

        const data: Qwen3Response = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error calling Qwen3 API through backend:', error);
      throw error;
    }
  }

  /**
   * Подтверждение действия (оплата, создание, обновление)
   */
  static async confirmAction(pendingAction: PendingAction): Promise<Qwen3Response> {
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

      const data: Qwen3Response = await response.json();
      return data;
    } catch (error) {
      console.error('Error confirming action:', error);
      throw error;
    }
  }
}
