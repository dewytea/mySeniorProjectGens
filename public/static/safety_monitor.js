// ZZonde Safety Monitor - 위급 상황 감지 및 알림
// 사용자의 안전을 보장하는 모니터링 시스템

class SafetyMonitor {
  constructor() {
    this.emergencyContacts = this.loadEmergencyContacts();
    this.emergencyHistory = [];
    this.isMonitoring = false;
    this.checkInterval = null;
  }

  // 비상 연락처 로드
  loadEmergencyContacts() {
    const stored = localStorage.getItem('zzonde_emergency_contacts');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      { name: '119', phone: '119', type: 'emergency' },
      { name: '가족', phone: '', type: 'family' }
    ];
  }

  // 비상 연락처 저장
  saveEmergencyContacts(contacts) {
    localStorage.setItem('zzonde_emergency_contacts', JSON.stringify(contacts));
    this.emergencyContacts = contacts;
  }

  // 위급 상황 확인
  checkEmergency(text, context = {}) {
    const detection = memoryService.detectEmergency(text);

    if (detection.isEmergency) {
      this.handleEmergency(detection, text, context);
    }

    return detection;
  }

  // 위급 상황 처리
  handleEmergency(detection, originalText, context) {
    const emergency = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      level: detection.level,
      text: originalText,
      keywords: detection.keywords,
      emotion: detection.emotion,
      context: context,
      resolved: false
    };

    this.emergencyHistory.push(emergency);

    // UI 알림 표시
    this.showEmergencyUI(emergency);

    // 음성 안내
    if (detection.level === 'critical') {
      speak('위급 상황이 감지되었습니다. 도움이 필요하신가요?');
    } else if (detection.level === 'warning') {
      speak('많이 힘드신 것 같아요. 괜찮으신가요?');
    }

    // 로그 기록
    console.error('Emergency detected:', emergency);

    return emergency;
  }

  // 위급 상황 UI 표시
  showEmergencyUI(emergency) {
    // 기존 모달 제거
    const existingModal = document.getElementById('emergencyModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'emergencyModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn 0.3s ease-in-out';

    const isCritical = emergency.level === 'critical';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
        <div class="text-center mb-6">
          <div class="w-24 h-24 mx-auto mb-4 rounded-full ${isCritical ? 'bg-red-100' : 'bg-yellow-100'} flex items-center justify-center">
            <i class="fas ${isCritical ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'} text-6xl ${isCritical ? 'text-red-500' : 'text-yellow-500'}"></i>
          </div>
          <h2 class="text-3xl font-bold text-gray-800 mb-3">
            ${isCritical ? '⚠️ 위급 상황 감지' : '😟 걱정되시나요?'}
          </h2>
          <p class="text-xl text-gray-600 leading-relaxed">
            ${isCritical 
              ? '도움이 필요하신 것 같아요. 지금 바로 연락하시겠어요?' 
              : '많이 힘드신 것 같아요. 누군가와 이야기하고 싶으신가요?'}
          </p>
        </div>

        <div class="space-y-3 mb-6">
          ${isCritical ? `
            <button 
              onclick="safetyMonitor.call119()"
              class="w-full bg-red-500 text-white px-8 py-6 rounded-full font-bold text-2xl hover:bg-red-600 transition-all shadow-lg flex items-center justify-center space-x-3"
            >
              <i class="fas fa-phone-alt text-3xl"></i>
              <span>119 긴급 전화</span>
            </button>
          ` : ''}

          ${this.emergencyContacts.filter(c => c.type === 'family' && c.phone).length > 0 ? `
            <button 
              onclick="safetyMonitor.callFamily()"
              class="w-full bg-blue-500 text-white px-8 py-6 rounded-full font-bold text-2xl hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center space-x-3"
            >
              <i class="fas fa-user-friends text-3xl"></i>
              <span>가족에게 전화</span>
            </button>
          ` : ''}

          <button 
            onclick="safetyMonitor.talkToAI()"
            class="w-full bg-zzonde-orange text-white px-8 py-6 rounded-full font-bold text-2xl hover:bg-zzonde-yellow transition-all shadow-lg flex items-center justify-center space-x-3"
          >
            <i class="fas fa-comment-dots text-3xl"></i>
            <span>존디와 이야기하기</span>
          </button>

          <button 
            onclick="safetyMonitor.dismissEmergency('${emergency.id}')"
            class="w-full bg-gray-300 text-gray-700 px-8 py-4 rounded-full font-bold text-xl hover:bg-gray-400 transition-all"
          >
            괜찮아요, 닫기
          </button>
        </div>

        <div class="text-center text-base text-gray-500">
          <p>언제든지 도움이 필요하시면 말씀해 주세요</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 애니메이션 CSS 추가
    if (!document.getElementById('emergencyStyles')) {
      const style = document.createElement('style');
      style.id = 'emergencyStyles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 119 전화
  call119() {
    speak('119에 연결합니다');
    
    if (confirm('119에 전화를 걸까요?')) {
      // 실제 앱에서는 전화 API 사용
      window.location.href = 'tel:119';
      this.logEmergencyAction('119_called');
    }
  }

  // 가족에게 전화
  callFamily() {
    const familyContact = this.emergencyContacts.find(c => c.type === 'family' && c.phone);
    
    if (familyContact) {
      speak(`${familyContact.name}에게 전화를 겁니다`);
      
      if (confirm(`${familyContact.name} (${familyContact.phone})에게 전화를 걸까요?`)) {
        window.location.href = `tel:${familyContact.phone}`;
        this.logEmergencyAction('family_called', familyContact);
      }
    } else {
      speak('등록된 가족 연락처가 없습니다');
      showNotification('가족 연락처를 먼저 등록해주세요', 'info');
    }
  }

  // AI와 대화
  talkToAI() {
    this.dismissEmergency();
    speak('제가 옆에 있어요. 무엇이든 말씀해 주세요');
    
    // 음성 동반자 화면으로 이동
    if (window.location.pathname !== '/companion') {
      window.location.href = '/companion';
    } else {
      // 이미 동반자 페이지라면 음성 입력 활성화
      const voiceBtn = document.getElementById('companionVoiceBtn');
      if (voiceBtn) {
        voiceBtn.click();
      }
    }
  }

  // 위급 상황 모달 닫기
  dismissEmergency(emergencyId) {
    const modal = document.getElementById('emergencyModal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    }

    if (emergencyId) {
      const emergency = this.emergencyHistory.find(e => e.id == emergencyId);
      if (emergency) {
        emergency.resolved = true;
        emergency.resolvedAt = new Date().toISOString();
      }
    }

    speak('언제든지 필요하시면 말씀해 주세요');
  }

  // 위급 상황 액션 로깅
  logEmergencyAction(action, data = {}) {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      data
    };

    const logs = JSON.parse(localStorage.getItem('zzonde_emergency_logs') || '[]');
    logs.push(log);

    // 최근 50개만 유지
    if (logs.length > 50) {
      logs.shift();
    }

    localStorage.setItem('zzonde_emergency_logs', JSON.stringify(logs));
  }

  // 주기적 안전 체크 시작
  startMonitoring(interval = 60000) { // 기본 1분마다
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.checkInterval = setInterval(() => {
      this.periodicCheck();
    }, interval);

    console.log('Safety monitoring started 🛡️');
  }

  // 주기적 체크
  periodicCheck() {
    const recentMemories = memoryService.getRecentMemories(5);
    
    // 최근 대화에서 부정적 감정 패턴 확인
    const negativeCount = recentMemories.filter(m => 
      m.metadata.emotion === 'sad' || m.metadata.emotion === 'worried'
    ).length;

    if (negativeCount >= 3) {
      speak('요즘 많이 힘드신 것 같아요. 제가 도와드릴 수 있을까요?');
    }
  }

  // 모니터링 중지
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('Safety monitoring stopped');
  }

  // 위급 상황 히스토리 가져오기
  getEmergencyHistory() {
    return this.emergencyHistory;
  }

  // 미해결 위급 상황 확인
  getUnresolvedEmergencies() {
    return this.emergencyHistory.filter(e => !e.resolved);
  }
}

// 싱글톤 인스턴스
const safetyMonitor = new SafetyMonitor();

// 앱 시작 시 모니터링 시작
safetyMonitor.startMonitoring();

console.log('Safety Monitor initialized 🛡️');
