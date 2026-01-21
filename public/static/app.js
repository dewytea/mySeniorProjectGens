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
          onclick="speak('${news.title}. ${news.summary}')"
          class="flex-1 bg-zzonde-orange text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-zzonde-yellow transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <i class="fas fa-volume-up"></i>
          <span>읽어주기</span>
        </button>
        <button class="flex-1 bg-gray-100 text-gray-800 px-6 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all shadow-md flex items-center justify-center space-x-2">
          <i class="fas fa-share-alt"></i>
          <span>공유하기</span>
        </button>
      </div>
    </article>
  `).join('');
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

console.log('ZZONDE initialized successfully! 🚀');
