# Google Maps API 설정 가이드

이 프로젝트는 구글 맵을 사용하여 맛집 위치를 표시합니다.

## 1. Google Cloud Console에서 API 키 발급

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. 상단의 프로젝트 선택 드롭다운을 클릭합니다.
3. "새 프로젝트"를 클릭하고 프로젝트 이름을 입력합니다. (예: `matzip-chatgi`)
4. "만들기"를 클릭합니다.

### 1.2 Maps JavaScript API 활성화
1. 왼쪽 메뉴에서 **"API 및 서비스" > "라이브러리"**를 선택합니다.
2. 검색창에 "Maps JavaScript API"를 입력합니다.
3. "Maps JavaScript API"를 클릭합니다.
4. **"사용"** 버튼을 클릭하여 API를 활성화합니다.

### 1.3 API 키 생성
1. 왼쪽 메뉴에서 **"API 및 서비스" > "사용자 인증 정보"**를 선택합니다.
2. 상단의 **"+ 사용자 인증 정보 만들기"** 버튼을 클릭합니다.
3. **"API 키"**를 선택합니다.
4. API 키가 생성되면 **복사**합니다.
5. (권장) **"키 제한"** 버튼을 클릭하여 보안 설정을 합니다:
   - **애플리케이션 제한사항**: "HTTP 리퍼러(웹사이트)"를 선택
   - **웹사이트 제한사항**에 다음을 추가:
     - `http://localhost:3000/*` (로컬 개발용)
     - `https://your-domain.com/*` (배포된 사이트 주소)
   - **API 제한사항**: "키 제한" 선택 후 "Maps JavaScript API"만 체크
6. **"저장"**을 클릭합니다.

## 2. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일을 열고 다음 줄을 수정합니다:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=여기에_발급받은_API_키_붙여넣기
```

**예시:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 3. 개발 서버 재시작

환경 변수를 수정한 후에는 반드시 개발 서버를 재시작해야 합니다:

```bash
# 기존 서버 중지 (Ctrl + C)
# 서버 재시작
npm run dev
```

## 4. 확인

브라우저에서 다음 페이지들을 열어 지도가 정상적으로 표시되는지 확인합니다:
- http://localhost:3000/ (메인 페이지)
- http://localhost:3000/map-simple (간단한 지도 테스트)
- http://localhost:3000/map-test (고급 지도 테스트)

## 5. 요금 정보

Google Maps API는 매달 $200 무료 크레딧을 제공합니다. 일반적인 개인 프로젝트에서는 무료 범위 내에서 충분히 사용 가능합니다.

자세한 요금 정보: https://cloud.google.com/maps-platform/pricing

## 문제 해결

### "API 키가 설정되지 않았습니다" 메시지가 나타날 때
- `.env.local` 파일에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`가 제대로 설정되었는지 확인하세요.
- 개발 서버를 재시작했는지 확인하세요.

### 지도가 회색으로 나타나거나 오류가 발생할 때
- Google Cloud Console에서 **Maps JavaScript API**가 활성화되어 있는지 확인하세요.
- API 키의 제한사항 설정에서 현재 도메인이 허용되어 있는지 확인하세요.
- 브라우저 개발자 도구(F12)의 콘솔에서 오류 메시지를 확인하세요.

### "This API project is not authorized to use this API" 오류
- Maps JavaScript API가 활성화되어 있는지 확인하세요.
- 올바른 프로젝트의 API 키를 사용하고 있는지 확인하세요.
