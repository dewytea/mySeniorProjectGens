// ZZonde Companion - AI 동반자 '존디' 인터페이스
// 사용자와 AI의 자연스러운 대화를 관리

class CompanionManager {
  constructor() {
    this.isListening = false;
    this.conversationActive = false;
    this.activeGreeting = localStorage.getItem('zzonde_active_greeting') !== 'false';
    this.lastGreetingTime = localStorage.getItem('zzonde_last_greeting');
  }

  // 페이지 로드 시 초기화
  initialize() {
    // 능동적 인사 (하루에 한 번)
    if (this.activeGreeting) {
      this.checkAndGreet();
    }

    // 최근 대화 로드
    this.loadConversationHistory();

    // 컨텍스트 업데이트
    this.updateContextDisplay();
  }

  // 능동적 인사 확인 및 실행
  checkAndGreet() {
    const today = new Date().toDateString();
    const lastGreeting = this.lastGreetingTime;

    if (lastGreeting !== today) {
      // 3초 후 인사
      setTimeout(() => {
        this.greetUser();
        localStorage.setItem('zzonde_last_greeting', today);
      }, 3000);
    }
  }

  // 사용자에게 인사
  async greetUser() {
    const context = memoryService.getUserContext();
    const userName = context.name || '사용자';
    const hour = new Date().getHours();

    let greeting = '';
    let timeOfDay = '';

    if (hour < 12) {
      timeOfDay = '아침';
      greeting = `좋은 아침이에요, ${userName}님! 잘 주무셨나요?`;
    } else if (hour < 18) {
      timeOfDay = '오후';
      greeting = `안녕하세요, ${userName}님! 점심은 드셨어요?`;
    } else {
      timeOfDay = '저녁';
      greeting = `좋은 저녁이에요, ${userName}님! 오늘 하루는 어떠셨어요?`;
    }

    // 컨텍스트 기반 추가 멘트
    const recentConcerns = context.concerns.filter(c => !c.resolved).slice(-1);
    if (recentConcerns.length > 0) {
      const daysPassed = Math.floor((Date.now() - new Date(recentConcerns[0].timestamp)) / (1000 * 60 * 60 * 24));
      if (daysPassed <= 1) {
        greeting += ` 어제 걱정하시던 일은 좀 나아지셨나요?`;
      }
    }

    // 음성 + 화면에 표시
    speak(greeting);
    this.addMessage('ai', greeting);

    // 메모리에 저장
    memoryService.saveConversation('[시스템: 능동적 인사]', greeting, {
      type: 'greeting',
      timeOfDay
    });
  }

  // 음성 입력 시작
  async startVoice() {
    if (!recognition) {
      speak('음성 인식이 지원되지 않습니다');
      showNotification('음성 인식 미지원', 'error');
      return;
    }

    const button = document.getElementById('companionVoiceBtn');
    if (button) {
      button.classList.add('animate-pulse');
      button.style.background = 'linear-gradient(to bottom right, #ef4444, #dc2626)';
    }

    speak('들고 있어요, 말씀해 주세요');

    try {
      recognition.start();
      this.isListening = true;
    } catch (e) {
      console.error('음성 인식 시작 오류:', e);
      if (this.isListening) {
        recognition.stop();
        setTimeout(() => recognition.start(), 100);
      }
    }
  }

  // 음성 입력 중지
  stopVoice() {
    if (recognition && this.isListening) {
      recognition.stop();
    }

    const button = document.getElementById('companionVoiceBtn');
    if (button) {
      button.classList.remove('animate-pulse');
      button.style.background = 'linear-gradient(to bottom right, #FF6D00, #FFD600)';
    }

    this.isListening = false;
  }

  // 메시지 전송
  async sendMessage(userMessage) {
    if (!userMessage || !userMessage.trim()) return;

    // 사용자 메시지 표시
    this.addMessage('user', userMessage);

    // 안전 체크
    const emergency = safetyMonitor.checkEmergency(userMessage);

    // 로딩 표시
    const loadingId = this.addMessage('ai', '생각 중...', true);

    // AI 응답 생성
    try {
      const aiResponse = await this.generateAIResponse(userMessage, emergency);

      // 로딩 메시지 제거
      this.removeMessage(loadingId);

      // AI 응답 표시
      this.addMessage('ai', aiResponse);

      // TTS
      speak(aiResponse);

      // 메모리 저장
      memoryService.saveConversation(userMessage, aiResponse, {
        emergency: emergency.isEmergency,
        timestamp: new Date().toISOString()
      });

      // 컨텍스트 업데이트
      this.updateContextDisplay();

    } catch (error) {
      console.error('AI 응답 생성 오류:', error);
      this.removeMessage(loadingId);
      this.addMessage('ai', '죄송해요, 잠시 후 다시 말씀해 주시겠어요?');
    }
  }

  // AI 응답 생성
  async generateAIResponse(userMessage, emergency) {
    const contextPrompt = memoryService.generateContextualPrompt(userMessage);

    try {
      // GenSpark AI API 호출
      const response = await fetch('https://www.genspark.ai/api/llm_proxy/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer gsk-default'
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: [
            {
              role: 'system',
              content: `당신은 '존디'라는 이름의 시니어를 위한 AI 동반자입니다. 
              
특징:
- 따뜻하고 공감하는 말투 사용
- 존댓말 사용 (예: ~세요, ~하세요)
- 짧고 명확한 문장 (한 문장은 20자 이내)
- 이모티콘 적절히 사용
- 사용자의 과거 대화 내용을 기억하고 언급
- 건강과 안전을 최우선으로 고려

금지 사항:
- 의료 진단이나 처방
- 법률 자문
- 금융 조언`
            },
            {
              role: 'user',
              content: contextPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error('AI API 오류');
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('AI API 호출 실패:', error);

      // Fallback: 간단한 규칙 기반 응답
      return this.generateFallbackResponse(userMessage, emergency);
    }
  }

  // Fallback 응답 (API 실패 시)
  generateFallbackResponse(userMessage, emergency) {
    const context = memoryService.getUserContext();
    const userName = context.name || '사용자';

    if (emergency.isEmergency) {
      return `${userName}님, 많이 힘드신 것 같아요. 제가 옆에 있어요. 도움이 필요하시면 언제든 말씀해 주세요.`;
    }

    const emotion = emergency.emotion;

    if (emotion === 'sad' || emotion === 'worried') {
      return `${userName}님, 괜찮으세요? 무슨 일이 있으신가요? 제가 들어드릴게요.`;
    }

    if (emotion === 'happy') {
      return `${userName}님, 기분이 좋아 보여서 저도 기뻐요! 😊`;
    }

    // 기본 응답
    const responses = [
      `네, ${userName}님. 잘 들었어요.`,
      `${userName}님, 그렇군요. 더 말씀해 주시겠어요?`,
      `알겠습니다, ${userName}님. 제가 도와드릴 수 있는 게 있을까요?`,
      `${userName}님의 말씀을 잘 이해했어요.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  // 대화 메시지 추가
  addMessage(sender, text, isLoading = false) {
    const container = document.getElementById('conversationList');
    if (!container) return null;

    // 빈 상태 메시지 제거
    const emptyState = container.querySelector('.text-center.text-gray-400');
    if (emptyState) {
      emptyState.remove();
    }

    const messageId = `msg-${Date.now()}`;
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`;

    const bubbleClass = sender === 'user'
      ? 'bg-zzonde-orange text-white'
      : 'bg-gray-100 text-gray-800';

    messageDiv.innerHTML = `
      <div class="${bubbleClass} rounded-2xl px-6 py-4 max-w-[80%] shadow-md">
        <p class="text-xl leading-relaxed">${text}</p>
        ${!isLoading ? `<p class="text-sm mt-2 opacity-70">${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</p>` : ''}
      </div>
    `;

    container.appendChild(messageDiv);

    // 스크롤 하단으로
    container.parentElement.scrollTop = container.parentElement.scrollHeight;

    return messageId;
  }

  // 메시지 제거
  removeMessage(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
      message.remove();
    }
  }

  // 대화 히스토리 로드
  loadConversationHistory() {
    const memories = memoryService.getRecentMemories(10);
    const container = document.getElementById('conversationList');

    if (!container || memories.length === 0) return;

    // 빈 상태 제거
    container.innerHTML = '';

    // 역순으로 표시 (오래된 것부터)
    memories.reverse().forEach(memory => {
      this.addMessage('user', memory.userMessage);
      this.addMessage('ai', memory.aiResponse);
    });
  }

  // 컨텍스트 표시 업데이트
  updateContextDisplay() {
    const context = memoryService.getUserContext();
    const detailsEl = document.getElementById('contextDetails');

    if (detailsEl) {
      detailsEl.innerHTML = `
        <p><strong>이름:</strong> ${context.name}</p>
        <p><strong>건강:</strong> ${context.healthConditions.slice(-3).join(', ') || '정보 없음'}</p>
        <p><strong>가족:</strong> ${context.familyMembers.slice(-3).join(', ') || '정보 없음'}</p>
        <p><strong>최근 걱정:</strong> ${context.concerns.length > 0 ? context.concerns[context.concerns.length - 1].text.slice(0, 30) + '...' : '없음'}</p>
      `;
    }
  }
}

// 전역 인스턴스
const companionManager = new CompanionManager();

// 음성 인식 설정 (companion 전용)
if (window.location.pathname === '/companion' && recognition) {
  recognition.onresult = async function(event) {
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      companionManager.stopVoice();
      await companionManager.sendMessage(finalTranscript);
    }
  };

  recognition.onend = function() {
    companionManager.stopVoice();
  };
}

// 전역 함수들
function startCompanionVoice() {
  companionManager.startVoice();
}

function sendQuickMessage(message) {
  companionManager.sendMessage(message);
}

function toggleCompanionSettings() {
  const panel = document.getElementById('companionSettings');
  if (panel) {
    panel.classList.toggle('hidden');
  }
}

function toggleActiveGreeting(enabled) {
  localStorage.setItem('zzonde_active_greeting', enabled ? 'true' : 'false');
  companionManager.activeGreeting = enabled;

  if (enabled) {
    speak('이제 제가 먼저 인사할게요!');
  } else {
    speak('알겠습니다. 필요하실 때 불러주세요.');
  }
}

function manageEmergencyContacts() {
  showNotification('비상 연락처 관리 기능 준비중', 'info');
  // TODO: 비상 연락처 관리 UI 구현
}

function showContextDebug() {
  const infoEl = document.getElementById('contextInfo');
  if (infoEl) {
    infoEl.style.display = infoEl.style.display === 'none' ? 'block' : 'none';
  }
  companionManager.updateContextDisplay();
}

// 페이지 로드 시 초기화
if (window.location.pathname === '/companion') {
  document.addEventListener('DOMContentLoaded', function() {
    companionManager.initialize();
  });
}

// 애니메이션 CSS 추가
if (!document.getElementById('companionStyles')) {
  const style = document.createElement('style');
  style.id = 'companionStyles';
  style.textContent = `
    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `;
  document.head.appendChild(style);
}

console.log('Companion Manager initialized 🤖');
