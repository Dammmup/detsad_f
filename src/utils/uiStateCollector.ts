
export const collectUIState = (): any => {
  try {

    const visibleElements = document.querySelectorAll(
      'body *:not(script):not(style):not(meta):not(link):not(title)',
    );
    let visibleText = '';

    visibleElements.forEach((element) => {
      if (element.nodeType === Node.TEXT_NODE) {
        const text = element.textContent?.trim();
        if (text) visibleText += text + ' ';
      } else if (element.nodeType === Node.ELEMENT_NODE) {
        const text = element.textContent?.trim();
        if (
          text &&
          element.tagName !== 'SCRIPT' &&
          element.tagName !== 'STYLE'
        ) {
          visibleText += text + ' ';
        }
      }
    });


    visibleText = visibleText.substring(0, 5000);


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
        pixelDepth: window.screen.pixelDepth,
      },
      window: {
        width: window.innerWidth,
        height: window.innerHeight,
      },

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
      })(),
    };


    const uiErrors: string[] = [];


    const errorElements = document.querySelectorAll(
      '.error, .alert, .warning, .danger, .invalid',
    );
    errorElements.forEach((el) => {
      const elementText =
        el.textContent?.trim() ||
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        '';
      if (elementText) {
        uiErrors.push(`UI Error: ${elementText}`);
      }
    });


    const invalidElements = document.querySelectorAll(
      '[aria-invalid="true"], [data-error], [data-invalid]',
    );
    invalidElements.forEach((el) => {
      const errorText =
        el.getAttribute('data-error') ||
        el.getAttribute('data-invalid') ||
        el.getAttribute('aria-errormessage') ||
        '';
      if (errorText) {
        uiErrors.push(`Invalid element: ${errorText}`);
      }
    });


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

      console.warn('Could not access localStorage or sessionStorage:', e);
    }


    const domSnapshot = {
      url: window.location.href,
      route: window.location.pathname,
      timestamp: new Date().toISOString(),
      elementCount: document.querySelectorAll('*').length,
      formElements: document.querySelectorAll('input, textarea, select').length,
      buttonElements: document.querySelectorAll(
        'button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]',
      ).length,
      linkElements: document.querySelectorAll('a').length,
      headings: {
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length,
        h4: document.querySelectorAll('h4').length,
        h5: document.querySelectorAll('h5').length,
        h6: document.querySelectorAll('h6').length,
      },
    };

    return {
      visibleText,
      componentsState,
      uiErrors,
      localStorageData,
      sessionStorageData,
      domSnapshot,
    };
  } catch (error) {
    console.error('Ошибка при сборе состояния UI:', error);
    return {
      visibleText: '',
      componentsState: {
        activeRoute: window.location.pathname,
        url: window.location.href,
      },
      uiErrors: [`Ошибка сбора состояния UI: ${error}`],
      localStorageData: {},
      sessionStorageData: {},
      domSnapshot: {
        url: window.location.href,
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
      },
    };
  }
};


export const sendUIState = async (sessionId: string, userId?: string) => {
  try {
    const uiState = collectUIState();


    let currentUser = uiState.componentsState.currentUser;
    if (!currentUser) {
      try {
        const currentUserResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/api/auth/current-user`,
          {
            method: 'GET',
            credentials: 'include',
          },
        );

        if (currentUserResponse.ok) {
          currentUser = await currentUserResponse.json();
        }
      } catch (error) {
        console.warn(
          'Не удалось получить информацию о текущем пользователе:',
          error,
        );
      }
    }

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/ui-state`,
      {
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
            currentUser,
          },
          uiErrors: uiState.uiErrors,
          localStorageData: uiState.localStorageData,
          sessionStorageData: uiState.sessionStorageData,
          domSnapshot: uiState.domSnapshot,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при отправке состояния UI:', error);

    return null;
  }
};


export const initUIStateCollector = (sessionId: string, userId?: string) => {






















































  return () => {









  };
};
