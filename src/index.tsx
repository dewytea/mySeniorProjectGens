import { Hono } from 'hono'
import { renderer } from './renderer'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// CORS 설정
app.use('/api/*', cors())

// Static files
app.use('/static/*', serveStatic({ root: './public' }))

// Renderer middleware
app.use(renderer)

// 홈 화면
app.get('/', (c) => {
  return c.render(
    <div class="min-h-screen bg-white">
      {/* Header */}
      <header class="bg-zzonde-orange text-white sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <img src="/static/zzonde-logo.png" alt="ZZonde Logo" class="w-10 h-10" />
              <h1 class="text-2xl font-bold" style="font-family: 'Quicksand', sans-serif; font-weight: 700;">ZZonde</h1>
            </div>
            <button 
              id="voiceBtn"
              class="bg-white text-zzonde-orange px-6 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
            >
              <i class="fas fa-microphone text-xl"></i>
              <span>음성 검색</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="max-w-7xl mx-auto px-4 py-6">
        {/* Text Size Control */}
        <div class="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 mb-6 shadow-md">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <i class="fas fa-text-height text-2xl text-zzonde-orange"></i>
              <span class="text-xl font-semibold">글씨 크기</span>
            </div>
            <div class="flex space-x-3">
              <button 
                onclick="changeTextSize('small')"
                class="text-size-btn bg-white px-6 py-3 rounded-xl shadow hover:shadow-lg transition-all font-semibold border-2 border-gray-300"
              >
                <span class="text-base">작게</span>
              </button>
              <button 
                onclick="changeTextSize('medium')"
                class="text-size-btn bg-zzonde-orange text-white px-6 py-3 rounded-xl shadow hover:shadow-lg transition-all font-semibold"
              >
                <span class="text-lg">보통</span>
              </button>
              <button 
                onclick="changeTextSize('large')"
                class="text-size-btn bg-white px-6 py-3 rounded-xl shadow hover:shadow-lg transition-all font-semibold border-2 border-gray-300"
              >
                <span class="text-xl">크게</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <a href="/news" class="quick-action-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all text-center border-2 border-transparent hover:border-zzonde-orange">
            <i class="fas fa-newspaper text-5xl text-zzonde-orange mb-3"></i>
            <p class="text-xl font-bold text-gray-800">뉴스</p>
          </a>
          <a href="/weather" class="quick-action-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all text-center border-2 border-transparent hover:border-zzonde-orange">
            <i class="fas fa-cloud-sun text-5xl text-zzonde-yellow mb-3"></i>
            <p class="text-xl font-bold text-gray-800">날씨</p>
          </a>
          <a href="/health" class="quick-action-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all text-center border-2 border-transparent hover:border-zzonde-orange">
            <i class="fas fa-heartbeat text-5xl text-zzonde-orange mb-3"></i>
            <p class="text-xl font-bold text-gray-800">건강</p>
          </a>
          <a href="/settings" class="quick-action-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all text-center border-2 border-transparent hover:border-zzonde-orange">
            <i class="fas fa-cog text-5xl text-gray-600 mb-3"></i>
            <p class="text-xl font-bold text-gray-800">설정</p>
          </a>
        </div>

        {/* Today's News */}
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-800 flex items-center">
              <i class="fas fa-newspaper text-zzonde-orange mr-3"></i>
              오늘의 주요 뉴스
            </h2>
            <a href="/news" class="text-zzonde-orange hover:underline text-lg font-semibold">
              더보기 →
            </a>
          </div>
          
          <div id="newsList" class="space-y-4">
            {/* News items will be loaded here */}
          </div>
        </div>

        {/* Voice Assistant Info */}
        <div class="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl p-8 shadow-lg">
          <div class="flex items-start space-x-4">
            <i class="fas fa-microphone-alt text-4xl text-zzonde-orange mt-1"></i>
            <div>
              <h3 class="text-2xl font-bold text-gray-800 mb-3">음성으로 더 편리하게</h3>
              <div class="space-y-2 text-lg text-gray-700">
                <p><i class="fas fa-check text-green-600 mr-2"></i> "오늘 날씨 알려줘"</p>
                <p><i class="fas fa-check text-green-600 mr-2"></i> "최신 뉴스 보여줘"</p>
                <p><i class="fas fa-check text-green-600 mr-2"></i> "글씨 크게 해줘"</p>
              </div>
              <button 
                onclick="document.getElementById('voiceBtn').click()"
                class="mt-4 bg-zzonde-orange text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-niagara-light transition-all shadow-lg"
              >
                지금 시도해보기
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl">
        <div class="max-w-7xl mx-auto px-4">
          <div class="grid grid-cols-4 gap-2 py-3">
            <a href="/" class="nav-item flex flex-col items-center py-3 text-zzonde-orange">
              <i class="fas fa-home text-3xl mb-1"></i>
              <span class="text-sm font-semibold">홈</span>
            </a>
            <a href="/news" class="nav-item flex flex-col items-center py-3 text-gray-600 hover:text-zzonde-orange transition-colors">
              <i class="fas fa-newspaper text-3xl mb-1"></i>
              <span class="text-sm font-semibold">뉴스</span>
            </a>
            <a href="/health" class="nav-item flex flex-col items-center py-3 text-gray-600 hover:text-zzonde-orange transition-colors">
              <i class="fas fa-heartbeat text-3xl mb-1"></i>
              <span class="text-sm font-semibold">건강</span>
            </a>
            <a href="/settings" class="nav-item flex flex-col items-center py-3 text-gray-600 hover:text-zzonde-orange transition-colors">
              <i class="fas fa-user-circle text-3xl mb-1"></i>
              <span class="text-sm font-semibold">내정보</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Voice Modal */}
      <div id="voiceModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <div class="text-center">
            <div id="voiceAnimation" class="mb-6">
              <i class="fas fa-microphone text-7xl text-zzonde-orange animate-pulse"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-3">듣고 있습니다...</h3>
            <p id="voiceText" class="text-xl text-gray-600 mb-6 min-h-[60px]">
              무엇을 도와드릴까요?
            </p>
            <button 
              onclick="stopVoice()"
              class="bg-red-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-red-600 transition-all shadow-lg"
            >
              취소
            </button>
          </div>
        </div>
      </div>

      {/* JavaScript */}
      <script src="/static/app.js"></script>
    </div>
  )
})

// API: 뉴스 가져오기 (Mock Data)
app.get('/api/news', (c) => {
  const news = [
    {
      id: 1,
      title: '2026년 설 연휴, 최대 9일 황금연휴 가능',
      summary: '올해 설 연휴는 1월 28일부터 30일까지이며, 연차를 활용하면 최대 9일의 황금연휴를 즐길 수 있습니다.',
      category: '사회',
      time: '1시간 전'
    },
    {
      id: 2,
      title: '서울 미세먼지 \'좋음\' 수준, 맑은 하늘 이어져',
      summary: '오늘 서울 지역 미세먼지 농도가 \'좋음\' 수준을 유지하며 청명한 날씨가 계속되고 있습니다.',
      category: '날씨',
      time: '2시간 전'
    },
    {
      id: 3,
      title: '건강보험 혜택 확대, 시니어 의료비 부담 완화',
      summary: '정부가 65세 이상 시니어를 대상으로 건강보험 혜택을 확대하여 의료비 부담을 줄이기로 했습니다.',
      category: '건강',
      time: '3시간 전'
    }
  ]
  
  return c.json({ success: true, data: news })
})

// 뉴스 페이지
app.get('/news', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50 pb-24">
      <header class="bg-zzonde-orange text-white sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center space-x-4">
            <a href="/" class="text-white hover:text-gray-200">
              <i class="fas fa-arrow-left text-2xl"></i>
            </a>
            <h1 class="text-2xl font-bold">오늘의 뉴스</h1>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6">
        <div id="newsDetailList" class="space-y-4">
          {/* News will be loaded here */}
        </div>
      </main>
      
      <script src="/static/app.js"></script>
    </div>
  )
})

// 설정 페이지
app.get('/settings', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50 pb-24">
      <header class="bg-zzonde-orange text-white sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center space-x-4">
            <a href="/" class="text-white hover:text-gray-200">
              <i class="fas fa-arrow-left text-2xl"></i>
            </a>
            <h1 class="text-2xl font-bold">설정</h1>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6">
        <div class="space-y-4">
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-text-height text-zzonde-orange mr-3"></i>
              화면 설정
            </h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between py-4 border-b">
                <span class="text-xl">글씨 크기</span>
                <div class="flex space-x-2">
                  <button onclick="changeTextSize('small')" class="px-4 py-2 border-2 rounded-lg">작게</button>
                  <button onclick="changeTextSize('medium')" class="px-4 py-2 bg-zzonde-orange text-white rounded-lg">보통</button>
                  <button onclick="changeTextSize('large')" class="px-4 py-2 border-2 rounded-lg">크게</button>
                </div>
              </div>
              <div class="flex items-center justify-between py-4 border-b">
                <span class="text-xl">고대비 모드</span>
                <label class="relative inline-block w-16 h-8">
                  <input type="checkbox" class="opacity-0 w-0 h-0" />
                  <span class="absolute cursor-pointer inset-0 bg-gray-300 rounded-full transition-all"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-microphone text-zzonde-orange mr-3"></i>
              음성 설정
            </h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between py-4 border-b">
                <span class="text-xl">음성 안내</span>
                <label class="relative inline-block w-16 h-8">
                  <input type="checkbox" checked class="opacity-0 w-0 h-0" />
                  <span class="absolute cursor-pointer inset-0 bg-zzonde-orange rounded-full transition-all"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-info-circle text-zzonde-orange mr-3"></i>
              앱 정보
            </h2>
            <div class="space-y-3 text-lg text-gray-700">
              <p>버전: 1.0.0 (Beta)</p>
              <p>제작: ZZonde Team</p>
              <p>문의: support@zzonde.app</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
})

export default app
