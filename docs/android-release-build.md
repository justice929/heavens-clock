# Heaven's Clock — Android 출시 빌드·서명·업로드 가이드

이 문서는 **본인이 직접 수행**하는 작업입니다. 명령어와 클릭 순서만 그대로 따라가면 됩니다.

소요 시간: 처음이면 **2~3시간**, 두 번째부터는 **20분**.

---

## 0. 필요한 것

| 항목 | 비고 |
|------|------|
| **Android Studio** 최신 | https://developer.android.com/studio |
| **JDK 17 이상** | Android Studio가 보통 같이 설치 |
| **Google Play 개발자 계정** ($25 일회성 결제) | https://play.google.com/console |
| **Android 폰** (USB 디버깅 켜진 상태) | 실기기 테스트용 |
| Android Studio "USB 드라이버" | 윈도우면 폰 제조사 드라이버 설치 |

> 한국에서 유료 앱 판매 시 추가로 **사업자등록 + 통신판매업 신고**가 필요할 수 있습니다(개인 개발자 한도 이하라면 면제 가능). 이 가이드 범위 밖이지만 출시 전 한 번 확인하세요.

---

## 1. Android Studio 에서 프로젝트 열기

```powershell
npm install            # 처음 한 번
npm run cap:sync       # web 자산을 android/app/src/main/assets/public 으로 복사
npm run cap:open:android
```

Android Studio가 열리며 `android/` 폴더가 프로젝트로 로드됩니다.

**Gradle Sync** 가 자동 시작됩니다. 처음이면 5~10분 걸립니다 (의존성 다운로드). 끝날 때까지 기다리세요.

---

## 2. Keystore 생성 (출시 평생 한 번, 절대 분실 금지)

> **경고**
> - Keystore 를 분실하거나 비밀번호를 잊으면 **앱 업데이트가 영원히 불가능**합니다 (Google 도 못 살려줌)
> - 비밀번호는 **password manager** 에 저장 + USB/클라우드 이중 백업
> - Keystore 는 **저장소에 절대 commit 하지 마세요** (이미 `.gitignore` 로 막혀 있음)

### 방법 A — Android Studio GUI (초보자 추천)

1. Android Studio 메뉴: **Build → Generate Signed Bundle / APK...**
2. **Android App Bundle** 선택 → Next
3. **Key store path** 옆 **Create new...** 클릭
4. 다음 정보 입력:

   | 필드 | 입력 |
   |------|------|
   | Key store path | `E:\keystores\heavens-clock.jks` (저장소 바깥, 본인이 잊지 않을 위치) |
   | Password | 강한 비밀번호 (예: 16자+ 랜덤) |
   | Confirm | 위와 동일 |
   | Alias | `heavens-clock` |
   | Password (alias) | 위 store 비밀번호와 같게 해도 OK |
   | Validity (years) | **25 이상** (Play 요구: 최소 25년) |
   | First and Last Name | `justice` |
   | Organizational Unit | (비워둠 OK) |
   | Organization | (비워둠 OK 또는 본인 사업명) |
   | City, State, Country code | `Seoul`, `Seoul`, `KR` |

5. OK 클릭 → keystore 파일 생성됨

### 방법 B — 커맨드라인 (이미 익숙한 분용)

```powershell
keytool -genkeypair -v `
  -keystore E:\keystores\heavens-clock.jks `
  -keyalg RSA -keysize 2048 -validity 36500 `
  -alias heavens-clock
```

질문에 답하면서 비밀번호와 정보 입력. 36500일(100년) 권장.

### Keystore 백업

생성 즉시:
- USB 메모리 / 외장하드에 복사
- 클라우드(Google Drive, OneDrive 등)에 암호화 zip 으로 백업
- 비밀번호를 password manager 에 저장 (1Password, Bitwarden 등)

---

## 3. `android/keystore.properties` 만들기 (자동 서명용)

매번 비밀번호 묻는 게 귀찮으므로, gradle 이 자동으로 읽어 서명하게 설정합니다. **이 파일은 git 에 안 들어갑니다** (.gitignore 처리됨).

`android/keystore.properties` 라는 파일을 새로 만들고 다음을 붙여 넣은 뒤 본인 값으로 채우세요:

```properties
storeFile=E:\\keystores\\heavens-clock.jks
storePassword=여기에_keystore_비밀번호
keyAlias=heavens-clock
keyPassword=여기에_alias_비밀번호
```

> 경로의 백슬래시는 **두 번** (`\\`) 으로 적습니다. macOS/Linux 면 슬래시 한 번 (`/`).

`build.gradle` 에 이미 이 파일을 읽도록 코드가 들어가 있으므로, 파일만 만들면 release 빌드가 자동 서명됩니다.

---

## 4. AAB 빌드

### 방법 A — npm 스크립트 (한 줄)

```powershell
npm run android:bundle:release
```

내부적으로:
1. `prepare-web` → www 폴더 갱신
2. `cap sync` → 안드로이드로 복사
3. `gradlew bundleRelease` → AAB 빌드

성공 시 출력 마지막에 다음 경로의 파일이 생성됩니다:

```
android\app\build\outputs\bundle\release\app-release.aab
```

### 방법 B — Android Studio GUI

1. **Build → Generate Signed Bundle / APK...**
2. **Android App Bundle** 선택 → Next
3. **Key store path / passwords / alias** 자동 입력 (방금 만든 keystore)
4. Variant: **release** → Finish
5. 우하단에 "Locate" 알림 → 클릭하면 AAB 위치 열림

### 빌드 검증

```powershell
# AAB 가 정상 서명됐는지 확인 (Android Studio 자체로도 검증됨)
# 파일 크기는 보통 5~15 MB 수준
Get-ChildItem android\app\build\outputs\bundle\release\app-release.aab | Select-Object Name, Length, LastWriteTime
```

---

## 5. Play Console 첫 업로드 (앱 등록 + 내부 테스트)

### 5-1. 앱 만들기

1. https://play.google.com/console 로그인
2. **앱 만들기** 클릭
3. 입력:

   | 필드 | 값 |
   |------|-----|
   | 앱 이름 | Heaven's Clock |
   | 기본 언어 | 한국어 (또는 영어) |
   | 앱 또는 게임 | **앱** |
   | 무료 또는 유료 | **무료** (인앱 결제만 있으므로) |
   | 정책·약관 동의 | 모두 체크 |

4. **앱 만들기** 확정

### 5-2. 내부 테스트 트랙에 첫 AAB 업로드

1. 좌측 메뉴: **테스트 → 내부 테스트**
2. **새 버전 만들기** 클릭
3. **App bundle 추가** → 방금 만든 `app-release.aab` 업로드
4. **출시 노트** 한국어/영어로 한 줄씩 작성 (예: `최초 출시`)
5. **저장 → 검토 → 출시 시작**

> 처음 업로드 시 Play 의 자동 분석이 5~30분 걸립니다. 그 사이 다음 단계 진행해도 됩니다.

### 5-3. 라이선스 테스터 등록

1. Play Console **설정 → 라이선스 테스트**
2. Gmail 주소 추가 (본인의 `paxpax13@gmail.com` + 필요시 추가 테스터)
3. **응답: LICENSED**
4. 저장

테스터 등록된 Gmail 로 폰의 Play Store 가 로그인되어 있으면 실제 결제 시 청구되지 않습니다.

### 5-4. 내부 테스트 링크로 폰에 설치

1. 내부 테스트 트랙 페이지의 **테스터** 탭
2. 이메일 목록에 본인 Gmail 추가 → **변경사항 저장**
3. **테스트 링크 복사** → 폰 브라우저에서 열기 → "테스터로 등록" → "Google Play 에서 다운로드"

> 처음에는 "관리자 승인 대기" 같은 메시지가 잠시 뜰 수 있습니다. 본인이 관리자이므로 5~10분 후 자동 해제됩니다.

---

## 6. 상품 등록 (AAB 업로드 후에 가능)

`docs/android-play-billing.md` §1-2, §1-3 그대로 진행:

1. 평생 이용권: `heavens_clock_lifetime_premium` / $14.99
2. 연간 구독: `heavens_clock_yearly_premium` / Base plan `yearly-autorenew` / $4.99

> AAB 가 한 번도 업로드되지 않은 앱은 **상품 만들기** 메뉴가 비활성화되어 있습니다. 5-2 단계가 끝나야 풀립니다.

---

## 7. 실기기에서 결제 흐름 검증

내부 테스트 링크로 폰에 설치한 후:

1. 메인 → **✦ Premium** 진입
2. **연간 $4.99** 또는 **평생 $14.99** 선택 → **계속**
3. Play 결제 시트에서 결제 (라이선스 테스터라 청구되지 않음)
4. 완료 → 시계로 복귀, 잠긴 테마 풀림
5. 앱 강제종료 후 다시 켜기 → Premium 유지 확인
6. WebView 디버깅 (`chrome://inspect`) 에서:
   ```js
   HeavensClockBilling.diagnose()
   ```
   `products.yearlyPremium.offers` 에 `yearly-autorenew` 가 보여야 정상

### 환불·취소 시나리오

Play Console **주문 관리** → 환불 후 → 폰에서 앱 다시 열기 → Premium 해제 확인.

---

## 8. 출시 (프로덕션 트랙)

내부 테스트에서 모든 시나리오가 통과되면:

1. Play Console **테스트 → 비공개 테스트** (선택, 외부 친구 테스트용) 또는 바로
2. **프로덕션** → 새 버전 만들기 → 같은 AAB 를 트랙 변경
3. **앱 콘텐츠** 모든 설문(개인정보, 데이터 안전, 광고, 대상 연령) 완료
   - 개인정보 URL: `https://justice929.github.io/heavens-clock/site/privacy.html`
   - 데이터 안전: `docs/play-data-safety.md` 답안 그대로
4. **출시 → 검토 → 출시 시작**
5. Google 심사 (보통 12~48시간) 후 자동 게시

---

## 9. 이후 업데이트 흐름

코드 변경 후 새 버전 올릴 때:

1. `android/app/build.gradle` 에서 `versionCode` **+1**, `versionName` 변경 (예: `1.0.1`)
2. `npm run android:bundle:release`
3. Play Console → 트랙에 새 AAB 업로드 → 출시

versionCode 는 **항상 단조 증가** 해야 하며, 한 번 출시한 versionCode 는 재사용 불가입니다.

---

## 10. 자주 막히는 곳 (Troubleshooting)

### Q. `gradlew bundleRelease` 가 "SDK location not found" 에러
**A.** Android Studio 를 한 번 열어 SDK 가 설치된 뒤 다시 시도. 또는 `android/local.properties` 에 `sdk.dir=C:\\Users\\...\\AppData\\Local\\Android\\Sdk` 입력.

### Q. "signing config 없음" 으로 release 빌드 실패
**A.** `android/keystore.properties` 파일이 없거나 경로가 틀림. 3번 단계 다시 확인. 파일이 있는데 안 잡히면 경로의 백슬래시를 `\\` 로 두 번 적었는지 체크.

### Q. Play Console 에 업로드했더니 "서명되지 않음" 에러
**A.** debug 빌드를 올린 것. 반드시 `bundleRelease` 또는 GUI의 "Signed Bundle" 로 만든 AAB 를 올려야 함.

### Q. 인앱 상품 만들기가 비활성화
**A.** AAB 한 번이라도 트랙에 업로드해야 활성화됨. 5-2 단계 완료 후 1~2시간 기다리고 재시도.

### Q. 폰에서 결제 시트가 안 뜸
**A.** Play Console 의 라이선스 테스터로 본인 Gmail 등록 + 폰 Play Store 가 그 Gmail 로 로그인되어 있어야 함. 다른 계정으로 로그인되어 있으면 안 됨.

### Q. `diagnose()` 의 `offers` 가 빈 배열
**A.** Play Console 의 base plan ID 가 `yearly-autorenew` 와 다름. 구독 페이지에서 base plan 이름 정확히 확인.

### Q. Keystore 비밀번호 잊었다
**A.** 복구 불가. 새 applicationId(`com.heavensclock.app2` 등)로 새 앱을 만들어야 함. **반드시 백업하세요.**

---

## 11. 빠른 체크리스트 (출시 직전 마지막 점검)

- [ ] `versionCode` 가 이전 출시보다 큼
- [ ] AAB 가 release 서명으로 빌드됨 (방법 A 또는 B)
- [ ] Keystore 가 USB + 클라우드에 백업됨
- [ ] Keystore 비밀번호가 password manager 에 저장됨
- [ ] Play Console 내부 테스트에 AAB 업로드됨
- [ ] 인앱 상품 2개 활성 상태 (`heavens_clock_lifetime_premium`, `heavens_clock_yearly_premium`)
- [ ] 구독에 `yearly-autorenew` base plan 추가됨
- [ ] 라이선스 테스터에 본인 Gmail 등록
- [ ] 실기기에서 구매·복원·환불 시나리오 통과
- [ ] `HeavensClockBilling.diagnose()` 출력에 `yearly-autorenew` offer 보임
- [ ] 개인정보처리방침 URL 등록
- [ ] 데이터 안전 양식 완료
- [ ] 앱 콘텐츠 설문(연령등급, 광고, 대상자 등) 완료
- [ ] 스토어 등록정보 (아이콘 512×512, 피처 그래픽 1024×500, 스크린샷 최소 2장, 설명문) 완료
