// Emergency Contact Management for Settings Page

// 비상 연락처 로드 및 표시
function loadEmergencyContacts() {
  if (typeof emergencySOSSystem === 'undefined') {
    console.error('Emergency SOS System not loaded');
    return;
  }

  const contacts = emergencySOSSystem.emergencyContacts;
  const container = document.getElementById('emergencyContactsList');
  
  if (!container) return;
  
  container.innerHTML = contacts.filter(c => c.type !== 'emergency').map(contact => `
    <div class="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div class="flex-1">
        <p class="text-lg font-semibold text-gray-800">${contact.name}</p>
        <p class="text-base text-gray-600">${contact.phone || '연락처 미등록'}</p>
      </div>
      <div class="flex space-x-2">
        <button 
          onclick="editEmergencyContact(${contact.id})"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
        >
          <i class="fas fa-edit"></i>
        </button>
        <button 
          onclick="deleteEmergencyContact(${contact.id})"
          class="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// 비상 연락처 추가
function addEmergencyContact() {
  const name = prompt('이름을 입력하세요:');
  if (!name) return;
  
  const phone = prompt('전화번호를 입력하세요 (예: 010-1234-5678):');
  if (!phone) return;
  
  const contacts = emergencySOSSystem.emergencyContacts;
  const newContact = {
    id: Date.now(),
    name,
    phone,
    type: 'family',
    isPrimary: false
  };
  
  contacts.push(newContact);
  emergencySOSSystem.saveEmergencyContacts(contacts);
  loadEmergencyContacts();
  
  if (typeof speak === 'function') {
    speak(`${name} 연락처가 등록되었습니다`);
  }
  
  if (typeof showNotification === 'function') {
    showNotification('비상 연락처가 추가되었습니다', 'success');
  }
}

// 비상 연락처 수정
function editEmergencyContact(id) {
  const contacts = emergencySOSSystem.emergencyContacts;
  const contact = contacts.find(c => c.id == id);
  if (!contact) return;
  
  const name = prompt('이름을 입력하세요:', contact.name);
  if (!name) return;
  
  const phone = prompt('전화번호를 입력하세요:', contact.phone);
  if (!phone) return;
  
  contact.name = name;
  contact.phone = phone;
  
  emergencySOSSystem.saveEmergencyContacts(contacts);
  loadEmergencyContacts();
  
  if (typeof showNotification === 'function') {
    showNotification('비상 연락처가 수정되었습니다', 'success');
  }
}

// 비상 연락처 삭제
function deleteEmergencyContact(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  
  let contacts = emergencySOSSystem.emergencyContacts;
  contacts = contacts.filter(c => c.id != id);
  
  emergencySOSSystem.saveEmergencyContacts(contacts);
  loadEmergencyContacts();
  
  if (typeof showNotification === 'function') {
    showNotification('비상 연락처가 삭제되었습니다', 'success');
  }
}

// 페이지 로드 시 연락처 로드
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/settings') {
      setTimeout(() => {
        loadEmergencyContacts();
      }, 500);
    }
  });
} else {
  if (window.location.pathname === '/settings') {
    setTimeout(() => {
      loadEmergencyContacts();
    }, 500);
  }
}

console.log('Emergency contact management loaded 📞');
