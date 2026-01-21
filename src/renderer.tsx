import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <title>ZZonde (쫀드기) - 인생이 쫀득해진다</title>
        <meta name="description" content="시니어를 위한 음성+터치 하이브리드 플랫폼" />
        
        {/* Google Fonts - Quicksand for chewy feeling */}
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&display=swap" rel="stylesheet" />
        
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
                    'zzonde-orange': '#FF6D00',
                    'zzonde-yellow': '#FFD600',
                    'zzonde-black': '#222222',
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
