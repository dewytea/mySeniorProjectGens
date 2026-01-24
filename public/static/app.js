// ZZONDE - Voice + Touch Hybrid Platform
// Text Size Management
let currentTextSize = 'medium';

// User Profile Management
let currentUserName = localStorage.getItem('zzonde_user_name') || '김철수';
let currentUserTitle = localStorage.getItem('zzonde_user_title') || '프로님';

// Voice Command History
let voiceCommandHistory = JSON.parse(localStorage.getItem('zzonde_voice_history') || '[]');
const MAX_HISTORY = 10;

// Save user profile
function saveUserProfile() {
  const nameInput = document.getElementById('userName');
  const titleSelect = document.getElementById('userTitle');
  
  if (nameInput && nameInput.value.trim()) {
    currentUserName = nameInput.value.trim();
    localStorage.setItem('zzonde_user_name', currentUserName);
  }
  
  if (titleSelect) {
    currentUserTitle = titleSelect.value;
    localStorage.setItem('zzonde_user_title', currentUserTitle);
  }
  
  speak(`${currentUserName} ${currentUserTitle}으로 저장되었습니다. 반갑습니다!`);
  
  // Show success message
  showNotification('프로필이 저장되었습니다!', 'success');
}

// Load user profile in settings page
function loadUserProfile() {
  const nameInput = document.getElementById('userName');
  const titleSelect = document.getElementById('userTitle');
  
  if (nameInput) {
    nameInput.value = currentUserName;
  }
  
  if (titleSelect) {
    titleSelect.value = currentUserTitle;
  }
  
  // Load AI mode setting
  const aiModeToggle = document.getElementById('aiModeToggle');
  if (aiModeToggle) {
    const useAI = localStorage.getItem('zzonde_use_ai') === 'true';
    aiModeToggle.checked = useAI;
  }
  
  // Load location settings
  loadLocation();
  const currentLocationEl = document.getElementById('currentLocation');
  if (currentLocationEl) {
    if (isLocationSet()) {
      currentLocationEl.textContent = `${userLocation.sido} ${userLocation.sigungu} ${userLocation.dong}`;
      currentLocationEl.style.color = '#059669'; // green-600
      currentLocationEl.style.fontWeight = 'bold';
    } else {
      currentLocationEl.textContent = '아직 설정하지 않았어요';
      currentLocationEl.style.color = '#ef4444'; // red-500
    }
  }
  
  // Load range settings
  const rangeInputs = document.querySelectorAll('input[name="range"]');
  rangeInputs.forEach(input => {
    if (input.value === userLocation.range) {
      input.checked = true;
      // Highlight selected option
      input.parentElement.classList.add('border-green-500', 'bg-green-50');
      input.parentElement.classList.remove('border-gray-300');
    }
  });
}
    aiModeToggle.checked = useAI;
    
    // Update toggle UI
    const toggleSpan = aiModeToggle.nextElementSibling;
    if (useAI) {
      toggleSpan.classList.remove('bg-gray-300');
      toggleSpan.classList.add('bg-gradient-to-r', 'from-purple-500', 'to-pink-500');
    }
  }
}

// Toggle AI mode
function toggleAIMode(enabled) {
  localStorage.setItem('zzonde_use_ai', enabled ? 'true' : 'false');
  
  const toggleSpan = document.querySelector('#aiModeToggle + span');
  if (toggleSpan) {
    if (enabled) {
      toggleSpan.classList.remove('bg-gray-300');
      toggleSpan.classList.add('bg-gradient-to-r', 'from-purple-500', 'to-pink-500');
      speak('AI 음성 인식이 활성화되었습니다. 더 정확한 명령 이해가 가능합니다.');
      showNotification('AI 모드 활성화! 🤖', 'success');
    } else {
      toggleSpan.classList.remove('bg-gradient-to-r', 'from-purple-500', 'to-pink-500');
      toggleSpan.classList.add('bg-gray-300');
      speak('AI 음성 인식이 비활성화되었습니다. 기본 규칙 기반 인식을 사용합니다.');
      showNotification('기본 모드로 전환', 'info');
    }
  }
}

// Add command to history
function addToVoiceHistory(command, result) {
  const historyItem = {
    command: command,
    result: result,
    timestamp: new Date().toISOString(),
    displayTime: new Date().toLocaleString('ko-KR', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };
  
  voiceCommandHistory.unshift(historyItem);
  
  // Keep only last MAX_HISTORY items
  if (voiceCommandHistory.length > MAX_HISTORY) {
    voiceCommandHistory = voiceCommandHistory.slice(0, MAX_HISTORY);
  }
  
  localStorage.setItem('zzonde_voice_history', JSON.stringify(voiceCommandHistory));
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-20 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-full text-xl font-bold shadow-2xl z-50 animate-pulse`;
  
  if (type === 'success') {
    notification.className += ' bg-green-500 text-white';
    notification.innerHTML = '<i class="fas fa-check-circle mr-2"></i>' + message;
  } else if (type === 'error') {
    notification.className += ' bg-red-500 text-white';
    notification.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>' + message;
  } else {
    notification.className += ' bg-blue-500 text-white';
    notification.innerHTML = '<i class="fas fa-info-circle mr-2"></i>' + message;
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

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
  
  // Load user profile in settings page
  if (window.location.pathname === '/settings') {
    loadUserProfile();
    loadVoiceHistory();
  }
});

// Load and display voice history
function loadVoiceHistory() {
  const historyList = document.getElementById('voiceHistoryList');
  if (!historyList) return;
  
  if (voiceCommandHistory.length === 0) {
    historyList.innerHTML = '<p class="text-center text-gray-500 text-lg py-8">아직 음성 명령 기록이 없습니다</p>';
    return;
  }
  
  historyList.innerHTML = voiceCommandHistory.map(item => `
    <div class="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center space-x-3 mb-2">
            <i class="fas fa-microphone text-zzonde-orange text-xl"></i>
            <span class="text-xl font-bold text-gray-800">"${item.command}"</span>
          </div>
          <div class="flex items-center space-x-2 text-lg text-gray-600">
            <i class="fas fa-arrow-right text-green-600"></i>
            <span>${item.result}</span>
          </div>
        </div>
        <span class="text-base text-gray-500">${item.displayTime}</span>
      </div>
    </div>
  `).join('');
}

// Clear voice history
function clearVoiceHistory() {
  if (confirm('모든 음성 명령 기록을 삭제하시겠습니까?')) {
    voiceCommandHistory = [];
    localStorage.removeItem('zzonde_voice_history');
    loadVoiceHistory();
    speak('음성 명령 기록이 모두 삭제되었습니다.');
    showNotification('기록이 삭제되었습니다', 'success');
  }
}

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
  
  recognition.onresult = async function(event) {
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
      const useAI = localStorage.getItem('zzonde_use_ai') === 'true';
      
      if (useAI) {
        // AI Intent Recognition
        const intentResult = await recognizeIntentWithAI(finalTranscript);
        if (intentResult && !intentResult.fallback) {
          handleIntentResult(finalTranscript, intentResult);
        } else {
          // Fallback to rule-based
          handleVoiceCommand(finalTranscript);
        }
      } else {
        // Rule-based only
        handleVoiceCommand(finalTranscript);
      }
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

// AI Intent Recognition
async function recognizeIntentWithAI(command) {
  try {
    const response = await fetch('/api/ai-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command })
    });

    if (!response.ok) {
      throw new Error('AI API failed');
    }

    const result = await response.json();
    console.log('AI Intent Result:', result);
    return result;
  } catch (error) {
    console.error('AI Intent Recognition failed:', error);
    return null;
  }
}

// Handle intent result
function handleIntentResult(command, intentResult) {
  const userName = `${currentUserName} ${currentUserTitle}`;
  const intent = intentResult.intent;
  const aiResponse = intentResult.response || '';
  
  // Map intent to action
  const intentMap = {
    'jobs': '/jobs',
    'community': '/community',
    'marketplace': '/marketplace',
    'medicine': '/health',
    'todo': '/health',
    'news': '/news',
    'weather': '/weather',
    'health': '/health',
    'settings': '/settings',
    'home': '/'
  };
  
  // Text size intents
  if (intent === 'text_size_large') {
    addToVoiceHistory(command, '글씨 크기를 크게 변경 (AI)');
    speak(`네, 알겠습니다. ${userName}. ${aiResponse}`);
    setTimeout(() => changeTextSize('large'), 1500);
    stopVoice();
    return true;
  }
  
  if (intent === 'text_size_small') {
    addToVoiceHistory(command, '글씨 크기를 작게 변경 (AI)');
    speak(`네, 알겠습니다. ${userName}. ${aiResponse}`);
    setTimeout(() => changeTextSize('small'), 1500);
    stopVoice();
    return true;
  }
  
  if (intent === 'text_size_medium') {
    addToVoiceHistory(command, '글씨 크기를 보통으로 변경 (AI)');
    speak(`네, 알겠습니다. ${userName}. ${aiResponse}`);
    setTimeout(() => changeTextSize('medium'), 1500);
    stopVoice();
    return true;
  }
  
  // Navigation intents
  const targetPage = intentMap[intent];
  if (targetPage) {
    const resultText = `${intentResult.response} (AI 인식)`;
    addToVoiceHistory(command, resultText);
    speak(`네, 알겠습니다. ${userName}. ${aiResponse}`);
    setTimeout(() => {
      window.location.href = targetPage;
    }, 2000);
    stopVoice();
    return true;
  }
  
  // Unknown intent
  if (intent === 'unknown') {
    addToVoiceHistory(command, '명령을 이해하지 못함 (AI)');
    speak(`${userName}, ${aiResponse}. 다시 말씀해주시거나, 일자리 찾기, 동네 이야기, 복약 시간 등을 말씀해주세요.`);
    setTimeout(() => stopVoice(), 4000);
    return false;
  }
  
  return false;
}

function startVoice() {
  // Check if AI mode is enabled
  const useAI = localStorage.getItem('zzonde_use_ai') === 'true';
  
  if (!recognition) {
    // Web Speech API가 지원되지 않으면 prompt로 fallback
    speak('음성 인식이 지원되지 않습니다. 텍스트로 입력해주세요.');
    setTimeout(async () => {
      const userInput = prompt('무엇을 도와드릴까요? (예: 일자리 찾아줘, 심심해, 장터 보여줘)');
      if (userInput && userInput.trim()) {
        if (useAI) {
          // AI Intent Recognition
          const intentResult = await recognizeIntentWithAI(userInput.trim());
          if (intentResult && !intentResult.fallback) {
            handleIntentResult(userInput.trim(), intentResult);
          } else {
            // Fallback to rule-based
            handleVoiceCommand(userInput.trim());
          }
        } else {
          handleVoiceCommand(userInput.trim());
        }
      }
    }, 1000);
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
    } else {
      // 실패하면 prompt로 fallback
      stopVoice();
      setTimeout(async () => {
        const userInput = prompt('무엇을 도와드릴까요? (예: 일자리 찾아줘, 심심해, 장터 보여줘)');
        if (userInput && userInput.trim()) {
          if (useAI) {
            const intentResult = await recognizeIntentWithAI(userInput.trim());
            if (intentResult && !intentResult.fallback) {
              handleIntentResult(userInput.trim(), intentResult);
            } else {
              handleVoiceCommand(userInput.trim());
            }
          } else {
            handleVoiceCommand(userInput.trim());
          }
        }
      }, 500);
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

// Voice Command Handler with Smart Intent Recognition
function handleVoiceCommand(command) {
  console.log('음성 명령:', command);
  
  const lowerCommand = command.toLowerCase().replace(/\s/g, '');
  
  // Get user name from localStorage (default: 김철수 프로님)
  const userName = localStorage.getItem('zzonde_user_name') || '김철수 프로';
  
  // Intent 1: 일거리 찾기 (Jobs)
  if (lowerCommand.includes('일') || 
      lowerCommand.includes('일자리') || 
      lowerCommand.includes('돈') || 
      lowerCommand.includes('알바') ||
      lowerCommand.includes('직장') ||
      lowerCommand.includes('구인') ||
      lowerCommand.includes('아르바이트')) {
    speak(`네, 알겠습니다. ${userName}님. 일거리 찾기 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/jobs';
    }, 2000);
    stopVoice();
    return;
  }
  
  // Intent 2: 동네 이야기 (Community)
  if (lowerCommand.includes('심심') || 
      lowerCommand.includes('이야기') || 
      lowerCommand.includes('대화') ||
      lowerCommand.includes('채팅') ||
      lowerCommand.includes('친구') ||
      lowerCommand.includes('동네') ||
      lowerCommand.includes('이웃')) {
    speak(`네, 알겠습니다. ${userName}님. 동네 이야기 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/community';
    }, 2000);
    stopVoice();
    return;
  }
  
  // Intent 3: 나눔 장터 (Marketplace)
  if (lowerCommand.includes('장터') || 
      lowerCommand.includes('사고싶') || 
      lowerCommand.includes('주문') ||
      lowerCommand.includes('구매') ||
      lowerCommand.includes('판매') ||
      lowerCommand.includes('나눔') ||
      lowerCommand.includes('중고') ||
      lowerCommand.includes('쇼핑')) {
    speak(`네, 알겠습니다. ${userName}님. 나눔 장터 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/marketplace';
    }, 2000);
    stopVoice();
    return;
  }
  
  // Text size commands
  if (lowerCommand.includes('글씨') || lowerCommand.includes('글자')) {
    if (lowerCommand.includes('크게') || lowerCommand.includes('키워')) {
      speak(`네, 알겠습니다. ${userName}님. 글씨를 크게 변경합니다.`);
      setTimeout(() => {
        changeTextSize('large');
      }, 1500);
      stopVoice();
      return;
    } else if (lowerCommand.includes('작게') || lowerCommand.includes('줄여')) {
      speak(`네, 알겠습니다. ${userName}님. 글씨를 작게 변경합니다.`);
      setTimeout(() => {
        changeTextSize('small');
      }, 1500);
      stopVoice();
      return;
    } else if (lowerCommand.includes('보통')) {
      speak(`네, 알겠습니다. ${userName}님. 글씨를 보통 크기로 변경합니다.`);
      setTimeout(() => {
        changeTextSize('medium');
      }, 1500);
      stopVoice();
      return;
    }
  }
  
  // Navigation commands (기존 기능 유지)
  if (lowerCommand.includes('뉴스')) {
    speak(`네, 알겠습니다. ${userName}님. 뉴스 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/news';
    }, 2000);
    stopVoice();
    return;
  }
  
  if (lowerCommand.includes('날씨')) {
    speak(`네, 알겠습니다. ${userName}님. 날씨 정보를 확인합니다.`);
    setTimeout(() => {
      window.location.href = '/weather';
    }, 2000);
    stopVoice();
    return;
  }
  
  if (lowerCommand.includes('건강')) {
    speak(`네, 알겠습니다. ${userName}님. 건강 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/health';
    }, 2000);
    stopVoice();
    return;
  }
  
  if (lowerCommand.includes('설정')) {
    speak(`네, 알겠습니다. ${userName}님. 설정 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/settings';
    }, 2000);
    stopVoice();
    return;
  }
  
  if (lowerCommand.includes('홈') || lowerCommand.includes('처음')) {
    speak(`네, 알겠습니다. ${userName}님. 홈 화면으로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
    stopVoice();
    return;
  }
  
  // Default response with suggestions
  speak(`${userName}님, "${command}" 명령을 이해하지 못했습니다. 다시 말씀해주시거나, 일자리 찾기, 동네 이야기, 나눔 장터 등을 말씀해주세요.`);
  setTimeout(() => {
    stopVoice();
  }, 4000);
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

// ===== 🏘️ Location Management (마실 범위) =====

// Location data structure
let userLocation = {
  sido: localStorage.getItem('zzonde_sido') || null,
  sigungu: localStorage.getItem('zzonde_sigungu') || null,
  dong: localStorage.getItem('zzonde_dong') || null,
  range: localStorage.getItem('zzonde_range') || '옆동네까지' // 우리동네만, 옆동네까지, 구전체
};

// Korean administrative divisions data (simplified for MVP)
const locationData = {
  '서울특별시': {
    '강남구': ['역삼동', '대치동', '삼성동', '청담동', '논현동'],
    '서초구': ['서초동', '반포동', '방배동', '잠원동', '양재동'],
    '송파구': ['잠실동', '신천동', '풍납동', '송파동', '가락동'],
    '강동구': ['천호동', '성내동', '길동', '둔촌동', '암사동']
  },
  '부산광역시': {
    '해운대구': ['우동', '중동', '좌동', '송정동', '재송동'],
    '수영구': ['광안동', '남천동', '수영동', '망미동', '민락동']
  },
  '인천광역시': {
    '남동구': ['구월동', '간석동', '만수동', '서창동', '장수동'],
    '연수구': ['송도동', '옥련동', '동춘동', '청학동', '연수동']
  },
  '대구광역시': {
    '수성구': ['범어동', '만촌동', '수성동', '황금동', '중동'],
    '달서구': ['성당동', '두류동', '본동', '감삼동', '죽전동']
  },
  '경기도': {
    '수원시': ['팔달구', '장안구', '권선구', '영통구'],
    '성남시': ['분당구', '수정구', '중원구'],
    '고양시': ['일산동구', '일산서구', '덕양구']
  }
};

// Save location to localStorage
function saveLocation() {
  localStorage.setItem('zzonde_sido', userLocation.sido || '');
  localStorage.setItem('zzonde_sigungu', userLocation.sigungu || '');
  localStorage.setItem('zzonde_dong', userLocation.dong || '');
  localStorage.setItem('zzonde_range', userLocation.range || '옆동네까지');
}

// Load location from localStorage
function loadLocation() {
  userLocation.sido = localStorage.getItem('zzonde_sido') || null;
  userLocation.sigungu = localStorage.getItem('zzonde_sigungu') || null;
  userLocation.dong = localStorage.getItem('zzonde_dong') || null;
  userLocation.range = localStorage.getItem('zzonde_range') || '옆동네까지';
}

// Check if location is set
function isLocationSet() {
  return userLocation.sido && userLocation.sigungu && userLocation.dong;
}

// Show location onboarding modal
function showLocationOnboarding() {
  const modal = document.createElement('div');
  modal.id = 'locationModal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.style.display = 'flex';
  
  const sidoOptions = Object.keys(locationData).map(sido => 
    `<option value="${sido}">${sido}</option>`
  ).join('');
  
  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
      <div class="text-center mb-6">
        <div class="text-6xl mb-4">🏘️</div>
        <h2 class="text-3xl font-bold text-gray-800 mb-2">어디에서 마실 나가시나요?</h2>
        <p class="text-lg text-gray-600">가까운 동네 소식을 보여드릴게요</p>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-xl font-semibold text-gray-800 mb-2">
            <i class="fas fa-map-marked-alt text-zzonde-orange mr-2"></i>시/도
          </label>
          <select id="sidoSelect" class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none">
            <option value="">선택해주세요</option>
            ${sidoOptions}
          </select>
        </div>
        
        <div id="sigunguContainer" style="display: none;">
          <label class="block text-xl font-semibold text-gray-800 mb-2">
            <i class="fas fa-building text-zzonde-orange mr-2"></i>구/군
          </label>
          <select id="sigunguSelect" class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none">
            <option value="">선택해주세요</option>
          </select>
        </div>
        
        <div id="dongContainer" style="display: none;">
          <label class="block text-xl font-semibold text-gray-800 mb-2">
            <i class="fas fa-home text-zzonde-orange mr-2"></i>동/읍/면
          </label>
          <select id="dongSelect" class="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-zzonde-orange focus:outline-none">
            <option value="">선택해주세요</option>
          </select>
        </div>
      </div>
      
      <button 
        id="confirmLocationBtn" 
        class="w-full mt-6 bg-gradient-to-r from-zzonde-orange to-zzonde-yellow text-white px-8 py-4 rounded-full font-bold text-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        disabled
      >
        <i class="fas fa-check-circle mr-2"></i>이 동네로 정할게요!
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  const sidoSelect = document.getElementById('sidoSelect');
  const sigunguSelect = document.getElementById('sigunguSelect');
  const dongSelect = document.getElementById('dongSelect');
  const sigunguContainer = document.getElementById('sigunguContainer');
  const dongContainer = document.getElementById('dongContainer');
  const confirmBtn = document.getElementById('confirmLocationBtn');
  
  sidoSelect.addEventListener('change', function() {
    const sido = this.value;
    if (sido && locationData[sido]) {
      sigunguContainer.style.display = 'block';
      sigunguSelect.innerHTML = '<option value="">선택해주세요</option>' +
        Object.keys(locationData[sido]).map(sigungu => 
          `<option value="${sigungu}">${sigungu}</option>`
        ).join('');
      dongContainer.style.display = 'none';
      dongSelect.innerHTML = '<option value="">선택해주세요</option>';
      confirmBtn.disabled = true;
    }
  });
  
  sigunguSelect.addEventListener('change', function() {
    const sido = sidoSelect.value;
    const sigungu = this.value;
    if (sido && sigungu && locationData[sido][sigungu]) {
      dongContainer.style.display = 'block';
      const dongList = locationData[sido][sigungu];
      dongSelect.innerHTML = '<option value="">선택해주세요</option>' +
        dongList.map(dong => 
          `<option value="${dong}">${dong}</option>`
        ).join('');
      confirmBtn.disabled = true;
    }
  });
  
  dongSelect.addEventListener('change', function() {
    confirmBtn.disabled = !this.value;
  });
  
  confirmBtn.addEventListener('click', function() {
    userLocation.sido = sidoSelect.value;
    userLocation.sigungu = sigunguSelect.value;
    userLocation.dong = dongSelect.value;
    saveLocation();
    
    modal.remove();
    speak(`${userLocation.dong}으로 설정되었습니다. 이제 가까운 동네 소식을 보여드릴게요!`);
    showNotification(`마실 동네: ${userLocation.dong} 🏘️`, 'success');
    
    // Reload current page to show filtered content
    if (window.location.pathname !== '/') {
      window.location.reload();
    }
  });
}

// Change location (for settings page)
function changeLocation() {
  showLocationOnboarding();
}

// Get location display text
function getLocationText() {
  if (!isLocationSet()) return '동네 설정 필요';
  return `${userLocation.dong}`;
}

// Get location range display text
function getRangeText() {
  const ranges = {
    '우리동네만': '걸어서 10분',
    '옆동네까지': '걸어서 20분',
    '구전체': '버스 타고 30분'
  };
  return ranges[userLocation.range] || '걸어서 20분';
}

// Update range setting
function updateRange(range) {
  userLocation.range = range;
  saveLocation();
  showNotification(`마실 범위: ${getRangeText()} 🚶`, 'success');
  
  // Reload if on content pages
  if (['/jobs', '/community', '/marketplace'].includes(window.location.pathname)) {
    window.location.reload();
  }
}

// Check location on page load
document.addEventListener('DOMContentLoaded', function() {
  loadLocation();
  
  // Show onboarding if location not set and on main pages
  const mainPages = ['/', '/jobs', '/community', '/marketplace'];
  if (!isLocationSet() && mainPages.includes(window.location.pathname)) {
    setTimeout(() => {
      showLocationOnboarding();
    }, 1000); // Show after 1 second
  }
});
