/**
 * Сжимает изображение на стороне клиента перед отправкой на сервер.
 * @param base64Str Исходная строка в формате Base64
 * @param maxWidth Максимальная ширина изображения
 * @param maxHeight Максимальная высота изображения
 * @param quality Качество сжатия (0.0 to 1.0)
 * @returns Промис с сжатой строкой Base64
 */
export const compressImage = (
  base64Str: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Рассчитываем новые размеры
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Не удалось получить контекст canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Сжимаем в JPEG (наиболее эффективно для фото)
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    img.onerror = (error) => reject(error);
  });
};
