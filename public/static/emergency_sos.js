// ZZonde Emergency SOS System
// 시니어를 위한 긴급 구조 요청 시스템

class EmergencySOSSystem {
  constructor() {
    this.isSOSActive = false;
    this.countdown = null;
    this.countdownValue = 3;
    this.userLocation = null;
    this.emergencyContacts = this.loadEmergencyContacts();
    
    // SOS 버튼 생성
    this.createSOSButton();
    
    // 위치 정보 권한 요청
    this.requestLocationPermission();
  }

  // 비상 연락처 로드
  loadEmergencyContacts() {
    const stored = localStorage.getItem('zzonde_emergency_contacts');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      { id: 1, name: '119', phone: '119', type: 'emergency', isPrimary: true },
      { id: 2, name: '가족', phone: '', type: 'family', isPrimary: false }
    ];
  }

  // 비상 연락처 저장
  saveEmergencyContacts(contacts) {
    localStorage.setItem('zzonde_emergency_contacts', JSON.stringify(contacts));
    this.emergencyContacts = contacts;
  }

  // SOS 플로팅 버튼 생성
  createSOSButton() {
    // 기존 버튼 제거
    const existingBtn = document.getElementById('sosFloatingButton');
    if (existingBtn) {
      existingBtn.remove();
    }

    const sosButton = document.createElement('div');
    sosButton.id = 'sosFloatingButton';
    sosButton.innerHTML = `
      <button 
        id="sosBtn"
        class="sos-button"
        aria-label="긴급 SOS"
      >
        <i class="fas fa-exclamation-triangle text-4xl"></i>
        <span class="sos-text">SOS</span>
      </button>

      <style>
        .sos-button {
          position: fixed;
          bottom: 140px;
          right: 20px;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #ff0000, #cc0000);
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 8px 30px rgba(255, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          z-index: 9999;
          transition: all 0.3s ease;
          animation: pulse-sos 2s infinite;
        }

        .sos-button:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 40px rgba(255, 0, 0, 0.7);
        }

        .sos-button:active {
          transform: scale(0.95);
        }

        .sos-text {
          font-size: 14px;
          font-weight: 900;
          margin-top: 2px;
          letter-spacing: 1px;
        }

        @keyframes pulse-sos {
          0%, 100% {
            box-shadow: 0 8px 30px rgba(255, 0, 0, 0.5);
          }
          50% {
            box-shadow: 0 8px 40px rgba(255, 0, 0, 0.8), 0 0 0 0 rgba(255, 0, 0, 0.7);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .sos-button.active {
          animation: shake 0.5s ease infinite, pulse-sos 0.5s ease infinite;
        }

        /* 모바일 최적화 */
        @media (max-width: 768px) {
          .sos-button {
            width: 70px;
            height: 70px;
            bottom: 120px;
            right: 15px;
          }
          
          .sos-button i {
            font-size: 1.75rem;
          }
          
          .sos-text {
            font-size: 12px;
          }
        }
      </style>
    `;

    document.body.appendChild(sosButton);

    // 이벤트 리스너 등록
    const btn = document.getElementById('sosBtn');
    btn.addEventListener('click', () => this.activateSOS());
  }

  // 위치 정보 권한 요청
  requestLocationPermission() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          console.log('Location permission granted 📍');
        },
        (error) => {
          console.warn('Location permission denied:', error);
          this.userLocation = null;
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }

  // 현재 위치 가져오기 (실시간)
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('위치 정보를 사용할 수 없습니다'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  // SOS 활성화
  async activateSOS() {
    if (this.isSOSActive) return;

    this.isSOSActive = true;

    // 버튼 애니메이션
    const btn = document.getElementById('sosBtn');
    btn.classList.add('active');

    // 진동 (모바일)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // 음성 안내
    speak('긴급 상황을 감지했습니다. 3초 후 자동으로 연결됩니다');

    // 위치 정보 업데이트
    try {
      this.userLocation = await this.getCurrentLocation();
    } catch (error) {
      console.error('위치 정보를 가져올 수 없습니다:', error);
    }

    // SOS 모달 표시 (카운트다운 포함)
    this.showSOSModal();
  }

  // SOS 모달 표시
  showSOSModal() {
    // 기존 모달 제거
    const existingModal = document.getElementById('sosModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'sosModal';
    modal.className = 'fixed inset-0 bg-red-900 bg-opacity-90 z-[10000] flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn 0.3s ease-in-out';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-scale-in relative">
        <!-- 카운트다운 원형 표시 -->
        <div class="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div class="w-32 h-32 rounded-full bg-red-500 flex items-center justify-center shadow-2xl border-8 border-white animate-countdown-pulse">
            <span id="countdownNumber" class="text-6xl font-black text-white">${this.countdownValue}</span>
          </div>
        </div>

        <div class="text-center mt-20 mb-6">
          <h2 class="text-4xl font-black text-red-600 mb-4 animate-pulse">
            🚨 긴급 SOS 활성화 🚨
          </h2>
          <p class="text-2xl text-gray-700 font-bold mb-2">
            ${this.countdownValue}초 후 자동 연결됩니다
          </p>
          <p class="text-lg text-gray-600">
            실수로 눌렀다면 아래 취소 버튼을 눌러주세요
          </p>
        </div>

        ${this.userLocation ? `
          <div class="bg-blue-50 rounded-xl p-4 mb-6 border-2 border-blue-200">
            <p class="text-lg font-semibold text-blue-800 mb-2 flex items-center">
              <i class="fas fa-map-marker-alt mr-2"></i>
              현재 위치 정보
            </p>
            <p class="text-base text-blue-700">
              위도: ${this.userLocation.latitude.toFixed(6)}<br>
              경도: ${this.userLocation.longitude.toFixed(6)}
            </p>
          </div>
        ` : `
          <div class="bg-yellow-50 rounded-xl p-4 mb-6 border-2 border-yellow-200">
            <p class="text-lg font-semibold text-yellow-800 flex items-center">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              위치 정보를 가져올 수 없습니다
            </p>
          </div>
        `}

        <div class="space-y-3">
          <!-- 119 즉시 연결 -->
          <button 
            onclick="emergencySOSSystem.call119Immediately()"
            class="w-full bg-red-600 text-white px-8 py-6 rounded-full font-black text-2xl hover:bg-red-700 transition-all shadow-xl flex items-center justify-center space-x-3"
          >
            <i class="fas fa-phone-alt text-3xl"></i>
            <span>지금 바로 119 연결</span>
          </button>

          ${this.emergencyContacts.filter(c => c.type === 'family' && c.phone).map(contact => `
            <button 
              onclick="emergencySOSSystem.callContact('${contact.id}')"
              class="w-full bg-blue-600 text-white px-8 py-6 rounded-full font-black text-2xl hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center space-x-3"
            >
              <i class="fas fa-user-friends text-3xl"></i>
              <span>${contact.name}에게 연락</span>
            </button>
          `).join('')}

          <!-- 취소 버튼 -->
          <button 
            onclick="emergencySOSSystem.cancelSOS()"
            class="w-full bg-gray-300 text-gray-800 px-8 py-4 rounded-full font-bold text-xl hover:bg-gray-400 transition-all shadow-lg"
          >
            <i class="fas fa-times mr-2"></i>
            실수였어요, 취소할게요
          </button>
        </div>

        <div class="mt-6 text-center text-base text-gray-500">
          <p>자동 연결을 원하지 않으시면 취소 버튼을 눌러주세요</p>
        </div>
      </div>

      <style>
        @keyframes countdown-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        .animate-countdown-pulse {
          animation: countdown-pulse 1s ease-in-out infinite;
        }
      </style>
    `;

    document.body.appendChild(modal);

    // 카운트다운 시작
    this.startCountdown();
  }

  // 카운트다운 시작
  startCountdown() {
    this.countdownValue = 3;

    this.countdown = setInterval(() => {
      this.countdownValue--;

      const countdownEl = document.getElementById('countdownNumber');
      if (countdownEl) {
        countdownEl.textContent = this.countdownValue;

        // 진동
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      }

      // 카운트다운 음성
      speak(this.countdownValue.toString());

      if (this.countdownValue <= 0) {
        clearInterval(this.countdown);
        this.executeEmergencyCall();
      }
    }, 1000);
  }

  // 자동 긴급 전화 실행
  executeEmergencyCall() {
    speak('119에 연결합니다');
    
    // 119 연결
    this.call119Immediately();
    
    // 모달 닫기
    this.closeSOS Modal();
  }

  // 119 즉시 연결
  call119Immediately() {
    // 카운트다운 취소
    if (this.countdown) {
      clearInterval(this.countdown);
    }

    // 로그 기록
    this.logEmergencyCall('119', this.userLocation);

    // 음성 안내
    speak('119 긴급 전화로 연결합니다');

    // 전화 연결
    window.location.href = 'tel:119';

    // SMS로 위치 정보 전송 (가능한 경우)
    if (this.userLocation) {
      const message = `긴급 상황입니다! 제 위치: https://maps.google.com/?q=${this.userLocation.latitude},${this.userLocation.longitude}`;
      
      // 가족에게도 SMS 전송
      const familyContacts = this.emergencyContacts.filter(c => c.type === 'family' && c.phone);
      familyContacts.forEach(contact => {
        const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
        setTimeout(() => {
          // 새 창에서 SMS 앱 열기 (방해하지 않도록)
          window.open(smsUrl, '_blank');
        }, 1000);
      });
    }

    // 모달 닫기
    this.closeSOSModal();
  }

  // 특정 연락처에 전화
  callContact(contactId) {
    const contact = this.emergencyContacts.find(c => c.id == contactId);
    
    if (!contact || !contact.phone) {
      showNotification('연락처 정보가 없습니다', 'error');
      return;
    }

    // 카운트다운 취소
    if (this.countdown) {
      clearInterval(this.countdown);
    }

    // 로그 기록
    this.logEmergencyCall(contact.name, this.userLocation, contact.phone);

    // 음성 안내
    speak(`${contact.name}에게 전화를 겁니다`);

    // 전화 연결
    window.location.href = `tel:${contact.phone}`;

    // SMS로 위치 정보 전송
    if (this.userLocation) {
      const message = `긴급 상황입니다! 제 위치: https://maps.google.com/?q=${this.userLocation.latitude},${this.userLocation.longitude}`;
      const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
      
      setTimeout(() => {
        window.open(smsUrl, '_blank');
      }, 1000);
    }

    // 모달 닫기
    this.closeSOSModal();
  }

  // SOS 취소
  cancelSOS() {
    // 카운트다운 중지
    if (this.countdown) {
      clearInterval(this.countdown);
      this.countdown = null;
    }

    // 음성 안내
    speak('긴급 호출이 취소되었습니다');

    // 버튼 애니메이션 제거
    const btn = document.getElementById('sosBtn');
    if (btn) {
      btn.classList.remove('active');
    }

    // 모달 닫기
    this.closeSOSModal();

    // 상태 초기화
    this.isSOSActive = false;

    // 로그 기록
    this.logEmergencyCall('cancelled', this.userLocation);
  }

  // SOS 모달 닫기
  closeSOSModal() {
    const modal = document.getElementById('sosModal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.remove();
        this.isSOSActive = false;
        
        // 버튼 애니메이션 제거
        const btn = document.getElementById('sosBtn');
        if (btn) {
          btn.classList.remove('active');
        }
      }, 300);
    }
  }

  // 긴급 통화 로그 기록
  logEmergencyCall(recipient, location, phone = '') {
    const log = {
      timestamp: new Date().toISOString(),
      recipient,
      phone,
      location: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      } : null,
      userAgent: navigator.userAgent
    };

    const logs = JSON.parse(localStorage.getItem('zzonde_sos_logs') || '[]');
    logs.push(log);

    // 최근 100개만 유지
    if (logs.length > 100) {
      logs.shift();
    }

    localStorage.setItem('zzonde_sos_logs', JSON.stringify(logs));
    console.log('Emergency call logged:', log);
  }

  // SOS 히스토리 가져오기
  getSOSHistory() {
    return JSON.parse(localStorage.getItem('zzonde_sos_logs') || '[]');
  }
}

// 싱글톤 인스턴스 생성
const emergencySOSSystem = new EmergencySOSSystem();

console.log('Emergency SOS System initialized 🚨');
