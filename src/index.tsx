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

// ===== AI Intent Recognition API =====
app.post('/api/ai-intent', async (c) => {
  try {
    const { command } = await c.req.json();
    
    if (!command) {
      return c.json({ error: 'Command is required' }, 400);
    }

    // AI 인텐트 인식 프롬프트
    const systemPrompt = `당신은 시니어를 위한 음성 어시스턴트 ZZonde의 인텐트 분류기입니다.

사용자의 음성 명령을 분석하여 다음 중 하나의 인텐트로 분류하세요:

**인텐트 목록:**
1. "jobs" - 일자리, 알바, 돈벌기, 일거리 관련
2. "community" - 심심함, 대화, 이야기, 친구, 이웃 관련
3. "marketplace" - 장터, 쇼핑, 구매, 판매, 나눔 관련
4. "medicine" - 복약, 약, 약시간, 건강관리 관련
5. "todo" - 오늘 할 일, 일정, 계획 관련
6. "news" - 뉴스, 소식 관련
7. "weather" - 날씨 관련
8. "health" - 건강, 운동, 식단 관련
9. "text_size_large" - 글씨 크게
10. "text_size_small" - 글씨 작게
11. "text_size_medium" - 글씨 보통
12. "settings" - 설정 관련
13. "home" - 홈, 처음으로
14. "unknown" - 위 카테고리에 해당하지 않음

**응답 형식 (JSON만 반환):**
{
  "intent": "인텐트명",
  "confidence": 0.95,
  "response": "사용자에게 들려줄 친근한 응답 (존댓말)"
}

**예시:**
입력: "일자리 찾고 싶어요"
출력: {"intent": "jobs", "confidence": 0.95, "response": "일자리를 찾아드릴게요"}

입력: "심심한데 누구 없나"
출력: {"intent": "community", "confidence": 0.90, "response": "동네 이웃들과 이야기 나눠보세요"}`;

    // OpenAI API 호출 (간단한 fetch 사용)
    const response = await fetch('https://www.genspark.ai/api/llm_proxy/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY || 'gsk-default'}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      // Fallback to rule-based
      return c.json({ 
        intent: 'unknown', 
        confidence: 0.5,
        response: '명령을 이해하지 못했습니다',
        fallback: true
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // JSON 파싱
    let result;
    try {
      // JSON 블록에서 추출
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(content);
      }
    } catch (e) {
      console.error('JSON parse error:', e, 'Content:', content);
      return c.json({ 
        intent: 'unknown', 
        confidence: 0.5,
        response: '명령을 이해하지 못했습니다',
        fallback: true
      });
    }

    return c.json(result);

  } catch (error) {
    console.error('AI Intent API error:', error);
    return c.json({ 
      error: 'Internal server error',
      intent: 'unknown',
      confidence: 0.5,
      response: '일시적인 오류가 발생했습니다',
      fallback: true
    }, 500);
  }
})

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
        {/* Live Demo Banner */}
        <div class="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-3xl shadow-2xl p-8 mb-6 text-white animate-pulse">
          <div class="text-center">
            <h2 class="text-3xl font-bold mb-3 flex items-center justify-center">
              <i class="fas fa-rocket mr-3 text-4xl"></i>
              🎉 라이브 배포 완료! 🎉
            </h2>
            <p class="text-2xl mb-4 font-semibold">지금 바로 체험해보세요!</p>
            <div class="bg-white bg-opacity-20 rounded-xl p-4 mb-4 backdrop-blur-sm">
              <p class="text-lg mb-2 font-semibold">🌐 배포 URL:</p>
              <a 
                href="https://5174-i1l4snsl2k1m52qnvfsx9-3844e1b6.sandbox.novita.ai"
                target="_blank"
                class="text-xl font-mono bg-white text-purple-600 px-6 py-3 rounded-lg inline-block hover:bg-yellow-100 transition-all shadow-lg"
              >
                https://5174-i1l4snsl2k1m52qnvfsx9-3844e1b6.sandbox.novita.ai
              </a>
            </div>
            <div class="flex justify-center space-x-4">
              <a 
                href="https://5174-i1l4snsl2k1m52qnvfsx9-3844e1b6.sandbox.novita.ai"
                target="_blank"
                class="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-xl hover:bg-yellow-300 transition-all shadow-lg"
              >
                <i class="fas fa-external-link-alt mr-2"></i>새 창으로 열기
              </a>
              <button 
                onclick="navigator.clipboard.writeText('https://5174-i1l4snsl2k1m52qnvfsx9-3844e1b6.sandbox.novita.ai'); alert('링크가 복사되었습니다!');"
                class="bg-yellow-400 text-purple-900 px-8 py-4 rounded-full font-bold text-xl hover:bg-yellow-300 transition-all shadow-lg"
              >
                <i class="fas fa-copy mr-2"></i>링크 복사
              </button>
            </div>
          </div>
        </div>

        {/* Feature Demo Center */}
        <div class="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
            <i class="fas fa-star text-zzonde-yellow mr-3 text-4xl"></i>
            ZZonde MVP 완전 기능 체험
            <i class="fas fa-star text-zzonde-yellow ml-3 text-4xl"></i>
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div class="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl p-6 border-2 border-zzonde-orange">
              <div class="flex items-center mb-3">
                <i class="fas fa-robot text-4xl text-zzonde-orange mr-3"></i>
                <h3 class="text-2xl font-bold text-gray-800">AI 동반자 '존디'</h3>
              </div>
              <ul class="space-y-2 text-lg text-gray-700">
                <li><i class="fas fa-check text-green-600 mr-2"></i>대화 기억 기능</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>능동적 인사</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>안전 모니터링</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>음성 인터페이스</li>
              </ul>
              <a 
                href="/companion"
                class="block mt-4 bg-zzonde-orange text-white px-6 py-3 rounded-full font-bold text-center hover:bg-zzonde-yellow transition-all"
              >
                지금 체험하기 →
              </a>
            </div>

            <div class="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-6 border-2 border-blue-400">
              <div class="flex items-center mb-3">
                <i class="fas fa-cloud-sun text-4xl text-blue-600 mr-3"></i>
                <h3 class="text-2xl font-bold text-gray-800">날씨 정보</h3>
              </div>
              <ul class="space-y-2 text-lg text-gray-700">
                <li><i class="fas fa-check text-green-600 mr-2"></i>실시간 날씨</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>대기질 정보</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>시간별 예보</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>음성 안내</li>
              </ul>
              <a 
                href="/weather"
                class="block mt-4 bg-blue-500 text-white px-6 py-3 rounded-full font-bold text-center hover:bg-blue-600 transition-all"
              >
                날씨 확인하기 →
              </a>
            </div>

            <div class="bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl p-6 border-2 border-red-400">
              <div class="flex items-center mb-3">
                <i class="fas fa-pills text-4xl text-red-600 mr-3"></i>
                <h3 class="text-2xl font-bold text-gray-800">복약 관리</h3>
              </div>
              <ul class="space-y-2 text-lg text-gray-700">
                <li><i class="fas fa-check text-green-600 mr-2"></i>복약 일정</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>알림 기능</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>복약 통계</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>음성 안내</li>
              </ul>
              <a 
                href="/health"
                class="block mt-4 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-center hover:bg-red-600 transition-all"
              >
                건강 관리하기 →
              </a>
            </div>

            <div class="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-6 border-2 border-green-400">
              <div class="flex items-center mb-3">
                <i class="fas fa-newspaper text-4xl text-green-600 mr-3"></i>
                <h3 class="text-2xl font-bold text-gray-800">뉴스</h3>
              </div>
              <ul class="space-y-2 text-lg text-gray-700">
                <li><i class="fas fa-check text-green-600 mr-2"></i>6개 카테고리</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>필터링 기능</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>TTS 읽어주기</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>뉴스 공유</li>
              </ul>
              <a 
                href="/news"
                class="block mt-4 bg-green-500 text-white px-6 py-3 rounded-full font-bold text-center hover:bg-green-600 transition-all"
              >
                뉴스 보기 →
              </a>
            </div>

            <div class="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl p-6 border-2 border-purple-400">
              <div class="flex items-center mb-3">
                <i class="fas fa-user-circle text-4xl text-purple-600 mr-3"></i>
                <h3 class="text-2xl font-bold text-gray-800">회원가입/로그인</h3>
              </div>
              <ul class="space-y-2 text-lg text-gray-700">
                <li><i class="fas fa-check text-green-600 mr-2"></i>간편 회원가입</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>프로필 관리</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>설정 저장</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>보안 기능</li>
              </ul>
              <a 
                href="/auth/login"
                class="block mt-4 bg-purple-500 text-white px-6 py-3 rounded-full font-bold text-center hover:bg-purple-600 transition-all"
              >
                로그인하기 →
              </a>
            </div>

            <div class="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-6 border-2 border-yellow-400">
              <div class="flex items-center mb-3">
                <i class="fas fa-microphone text-4xl text-yellow-600 mr-3"></i>
                <h3 class="text-2xl font-bold text-gray-800">음성 인식</h3>
              </div>
              <ul class="space-y-2 text-lg text-gray-700">
                <li><i class="fas fa-check text-green-600 mr-2"></i>AI 인텐트 인식</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>페이지 이동</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>명령 실행</li>
                <li><i class="fas fa-check text-green-600 mr-2"></i>TTS 응답</li>
              </ul>
              <button 
                onclick="document.getElementById('voiceBtn').click()"
                class="block w-full mt-4 bg-yellow-500 text-white px-6 py-3 rounded-full font-bold text-center hover:bg-yellow-600 transition-all"
              >
                음성 명령 시작 →
              </button>
            </div>
          </div>

          <div class="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-6 border-2 border-green-400">
            <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-code text-green-600 mr-3"></i>
              기술 스택 & 아키텍처
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center bg-white rounded-xl p-4 shadow">
                <i class="fas fa-server text-3xl text-orange-500 mb-2"></i>
                <p class="font-bold text-lg">Backend</p>
                <p class="text-base text-gray-600">Hono</p>
              </div>
              <div class="text-center bg-white rounded-xl p-4 shadow">
                <i class="fab fa-react text-3xl text-blue-500 mb-2"></i>
                <p class="font-bold text-lg">Frontend</p>
                <p class="text-base text-gray-600">TSX</p>
              </div>
              <div class="text-center bg-white rounded-xl p-4 shadow">
                <i class="fas fa-microphone-alt text-3xl text-purple-500 mb-2"></i>
                <p class="font-bold text-lg">Voice</p>
                <p class="text-base text-gray-600">Web Speech API</p>
              </div>
              <div class="text-center bg-white rounded-xl p-4 shadow">
                <i class="fas fa-robot text-3xl text-pink-500 mb-2"></i>
                <p class="font-bold text-lg">AI</p>
                <p class="text-base text-gray-600">GPT-5-mini</p>
              </div>
            </div>
          </div>
        </div>

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
                <span class="text-lg">작게</span>
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
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <a href="/companion" class="quick-action-card bg-gradient-to-br from-zzonde-orange to-zzonde-yellow rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all text-center border-2 border-transparent hover:border-white">
            <i class="fas fa-robot text-5xl text-white mb-3"></i>
            <p class="text-xl font-bold text-white">존디와 대화</p>
            <p class="text-sm text-white opacity-90 mt-1">AI 동반자</p>
          </a>
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
          <a href="/jobs" class="quick-action-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all text-center border-2 border-transparent hover:border-zzonde-orange">
            <i class="fas fa-briefcase text-5xl text-green-600 mb-3"></i>
            <p class="text-xl font-bold text-gray-800">일거리 찾기</p>
          </a>
          <a href="/community" class="quick-action-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all text-center border-2 border-transparent hover:border-zzonde-orange">
            <i class="fas fa-comments text-5xl text-blue-600 mb-3"></i>
            <p class="text-xl font-bold text-gray-800">동네 이야기</p>
          </a>
          <a href="/marketplace" class="quick-action-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all text-center border-2 border-transparent hover:border-zzonde-orange">
            <i class="fas fa-shopping-basket text-5xl text-purple-600 mb-3"></i>
            <p class="text-xl font-bold text-gray-800">나눔 장터</p>
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
                <p><i class="fas fa-check text-green-600 mr-2"></i> "일자리 찾아줘"</p>
                <p><i class="fas fa-check text-green-600 mr-2"></i> "심심해, 이야기하고 싶어"</p>
                <p><i class="fas fa-check text-green-600 mr-2"></i> "장터 보여줘"</p>
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
      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-40">
        <div class="max-w-7xl mx-auto px-4">
          <div class="grid grid-cols-5 gap-1 py-3">
            <a href="/" class="nav-item flex flex-col items-center py-3 text-zzonde-orange">
              <i class="fas fa-home text-3xl mb-1"></i>
              <span class="text-sm font-semibold">홈</span>
            </a>
            <a href="/news" class="nav-item flex flex-col items-center py-3 text-gray-600 hover:text-zzonde-orange transition-colors">
              <i class="fas fa-newspaper text-3xl mb-1"></i>
              <span class="text-sm font-semibold">뉴스</span>
            </a>
            <a href="/weather" class="nav-item flex flex-col items-center py-3 text-gray-600 hover:text-zzonde-orange transition-colors">
              <i class="fas fa-cloud-sun text-3xl mb-1"></i>
              <span class="text-sm font-semibold">날씨</span>
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

// API: 날씨 정보 가져오기 (OpenWeather API)
app.get('/api/weather', async (c) => {
  try {
    const apiKey = c.env?.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY || 'demo_key';
    const city = c.req.query('city') || 'Seoul';
    const lang = 'kr';
    
    // OpenWeather API 호출
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&lang=${lang}&units=metric`
    );
    
    if (!weatherResponse.ok) {
      // API 실패 시 Mock 데이터 반환
      console.log('OpenWeather API failed, using mock data');
      return c.json({
        success: true,
        data: {
          city: '서울',
          temp: 15,
          feels_like: 13,
          description: '맑음',
          icon: '01d',
          humidity: 60,
          wind_speed: 2.5,
          pressure: 1013,
          visibility: 10000,
          sunrise: new Date().setHours(7, 30, 0),
          sunset: new Date().setHours(17, 45, 0)
        },
        source: 'mock'
      });
    }
    
    const weatherData = await weatherResponse.json();
    
    return c.json({
      success: true,
      data: {
        city: weatherData.name,
        temp: Math.round(weatherData.main.temp),
        feels_like: Math.round(weatherData.main.feels_like),
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        humidity: weatherData.main.humidity,
        wind_speed: weatherData.wind.speed,
        pressure: weatherData.main.pressure,
        visibility: weatherData.visibility,
        sunrise: weatherData.sys.sunrise * 1000,
        sunset: weatherData.sys.sunset * 1000
      },
      source: 'api'
    });
  } catch (error) {
    console.error('Weather API error:', error);
    // 에러 발생 시 Mock 데이터 반환
    return c.json({
      success: true,
      data: {
        city: '서울',
        temp: 15,
        feels_like: 13,
        description: '맑음',
        icon: '01d',
        humidity: 60,
        wind_speed: 2.5,
        pressure: 1013,
        visibility: 10000,
        sunrise: new Date().setHours(7, 30, 0),
        sunset: new Date().setHours(17, 45, 0)
      },
      source: 'mock'
    });
  }
});

// API: 대기질 정보 가져오기
app.get('/api/air-quality', async (c) => {
  try {
    const apiKey = c.env?.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY || 'demo_key';
    const lat = c.req.query('lat') || '37.5665';  // Seoul
    const lon = c.req.query('lon') || '126.9780'; // Seoul
    
    const airResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    
    if (!airResponse.ok) {
      return c.json({
        success: true,
        data: {
          aqi: 1,
          pm10: 30,
          pm25: 15,
          level: '좋음',
          color: 'green'
        },
        source: 'mock'
      });
    }
    
    const airData = await airResponse.json();
    const aqi = airData.list[0].main.aqi;
    const components = airData.list[0].components;
    
    const aqiLevels = ['좋음', '보통', '나쁨', '매우 나쁨', '최악'];
    const aqiColors = ['green', 'yellow', 'orange', 'red', 'purple'];
    
    return c.json({
      success: true,
      data: {
        aqi: aqi,
        pm10: Math.round(components.pm10),
        pm25: Math.round(components.pm2_5),
        level: aqiLevels[aqi - 1] || '좋음',
        color: aqiColors[aqi - 1] || 'green'
      },
      source: 'api'
    });
  } catch (error) {
    console.error('Air quality API error:', error);
    return c.json({
      success: true,
      data: {
        aqi: 1,
        pm10: 30,
        pm25: 15,
        level: '좋음',
        color: 'green'
      },
      source: 'mock'
    });
  }
});

// API: 뉴스 가져오기 (Naver RSS + Mock Data)
app.get('/api/news', async (c) => {
  try {
    const category = c.req.query('category') || 'all';
    
    // RSS 피드 파싱을 위해 간단한 fetch 사용
    // 네이버 뉴스 RSS: https://news.naver.com/main/list.naver?mode=LSD&mid=sec&sid1=001
    // 실제로는 CORS 문제로 서버에서 처리해야 함
    
    // 카테고리별 RSS URL
    const rssUrls = {
      'society': 'https://news.naver.com/main/list.naver?mode=LSD&mid=sec&sid1=102',
      'politics': 'https://news.naver.com/main/list.naver?mode=LSD&mid=sec&sid1=100',
      'economy': 'https://news.naver.com/main/list.naver?mode=LSD&mid=sec&sid1=101',
      'life': 'https://news.naver.com/main/list.naver?mode=LSD&mid=sec&sid1=103',
      'world': 'https://news.naver.com/main/list.naver?mode=LSD&mid=sec&sid1=104',
      'it': 'https://news.naver.com/main/list.naver?mode=LSD&mid=sec&sid1=105'
    };
    
    // MVP에서는 Mock 데이터 사용 (CORS 문제 해결 후 실제 API 사용)
    const mockNews = [
      {
        id: 1,
        title: '2026년 설 연휴, 최대 9일 황금연휴 가능',
        summary: '올해 설 연휴는 1월 28일부터 30일까지이며, 연차를 활용하면 최대 9일의 황금연휴를 즐길 수 있습니다. 귀향길 교통 혼잡이 예상되니 미리 계획하세요.',
        category: '사회',
        categoryEn: 'society',
        time: '1시간 전',
        source: '연합뉴스',
        url: 'https://news.naver.com',
        imageUrl: '/static/news-placeholder.jpg'
      },
      {
        id: 2,
        title: '서울 미세먼지 \'좋음\' 수준, 맑은 하늘 이어져',
        summary: '오늘 서울 지역 미세먼지 농도가 \'좋음\' 수준을 유지하며 청명한 날씨가 계속되고 있습니다. 야외 활동하기 좋은 날씨입니다.',
        category: '날씨',
        categoryEn: 'weather',
        time: '2시간 전',
        source: 'KBS뉴스',
        url: 'https://news.naver.com',
        imageUrl: '/static/news-placeholder.jpg'
      },
      {
        id: 3,
        title: '건강보험 혜택 확대, 시니어 의료비 부담 완화',
        summary: '정부가 65세 이상 시니어를 대상으로 건강보험 혜택을 확대하여 의료비 부담을 줄이기로 했습니다. 올해 상반기부터 시행될 예정입니다.',
        category: '건강',
        categoryEn: 'health',
        time: '3시간 전',
        source: 'MBC뉴스',
        url: 'https://news.naver.com',
        imageUrl: '/static/news-placeholder.jpg'
      },
      {
        id: 4,
        title: '시니어 일자리 사업 확대... 월 50만원 이상 지원',
        summary: '정부가 시니어 일자리 사업을 대폭 확대하여 65세 이상 어르신들에게 월 50만원 이상의 일자리를 제공하기로 했습니다.',
        category: '경제',
        categoryEn: 'economy',
        time: '4시간 전',
        source: 'SBS뉴스',
        url: 'https://news.naver.com',
        imageUrl: '/static/news-placeholder.jpg'
      },
      {
        id: 5,
        title: '스마트폰 사용법 무료 교육... 전국 복지관에서 진행',
        summary: '전국 노인복지관에서 스마트폰 사용법 무료 교육이 진행됩니다. 카카오톡, 인터넷뱅킹 등 실생활에 필요한 기능을 배울 수 있습니다.',
        category: 'IT',
        categoryEn: 'it',
        time: '5시간 전',
        source: 'JTBC뉴스',
        url: 'https://news.naver.com',
        imageUrl: '/static/news-placeholder.jpg'
      },
      {
        id: 6,
        title: '치매 예방 프로그램 전국 확대... 무료 검진 실시',
        summary: '보건복지부가 치매 예방 프로그램을 전국으로 확대하고, 65세 이상 어르신을 대상으로 무료 검진을 실시합니다.',
        category: '건강',
        categoryEn: 'health',
        time: '6시간 전',
        source: '연합뉴스',
        url: 'https://news.naver.com',
        imageUrl: '/static/news-placeholder.jpg'
      }
    ];
    
    // 카테고리 필터링
    let filteredNews = mockNews;
    if (category !== 'all') {
      filteredNews = mockNews.filter(news => news.categoryEn === category);
    }
    
    return c.json({ 
      success: true, 
      data: filteredNews,
      source: 'mock',
      message: 'MVP에서는 Mock 데이터를 사용합니다. 실제 서비스에서는 네이버 뉴스 API를 연동합니다.'
    });
  } catch (error) {
    console.error('News API error:', error);
    
    // Fallback to mock data
    const fallbackNews = [
      {
        id: 1,
        title: '뉴스를 불러올 수 없습니다',
        summary: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        category: '공지',
        categoryEn: 'notice',
        time: '방금 전',
        source: 'ZZonde',
        url: '#',
        imageUrl: '/static/news-placeholder.jpg'
      }
    ];
    
    return c.json({ 
      success: true, 
      data: fallbackNews,
      source: 'fallback'
    });
  }
});

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
        {/* Category Filter */}
        <div class="mb-6 overflow-x-auto">
          <div class="flex space-x-3 pb-2">
            <button 
              onclick="filterNewsByCategory('all')"
              class="news-category-btn bg-zzonde-orange text-white px-6 py-3 rounded-full font-bold text-lg whitespace-nowrap shadow-md hover:shadow-lg transition-all"
              data-category="all"
            >
              전체
            </button>
            <button 
              onclick="filterNewsByCategory('society')"
              class="news-category-btn bg-white text-gray-800 px-6 py-3 rounded-full font-bold text-lg whitespace-nowrap shadow-md hover:shadow-lg transition-all border-2 border-gray-300"
              data-category="society"
            >
              사회
            </button>
            <button 
              onclick="filterNewsByCategory('health')"
              class="news-category-btn bg-white text-gray-800 px-6 py-3 rounded-full font-bold text-lg whitespace-nowrap shadow-md hover:shadow-lg transition-all border-2 border-gray-300"
              data-category="health"
            >
              건강
            </button>
            <button 
              onclick="filterNewsByCategory('economy')"
              class="news-category-btn bg-white text-gray-800 px-6 py-3 rounded-full font-bold text-lg whitespace-nowrap shadow-md hover:shadow-lg transition-all border-2 border-gray-300"
              data-category="economy"
            >
              경제
            </button>
            <button 
              onclick="filterNewsByCategory('it')"
              class="news-category-btn bg-white text-gray-800 px-6 py-3 rounded-full font-bold text-lg whitespace-nowrap shadow-md hover:shadow-lg transition-all border-2 border-gray-300"
              data-category="it"
            >
              IT
            </button>
          </div>
        </div>

        <div id="newsDetailList" class="space-y-4">
          {/* News will be loaded here */}
        </div>
      </main>
      
      <script src="/static/app.js"></script>
    </div>
  )
})

// API: 복약 정보 가져오기
app.get('/api/medicines', (c) => {
  // LocalStorage에서 가져온 데이터를 반환 (실제로는 D1에서 가져와야 함)
  // 클라이언트 측에서 처리하도록 Mock 데이터 반환
  const medicines = [
    {
      id: 1,
      name: '혈압약',
      time: '08:00',
      timeDisplay: '아침 8:00',
      taken: false,
      frequency: 'daily',
      notes: '식후 30분'
    },
    {
      id: 2,
      name: '소화제',
      time: '12:30',
      timeDisplay: '점심 12:30',
      taken: false,
      frequency: 'daily',
      notes: '식후 즉시'
    },
    {
      id: 3,
      name: '비타민',
      time: '18:00',
      timeDisplay: '저녁 6:00',
      taken: false,
      frequency: 'daily',
      notes: '식후 30분'
    }
  ];
  
  return c.json({ success: true, data: medicines });
});

// API: 복약 완료 처리
app.post('/api/medicines/:id/take', async (c) => {
  const id = c.req.param('id');
  
  // 실제로는 D1 database에 저장
  // 현재는 success만 반환
  return c.json({
    success: true,
    message: '복약이 완료되었습니다',
    medicineId: id,
    takenAt: new Date().toISOString()
  });
});

// API: 복약 추가
app.post('/api/medicines', async (c) => {
  try {
    const body = await c.req.json();
    const { name, time, frequency, notes } = body;
    
    // 실제로는 D1에 저장
    const newMedicine = {
      id: Date.now(),
      name,
      time,
      frequency: frequency || 'daily',
      notes: notes || '',
      taken: false
    };
    
    return c.json({
      success: true,
      data: newMedicine
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to add medicine'
    }, 400);
  }
});

// API: 회원가입/로그인 (MVP - LocalStorage, 향후 D1 연동)
app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const { name, phone, password } = body;
    
    if (!name || !phone || !password) {
      return c.json({
        success: false,
        error: '모든 필드를 입력해주세요'
      }, 400);
    }
    
    // MVP: Client에서 localStorage로 처리
    // 실제로는 D1 database에 저장
    return c.json({
      success: true,
      message: '회원가입이 완료되었습니다',
      user: {
        name,
        phone: phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3'), // 부분 마스킹
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: '회원가입 중 오류가 발생했습니다'
    }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { phone, password } = body;
    
    if (!phone || !password) {
      return c.json({
        success: false,
        error: '전화번호와 비밀번호를 입력해주세요'
      }, 400);
    }
    
    // MVP: Client에서 localStorage로 처리
    // 실제로는 D1 database에서 검증
    return c.json({
      success: true,
      message: '로그인 성공',
      user: {
        phone: phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3'),
        loginAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: '로그인 중 오류가 발생했습니다'
    }, 500);
  }
});

// 음성 동반자 '존디' 페이지
app.get('/companion', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 pb-32">
      <header class="bg-zzonde-orange text-white sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <a href="/" class="text-white hover:text-gray-200">
                <i class="fas fa-arrow-left text-2xl"></i>
              </a>
              <h1 class="text-2xl font-bold">존디와 대화</h1>
            </div>
            <button 
              onclick="toggleCompanionSettings()"
              class="text-white hover:text-gray-200"
            >
              <i class="fas fa-cog text-2xl"></i>
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-6">
        {/* AI 캐릭터 */}
        <div class="text-center mb-8">
          <div class="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-zzonde-orange to-zzonde-yellow flex items-center justify-center shadow-2xl">
            <i class="fas fa-robot text-6xl text-white"></i>
          </div>
          <h2 class="text-3xl font-bold text-gray-800 mb-2">존디</h2>
          <p class="text-xl text-gray-600">당신의 쫀득한 AI 동반자 🍬</p>
        </div>

        {/* 대화 내역 */}
        <div id="conversationContainer" class="bg-white rounded-3xl shadow-lg p-6 mb-6 min-h-[400px] max-h-[500px] overflow-y-auto">
          <div id="conversationList" class="space-y-4">
            {/* 대화가 여기에 표시됩니다 */}
            <div class="text-center text-gray-400 py-12">
              <i class="fas fa-comments text-6xl mb-4"></i>
              <p class="text-xl">아래 마이크 버튼을 눌러 대화를 시작하세요</p>
            </div>
          </div>
        </div>

        {/* 빠른 응답 버튼 */}
        <div id="quickReplies" class="flex flex-wrap gap-3 mb-6 justify-center">
          <button 
            onclick="sendQuickMessage('오늘 날씨 어때?')"
            class="bg-white text-gray-700 px-6 py-3 rounded-full font-semibold text-lg border-2 border-gray-300 hover:border-zzonde-orange hover:text-zzonde-orange transition-all shadow-md"
          >
            🌤️ 날씨 알려줘
          </button>
          <button 
            onclick="sendQuickMessage('오늘 뉴스 보여줘')"
            class="bg-white text-gray-700 px-6 py-3 rounded-full font-semibold text-lg border-2 border-gray-300 hover:border-zzonde-orange hover:text-zzonde-orange transition-all shadow-md"
          >
            📰 뉴스 보여줘
          </button>
          <button 
            onclick="sendQuickMessage('약 먹을 시간이야?')"
            class="bg-white text-gray-700 px-6 py-3 rounded-full font-semibold text-lg border-2 border-gray-300 hover:border-zzonde-orange hover:text-zzonde-orange transition-all shadow-md"
          >
            💊 약 시간 확인
          </button>
        </div>

        {/* 컨텍스트 정보 (디버깅용, 나중에 숨길 수 있음) */}
        <div id="contextInfo" class="bg-blue-50 rounded-2xl p-4 mb-6 text-sm" style="display: none;">
          <p class="font-semibold text-blue-800 mb-2">🧠 기억된 정보:</p>
          <div id="contextDetails" class="text-blue-700"></div>
        </div>
      </main>

      {/* 거대한 마이크 버튼 (Floating Action Button) */}
      <div class="fixed bottom-24 left-0 right-0 flex justify-center z-40">
        <button 
          id="companionVoiceBtn"
          onclick="startCompanionVoice()"
          class="w-28 h-28 rounded-full bg-gradient-to-br from-zzonde-orange to-zzonde-yellow text-white shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 flex items-center justify-center"
          style="box-shadow: 0 10px 40px rgba(255, 109, 0, 0.4);"
        >
          <i class="fas fa-microphone text-5xl"></i>
        </button>
      </div>

      {/* 설정 패널 */}
      <div id="companionSettings" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-800">동반자 설정</h2>
            <button 
              onclick="toggleCompanionSettings()"
              class="text-gray-500 hover:text-gray-700"
            >
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between py-4 border-b">
              <div>
                <p class="text-xl font-semibold text-gray-800">능동적 대화</p>
                <p class="text-base text-gray-600">존디가 먼저 말을 걸게 합니다</p>
              </div>
              <label class="relative inline-block w-16 h-8">
                <input 
                  type="checkbox" 
                  id="activeGreeting"
                  checked
                  onchange="toggleActiveGreeting(this.checked)"
                  class="opacity-0 w-0 h-0" 
                />
                <span class="absolute cursor-pointer inset-0 bg-zzonde-orange rounded-full transition-all"></span>
              </label>
            </div>

            <div class="flex items-center justify-between py-4 border-b">
              <div>
                <p class="text-xl font-semibold text-gray-800">안전 모니터링</p>
                <p class="text-base text-gray-600">위급 상황을 자동으로 감지합니다</p>
              </div>
              <label class="relative inline-block w-16 h-8">
                <input 
                  type="checkbox" 
                  id="safetyMonitoring"
                  checked
                  class="opacity-0 w-0 h-0" 
                />
                <span class="absolute cursor-pointer inset-0 bg-zzonde-orange rounded-full transition-all"></span>
              </label>
            </div>

            <div class="py-4">
              <p class="text-xl font-semibold text-gray-800 mb-3">비상 연락처</p>
              <button 
                onclick="manageEmergencyContacts()"
                class="w-full bg-zzonde-orange text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-zzonde-yellow transition-all"
              >
                <i class="fas fa-phone mr-2"></i>연락처 관리
              </button>
            </div>

            <div class="py-4">
              <button 
                onclick="showContextDebug()"
                class="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-semibold text-lg hover:bg-gray-300 transition-all"
              >
                <i class="fas fa-brain mr-2"></i>기억된 정보 보기
              </button>
            </div>
          </div>
        </div>
      </div>

      <script src="/static/app.js"></script>
      <script src="/static/auth.js"></script>
      <script src="/static/memory_service.js"></script>
      <script src="/static/safety_monitor.js"></script>
      <script src="/static/companion.js"></script>
    </div>
  )
});

// 로그인/회원가입 페이지
app.get('/auth/login', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div class="text-center mb-8">
          <img src="/static/zzonde-logo.png" alt="ZZonde" class="w-20 h-20 mx-auto mb-4" />
          <h1 class="text-4xl font-bold text-gray-800 mb-2" style="font-family: 'Quicksand', sans-serif;">ZZonde</h1>
          <p class="text-xl text-gray-600">로그인하고 쫀득한 하루를 시작하세요!</p>
        </div>
        
        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-xl font-semibold text-gray-800 mb-2">
              <i class="fas fa-phone text-zzonde-orange mr-2"></i>전화번호
            </label>
            <input 
              type="tel" 
              id="loginPhone"
              placeholder="010-1234-5678"
              class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label class="block text-xl font-semibold text-gray-800 mb-2">
              <i class="fas fa-lock text-zzonde-orange mr-2"></i>비밀번호
            </label>
            <input 
              type="password" 
              id="loginPassword"
              placeholder="비밀번호"
              class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none"
              required
            />
          </div>
          
          <button 
            type="submit"
            class="w-full bg-gradient-to-r from-zzonde-orange to-zzonde-yellow text-white px-8 py-4 rounded-full font-bold text-xl hover:shadow-lg transition-all"
          >
            <i class="fas fa-sign-in-alt mr-2"></i>로그인
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-lg text-gray-600 mb-3">아직 회원이 아니신가요?</p>
          <a 
            href="/auth/register"
            class="inline-block bg-white text-zzonde-orange px-6 py-3 rounded-full font-bold text-lg border-2 border-zzonde-orange hover:bg-orange-50 transition-all"
          >
            회원가입하기
          </a>
        </div>
        
        <div class="mt-6 text-center">
          <a 
            href="/"
            class="text-lg text-gray-600 hover:text-zzonde-orange transition-colors"
          >
            <i class="fas fa-arrow-left mr-2"></i>홈으로 돌아가기
          </a>
        </div>
      </div>
      
      <script src="/static/app.js"></script>
      <script src="/static/auth.js"></script>
    </div>
  )
});

app.get('/auth/register', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div class="text-center mb-8">
          <img src="/static/zzonde-logo.png" alt="ZZonde" class="w-20 h-20 mx-auto mb-4" />
          <h1 class="text-4xl font-bold text-gray-800 mb-2" style="font-family: 'Quicksand', sans-serif;">ZZonde</h1>
          <p class="text-xl text-gray-600">가입하고 쫀득한 연결을 시작하세요!</p>
        </div>
        
        <form id="registerForm" class="space-y-4">
          <div>
            <label class="block text-xl font-semibold text-gray-800 mb-2">
              <i class="fas fa-user text-zzonde-orange mr-2"></i>이름
            </label>
            <input 
              type="text" 
              id="registerName"
              placeholder="홍길동"
              class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label class="block text-xl font-semibold text-gray-800 mb-2">
              <i class="fas fa-phone text-zzonde-orange mr-2"></i>전화번호
            </label>
            <input 
              type="tel" 
              id="registerPhone"
              placeholder="010-1234-5678"
              class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label class="block text-xl font-semibold text-gray-800 mb-2">
              <i class="fas fa-lock text-zzonde-orange mr-2"></i>비밀번호
            </label>
            <input 
              type="password" 
              id="registerPassword"
              placeholder="6자 이상"
              class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none"
              required
              minlength="6"
            />
          </div>
          
          <div>
            <label class="block text-xl font-semibold text-gray-800 mb-2">
              <i class="fas fa-lock text-zzonde-orange mr-2"></i>비밀번호 확인
            </label>
            <input 
              type="password" 
              id="registerPasswordConfirm"
              placeholder="비밀번호 다시 입력"
              class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none"
              required
            />
          </div>
          
          <button 
            type="submit"
            class="w-full bg-gradient-to-r from-zzonde-orange to-zzonde-yellow text-white px-8 py-4 rounded-full font-bold text-xl hover:shadow-lg transition-all"
          >
            <i class="fas fa-user-plus mr-2"></i>회원가입
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-lg text-gray-600 mb-3">이미 회원이신가요?</p>
          <a 
            href="/auth/login"
            class="inline-block bg-white text-zzonde-orange px-6 py-3 rounded-full font-bold text-lg border-2 border-zzonde-orange hover:bg-orange-50 transition-all"
          >
            로그인하기
          </a>
        </div>
        
        <div class="mt-6 text-center">
          <a 
            href="/"
            class="text-lg text-gray-600 hover:text-zzonde-orange transition-colors"
          >
            <i class="fas fa-arrow-left mr-2"></i>홈으로 돌아가기
          </a>
        </div>
      </div>
      
      <script src="/static/app.js"></script>
      <script src="/static/auth.js"></script>
    </div>
  )
});

// 날씨 페이지
app.get('/weather', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 pb-24">
      <header class="bg-zzonde-orange text-white sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center space-x-4">
            <a href="/" class="text-white hover:text-gray-200">
              <i class="fas fa-arrow-left text-2xl"></i>
            </a>
            <h1 class="text-2xl font-bold">오늘의 날씨</h1>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6">
        {/* Current Weather Card */}
        <div class="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div class="text-center mb-6">
            <div class="flex items-center justify-center mb-4">
              <i class="fas fa-map-marker-alt text-zzonde-orange text-2xl mr-2"></i>
              <h2 id="cityName" class="text-2xl font-bold text-gray-800">서울</h2>
            </div>
            <div class="flex items-center justify-center mb-4">
              <i id="weatherIcon" class="fas fa-sun text-8xl text-zzonde-yellow"></i>
            </div>
            <div class="text-7xl font-bold text-gray-900 mb-2">
              <span id="currentTemp">15</span>°
            </div>
            <p id="weatherDesc" class="text-2xl text-gray-600 mb-4">맑음</p>
            <div class="flex justify-center space-x-8 text-lg">
              <div>
                <i class="fas fa-tint text-blue-500 mr-2"></i>
                <span>습도 <strong id="humidity">60</strong>%</span>
              </div>
              <div>
                <i class="fas fa-wind text-gray-500 mr-2"></i>
                <span>바람 <strong id="windSpeed">2.5</strong>m/s</span>
              </div>
            </div>
          </div>

          {/* Voice Button */}
          <button 
            onclick="speakWeather()"
            class="w-full bg-zzonde-orange text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-zzonde-yellow transition-all shadow-lg flex items-center justify-center space-x-3"
          >
            <i class="fas fa-volume-up text-2xl"></i>
            <span>날씨 정보 듣기</span>
          </button>
        </div>

        {/* Hourly Forecast */}
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-clock text-zzonde-orange mr-3"></i>
            시간별 예보
          </h3>
          <div class="grid grid-cols-4 md:grid-cols-6 gap-4">
            {[
              { time: '오후 2시', icon: 'fa-sun', temp: '16°', color: 'text-zzonde-yellow' },
              { time: '오후 3시', icon: 'fa-sun', temp: '17°', color: 'text-zzonde-yellow' },
              { time: '오후 4시', icon: 'fa-cloud-sun', temp: '16°', color: 'text-gray-500' },
              { time: '오후 5시', icon: 'fa-cloud', temp: '15°', color: 'text-gray-500' },
              { time: '오후 6시', icon: 'fa-cloud-moon', temp: '14°', color: 'text-blue-400' },
              { time: '오후 7시', icon: 'fa-moon', temp: '13°', color: 'text-blue-600' },
            ].map(item => (
              <div class="text-center bg-gray-50 rounded-xl p-4">
                <p class="text-base font-semibold text-gray-700 mb-2">{item.time}</p>
                <i class={`fas ${item.icon} text-4xl ${item.color} mb-2`}></i>
                <p class="text-xl font-bold text-gray-900">{item.temp}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Forecast */}
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-calendar-week text-zzonde-orange mr-3"></i>
            주간 예보
          </h3>
          <div class="space-y-3">
            {[
              { day: '오늘', icon: 'fa-sun', high: '17°', low: '10°', color: 'text-zzonde-yellow' },
              { day: '내일', icon: 'fa-cloud-sun', high: '16°', low: '9°', color: 'text-gray-500' },
              { day: '수요일', icon: 'fa-cloud-rain', high: '14°', low: '8°', color: 'text-blue-500' },
              { day: '목요일', icon: 'fa-cloud', high: '15°', low: '9°', color: 'text-gray-500' },
              { day: '금요일', icon: 'fa-sun', high: '18°', low: '11°', color: 'text-zzonde-yellow' },
              { day: '토요일', icon: 'fa-sun', high: '19°', low: '12°', color: 'text-zzonde-yellow' },
              { day: '일요일', icon: 'fa-cloud-sun', high: '17°', low: '11°', color: 'text-gray-500' },
            ].map(item => (
              <div class="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                <span class="text-xl font-semibold text-gray-800 w-24">{item.day}</span>
                <i class={`fas ${item.icon} text-3xl ${item.color} w-16 text-center`}></i>
                <div class="flex space-x-4 text-lg">
                  <span class="text-gray-900 font-bold">{item.high}</span>
                  <span class="text-gray-500">{item.low}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Air Quality */}
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-wind text-zzonde-orange mr-3"></i>
            미세먼지 & 공기질
          </h3>
          <div class="grid grid-cols-2 gap-4" id="airQualityContainer">
            <div class="bg-green-50 rounded-xl p-6 text-center border-2 border-green-200">
              <i class="fas fa-leaf text-4xl text-green-600 mb-2"></i>
              <p class="text-lg text-gray-700 mb-2">미세먼지 (PM10)</p>
              <p id="pm10Level" class="text-3xl font-bold text-green-600">좋음</p>
              <p id="pm10Value" class="text-base text-gray-600 mt-2">30 μg/m³</p>
            </div>
            <div class="bg-green-50 rounded-xl p-6 text-center border-2 border-green-200">
              <i class="fas fa-smog text-4xl text-green-600 mb-2"></i>
              <p class="text-lg text-gray-700 mb-2">초미세먼지 (PM2.5)</p>
              <p id="pm25Level" class="text-3xl font-bold text-green-600">좋음</p>
              <p id="pm25Value" class="text-base text-gray-600 mt-2">15 μg/m³</p>
            </div>
          </div>
          <div id="airQualityAdvice" class="mt-4 bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
            <p class="text-lg text-blue-800">
              <i class="fas fa-info-circle mr-2"></i>
              <strong>외출 추천:</strong> 오늘은 야외 활동하기 좋은 날씨입니다! 🌞
            </p>
          </div>
        </div>
      </main>

      <script src="/static/app.js"></script>
    </div>
  )
})

// 건강 페이지
app.get('/health', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 pb-24">
      <header class="bg-zzonde-orange text-white sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center space-x-4">
            <a href="/" class="text-white hover:text-gray-200">
              <i class="fas fa-arrow-left text-2xl"></i>
            </a>
            <h1 class="text-2xl font-bold">건강 관리</h1>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6">
        {/* Daily Summary */}
        <div class="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-heartbeat text-zzonde-orange mr-3"></i>
            오늘의 건강
          </h2>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center bg-orange-50 rounded-xl p-6">
              <i class="fas fa-pills text-4xl text-zzonde-orange mb-3"></i>
              <p class="text-lg text-gray-700">복약</p>
              <div id="medicineStats">
                <p class="text-3xl font-bold text-zzonde-orange">0/3</p>
              </div>
            </div>
            <div class="text-center bg-yellow-50 rounded-xl p-6">
              <i class="fas fa-glass-water text-4xl text-blue-500 mb-3"></i>
              <p class="text-lg text-gray-700">물</p>
              <p class="text-3xl font-bold text-blue-500">5/8</p>
            </div>
            <div class="text-center bg-green-50 rounded-xl p-6">
              <i class="fas fa-walking text-4xl text-green-600 mb-3"></i>
              <p class="text-lg text-gray-700">걸음</p>
              <p class="text-3xl font-bold text-green-600">3,240</p>
            </div>
          </div>
        </div>

        {/* Medicine Schedule */}
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-2xl font-bold text-gray-800 flex items-center">
              <i class="fas fa-pills text-zzonde-orange mr-3"></i>
              오늘의 복약 일정
            </h3>
            <button 
              onclick="addMedicine()"
              class="bg-zzonde-orange text-white px-4 py-2 rounded-full text-base font-semibold hover:bg-zzonde-yellow transition-all"
            >
              <i class="fas fa-plus mr-2"></i>추가
            </button>
          </div>
          
          <div id="medicineScheduleContainer" class="space-y-3">
            {/* Medicines will be loaded here */}
          </div>

          <button 
            onclick="speakMedicineReminder()"
            class="w-full mt-4 bg-gradient-to-r from-orange-100 to-yellow-100 text-zzonde-orange px-6 py-4 rounded-full font-bold text-xl hover:shadow-lg transition-all flex items-center justify-center space-x-3 border-2 border-zzonde-orange"
          >
            <i class="fas fa-volume-up text-2xl"></i>
            <span>복약 시간 음성 알림</span>
          </button>
        </div>

        {/* Health Metrics */}
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-chart-line text-zzonde-orange mr-3"></i>
            건강 지표
          </h3>
          <div class="space-y-4">
            <div class="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-5 border-l-4 border-red-400">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-lg text-gray-700 mb-1">혈압</p>
                  <p class="text-3xl font-bold text-gray-900">120/80 <span class="text-xl text-gray-600">mmHg</span></p>
                </div>
                <i class="fas fa-heartbeat text-5xl text-red-400"></i>
              </div>
              <p class="text-base text-green-600 mt-2">
                <i class="fas fa-check-circle mr-1"></i> 정상 범위입니다
              </p>
            </div>

            <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border-l-4 border-blue-400">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-lg text-gray-700 mb-1">혈당</p>
                  <p class="text-3xl font-bold text-gray-900">95 <span class="text-xl text-gray-600">mg/dL</span></p>
                </div>
                <i class="fas fa-tint text-5xl text-blue-400"></i>
              </div>
              <p class="text-base text-green-600 mt-2">
                <i class="fas fa-check-circle mr-1"></i> 정상 범위입니다
              </p>
            </div>

            <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border-l-4 border-purple-400">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-lg text-gray-700 mb-1">체온</p>
                  <p class="text-3xl font-bold text-gray-900">36.5 <span class="text-xl text-gray-600">°C</span></p>
                </div>
                <i class="fas fa-thermometer-half text-5xl text-purple-400"></i>
              </div>
              <p class="text-base text-green-600 mt-2">
                <i class="fas fa-check-circle mr-1"></i> 정상 범위입니다
              </p>
            </div>
          </div>
        </div>

        {/* Health Tips */}
        <div class="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl shadow-lg p-6 border-2 border-zzonde-orange">
          <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-lightbulb text-zzonde-yellow mr-3"></i>
            오늘의 건강 팁
          </h3>
          <div class="space-y-3">
            <div class="flex items-start space-x-3">
              <i class="fas fa-check-circle text-2xl text-zzonde-orange mt-1"></i>
              <p class="text-xl text-gray-800">하루 30분 이상 가벼운 산책을 하세요</p>
            </div>
            <div class="flex items-start space-x-3">
              <i class="fas fa-check-circle text-2xl text-zzonde-orange mt-1"></i>
              <p class="text-xl text-gray-800">물을 자주 마시는 습관을 들이세요 (8잔/일)</p>
            </div>
            <div class="flex items-start space-x-3">
              <i class="fas fa-check-circle text-2xl text-zzonde-orange mt-1"></i>
              <p class="text-xl text-gray-800">규칙적인 수면 시간을 유지하세요 (7-8시간)</p>
            </div>
          </div>
        </div>

        {/* Emergency Button */}
        <div class="mt-6 bg-red-500 rounded-2xl shadow-2xl p-6">
          <button 
            onclick="emergencyCall()"
            class="w-full flex items-center justify-center space-x-4"
          >
            <i class="fas fa-phone-alt text-6xl text-white"></i>
            <div class="text-left">
              <p class="text-white text-xl font-semibold">긴급 상황 시</p>
              <p class="text-white text-3xl font-bold">119 바로 연결</p>
            </div>
          </button>
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
          {/* User Profile Section */}
          <div class="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl shadow-lg p-6 border-2 border-zzonde-orange">
            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-user-circle text-zzonde-orange mr-3"></i>
              사용자 정보
            </h2>
            
            <div id="authSection" class="space-y-4">
              {/* Will be filled by JavaScript */}
            </div>
            
            <div class="space-y-4 mt-4" id="profileSection">
              <div class="flex items-center justify-between py-4 border-b border-orange-200">
                <div class="flex-1">
                  <label class="text-xl font-semibold text-gray-800 block mb-2">이름</label>
                  <input 
                    type="text" 
                    id="userName"
                    placeholder="예: 김철수"
                    class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none"
                  />
                </div>
              </div>
              <div class="flex items-center justify-between py-4 border-b border-orange-200">
                <div class="flex-1">
                  <label class="text-xl font-semibold text-gray-800 block mb-2">호칭</label>
                  <select 
                    id="userTitle"
                    class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none"
                  >
                    <option value="님">님</option>
                    <option value="프로님">프로님</option>
                    <option value="선생님">선생님</option>
                    <option value="어르신">어르신</option>
                  </select>
                </div>
              </div>
              <button 
                onclick="saveUserProfile()"
                class="w-full bg-zzonde-orange text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-zzonde-yellow transition-all shadow-lg"
              >
                <i class="fas fa-save mr-2"></i>저장하기
              </button>
            </div>
          </div>

          {/* 나의 마실 범위 섹션 */}
          <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-walking text-green-600 mr-3"></i>
              나의 마실 범위 🚶
            </h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between py-4 border-b border-green-200">
                <div>
                  <span class="text-xl font-semibold text-gray-800">현재 동네</span>
                  <p class="text-lg text-gray-600 mt-1" id="currentLocation">설정 필요</p>
                </div>
                <button 
                  onclick="changeLocation()"
                  class="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold text-lg hover:bg-green-600 transition-all shadow-md"
                >
                  <i class="fas fa-map-marker-alt mr-2"></i>동네 변경
                </button>
              </div>
              
              <div class="py-4 border-b border-green-200">
                <label class="text-xl font-semibold text-gray-800 block mb-3">오늘은 어디까지 마실 나가실래요?</label>
                <div class="space-y-3">
                  <label class="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
                    <input 
                      type="radio" 
                      name="range" 
                      value="우리동네만" 
                      onchange="updateRange(this.value)"
                      class="w-6 h-6 text-green-600"
                    />
                    <div class="ml-4">
                      <div class="text-xl font-semibold">🏠 우리 동네만</div>
                      <div class="text-base text-gray-600">걸어서 10분 거리</div>
                    </div>
                  </label>
                  
                  <label class="flex items-center p-4 border-2 border-green-500 bg-green-50 rounded-lg cursor-pointer">
                    <input 
                      type="radio" 
                      name="range" 
                      value="옆동네까지" 
                      onchange="updateRange(this.value)"
                      class="w-6 h-6 text-green-600"
                      checked
                    />
                    <div class="ml-4">
                      <div class="text-xl font-semibold">🏘️ 옆 동네까지 (추천)</div>
                      <div class="text-base text-gray-600">걸어서 20분 거리</div>
                    </div>
                  </label>
                  
                  <label class="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
                    <input 
                      type="radio" 
                      name="range" 
                      value="구전체" 
                      onchange="updateRange(this.value)"
                      class="w-6 h-6 text-green-600"
                    />
                    <div class="ml-4">
                      <div class="text-xl font-semibold">🌆 구 전체</div>
                      <div class="text-base text-gray-600">버스 타고 30분 거리</div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p class="text-lg text-blue-800">
                  <i class="fas fa-info-circle mr-2"></i>
                  <span class="font-semibold">고무줄 마실 범위</span>: 근처에 소식이 없으면 자동으로 범위를 넓혀 드려요!
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-text-height text-zzonde-orange mr-3"></i>
              화면 설정
            </h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between py-4 border-b">
                <span class="text-xl">글씨 크기</span>
                <div class="flex space-x-2">
                  <button 
                    onclick="changeTextSize('small')" 
                    class="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-lg text-gray-800 hover:bg-gray-50 transition-all"
                    style="color: #222222 !important;"
                  >
                    작게
                  </button>
                  <button 
                    onclick="changeTextSize('medium')" 
                    class="px-6 py-3 bg-zzonde-orange text-white rounded-lg font-semibold text-lg hover:bg-zzonde-yellow transition-all"
                    style="color: #FFFFFF !important; background-color: #FF6D00 !important;"
                  >
                    보통
                  </button>
                  <button 
                    onclick="changeTextSize('large')" 
                    class="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-xl text-gray-800 hover:bg-gray-50 transition-all"
                    style="color: #222222 !important; font-size: 20px !important; font-weight: 700 !important;"
                  >
                    크게
                  </button>
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
                <div>
                  <span class="text-xl font-semibold">음성 안내</span>
                  <p class="text-base text-gray-600 mt-1">음성으로 안내를 들을 수 있습니다</p>
                </div>
                <label class="relative inline-block w-16 h-8">
                  <input type="checkbox" checked class="opacity-0 w-0 h-0" />
                  <span class="absolute cursor-pointer inset-0 bg-zzonde-orange rounded-full transition-all"></span>
                </label>
              </div>
              <div class="flex items-center justify-between py-4 border-b">
                <div>
                  <span class="text-xl font-semibold flex items-center">
                    AI 음성 인식
                    <span class="ml-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full">
                      <i class="fas fa-magic mr-1"></i>NEW
                    </span>
                  </span>
                  <p class="text-base text-gray-600 mt-1">AI가 더 정확하게 명령을 이해합니다</p>
                </div>
                <label class="relative inline-block w-16 h-8">
                  <input 
                    type="checkbox" 
                    id="aiModeToggle"
                    onchange="toggleAIMode(this.checked)"
                    class="opacity-0 w-0 h-0" 
                  />
                  <span class="absolute cursor-pointer inset-0 bg-gray-300 rounded-full transition-all"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Voice Command History */}
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-2xl font-bold text-gray-800 flex items-center">
                <i class="fas fa-history text-zzonde-orange mr-3"></i>
                최근 음성 명령
              </h2>
              <button 
                onclick="clearVoiceHistory()"
                class="text-red-500 hover:text-red-700 font-semibold text-lg"
              >
                <i class="fas fa-trash mr-2"></i>전체 삭제
              </button>
            </div>
            <div id="voiceHistoryList" class="space-y-3">
              <p class="text-center text-gray-500 text-lg py-8">아직 음성 명령 기록이 없습니다</p>
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
      
      <script src="/static/app.js"></script>
      <script src="/static/auth.js"></script>
    </div>
  )
})

// 일거리 찾기 페이지
app.get('/jobs', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 pb-24">
      <header class="bg-zzonde-orange text-white sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center space-x-4">
            <a href="/" class="text-white hover:text-gray-200">
              <i class="fas fa-arrow-left text-2xl"></i>
            </a>
            <h1 class="text-2xl font-bold">일거리 찾기</h1>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6">
        <div class="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-briefcase text-green-600 mr-3"></i>
            오늘의 일거리
          </h2>
          
          <div class="space-y-4">
            {[
              { title: '마트 진열 도우미', location: '강남구', pay: '시간당 15,000원', time: '오전 9시-12시', icon: 'fa-shopping-cart' },
              { title: '공원 청소 봉사', location: '서초구', pay: '시간당 12,000원', time: '오후 2시-5시', icon: 'fa-broom' },
              { title: '배달 보조', location: '송파구', pay: '건당 5,000원', time: '오후 6시-9시', icon: 'fa-motorcycle' },
            ].map(job => (
              <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all">
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-4">
                    <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                      <i class={`fas ${job.icon} text-3xl text-white`}></i>
                    </div>
                    <div>
                      <h3 class="text-2xl font-bold text-gray-800 mb-2">{job.title}</h3>
                      <p class="text-lg text-gray-600">
                        <i class="fas fa-map-marker-alt text-green-600 mr-2"></i>
                        {job.location}
                      </p>
                      <p class="text-lg text-gray-600">
                        <i class="fas fa-clock text-green-600 mr-2"></i>
                        {job.time}
                      </p>
                      <p class="text-xl font-bold text-green-600 mt-2">{job.pay}</p>
                    </div>
                  </div>
                  <button class="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-green-600 transition-all">
                    지원하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-lightbulb text-zzonde-yellow mr-3"></i>
            일거리 찾기 팁
          </h3>
          <div class="space-y-3">
            <p class="text-xl text-gray-700">
              <i class="fas fa-check-circle text-green-600 mr-2"></i>
              주 3회 이하 단기 일자리가 많습니다
            </p>
            <p class="text-xl text-gray-700">
              <i class="fas fa-check-circle text-green-600 mr-2"></i>
              건강 상태에 맞는 일을 선택하세요
            </p>
          </div>
        </div>
      </main>

      <script src="/static/app.js"></script>
    </div>
  )
})

// 동네 이야기 페이지
app.get('/community', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 pb-24">
      <header class="bg-zzonde-orange text-white sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center space-x-4">
            <a href="/" class="text-white hover:text-gray-200">
              <i class="fas fa-arrow-left text-2xl"></i>
            </a>
            <h1 class="text-2xl font-bold">동네 이야기</h1>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6">
        <div class="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-800 flex items-center">
              <i class="fas fa-comments text-blue-600 mr-3"></i>
              이웃들의 이야기
            </h2>
            <button class="bg-blue-500 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-blue-600 transition-all">
              <i class="fas fa-pen mr-2"></i>글쓰기
            </button>
          </div>
          
          <div class="space-y-4">
            {[
              { name: '김철수', time: '30분 전', content: '오늘 날씨가 참 좋네요! 공원 산책 어떠세요?', likes: 12, comments: 5 },
              { name: '이영희', time: '1시간 전', content: '동네 맛집 추천해주세요. 손주들 데리고 갈 곳 찾아요!', likes: 8, comments: 15 },
              { name: '박민수', time: '2시간 전', content: '오늘 복지관에서 탁구 대회가 있다고 하네요!', likes: 20, comments: 7 },
            ].map(post => (
              <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all">
                <div class="flex items-start space-x-4 mb-4">
                  <div class="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-2xl text-white"></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xl font-bold text-gray-800">{post.name}</p>
                      <p class="text-base text-gray-500">{post.time}</p>
                    </div>
                    <p class="text-xl text-gray-700 leading-relaxed">{post.content}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-6 text-lg text-gray-600 border-t pt-4">
                  <button class="flex items-center space-x-2 hover:text-blue-600 transition-all">
                    <i class="fas fa-thumbs-up"></i>
                    <span>좋아요 {post.likes}</span>
                  </button>
                  <button class="flex items-center space-x-2 hover:text-blue-600 transition-all">
                    <i class="fas fa-comment"></i>
                    <span>댓글 {post.comments}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <script src="/static/app.js"></script>
    </div>
  )
})

// 나눔 장터 페이지
app.get('/marketplace', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 pb-24">
      <header class="bg-zzonde-orange text-white sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center space-x-4">
            <a href="/" class="text-white hover:text-gray-200">
              <i class="fas fa-arrow-left text-2xl"></i>
            </a>
            <h1 class="text-2xl font-bold">나눔 장터</h1>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6">
        <div class="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-800 flex items-center">
              <i class="fas fa-shopping-basket text-purple-600 mr-3"></i>
              이웃과 나누기
            </h2>
            <button class="bg-purple-500 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-purple-600 transition-all">
              <i class="fas fa-plus mr-2"></i>등록하기
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: '전기밥솥', price: '무료 나눔', condition: '깨끗함', seller: '김영수', location: '강남구', image: 'fa-blender' },
              { title: '책상', price: '10,000원', condition: '중고', seller: '이미숙', location: '서초구', image: 'fa-chair' },
              { title: '옷장', price: '무료 나눔', condition: '약간 낡음', seller: '박정희', location: '송파구', image: 'fa-box-open' },
              { title: '자전거', price: '50,000원', condition: '양호', seller: '최민호', location: '강동구', image: 'fa-bicycle' },
            ].map(item => (
              <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-all">
                <div class="flex items-start space-x-4">
                  <div class="w-20 h-20 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class={`fas ${item.image} text-4xl text-white`}></i>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">{item.title}</h3>
                    <p class="text-xl font-bold text-purple-600 mb-2">{item.price}</p>
                    <p class="text-lg text-gray-600">
                      <i class="fas fa-check-circle text-green-600 mr-2"></i>
                      {item.condition}
                    </p>
                    <p class="text-lg text-gray-600">
                      <i class="fas fa-user text-purple-600 mr-2"></i>
                      {item.seller}
                    </p>
                    <p class="text-lg text-gray-600">
                      <i class="fas fa-map-marker-alt text-purple-600 mr-2"></i>
                      {item.location}
                    </p>
                  </div>
                </div>
                <button class="w-full mt-4 bg-purple-500 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-purple-600 transition-all">
                  연락하기
                </button>
              </div>
            ))}
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-info-circle text-zzonde-orange mr-3"></i>
            안전한 거래 팁
          </h3>
          <div class="space-y-3">
            <p class="text-xl text-gray-700">
              <i class="fas fa-check-circle text-purple-600 mr-2"></i>
              직접 만나서 물건을 확인하세요
            </p>
            <p class="text-xl text-gray-700">
              <i class="fas fa-check-circle text-purple-600 mr-2"></i>
              믿을 수 있는 이웃과 거래하세요
            </p>
          </div>
        </div>
      </main>

      <script src="/static/app.js"></script>
    </div>
  )
})

export default app
