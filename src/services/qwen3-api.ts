// Сервис для взаимодействия с Qwen3 через backend

interface ChatMessage {
  id: number;
  text: string;
 sender: 'user' | 'ai';
  timestamp: Date;
}

interface Qwen3Response {
  content: string;
}

export class Qwen3ApiService {
  private static readonly API_URL = `${process.env.REACT_APP_API_URL}/qwen3-chat/chat`;

  static async sendMessage(messages: ChatMessage[], currentPage?: string, imageFile?: File, sessionId?: string): Promise<string> {
    try {
      // Если есть изображение, используем FormData для отправки файла
      if (imageFile) {
        const formData = new FormData();
        
        // Добавляем сообщения
        formData.append('messages', JSON.stringify(messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString() // Преобразуем дату в строку для передачи
        }))));
        
        // Добавляем модель
        formData.append('model', 'qwen-vl-max'); // Используем модель с поддержкой визуального восприятия
        
        // Добавляем информацию о текущей странице
        if (currentPage) {
          formData.append('currentPage', currentPage);
        }
        
        // Добавляем sessionId, если он доступен
        if (sessionId) {
          formData.append('sessionId', sessionId);
        }
        
        // Добавляем файл изображения
        formData.append('image', imageFile, imageFile.name);

        const response = await fetch(this.API_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}. ${response.statusText}`);
        }

        const data: Qwen3Response = await response.json();
        return data.content || 'Не удалось получить ответ от ИИ.';
      } else {
        // Если изображения нет, используем старый метод с JSON
        const requestData: any = {
          messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString() // Преобразуем дату в строку для передачи
          })),
          model: 'qwen-plus'
        };
        
        // Добавляем информацию о текущей странице, если она предоставлена
        if (currentPage) {
          requestData.currentPage = currentPage;
        }
        
        // Добавляем sessionId, если он доступен
        if (sessionId) {
          requestData.sessionId = sessionId;
        }

        const response = await fetch(this.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}. ${response.statusText}`);
        }

        const data: Qwen3Response = await response.json();
        return data.content || 'Не удалось получить ответ от ИИ.';
      }
    } catch (error) {
      console.error('Error calling Qwen3 API through backend:', error);
      throw error; // Пробрасываем ошибку наверх для обработки в компоненте
    }
  }
}
