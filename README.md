# 🍽️ 맛집 챗지 (Restaurant Curator)

AI 기반 맛집 찾기 & 음식 추천 플랫폼

## ✨ 주요 기능

### 1. 🗺️ 맛집 지도
- 네이버 지도 API를 활용한 맛집 위치 표시
- 즐겨찾기 기능
- 카테고리별 필터링

### 2. 🎯 AI 음식 추천
- **비로그인**: 랜덤 추천
- **로그인**: 개인화된 AI 추천
  - 사용자 평가 기반 학습 (1-10점)
  - 음식 종류, 분류별 가중치 자동 조정
  - 선호도 반영한 맞춤 추천

### 3. 👤 마이페이지
- 즐겨찾기 음식점 관리
- 추천 옵션 설정
- 음식 추천 가중치 확인

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 아래 값을 입력하세요:

```env
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 네이버 지도 API
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
```

### 3. Firebase 설정

자세한 Firebase 설정 방법은 다음 문서를 참조하세요:
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase 초기 설정
- [FIRESTORE_PERMISSIONS_FIX.md](./FIRESTORE_PERMISSIONS_FIX.md) - Firestore 권한 설정 ⚠️ **필수!**

**⚠️ 중요**: "Missing or insufficient permissions" 오류가 발생하면 [FIRESTORE_PERMISSIONS_FIX.md](./FIRESTORE_PERMISSIONS_FIX.md)를 확인하세요!

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 앱을 확인할 수 있습니다.

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx              # 전역 레이아웃 (Navbar 포함)
│   ├── page.tsx                # 메인 페이지 (맛집 지도)
│   ├── recommendation/         # 음식 추천 페이지
│   ├── mypage/                 # 마이페이지
│   ├── login/                  # 로그인
│   └── signup/                 # 회원가입
├── components/
│   ├── NaverMap.tsx           # 네이버 지도 컴포넌트
│   ├── Navbar.tsx             # 통합 네비게이션
│   ├── RecommendationClient.tsx # 음식 추천 UI
│   └── MyPageContent.tsx       # 가중치 확인 UI
├── store/
│   └── userStore.ts           # Zustand 상태 관리
└── lib/
    ├── firebase.ts            # Firebase 초기화
    └── geocoding.ts           # 지오코딩 유틸리티
```

## 🛠️ 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore)
- **Maps**: Naver Maps API

## 🎮 사용 방법

### 음식 추천 받기

1. **음식 추천** 메뉴 클릭
2. 원하는 음식 종류, 큰 분류, 세부 분류 선택 (선택사항)
3. **메뉴 추천받기** 버튼 클릭
4. 로그인한 경우: 추천 결과에 1-10점 평가
5. 평가를 계속하면 AI가 학습하여 더 나은 추천 제공!

### 맛집 찾기

1. 메인 페이지에서 지도 확인
2. 음식점 마커 클릭하여 정보 확인
3. 별 아이콘 클릭하여 즐겨찾기 추가
4. 마이페이지에서 즐겨찾기 관리

## 📊 음식 추천 알고리즘

- **가중치 학습 시스템**: 사용자 평가에 따라 음식 선호도 자동 조정
- **다차원 분석**: 음식 종류(Cuisine), 분류(Food Group), 세부 분류(Category) 별 가중치
- **학습률 조정**: 점진적 학습으로 안정적인 추천
- **가중치 범위**: 0.1 ~ 2.0 (과도한 편향 방지)

## 🐛 문제 해결

### "Missing or insufficient permissions" 오류
➡️ [FIRESTORE_PERMISSIONS_FIX.md](./FIRESTORE_PERMISSIONS_FIX.md) 참조

### 지도가 표시되지 않음
- 네이버 지도 API 키 확인
- [NAVER_MAP_SETUP.md](./NAVER_MAP_SETUP.md) 참조

### 빌드 실패
```bash
# 캐시 삭제 후 재빌드
rm -rf .next
npm run build
```

## 📝 스크립트

```bash
npm run dev       # 개발 서버 실행 (+ 음식 데이터 자동 생성)
npm run build     # 프로덕션 빌드 (+ 음식 데이터 자동 생성)
npm run start     # 프로덕션 서버 실행
npm run lint      # ESLint 실행
```

## 🔄 데이터 생성

음식 데이터는 `data/food_classification.csv`에서 자동으로 생성됩니다.
- `npm run dev` 또는 `npm run build` 실행 시 자동 생성
- 수동 생성: `node scripts/generate-food-data.js`

## 🚢 배포

### Vercel 배포 (권장)

1. GitHub에 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경 변수 설정
4. 배포!

### 환경 변수 설정 필수
- Firebase 설정 (6개)
- Naver Map API 키 (1개)

## 📄 라이센스

This project is licensed under the MIT License.

## 👨‍💻 개발자

Created with ❤️ using Next.js, Firebase, and AI

---

**⭐ Star this repo if you find it helpful!**
