// Функция для сбора состояния интерфейса
export const collectUIState = (): any => {
  try {
    // Собираем видимый текст на странице
    const visibleElements = document.querySelectorAll('body *:not(script):not(style):not(meta):not(link):not(title)');
    let visibleText = '';
    
    visibleElements.forEach(element => {
      if (element.nodeType === Node.TEXT_NODE) {
        const text = element.textContent?.trim();
        if (text) visibleText += text + ' ';
      } else if (element.nodeType === Node.ELEMENT_NODE) {
        const text = element.textContent?.trim();
        if (text && element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE') {
          visibleText += text + ' ';
        }
      }
    });
    
    // Ограничиваем длину текста до 5000 символов
    visibleText = visibleText.substring(0, 5000);
    
    // Собираем информацию о компонентах
    const componentsState = {
      activeRoute: window.location.pathname,
      title: document.title,
      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth
      },
      window: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      // Собираем информацию о текущем пользователе из localStorage или API
      currentUser: (() => {
        try {
          const userData = localStorage.getItem('currentUser');
          if (userData) {
            return JSON.parse(userData);
          }
          return null;
        } catch (e) {
          console.warn('Could not parse currentUser from localStorage:', e);
          return null;
        }
      })()
    };
    
    // Ищем возможные ошибки в интерфейсе
    const errors: string[] = [];
    
    // Проверяем наличие элементов с классами ошибок
    const errorElements = document.querySelectorAll('.error, .alert, .warning, .danger, .invalid');
    errorElements.forEach(el => {
      const elementText = el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('title') || '';
      if (elementText) {
        errors.push(`UI Error: ${elementText}`);
      }
    });
    
    // Проверяем наличие элементов с атрибутами ошибок
    const invalidElements = document.querySelectorAll('[aria-invalid="true"], [data-error], [data-invalid]');
    invalidElements.forEach(el => {
      const errorText = el.getAttribute('data-error') || el.getAttribute('data-invalid') || el.getAttribute('aria-errormessage') || '';
      if (errorText) {
        errors.push(`Invalid element: ${errorText}`);
      }
    });
    
    // Собираем данные из localStorage и sessionStorage
    const localStorageData: any = {};
    const sessionStorageData: any = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          localStorageData[key] = localStorage.getItem(key);
        }
      }
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          sessionStorageData[key] = sessionStorage.getItem(key);
        }
      }
    } catch (e) {
      // Игнорируем ошибки доступа к хранилищу
      console.warn('Could not access localStorage or sessionStorage:', e);
    }
    
    // Собираем информацию о DOM для анализа
    const domSnapshot = {
      url: window.location.href,
      route: window.location.pathname,
      timestamp: new Date().toISOString(),
      elementCount: document.querySelectorAll('*').length,
      formElements: document.querySelectorAll('input, textarea, select').length,
      buttonElements: document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]').length,
      linkElements: document.querySelectorAll('a').length,
      headings: {
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length,
        h4: document.querySelectorAll('h4').length,
        h5: document.querySelectorAll('h5').length,
        h6: document.querySelectorAll('h6').length
      }
    };
    
    return {
      visibleText,
      componentsState,
      errors,
      localStorageData,
      sessionStorageData,
      domSnapshot
    };
  } catch (error) {
    console.error('Ошибка при сборе состояния UI:', error);
    return {
      visibleText: '',
      componentsState: { activeRoute: window.location.pathname, url: window.location.href },
      errors: [`Ошибка сбора состояния UI: ${error}`],
      localStorageData: {},
      sessionStorageData: {},
      domSnapshot: { url: window.location.href, route: window.location.pathname, timestamp: new Date().toISOString() }
    };
  }
};

// Функция для отправки состояния UI на бэкенд
export const sendUIState = async (sessionId: string, userId?: string) => {
  try {
    const uiState = collectUIState();
    
    // Получаем информацию о текущем пользователе через API
    let currentUser = uiState.componentsState.currentUser;
    if (!currentUser) {
      try {
        const currentUserResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/current-user`, {
          method: 'GET',
         // Включаем cookies для передачи токена аутентификации
        });
        
        if (currentUserResponse.ok) {
          currentUser = await currentUserResponse.json();
        }
      } catch (error) {
        console.warn('Не удалось получить информацию о текущем пользователе:', error);
      }
    }
    
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ui-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        sessionId,
        url: uiState.componentsState.url,
        route: uiState.componentsState.activeRoute,
        visibleText: uiState.visibleText,
        componentsState: {
          ...uiState.componentsState,
          currentUser
        },
        errors: uiState.errors,
        localStorageData: uiState.localStorageData,
        sessionStorageData: uiState.sessionStorageData,
        domSnapshot: uiState.domSnapshot
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при отправке состояния UI:', error);
    // Не выбрасываем ошибку, чтобы не нарушать работу приложения
    return null;
  }
};

// Функция для инициализации автоматического сбора состояния UI
export const initUIStateCollector = (sessionId: string, userId?: string) => {
  // Отправляем состояние UI при загрузке страницы
  // sendUIState(sessionId, userId);
  
  // Отправляем состояние UI каждые 15 секунд
  // const intervalId = setInterval(() => {
  //   sendUIState(sessionId, userId);
  // }, 10000); // 15 секунд
  
  // Отправляем состояние UI при изменении URL (навигации)
  // let currentPath = window.location.pathname;
  // const handleUrlChange = () => {
  //   if (window.location.pathname !== currentPath) {
  //     currentPath = window.location.pathname;
  //     sendUIState(sessionId, userId);
  //   }
  // };
  
  // Наблюдаем за изменениями URL
  // const originalPushState = window.history.pushState;
  // const originalReplaceState = window.history.replaceState;
  
  // window.history.pushState = function (...args: [data: any, unused: string, url?: string | URL | null]) {
  //   originalPushState.apply(this, args);
  //   handleUrlChange();
  // };
  
  // window.history.replaceState = function (...args: [data: any, unused: string, url?: string | URL | null]) {
  //   originalReplaceState.apply(this, args);
  //   handleUrlChange();
  // };
  
  // Также проверяем изменения URL с помощью popstate
  // window.addEventListener('popstate', handleUrlChange);
  
  // Отслеживаем клики и изменения на странице
  // const observer = new MutationObserver(() => {
  //   // Не отправляем каждый раз при изменении, а делаем это с задержкой
  //   // чтобы избежать слишком частых вызовов
  //   clearTimeout((window as any).uiStateTimeout);
  //   (window as any).uiStateTimeout = setTimeout(() => {
  //     sendUIState(sessionId, userId);
  //   }, 2000); // Отправляем обновление через 2 секунды после последнего изменения
  // });
  
  // observer.observe(document.body, {
  //   childList: true,
  //   subtree: true,
  //   attributes: true,
  //   attributeOldValue: true,
  //   characterData: true,
  //   characterDataOldValue: true
  // });
  
  // Возвращаем функцию для остановки сбора
  return () => {
    // clearInterval(intervalId);
    // window.removeEventListener('popstate', handleUrlChange);
    // window.history.pushState = originalPushState;
    // window.history.replaceState = originalReplaceState;
    // observer.disconnect();
    
    // Очищаем таймаут
    // if ((window as any).uiStateTimeout) {
    //   clearTimeout((window as any).uiStateTimeout);
    // }
  };
};