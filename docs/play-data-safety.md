# Google Play Console — Data Safety Form Answers

> 작성 위치: Play Console → App content → Data safety
>
> 본 앱은 서버에 어떤 개인정보도 수집하지 않으므로 대부분 "No"로 답할 수 있습니다. 아래 답안을 그대로 사용하세요.

## 1. Data collection and security (개요)

| 질문 | 답변 |
|------|------|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | (수집 항목이 없으므로 표시 안 됨) |
| Do you provide a way for users to request that their data be deleted? | **Yes — Users can delete all data by uninstalling the app or clearing fields in the in-app onboarding edit screen.** |

> ⚠️ "No"를 선택하는 근거: 모든 사용자 입력(생년월일, 버킷리스트 등)은 기기 내 localStorage 에만 저장되며, 개발자 서버·분석 SDK·광고 SDK로 전송되지 않습니다. Google Play Billing 의 결제 정보는 Google이 직접 처리하므로 개발자에게 "수집"되지 않습니다. Play 가이드라인 기준상 "기기에서만 처리" 는 collection 으로 간주하지 않습니다.

## 2. Data types — 각 카테고리 답변

| 카테고리 | Collected? | Shared? | 비고 |
|---------|-----------|---------|------|
| Personal info (Name, Email, User ID, Address, Phone, Race, Politics 등) | No | No | 입력 없음 |
| Financial info | No | No | Google Play 가 직접 처리 |
| Health & fitness | No | No | — |
| Messages | No | No | — |
| Photos & videos | No | No | — |
| Audio | No | No | — |
| Files & docs | No | No | — |
| Calendar | No | No | — |
| Contacts | No | No | — |
| App activity (Page views, Search history, Installed apps 등) | No | No | 분석 미설치 |
| Web browsing | No | No | — |
| App info and performance (Crash logs, Diagnostics, Other app perf) | No | No | 크래시 리포트 SDK 미설치 |
| Device or other IDs (Advertising ID 등) | No | No | 광고 ID 사용 안 함 |
| Location (Approximate, Precise) | No | No | 권한 요청 없음 |

> 💡 만약 미래에 Firebase Crashlytics 같은 크래시 리포트를 추가한다면 **App info and performance → Crash logs → Yes** 로 바꿔야 합니다.

## 3. Security practices

- **Encryption in transit:** 수집 데이터가 없어 표시되지 않음. (Google Play Billing 트래픽은 Google이 HTTPS로 처리)
- **Data deletion:** "Yes — Users can request data deletion" 선택. 설명란에 다음 문장을 영어로 입력하세요.

```
All app data is stored only on the user's device. Users can delete it at any time by
uninstalling the app or by clearing fields from the in-app onboarding edit screen.
We have no server-side data to delete.
```

## 4. Privacy policy URL

게시한 정책 URL을 입력합니다.

```
https://justice929.github.io/heavens-clock/site/privacy.html
```

> 위 URL 은 GitHub Pages 무료 호스팅 결과 주소입니다. 도메인 구입 후 자체 도메인으로 교체하려면 Play Console 의 정책 URL 만 갱신하고, `onboarding.html` / `premium.html` 의 in-app 링크 두 곳을 같이 수정하면 됩니다.

## 5. Children

- **Target audience:** 13세 이상 (또는 회사 정책에 따라 16+)
- 만 14세 미만 사용자에 대한 별도 처리가 없으므로 *"Designed for families" 미참가* 로 설정.

## 6. Ads

- Ads in your app? → **No**
- Uses an advertising ID? → **No**

## 7. Government apps / News apps / Financial services 등 특수 카테고리

해당 없음.

---

## 폼 통과 후 체크리스트

- [ ] 정책 URL 이 실제로 외부에서 열림 (브라우저 시크릿 모드로 확인)
- [ ] 정책 페이지에 영어/한국어 둘 다 표시됨
- [ ] 앱 내(온보딩 마지막 단계, 결제 화면 하단)에서 정책 링크가 보임
- [ ] `[DEVELOPER_NAME]`, `[CONTACT_EMAIL]`, `[EFFECTIVE_DATE]`, `[COUNTRY]` 4 개 자리표시가 모두 채워졌는지 `site/privacy.html` 검색
- [ ] Data safety preview 가 Play Console 에서 빨간 경고 없이 통과
