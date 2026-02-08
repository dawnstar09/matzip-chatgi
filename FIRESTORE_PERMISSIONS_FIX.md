# 🔥 Firestore 권한 오류 해결 가이드

## 문제: "Missing or insufficient permissions"

이 오류는 Firestore 보안 규칙이 제대로 설정되지 않아 발생합니다.

## ✅ 빠른 해결 방법

### 방법 1: Firebase Console에서 직접 설정 (권장)

1. **Firebase Console 접속**
   - https://console.firebase.google.com/ 접속
   - 프로젝트 선택

2. **Firestore Database로 이동**
   - 왼쪽 메뉴에서 "Firestore Database" 클릭
   - 상단의 "규칙" 탭 클릭

3. **규칙 복사 & 붙여넣기**
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // 사용자는 자신의 데이터만 읽고 쓸 수 있습니다
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // 즐겨찾기도 자신의 것만 접근 가능
       match /favorites/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // 나머지는 모두 거부
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

4. **게시 버튼 클릭**
   - 규칙을 수정한 후 반드시 "게시" 버튼을 클릭하세요!

### 방법 2: Firebase CLI로 배포

```bash
# Firebase CLI 설치 (처음 한 번만)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 폴더에서 Firestore 규칙 배포
firebase deploy --only firestore:rules
```

## 🧪 규칙 테스트

Firebase Console의 "규칙 플레이그라운드"에서 테스트:
1. Firestore Database > 규칙 탭
2. "규칙 플레이그라운드" 섹션
3. 시뮬레이션 실행:
   - 위치: `/users/test-user-id`
   - 인증됨: ✅ 체크
   - UID: `test-user-id`
   - 실행: 읽기/쓰기 둘 다 "허용됨"이 나와야 함

## 🔍 개발 중 임시 해결책 (비권장)

**⚠️ 절대로 프로덕션에서 사용하지 마세요!**

테스트 목적으로만 아래 규칙 사용:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

이 규칙은 로그인한 사용자가 모든 데이터를 읽고 쓸 수 있게 합니다.
반드시 개발 완료 후 위의 안전한 규칙으로 변경하세요!

## 📋 체크리스트

- [ ] Firebase Console에서 Firestore Database가 생성되었는가?
- [ ] Firestore 규칙이 올바르게 설정되었는가?
- [ ] 규칙을 수정한 후 "게시" 버튼을 클릭했는가?
- [ ] .env.local 파일에 Firebase 설정이 올바른가?
- [ ] 개발 서버를 재시작했는가? (npm run dev)
- [ ] 브라우저 콘솔에서 오류 메시지를 확인했는가?

## 🆘 추가 도움이 필요하면

1. **브라우저 개발자 도구 열기** (F12)
2. **Console 탭 확인**
3. 오류 메시지와 스택 트레이스 복사
4. Firebase Console에서 "Firestore > 사용량" 탭 확인

## 💡 앱의 오류 처리

이 앱은 Firestore 권한 오류가 발생해도 계속 작동합니다:
- ✅ 비로그인 사용자: 랜덤 추천 계속 사용 가능
- ✅ 로그인 사용자: 가중치 없이 랜덤 추천 사용
- ⚠️ 가중치 학습은 Firestore 규칙 설정 후 작동

규칙 설정 후에는 개인화된 추천이 정상 작동합니다!
