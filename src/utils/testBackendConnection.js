/**
 * Тестирование подключения к бэкенду
 * Проверяет доступность API и настройки CORS
 */

const testBackendConnection = async () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
  
  console.log('🔍 Тестирование подключения к бэкенду...');
  console.log(`🔄 URL API: ${API_URL}`);
  
  try {
    // Проверка доступности эндпоинта
    console.log('\n1. Проверка доступности эндпоинта...');
    const response = await fetch(API_URL);
    
    console.log(`✅ Статус ответа: ${response.status} ${response.statusText}`);
    
    // Проверка CORS
    console.log('\n2. Проверка CORS...');
    const corsHeaders = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('access-control')) {
        corsHeaders[key] = value;
      }
    });
    
    if (Object.keys(corsHeaders).length > 0) {
      console.log('✅ Найдены CORS заголовки:', corsHeaders);
    } else {
      console.warn('⚠️ CORS заголовки не найдены. Это может вызвать проблемы с кросс-доменными запросами.');
    }
    
    // Проверка доступности эндпоинтов API
    console.log('\n3. Проверка доступности эндпоинтов API...');
    
    const endpoints = [
      { name: 'Пользователи', path: '/users' },
      { name: 'Курсы (Группы)', path: '/groups' },
      { name: 'Роли пользователей', path: '/users/roles' },
      { name: 'Преподаватели', path: '/users/teachers' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const endpointResponse = await fetch(`${API_URL}${endpoint.path}`);
        console.log(`   ${endpoint.name} (${endpoint.path}): ${endpointResponse.status} ${endpointResponse.statusText}`);
      } catch (error) {
        console.error(`   ❌ Ошибка при проверке ${endpoint.name}:`, error.message);
      }
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n✅ Проверка завершена.');
    
  } catch (error) {
    console.error('\n❌ Ошибка при подключении к бэкенду:', error.message);
    console.log('\nВозможные причины:');
    console.log('1. Бэкенд не запущен');
    console.log('2. Неправильный URL API в настройках');
    console.log('3. Проблемы с CORS на стороне сервера');
    console.log('4. Проблемы с сетевым подключением');
    console.log('\nРекомендации:');
    console.log('1. Убедитесь, что бэкенд запущен и доступен по указанному адресу');
    console.log(`2. Проверьте настройки CORS на бэкенде (должны быть разрешены запросы с ${window.location.origin})`);
    console.log('3. Проверьте настройки прокси в package.json или конфигурации веб-сервера');
  }
};

// Экспортируем функцию для использования в консоли браузера
if (typeof window !== 'undefined') {
  window.testBackendConnection = testBackendConnection;
}

export default testBackendConnection;
