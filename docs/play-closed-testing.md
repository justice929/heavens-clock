# Heaven's Clock — 비공개 테스트(Closed Testing) 준비 & 진행 가이드

> 개인 개발자 계정은 **프로덕션 출시 전에 비공개 테스트(12명 이상 · 14일 이상)** 가 필수입니다.
> 이 문서는 바로 따라 하면 되는 복붙용 자료입니다.

---

## 0. 업로드할 파일

| 항목 | 값 |
|------|-----|
| AAB 경로 | `android/app/build/outputs/bundle/release/app-release.aab` |
| versionCode | **9** |
| versionName | **1.0.8** |

---

## 1. 비공개 테스트 트랙 만들기 (Play Console)

1. 왼쪽 메뉴 **테스트 → 비공개 테스트**
2. **새 버전 만들기** 클릭
3. **App bundle** 에 위 `app-release.aab` 업로드
4. **출시 노트** 입력 (아래 2번 복붙)
5. **저장 → 검토 → 비공개 테스트 트랙으로 출시**

---

## 2. 출시 노트 (Release notes)

### 한국어 (`ko-KR`)
```
- 홈 화면 위젯 개편 (년·일·시 + 매일 바뀌는 문장)
- 행동 알림 추가 (아침/오후/저녁)
- 위젯 선택 화면 미리보기 추가
- 화면 비율·시계 크기 최적화
- 안정성 개선
```

### English (`en-US`)
```
- Redesigned home screen widget (years/days/hours + daily quote)
- Added action reminders (morning/afternoon/evening)
- Added widget picker preview
- Optimized layout and clock sizing
- Stability improvements
```

---

## 3. 테스터 12명 모으기 (가장 중요)

### 방법 A — 이메일 목록 (가장 간단)
1. **테스트 → 비공개 테스트 → 테스터** 탭
2. **이메일 목록 만들기** → 테스터 Gmail 12개 이상 입력
3. 저장

### 방법 B — Google 그룹
- 그룹 이메일 1개만 등록하면 그룹 멤버 전체가 테스터가 됨

### 핵심 조건 (Google 정책)
- **12명 이상**이 **실제로 옵트인(참여 수락) + 설치**해야 카운트됩니다.
- 단순히 이메일만 등록 ≠ 참여. 각자 **참여 링크 수락 후 설치**해야 함.
- 이 상태로 **14일 연속 유지** → 이후 프로덕션 신청 버튼 활성화.

### 모집 팁
- 가족·친구·지인 Gmail 12개가 가장 빠름
- 각자 폰에서 **같은 Gmail로 Play 스토어 로그인** 필요

---

## 4. 테스터에게 보낼 안내 메시지 (복붙용)

### 한국어
```
[Heaven's Clock 테스트 도와주세요 🙏]

안드로이드 앱 '천국의 시계' 출시 전 테스트 중입니다.
아래만 해주시면 큰 도움이 됩니다 (5분):

1) 이 링크를 안드로이드 폰에서 열기:
   (Play Console 비공개 테스트 '참여 링크' 붙여넣기)
2) "테스터 되기" 수락
3) Play 스토어에서 'Heaven's Clock' 설치
4) 한 번 실행해 보기 (그냥 켜보기만 해도 OK)

* 무료입니다. 결제 안 하셔도 됩니다.
* 설치 후 2주 동안 그냥 두시면 됩니다 (삭제만 하지 말아주세요).
감사합니다!
```

### English
```
[Help me test Heaven's Clock 🙏]

I'm testing my Android app "Heaven's Clock" before launch.
Please do this (5 min):

1) Open this link on your Android phone:
   (paste the closed-test opt-in link from Play Console)
2) Tap "Become a tester"
3) Install "Heaven's Clock" from the Play Store
4) Open it once (just launching is fine)

* It's free. No purchase needed.
* Please keep it installed for ~2 weeks (just don't uninstall).
Thank you!
```

> 참여 링크 위치: **테스트 → 비공개 테스트 → 테스터 탭 → "테스터가 참여하는 방법" / 링크 복사**

---

## 5. 14일 카운트 동안

- 12명 참여(설치) 유지가 핵심. 중간에 삭제하면 카운트가 줄 수 있음.
- 그동안 우리는 **스토어 등록정보·등급·데이터 안전** 등을 이미 끝냈으니 추가 작업 없음.
- 14일 + 12명 충족되면 **게시 개요 → 프로덕션 신청** 버튼이 열림.

---

## 6. 체크리스트

- [ ] 비공개 테스트 트랙에 AAB(versionCode 9) 업로드·출시
- [ ] 출시 노트 입력 (ko/en)
- [ ] 테스터 이메일 12명+ 등록
- [ ] 참여 링크 복사 → 12명에게 안내 메시지 발송
- [ ] 12명 옵트인 + 설치 확인
- [ ] 14일 경과 대기
- [ ] 프로덕션 액세스 신청 → 프로덕션 출시

---

## 7. 자주 막히는 부분

| 증상 | 해결 |
|------|------|
| 테스터가 "앱을 찾을 수 없음" | 참여 링크로 옵트인 먼저, 같은 Gmail로 Play 로그인 |
| 참여자 수 0명 | 이메일 등록만으로는 0, 각자 링크 수락+설치해야 반영 |
| 프로덕션 버튼 비활성 | 12명·14일 미충족 — 조건 충족까지 대기 |
| versionCode 중복 오류 | 이미 9 업로드됨 → 다음은 10으로 올려 재빌드 |
