# Naver Map API 설정 가이드

## 1. API 키 발급받기

### Naver Cloud Platform 계정 생성
1. [Naver Cloud Platform](https://www.ncloud.com/) 접속
2. 회원가입 또는 로그인
3. 본인인증 완료

### Application 등록
1. Console 접속
2. **Services** → **AI·NAVER API** → **Application** 선택
3. **Application 등록** 버튼 클릭
4. 다음 정보 입력:
   - Application 이름: `맛집챗지` (원하는 이름)
   - Service 선택: **Web Dynamic Map** 체크
   - 웹 서비스 URL:
     - 개발: `http://localhost:3000`
     - 배포: `https://yourdomain.com`

### API 키 확인
1. 등록된 Application 목록에서 생성한 앱 클릭
2. **Client ID** 복사
3. `.env.local` 파일의 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`에 붙여넣기

## 2. 환경 변수 설정

`.env.local` 파일에 다음 추가:
```
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=발급받은-Client-ID
```

## 3. 개발 서버 재시작

```bash
# 서버가 실행 중이면 중지 (Ctrl+C)
# 다시 시작
npm run dev
```

## 4. 지도 테스트

브라우저에서 접속:
- 메인: http://localhost:3000
- 지도 테스트: http://localhost:3000/map-test

## 5. NaverMap 컴포넌트 사용법

```tsx
import NaverMap from '@/components/NaverMap';

export default function MyPage() {
  return (
    <NaverMap 
      lat={37.5665}  // 위도
      lng={126.9780}  // 경도
      zoom={15}       // 줌 레벨 (1-21)
      className="w-full h-[400px]"
    />
  );
}
```

## 6. 주요 기능

### 기본 지도 표시
- 위도/경도로 원하는 위치 표시
- 자동으로 마커 생성
- 줌 컨트롤 제공

### 위치 변경
- `lat`, `lng` props를 변경하면 지도가 자동으로 이동
- 여러 위치를 동적으로 표시 가능

### 추가 개발 가능 기능
- 여러 마커 표시
- 마커 클릭 이벤트
- 정보 창 (InfoWindow)
- 경로 표시
- 주소 검색

## 7. 참고 자료

- [Naver Maps API v3 문서](https://navermaps.github.io/maps.js.ncp/)
- [Naver Cloud Platform Console](https://console.ncloud.com/)

## 8. 문제 해결

### 지도가 표시되지 않는 경우
1. Client ID가 올바른지 확인
2. 개발 서버 재시작
3. 브라우저 콘솔에서 에러 메시지 확인
4. URL이 Naver Cloud Platform에 등록되어 있는지 확인

### "ncpClientId is required" 에러
- `.env.local` 파일이 올바르게 저장되었는지 확인
- 개발 서버를 재시작했는지 확인
