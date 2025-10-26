import React, { useEffect, useRef, useState } from 'react';
import { Typography, Box } from '@mui/material';

interface YandexMapProps {
  center: { lat: number; lng: number };
  radius: number;
  onRadiusChange: (radius: number) => void;
  onCenterChange: (center: { lat: number; lng: number }) => void;
  apiKey: string;
}

const YandexMap: React.FC<YandexMapProps> = ({ 
  center, 
  radius, 
  onRadiusChange, 
  onCenterChange,
  apiKey
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [ymaps, setYmaps] = useState<any>(null);

  // Загрузка API Яндекс.Карт
  useEffect(() => {
    // Загружаем карту даже если API ключ пустой - в этом случае будет использоваться ключ из переменной окружения бэкенда
    console.log('Попытка загрузки Яндекс.Карт с API-ключом:', apiKey);
    
    const scriptId = 'yandex-map-script';
    // Удаляем существующий скрипт, если он есть
    if (document.getElementById(scriptId)) {
      const existingScript = document.getElementById(scriptId);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    }

    // Если apiKey пустой, будем использовать ключ из бэкенд-переменной окружения
    const apiParam = apiKey ? `?apikey=${apiKey}&` : '?';
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://api-maps.yandex.ru/2.1/${apiParam}lang=ru_RU`;
    script.onload = () => {
      console.log('Скрипт Яндекс.Карт загружен');
      // @ts-ignore
      setYmaps(window.ymaps);
    };
    script.onerror = () => {
      console.error('Ошибка загрузки скрипта Яндекс.Карт');
    };
    document.head.appendChild(script);

    return () => {
      // Очищаем карту при размонтировании компонента
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      circleRef.current = null;
      setYmaps(null);
      // Удаляем скрипт при размонтировании компонента
      if (document.getElementById(scriptId)) {
        const scriptElement = document.getElementById(scriptId);
        if (scriptElement && scriptElement.parentNode) {
          scriptElement.parentNode.removeChild(scriptElement);
        }
      }
    };
  }, [apiKey]);

  // Инициализация карты
  useEffect(() => {
    console.log('Инициализация карты, ymaps:', ymaps, 'mapContainerRef.current:', mapContainerRef.current, 'mapInstanceRef.current:', mapInstanceRef.current);
    
    if (!ymaps || !mapContainerRef.current || mapInstanceRef.current) return;

    ymaps.ready(() => {
      console.log('Yandex Maps API готов к использованию');
      
      // Проверяем, что контейнер еще существует
      if (!mapContainerRef.current) return;
      
      // @ts-ignore
      const map = new window.ymaps.Map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: 15,
        controls: ['zoomControl', 'geolocationControl']
      });

      // Создаем круг для отображения радиуса
      // @ts-ignore
      const circle = new window.ymaps.Circle(
        [[center.lat, center.lng], radius],
        {},
        {
          draggable: true,
          fillColor: '#00FF00',
          fillOpacity: 0.3,
          strokeColor: '#00FF00',
          strokeOpacity: 0.8,
          strokeWidth: 2
        }
      );

      // Обработчик перетаскивания круга
      circle.events.add('dragend', () => {
        const newCenter = circle.geometry.getCoordinates();
        onCenterChange({ lat: newCenter[0], lng: newCenter[1] });
      });

      // Добавляем круг на карту
      map.geoObjects.add(circle);
      
      // Сохраняем ссылки на объекты
      mapInstanceRef.current = map;
      circleRef.current = circle;

      // Обработчик клика по карте для изменения центра
      map.events.add('click', (e: any) => {
        const coords = e.get('coords');
        circle.geometry.setCoordinates(coords);
        onCenterChange({ lat: coords[0], lng: coords[1] });
      });
      
      console.log('Карта инициализирована и добавлена в DOM');
    });

    return () => {
      if (mapInstanceRef.current) {
        console.log('Уничтожение экземпляра карты');
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [ymaps, center, radius, onCenterChange]);

  // Обновление радиуса и центра круга
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.geometry.setCoordinates([[center.lat, center.lng], radius]);
    }
  }, [center, radius]);

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      onRadiusChange(value);
    }
  };

  return (
    <Box>
      {!apiKey && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 1 }}>
          <Typography color="success.main">
            Используется API ключ из настроек сервера.
          </Typography>
        </Box>
      )}
      <Box
        ref={mapContainerRef}
        sx={{ width: '100%', height: 400, mb: 2, border: '1px solid #ccc' }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>Радиус (метры):</Typography>
        <input
          type="range"
          min="10"
          max="1000"
          value={radius}
          onChange={handleRadiusChange}
          style={{ width: 200 }}
        />
        <Typography>{radius} м</Typography>
      </Box>
    </Box>
  );
};

export default YandexMap;