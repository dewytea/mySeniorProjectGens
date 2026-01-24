# ZZonde 지역 권역 시스템 설계안

## 📍 핵심 전략: 3단계 하이브리드 접근

### 1단계: 초기 온보딩 (수동 입력) ⭐⭐⭐⭐⭐
**가장 추천하는 시작점**

#### 구현 방법
```
첫 방문 시 모달:
"어디에 사시나요?"
→ 시/도 선택 (서울특별시, 부산광역시...)
→ 구 선택 (강남구, 서초구...)
→ 동 선택 (대치동, 역삼동...)
→ "이 지역으로 설정할까요?" 확인
```

#### 장점
- ✅ **간단하고 명확** (60세 이상도 쉽게 이해)
- ✅ **프라이버시 문제 없음** (GPS 거부감 ↓)
- ✅ **100% 정확한 지역 매칭**
- ✅ **구현 빠름** (1-2일 소요)

#### 단점
- ❌ 이사 시 수동 변경 필요
- ❌ 실시간 위치 추적 불가

---

### 2단계: GPS 보조 (선택적) ⭐⭐⭐⭐
**사용자가 원할 때만 활성화**

#### 구현 방법
```
설정 > 위치 설정:
□ "내 위치 자동 감지" (기본: OFF)
  └ ON 시: GPS로 동네 자동 갱신
  └ OFF 시: 수동 설정 유지

+ "지금 내 위치로 변경" 버튼
```

#### 사용 시나리오
- 여행/출장 시 임시 지역 변경
- 다른 동네 방문 시 해당 지역 정보 확인
- "지금 내 위치 주변" 기능

#### 기술 스택
- **Web API**: `navigator.geolocation.getCurrentPosition()`
- **역지오코딩**: Cloudflare Workers에서 API 호출
  - Google Maps Geocoding API
  - Kakao Local API (한국 주소 정확도 ↑)

---

### 3단계: 지오펜싱 (고급 기능) ⭐⭐⭐
**향후 확장용 - MVP에는 불필요**

#### 활용 예시
- 특정 지역 방문 시 알림 (예: "복지관 근처입니다. 오늘 프로그램을 확인하세요!")
- 이벤트 지역 한정 (예: "강남구 주민만 참여 가능한 모임")
- 긴급 상황 자동 감지 (예: 평소 활동 반경 벗어남)

---

## 🗺️ 권역 구분 체계

### 추천: 행정구역 3단계 체계

```
Level 1: 시/도 (17개)
└─ 서울특별시, 부산광역시, 경기도...

Level 2: 구/군 (약 250개)
└─ 강남구, 서초구, 수원시 팔달구...

Level 3: 동/읍/면 (약 3,500개) ⭐ 핵심
└─ 대치동, 역삼동, 삼성동...
```

#### 왜 "동" 단위가 최적인가?
1. **적절한 반경**: 도보 15-30분 (1-2km)
2. **커뮤니티 크기**: 5천~3만 명 (적당한 활성도)
3. **행정 단위**: 주민센터, 복지관 단위와 일치
4. **당근마켓 성공 사례**: 동 단위가 가장 활발

---

## 💾 데이터 구조 (Cloudflare D1)

### locations 테이블
```sql
CREATE TABLE locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sido TEXT NOT NULL,              -- 서울특별시
  sigungu TEXT NOT NULL,           -- 강남구
  dong TEXT NOT NULL,              -- 대치동
  latitude REAL,                   -- 37.4959
  longitude REAL,                  -- 127.0626
  population INTEGER,              -- 인구 수
  senior_population INTEGER,       -- 60세 이상 인구
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_dong ON locations(sido, sigungu, dong);
```

### users 테이블에 location 추가
```sql
ALTER TABLE users ADD COLUMN location_id INTEGER REFERENCES locations(id);
ALTER TABLE users ADD COLUMN location_range INTEGER DEFAULT 3; -- 반경 (km)
```

### posts 테이블 (일거리/장터/이야기)
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,              -- 'job', 'marketplace', 'community'
  title TEXT NOT NULL,
  content TEXT,
  user_id INTEGER REFERENCES users(id),
  location_id INTEGER REFERENCES locations(id),
  is_location_limited BOOLEAN DEFAULT TRUE, -- 지역 한정 여부
  view_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_location ON posts(location_id, type);
```

---

## 🎯 지역 필터링 로직

### 방식 1: 같은 동만 (기본)
```javascript
// 같은 동네 게시글만
WHERE posts.location_id = user.location_id
```

### 방식 2: 인접 동 포함 (확장)
```javascript
// 반경 3km 내 모든 게시글
WHERE distance(
  posts.latitude, posts.longitude,
  user.latitude, user.longitude
) <= user.location_range
```

### 방식 3: 유저 선택 (권장) ⭐
```
설정 > 지역 범위:
○ 우리 동네만 (대치동)
○ 인근 지역 포함 (+역삼동, 삼성동)
○ 구 전체 (강남구 전체)
```

---

## 🚀 구현 로드맵

### Phase 1: MVP (1주일) ⭐ **지금 시작!**
- [ ] 수동 지역 설정 (시/도/구/동)
- [ ] localStorage 저장
- [ ] 지역별 게시글 필터링
- [ ] "내 동네" / "전체 지역" 토글

### Phase 2: GPS 통합 (1주일)
- [ ] 선택적 GPS 권한 요청
- [ ] Kakao Local API 연동
- [ ] "지금 내 위치로 변경" 버튼
- [ ] 이동 감지 및 자동 제안

### Phase 3: 고급 기능 (2주일)
- [ ] 인접 지역 자동 추천
- [ ] 지역 인증 (본인 확인)
- [ ] 지역 통계 (우리 동네 활동 지수)
- [ ] 지오펜싱 알림

---

## 💡 차별화 아이디어

### 1. **시니어 친화적 UX**
```
큰 지도 대신:
📍 "대치동" 클릭
└─ "역삼동", "삼성동" 인접 지역 표시
└─ "강남구 전체 보기"
```

### 2. **음성 명령 통합**
```
"우리 동네 일거리 찾아줘"
→ 자동으로 사용자 동네 필터 적용

"역삼동 장터 보여줘"
→ 임시로 역삼동 필터 적용
```

### 3. **커뮤니티 온도계**
```
대치동 활동 지수: 🔥🔥🔥🔥 (매우 활발)
- 오늘 올라온 게시글: 12개
- 활성 사용자: 89명
- 주요 관심사: #일거리 #동네소식
```

### 4. **오프라인 연계**
```
"대치동 주민센터에서 확인"
→ QR 코드로 지역 인증
→ "동네 주민 인증" 배지 획득
```

---

## 📊 기대 효과

### 사용자 측면
- ✅ **관련성 ↑**: 내 동네 정보만 = 노이즈 ↓
- ✅ **신뢰도 ↑**: "같은 동네 주민" = 안전감
- ✅ **참여율 ↑**: 직접 만날 수 있음 = 실행력
- ✅ **커뮤니티 ↑**: 지역 기반 네트워킹

### 비즈니스 측면
- ✅ **지역 광고**: 동네 상권 맞춤 광고
- ✅ **지자체 협력**: 지역 복지 서비스 연계
- ✅ **데이터 가치**: 시니어 지역별 활동 데이터
- ✅ **확장성**: 전국 단위 플랫폼 가능

---

## 🎬 다음 단계

### Option A: MVP 구현 시작 (추천 ⭐⭐⭐⭐⭐)
- 수동 지역 설정 + 필터링 로직 (3-5일 소요)
- 간단하지만 핵심 가치 제공

### Option B: 전체 설계 검토
- 더 많은 아이디어 브레인스토밍
- 경쟁사 분석 (당근마켓, 네이버 카페)

### Option C: PWA 먼저 완성
- 앱 형태로 만든 후 지역 기능 추가

---

**이안님 의견**
어떤 방향이 마음에 드시나요?
1. MVP부터 빠르게 시작?
2. 더 자세한 기획이 필요?
3. 다른 아이디어 추가?

알려주시면 바로 진행하겠습니다! 😊
