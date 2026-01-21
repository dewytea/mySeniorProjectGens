// ZZONDE - Voice + Touch Hybrid Platform
// Text Size Management
let currentTextSize = 'medium';

const textSizes = {
  small: {
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px'
  },
  medium: {
    base: '18px',
    lg: '20px',
    xl: '24px',
    '2xl': '28px',
    '3xl': '36px'
  },
  large: {
    base: '22px',
    lg: '26px',
    xl: '30px',
    '2xl': '36px',
    '3xl': '44px'
  }
};

function changeTextSize(size) {
  currentTextSize = size;
  localStorage.setItem('zzonde_text_size', size);
  
  const root = document.documentElement;
  const sizes = textSizes[size];
  
  root.style.setProperty('--text-base', sizes.base);
  root.style.setProperty('--text-lg', sizes.lg);
  root.style.setProperty('--text-xl', sizes.xl);
  root.style.setProperty('--text-2xl', sizes['2xl']);
  root.style.setProperty('--text-3xl', sizes['3xl']);
  
  // Update button styles
  document.querySelectorAll('.text-size-btn').forEach(btn => {
    btn.classList.remove('bg-zzonde-orange', 'text-white');
    btn.classList.add('bg-white', 'border-2', 'border-gray-300');
  });
  
  const activeBtn = Array.from(document.querySelectorAll('.text-size-btn'))
    .find(btn => btn.textContent.includes(size === 'small' ? '작게' : size === 'medium' ? '보통' : '크게'));
  
  if (activeBtn) {
    activeBtn.classList.remove('bg-white', 'border-2', 'border-gray-300');
    activeBtn.classList.add('bg-zzonde-orange', 'text-white');
  }
  
  // TTS announcement
  speak(size === 'small' ? '작은 글씨로 변경되었습니다' : 
        size === 'medium' ? '보통 글씨로 변경되었습니다' : 
        '큰 글씨로 변경되었습니다');
}

// Load saved text size
window.addEventListener('DOMContentLoaded', () => {
  const savedSize = localStorage.getItem('zzonde_text_size') || 'medium';
  changeTextSize(savedSize);
  loadNews();
});

// Voice Recognition (Web Speech API)
let recognition = null;
let isListening = false;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'ko-KR';
  
  recognition.onstart = function() {
    isListening = true;
    console.log('음성 인식 시작');
  };
  
  recognition.onresult = function(event) {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    const voiceText = document.getElementById('voiceText');
    if (voiceText) {
      voiceText.textContent = finalTranscript || interimTranscript || '듣고 있습니다...';
    }
    
    if (finalTranscript) {
      handleVoiceCommand(finalTranscript);
    }
  };
  
  recognition.onerror = function(event) {
    console.error('음성 인식 오류:', event.error);
    if (event.error === 'no-speech') {
      speak('음성이 감지되지 않았습니다. 다시 시도해주세요.');
    } else if (event.error === 'not-allowed') {
      speak('마이크 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
    }
    stopVoice();
  };
  
  recognition.onend = function() {
    isListening = false;
  };
}

// Voice Button Handler
const voiceBtn = document.getElementById('voiceBtn');
if (voiceBtn) {
  voiceBtn.addEventListener('click', startVoice);
}

function startVoice() {
  if (!recognition) {
    alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.');
    return;
  }
  
  const modal = document.getElementById('voiceModal');
  modal.classList.remove('hidden');
  
  const voiceText = document.getElementById('voiceText');
  voiceText.textContent = '듣고 있습니다...';
  
  try {
    recognition.start();
    speak('무엇을 도와드릴까요?');
  } catch (e) {
    console.error('음성 인식 시작 오류:', e);
    if (isListening) {
      recognition.stop();
      setTimeout(() => {
        recognition.start();
      }, 100);
    }
  }
}

function stopVoice() {
  const modal = document.getElementById('voiceModal');
  modal.classList.add('hidden');
  
  if (recognition && isListening) {
    recognition.stop();
  }
}

// Voice Command Handler
function handleVoiceCommand(command) {
  console.log('음성 명령:', command);
  
  const lowerCommand = command.toLowerCase().replace(/\s/g, '');
  
  // Text size commands
  if (lowerCommand.includes('글씨') || lowerCommand.includes('글자')) {
    if (lowerCommand.includes('크게') || lowerCommand.includes('키워')) {
      changeTextSize('large');
      stopVoice();
      return;
    } else if (lowerCommand.includes('작게') || lowerCommand.includes('줄여')) {
      changeTextSize('small');
      stopVoice();
      return;
    } else if (lowerCommand.includes('보통')) {
      changeTextSize('medium');
      stopVoice();
      return;
    }
  }
  
  // Navigation commands
  if (lowerCommand.includes('뉴스')) {
    speak('뉴스 페이지로 이동합니다');
    setTimeout(() => {
      window.location.href = '/news';
    }, 1000);
    return;
  }
  
  if (lowerCommand.includes('날씨')) {
    speak('날씨 정보를 확인합니다');
    setTimeout(() => {
      window.location.href = '/weather';
    }, 1000);
    return;
  }
  
  if (lowerCommand.includes('건강')) {
    speak('건강 페이지로 이동합니다');
    setTimeout(() => {
      window.location.href = '/health';
    }, 1000);
    return;
  }
  
  if (lowerCommand.includes('설정')) {
    speak('설정 페이지로 이동합니다');
    setTimeout(() => {
      window.location.href = '/settings';
    }, 1000);
    return;
  }
  
  if (lowerCommand.includes('홈') || lowerCommand.includes('처음')) {
    speak('홈 화면으로 이동합니다');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
    return;
  }
  
  // Default response
  speak(`${command} 명령을 이해하지 못했습니다. 다시 말씀해주세요.`);
  setTimeout(() => {
    stopVoice();
  }, 2000);
}

// Text-to-Speech (TTS)
function speak(text) {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // Slightly slower for seniors
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }
}

// Load News
async function loadNews() {
  try {
    const response = await fetch('/api/news');
    const result = await response.json();
    
    if (result.success) {
      renderNews(result.data);
      renderNewsDetail(result.data);
    }
  } catch (error) {
    console.error('뉴스 로딩 오류:', error);
  }
}

function renderNews(newsItems) {
  const newsList = document.getElementById('newsList');
  if (!newsList) return;
  
  newsList.innerHTML = newsItems.slice(0, 3).map(news => `
    <a href="/news" class="block bg-gray-50 hover:bg-gray-100 rounded-xl p-5 transition-all border-2 border-transparent hover:border-niagara-blue">
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0">
          <span class="inline-block bg-zzonde-orange text-white px-3 py-1 rounded-full text-sm font-semibold">
            ${news.category}
          </span>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-800 mb-2">${news.title}</h3>
          <p class="text-lg text-gray-600 mb-2">${news.summary}</p>
          <p class="text-sm text-gray-500">${news.time}</p>
        </div>
      </div>
    </a>
  `).join('');
}

function renderNewsDetail(newsItems) {
  const newsDetailList = document.getElementById('newsDetailList');
  if (!newsDetailList) return;
  
  newsDetailList.innerHTML = newsItems.map(news => `
    <article class="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all">
      <div class="flex items-center space-x-3 mb-4">
        <span class="inline-block bg-zzonde-orange text-white px-4 py-2 rounded-full text-base font-semibold">
          ${news.category}
        </span>
        <span class="text-gray-500 text-base">${news.time}</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 mb-4 leading-relaxed">${news.title}</h2>
      <p class="text-xl text-gray-700 leading-relaxed mb-6">${news.summary}</p>
      <div class="flex items-center space-x-4">
        <button 
          onclick="speakNews('${news.id}')"
          data-title="${news.title.replace(/'/g, '&#39;')}"
          data-summary="${news.summary.replace(/'/g, '&#39;')}"
          class="flex-1 px-6 py-4 rounded-xl font-bold text-xl transition-all shadow-md"
          style="display: flex !important; align-items: center !important; justify-content: center !important; gap: 12px !important; min-height: 56px !important; background-color: #FF6D00 !important; color: #FFFFFF !important;"
        >
          <i class="fas fa-volume-up" style="font-size: 20px; color: #FFFFFF;"></i>
          <span style="display: inline-block; color: #FFFFFF !important; font-weight: 700; font-size: 18px;">읽어주기</span>
        </button>
        <button 
          onclick="shareNews('${news.id}')"
          class="flex-1 px-6 py-4 rounded-xl font-bold text-xl transition-all shadow-md"
          style="display: flex !important; align-items: center !important; justify-content: center !important; gap: 12px !important; min-height: 56px !important; background-color: #f3f4f6 !important; color: #222222 !important;"
        >
          <i class="fas fa-share-alt" style="font-size: 20px; color: #222222;"></i>
          <span style="display: inline-block; color: #222222 !important; font-weight: 700; font-size: 18px;">공유하기</span>
        </button>
      </div>
    </article>
  `).join('');
}

// Helper function for speaking news
function speakNews(newsId) {
  const button = event.target.closest('button');
  const title = button.getAttribute('data-title').replace(/&#39;/g, "'");
  const summary = button.getAttribute('data-summary').replace(/&#39;/g, "'");
  speak(`${title}. ${summary}`);
}

// Helper function for sharing news
function shareNews(newsId) {
  speak('공유 기능은 곧 제공될 예정입니다');
  // Future: Implement actual sharing functionality
}

// Click outside modal to close
document.addEventListener('click', (e) => {
  const modal = document.getElementById('voiceModal');
  if (modal && e.target === modal) {
    stopVoice();
  }
});

// Accessibility: Keyboard navigation
document.addEventListener('keydown', (e) => {
  // Escape key to close modal
  if (e.key === 'Escape') {
    const modal = document.getElementById('voiceModal');
    if (modal && !modal.classList.contains('hidden')) {
      stopVoice();
    }
  }
  
  // Ctrl/Cmd + K for voice search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    startVoice();
  }
});

// ===== Weather Functions =====

function speakWeather() {
  const temp = document.getElementById('currentTemp')?.textContent || '15';
  const weatherText = `현재 서울 날씨를 알려드립니다. 
    기온은 섭씨 ${temp}도이며, 맑은 날씨입니다. 
    습도는 60퍼센트, 바람은 초속 2.5미터입니다. 
    미세먼지와 초미세먼지 모두 좋음 단계로, 
    야외 활동하기 좋은 날씨입니다.`;
  
  speak(weatherText);
}

// ===== Health Functions =====

function takeMedicine(medicineName) {
  speak(`${medicineName} 복용을 완료하셨습니다. 좋아요!`);
  
  // Show success message
  const message = document.createElement('div');
  message.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-2xl z-50 animate-pulse';
  message.innerHTML = '<i class="fas fa-check-circle mr-2"></i>복약 완료!';
  document.body.appendChild(message);
  
  setTimeout(() => {
    message.remove();
  }, 3000);
}

function speakMedicineReminder() {
  const reminderText = `오늘의 복약 일정을 알려드립니다. 
    아침 8시 혈압약, 완료. 
    점심 12시 30분 소화제, 완료. 
    저녁 6시 비타민, 아직 복용하지 않으셨습니다. 
    잊지 말고 복용하세요!`;
  
  speak(reminderText);
}

function emergencyCall() {
  if (confirm('119에 연결하시겠습니까?')) {
    speak('119에 연결합니다');
    // In real app, this would trigger actual emergency call
    alert('실제 앱에서는 119에 자동으로 연결됩니다.');
  }
}

// ===== Initialize Page-specific Content =====

// Check current page and load appropriate content
const currentPath = window.location.pathname;

if (currentPath === '/weather') {
  console.log('Weather page loaded');
  // Could load real weather data here
}

if (currentPath === '/health') {
  console.log('Health page loaded');
  // Could load health data from localStorage or API
}

console.log('ZZONDE initialized successfully! 🚀');
