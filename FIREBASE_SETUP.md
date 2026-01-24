# Firebase Authentication 설정 가이드

## 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: restaurant-curator)
4. Google Analytics 설정 (선택사항)

## 2. Firebase Authentication 활성화
1. Firebase Console에서 프로젝트 선택
2. 왼쪽 메뉴에서 "Authentication" 클릭
3. "시작하기" 클릭
4. "Sign-in method" 탭 선택
5. "이메일/비밀번호" 활성화

## 3. 웹 앱 등록 및 설정값 가져오기
1. Firebase Console의 프로젝트 설정 (톱니바퀴 아이콘)
2. "일반" 탭에서 하단의 "내 앱" 섹션
3. 웹 아이콘 (</>) 클릭
4. 앱 닉네임 입력 후 "앱 등록"
5. Firebase SDK 설정 정보 복사

## 4. 환경 변수 설정
`.env.local` 파일에 Firebase 설정값을 입력하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 5. 개발 서버 재시작
환경 변수를 수정한 후에는 개발 서버를 재시작해야 합니다:
```bash
npm run dev
```

## 구현된 기능
- ✅ 이메일/비밀번호 회원가입
- ✅ 이메일/비밀번호 로그인
- ✅ 에러 메시지 한글 처리
- ✅ 로딩 상태 표시
- ✅ 사용자 displayName에 아이디 저장

## 다음 단계
- Firebase Firestore 연동 (사용자 추가 정보 저장)
- 로그아웃 기능 구현
- 로그인 상태 관리 (Context API 또는 Zustand)
- 비밀번호 재설정 기능
