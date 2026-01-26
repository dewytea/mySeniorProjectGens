// ZZonde Authentication Module
// MVP: LocalStorage based (to be replaced with D1 in production)

// Check if user is logged in
function isLoggedIn() {
  const user = localStorage.getItem('zzonde_user');
  return user !== null;
}

// Get current user
function getCurrentUser() {
  const userStr = localStorage.getItem('zzonde_user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
}

// Save user to localStorage
function saveUser(user) {
  localStorage.setItem('zzonde_user', JSON.stringify(user));
}

// Remove user from localStorage (logout)
function logout() {
  localStorage.removeItem('zzonde_user');
  speak('로그아웃 되었습니다');
  window.location.href = '/auth/login';
}

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!phone || !password) {
      speak('전화번호와 비밀번호를 입력해주세요');
      showNotification('모든 필드를 입력해주세요', 'error');
      return;
    }
    
    // Check if user exists in localStorage
    const savedUsers = JSON.parse(localStorage.getItem('zzonde_users') || '{}');
    const savedUser = savedUsers[phone];
    
    if (!savedUser) {
      speak('등록되지 않은 전화번호입니다');
      showNotification('등록되지 않은 전화번호입니다', 'error');
      return;
    }
    
    if (savedUser.password !== password) {
      speak('비밀번호가 틀렸습니다');
      showNotification('비밀번호가 틀렸습니다', 'error');
      return;
    }
    
    // Login successful
    const user = {
      name: savedUser.name,
      phone: phone,
      phoneDisplay: phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3'),
      loginAt: new Date().toISOString()
    };
    
    saveUser(user);
    
    speak(`${savedUser.name}님, 환영합니다!`);
    showNotification(`${savedUser.name}님 환영합니다! 🎉`, 'success');
    
    // Redirect to home after 1 second
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  });
}

// Register Form Handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value.trim();
    
    if (!name || !phone || !password || !passwordConfirm) {
      speak('모든 필드를 입력해주세요');
      showNotification('모든 필드를 입력해주세요', 'error');
      return;
    }
    
    if (password !== passwordConfirm) {
      speak('비밀번호가 일치하지 않습니다');
      showNotification('비밀번호가 일치하지 않습니다', 'error');
      return;
    }
    
    if (password.length < 6) {
      speak('비밀번호는 6자 이상이어야 합니다');
      showNotification('비밀번호는 6자 이상이어야 합니다', 'error');
      return;
    }
    
    // Phone number validation
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone)) {
      speak('올바른 전화번호 형식이 아닙니다');
      showNotification('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)', 'error');
      return;
    }
    
    // Check if phone already exists
    const savedUsers = JSON.parse(localStorage.getItem('zzonde_users') || '{}');
    if (savedUsers[phone]) {
      speak('이미 가입된 전화번호입니다');
      showNotification('이미 가입된 전화번호입니다', 'error');
      return;
    }
    
    // Save new user
    savedUsers[phone] = {
      name: name,
      password: password,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('zzonde_users', JSON.stringify(savedUsers));
    
    // Auto login
    const user = {
      name: name,
      phone: phone,
      phoneDisplay: phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3'),
      loginAt: new Date().toISOString()
    };
    
    saveUser(user);
    
    speak(`${name}님, 회원가입을 환영합니다!`);
    showNotification(`${name}님 가입 완료! 🎉`, 'success');
    
    // Redirect to home after 1 second
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  });
}

// Update settings page with user info
if (window.location.pathname === '/settings') {
  const user = getCurrentUser();
  const authSection = document.getElementById('authSection');
  
  if (authSection) {
    if (user) {
      // User is logged in
      authSection.innerHTML = `
        <div class="bg-white rounded-xl p-5 border-2 border-green-200">
          <div class="flex items-center space-x-4 mb-4">
            <div class="w-16 h-16 bg-gradient-to-r from-zzonde-orange to-zzonde-yellow rounded-full flex items-center justify-center">
              <i class="fas fa-user text-3xl text-white"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-800">${user.name}</p>
              <p class="text-lg text-gray-600">${user.phoneDisplay}</p>
            </div>
          </div>
          <button 
            onclick="logout()"
            class="w-full bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-red-600 transition-all"
          >
            <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
          </button>
        </div>
      `;
      
      // Fill name input if empty
      const userNameInput = document.getElementById('userName');
      if (userNameInput && !userNameInput.value) {
        userNameInput.value = user.name || '';
      }
    } else {
      // User is not logged in
      authSection.innerHTML = `
        <div class="bg-white rounded-xl p-5 border-2 border-orange-200 text-center">
          <i class="fas fa-user-circle text-6xl text-gray-300 mb-4"></i>
          <p class="text-xl text-gray-600 mb-4">로그인하고 더 많은 기능을 이용하세요</p>
          <div class="space-y-3">
            <a 
              href="/auth/login"
              class="block w-full bg-gradient-to-r from-zzonde-orange to-zzonde-yellow text-white px-6 py-3 rounded-full font-bold text-lg hover:shadow-lg transition-all"
            >
              <i class="fas fa-sign-in-alt mr-2"></i>로그인
            </a>
            <a 
              href="/auth/register"
              class="block w-full bg-white text-zzonde-orange px-6 py-3 rounded-full font-bold text-lg border-2 border-zzonde-orange hover:bg-orange-50 transition-all"
            >
              <i class="fas fa-user-plus mr-2"></i>회원가입
            </a>
          </div>
        </div>
      `;
    }
  }
}

console.log('Auth module loaded');
