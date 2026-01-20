import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <title>NIAGARA - 폭포처럼 쏟아지는 정보, 간단하게</title>
        <meta name="description" content="시니어를 위한 음성+터치 하이브리드 플랫폼" />
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* Font Awesome Icons */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        
        {/* Custom Styles */}
        <link href="/static/style.css" rel="stylesheet" />
        
        {/* Tailwind Config */}
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    'niagara-blue': '#1A237E',
                    'niagara-light': '#3949AB',
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body class="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
})
