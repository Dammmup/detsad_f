# Настройка маршрутизации для React приложения

## Проблема

Приложение использует BrowserRouter для клиентской маршрутизации. Когда пользователь вводит конкретный маршрут (например, `/app/dashboard`, `/login`, `/children`) в адресной строке браузера, сервер должен возвращать `index.html` файл, чтобы клиентская маршрутизация могла работать корректно.

## Решение

### Vercel

Файл `vercel.json` уже создан в корне проекта:
```
{
  "rewrites": [
    { "source": "/((?!static|favicon|manifest).*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

Эта конфигурация перенаправляет все маршруты на `/`, за исключением статических файлов (CSS, JS, изображения), favicon и manifest файлов, что позволяет корректно работать клиентской маршрутизации без ошибок загрузки статических ресурсов.

### Netlify

Файл `_redirects` уже создан в папке `public/`:
```
/*    /index.html   200
```

### Apache (.htaccess)

Создайте файл `.htaccess` в папке `build/` или в корне сервера:
```
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QR,L]
```

### Nginx

В конфигурации сервера добавьте:
```
location / {
  try_files $uri $uri/ /index.html;
}
```

### Node.js (Express)

Если используется Express сервер:
```javascript
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build/index.html'));
});
```

### IIS (web.config)

Создайте файл `web.config`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Main Rule" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## Важно

После сборки приложения (`npm run build`) убедитесь, что сервер настроен в соответствии с вашей инфраструктурой. Файл `_redirects` будет работать на Netlify, но для других платформ используйте соответствующие конфигурации.