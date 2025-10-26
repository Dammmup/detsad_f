import React from 'react';
import { Typography, Box } from '@mui/material';
import { YMaps, Map, Circle, ZoomControl, GeolocationControl } from '@pbe/react-yandex-maps';

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

  const handleDragEnd = (e: any) => {
    const newCoords = e.get('target').geometry.getCoordinates();
    if (newCoords) {
      onCenterChange({ lat: newCoords[0], lng: newCoords[1] });
    }
  };

  const handleMapClick = (e: any) => {
    const coords = e.get('coords');
    if (coords) {
      onCenterChange({ lat: coords[0], lng: coords[1] });
    }
  };

  const handleRadiusSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      onRadiusChange(value);
    }
  };

  return (
    <YMaps query={{ apikey: apiKey, lang: 'ru_RU' }}>
      <Box>
        {!apiKey && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 1 }}>
            <Typography color="success.main">
              Используется API ключ из настроек сервера.
            </Typography>
          </Box>
        )}
        <Map
          state={{ center: [center.lat, center.lng], zoom: 15 }}
          style={{ width: '100%', height: 400, marginBottom: '16px', border: '1px solid #ccc' }}
          onClick={handleMapClick}
        >
          <Circle
            geometry={[[center.lat, center.lng], radius]}
            options={{
              draggable: true,
              fillColor: '#00FF00',
              fillOpacity: 0.3,
              strokeColor: '#00FF00',
              strokeOpacity: 0.8,
              strokeWidth: 2,
            }}
            onDragEnd={handleDragEnd}
          />
          <ZoomControl />
          <GeolocationControl />
        </Map>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography>Радиус (метры):</Typography>
          <input
            type="range"
            min="10"
            max="1000"
            value={radius}
            onChange={handleRadiusSliderChange}
            style={{ width: 200 }}
          />
          <Typography>{radius} м</Typography>
        </Box>
      </Box>
    </YMaps>
  );
};

export default YandexMap;