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
    if (!apiKey) return;

    const scriptId = 'yandex-map-script';
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.onload = () => {
      // @ts-ignore
      setYmaps(window.ymaps);
    };
    document.head.appendChild(script);

    return () => {
      if (document.getElementById(scriptId)) {
        document.head.removeChild(script);
      }
    };
  }, [apiKey]);

  // Инициализация карты
  useEffect(() => {
    if (!ymaps || !mapContainerRef.current) return;

    ymaps.ready(() => {
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
          strokeColor: '#0000FF',
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
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, [ymaps, center, radius, onCenterChange, onRadiusChange]);

  // Обновление радиуса круга
  useEffect(() => {
    if (circleRef.current) {
      const geometry = circleRef.current.geometry;
      const center = geometry.getCoordinates();
      geometry.setCoordinates([center, radius]);
    }
  }, [radius]);

  // Обновление центра круга
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