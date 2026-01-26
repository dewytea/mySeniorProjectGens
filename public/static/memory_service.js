// ZZonde Memory Service - AI 동반자의 기억 시스템
// localStorage 기반 (MVP), 향후 벡터 DB로 확장 가능

class MemoryService {
  constructor() {
    this.storageKey = 'zzonde_ai_memory';
    this.userContextKey = 'zzonde_user_context';
    this.maxMemories = 100; // 최대 저장할 대화 수
  }

  // 사용자 컨텍스트 저장 (건강, 가족, 취미 등)
  saveUserContext(context) {
    const existing = this.getUserContext();
    const updated = {
      ...existing,
      ...context,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(this.userContextKey, JSON.stringify(updated));
    return updated;
  }

  // 사용자 컨텍스트 가져오기
  getUserContext() {
    const stored = localStorage.getItem(this.userContextKey);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      name: localStorage.getItem('zzonde_user_name') || '사용자',
      healthConditions: [], // 건강 상태 기록
      familyMembers: [], // 가족 관계
      hobbies: [], // 취미
      concerns: [], // 걱정거리
      lastUpdated: new Date().toISOString()
    };
  }

  // 대화 저장
  saveConversation(userMessage, aiResponse, metadata = {}) {
    const memories = this.getMemories();
    const conversation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userMessage,
      aiResponse,
      metadata: {
        emotion: this.detectEmotion(userMessage),
        keywords: this.extractKeywords(userMessage),
        category: this.categorizeMessage(userMessage),
        ...metadata
      }
    };

    memories.unshift(conversation);

    // 최대 개수 제한
    if (memories.length > this.maxMemories) {
      memories.pop();
    }

    localStorage.setItem(this.storageKey, JSON.stringify(memories));

    // 컨텍스트 업데이트
    this.updateContextFromConversation(conversation);

    return conversation;
  }

  // 모든 대화 기록 가져오기
  getMemories() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  // 최근 대화 가져오기
  getRecentMemories(count = 5) {
    const memories = this.getMemories();
    return memories.slice(0, count);
  }

  // 키워드로 대화 검색 (간단한 벡터 검색 시뮬레이션)
  searchMemories(query, limit = 5) {
    const memories = this.getMemories();
    const queryLower = query.toLowerCase();
    const keywords = this.extractKeywords(queryLower);

    // 관련성 점수 계산
    const scored = memories.map(memory => {
      let score = 0;
      const memoryText = (memory.userMessage + ' ' + memory.aiResponse).toLowerCase();

      // 키워드 매칭
      keywords.forEach(keyword => {
        if (memoryText.includes(keyword)) {
          score += 10;
        }
      });

      // 카테고리 매칭
      if (memory.metadata.category === this.categorizeMessage(query)) {
        score += 5;
      }

      return { ...memory, relevanceScore: score };
    });

    // 점수순 정렬 및 상위 결과 반환
    return scored
      .filter(m => m.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // 감정 감지 (간단한 규칙 기반)
  detectEmotion(text) {
    const textLower = text.toLowerCase();

    const emotions = {
      sad: ['슬퍼', '우울', '외로', '힘들', '아파', '고통', '살려'],
      happy: ['기뻐', '행복', '좋아', '즐거', '신나', '재밌', '웃'],
      angry: ['화나', '짜증', '열받', '싫어', '미워'],
      worried: ['걱정', '불안', '두려', '무서', '겁나'],
      neutral: []
    };

    for (const [emotion, keywords] of Object.entries(emotions)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          return emotion;
        }
      }
    }

    return 'neutral';
  }

  // 키워드 추출 (간단한 형태소 분석)
  extractKeywords(text) {
    // 불용어 제거
    const stopwords = ['은', '는', '이', '가', '을', '를', '의', '에', '와', '과', '도', '만', '하고', '있어', '있습니다', '해요', '요'];
    const words = text.toLowerCase().split(/\s+/);

    const keywords = words.filter(word => {
      return word.length >= 2 && !stopwords.includes(word);
    });

    return [...new Set(keywords)]; // 중복 제거
  }

  // 메시지 카테고리 분류
  categorizeMessage(text) {
    const textLower = text.toLowerCase();

    const categories = {
      health: ['아파', '건강', '병원', '약', '아프', '통증', '허리', '무릎', '머리', '배', '열'],
      family: ['가족', '자식', '아들', '딸', '손주', '배우자', '남편', '아내', '부모'],
      emotion: ['외로', '슬퍼', '우울', '불안', '화나', '기뻐', '행복'],
      daily: ['날씨', '식사', '산책', '운동', '텔레비전', 'tv'],
      work: ['일', '일자리', '알바', '돈', '월급', '직장'],
      social: ['친구', '이웃', '모임', '동네', '이야기']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          return category;
        }
      }
    }

    return 'general';
  }

  // 대화에서 컨텍스트 업데이트
  updateContextFromConversation(conversation) {
    const context = this.getUserContext();
    const { userMessage, metadata } = conversation;

    // 건강 상태 업데이트
    if (metadata.category === 'health') {
      const healthKeywords = this.extractKeywords(userMessage);
      healthKeywords.forEach(keyword => {
        if (!context.healthConditions.includes(keyword)) {
          context.healthConditions.push(keyword);
        }
      });
    }

    // 가족 관계 업데이트
    if (metadata.category === 'family') {
      const familyKeywords = this.extractKeywords(userMessage);
      familyKeywords.forEach(keyword => {
        if (!context.familyMembers.includes(keyword)) {
          context.familyMembers.push(keyword);
        }
      });
    }

    // 걱정거리 추적
    if (metadata.emotion === 'sad' || metadata.emotion === 'worried') {
      const concern = {
        text: userMessage,
        timestamp: conversation.timestamp,
        resolved: false
      };
      context.concerns.push(concern);
      
      // 최근 10개만 유지
      if (context.concerns.length > 10) {
        context.concerns.shift();
      }
    }

    this.saveUserContext(context);
  }

  // 컨텍스트 기반 프롬프트 생성
  generateContextualPrompt(currentMessage) {
    const context = this.getUserContext();
    const recentMemories = this.getRecentMemories(3);
    const relevantMemories = this.searchMemories(currentMessage, 2);

    let contextPrompt = `사용자 정보:
- 이름: ${context.name}
- 최근 건강 상태: ${context.healthConditions.slice(-3).join(', ') || '정보 없음'}
- 최근 언급한 가족: ${context.familyMembers.slice(-3).join(', ') || '정보 없음'}

최근 대화:
${recentMemories.map((m, i) => `${i + 1}. 사용자: "${m.userMessage}" → AI: "${m.aiResponse}"`).join('\n')}

관련 과거 대화:
${relevantMemories.map((m, i) => `${i + 1}. "${m.userMessage}" (${new Date(m.timestamp).toLocaleDateString()})`).join('\n')}

현재 사용자 메시지: "${currentMessage}"

위 컨텍스트를 참고하여 따뜻하고 공감하는 답변을 생성하세요.`;

    return contextPrompt;
  }

  // 위급 상황 감지
  detectEmergency(text) {
    const emergencyKeywords = [
      '살려', '도와줘', '119', '응급', '넘어졌', '쓰러', '심장', '호흡', 
      '너무 아파', '죽겠', '안 돼', '위험', '위급'
    ];

    const textLower = text.toLowerCase();
    const emotion = this.detectEmotion(text);

    // 키워드 매칭
    for (const keyword of emergencyKeywords) {
      if (textLower.includes(keyword)) {
        return {
          isEmergency: true,
          level: 'critical',
          keywords: [keyword],
          emotion
        };
      }
    }

    // 강한 부정적 감정 연속
    if (emotion === 'sad' || emotion === 'worried') {
      const recentMemories = this.getRecentMemories(3);
      const negativeCount = recentMemories.filter(m => 
        m.metadata.emotion === 'sad' || m.metadata.emotion === 'worried'
      ).length;

      if (negativeCount >= 2) {
        return {
          isEmergency: true,
          level: 'warning',
          reason: '지속적인 부정적 감정',
          emotion
        };
      }
    }

    return {
      isEmergency: false,
      emotion
    };
  }

  // 메모리 초기화
  clearMemories() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.userContextKey);
  }

  // 메모리 내보내기 (JSON)
  exportMemories() {
    return {
      memories: this.getMemories(),
      context: this.getUserContext(),
      exportDate: new Date().toISOString()
    };
  }

  // 메모리 가져오기 (JSON)
  importMemories(data) {
    if (data.memories) {
      localStorage.setItem(this.storageKey, JSON.stringify(data.memories));
    }
    if (data.context) {
      localStorage.setItem(this.userContextKey, JSON.stringify(data.context));
    }
  }
}

// 싱글톤 인스턴스
const memoryService = new MemoryService();

console.log('Memory Service initialized 🧠');
