# Heaven's Clock — Google Play Billing 출시 가이드

앱 결제 흐름은 코드 측 구현이 끝났습니다. 이 문서는 **Play Console**에서 실제 상품·테스터·릴리스를 연결하는 순서입니다.

---

## 0. 한눈에 보는 ID·가격 표

코드와 Play Console 이 **정확히 일치해야** 결제가 동작합니다.

| 종류 | Product ID | Base Plan ID | Play 유형 | 기본 가격 |
|------|-----------|-------------|-----------|----------|
| 평생 이용권 | `heavens_clock_lifetime_premium` | (없음 — 인앱 상품) | 인앱 상품 / Non-consumable / 1회 결제 | **$14.99** |
| 연간 구독 | `heavens_clock_yearly_premium` | `yearly-autorenew` | 구독 / Auto-renewing / 1년 | **$4.99 / 년** |

applicationId: `com.heavensclock.app` (capacitor.config.json, android/app/build.gradle 와 동일)

ID 를 바꾸려면 다음 5곳을 모두 손봐야 합니다.

- `js/billing.mjs` → `PRODUCT_IDS`, `BASE_PLAN_IDS`
- `js/billing-bundle.js` → 위 변경 후 `npm run build-billing` 으로 재빌드
- `js/premium-bundle.js` → 상단 `PRODUCT_IDS`
- `premium.html` → `data-product="..."` 두 군데
- 이 문서

---

## 1. Play Console 1회 세팅

### 1-1. 앱 생성·번들 업로드
1. [Play Console](https://play.google.com/console) → 앱 만들기 (`com.heavensclock.app`)
2. **앱 무결성 → Play 앱 서명** 활성화
3. **테스트 → 내부 테스트**에 최초 AAB 업로드 (없으면 상품 등록이 막힙니다)
   ```powershell
   npm run cap:sync
   # Android Studio 열고 Build > Generate Signed Bundle / APK
   ```

### 1-2. 평생 이용권 (인앱 상품)
1. **수익 창출 → 상품 → 인앱 상품 → 상품 만들기**
2. 상품 ID: **`heavens_clock_lifetime_premium`** (정확히 그대로)
3. 이름·설명 입력
4. **기본 가격: $14.99 USD** → 자동 변환 옵션 켜면 ₩, €, ¥ 등 자동 산출
5. 상태 **활성**

### 1-3. 연간 구독
1. **수익 창출 → 상품 → 구독 → 구독 만들기**
2. 상품 ID: **`heavens_clock_yearly_premium`**
3. 이름·혜택·태그 입력 → 저장
4. 생성된 구독 페이지에서 **기본 요금제 (Base plan) 추가**
   - Base plan ID: **`yearly-autorenew`** (정확히 그대로 — 이 값이 코드의 `BASE_PLAN_IDS.yearlyPremium` 과 일치해야 함)
   - 결제 주기: **1년**
   - 자동 갱신: **사용**
   - **기본 가격: $4.99 USD** → 자동 변환 사용 권장
   - 무료 체험 등은 별도 Offer 로 나중에 추가 가능 (v1 출시에는 생략 권장)
5. 상태 **활성**

### 1-4. 라이선스 테스터
1. **설정 → 라이선스 테스트**
2. 본인 Gmail 추가 → **응답: LICENSED**
3. 같은 Gmail로 폰에 Play Store 로그인 → 테스트 결제 시 실제 청구 안 됨

---

## 2. 가격 책정 가이드

| 시장 | 연간 | 평생 |
|------|------|------|
| **US (USD)** | $4.99 | $14.99 |
| 한국 (KRW, 환율 자동) | ≈ ₩6,900 | ≈ ₩19,900 |
| 일본 (JPY) | ≈ ¥750 | ≈ ¥2,250 |
| 유럽 (EUR) | ≈ €4.99 | ≈ €14.99 |

> Play Console 의 "가격 자동 변환" 기능을 켜면 USD 기준값에서 모든 통화·국가 가격이 한 번에 생성됩니다. 출시 후 특정 국가만 수동 조정도 가능합니다.

UI 에 표시되는 가격 텍스트는 **두 가지 경로**로 표시됩니다.

1. **store 응답 후(실기기 정상 흐름)** — Play 가 사용자 국가 화폐로 자동 노출 (ex. `₩6,900/년`)
2. **store 응답 전(아주 짧은 초기 로딩 또는 브라우저 미리보기)** — i18n 의 `premium.yearlyPrice`/`premium.lifetimePrice` 값이 폴백으로 표시됨. 현재는 `$4.99 / year`, `$14.99 once` (각 언어로 번역됨).

---

## 3. 기기 테스트

### 3-1. 빌드·설치
```powershell
npm run cap:sync
```
Android Studio → **Run ▶** (또는 Generate Signed Bundle 후 내부 테스트 트랙에 업로드 → 트랙 URL에서 설치)

> 디버그 빌드도 결제 UI가 뜨지만, Play 가 상품을 인식하려면 **같은 applicationId + versionCode** 의 AAB가 한 번 이상 트랙에 업로드되어 있어야 합니다.

### 3-2. 실제 결제 흐름
1. 메인 → **✦ Premium** 진입
2. **연간** 또는 **평생** 선택 → **계속**
3. Play 결제 시트 표시
4. **테스트 카드**로 결제 (라이선스 테스터는 청구 없음)
5. 완료 → 자동으로 시계로 복귀, 테마 자물쇠 해제
6. 앱을 껐다 켜도 유지되는지 확인
7. **구매 복원** 버튼: 다른 기기에서 같은 Google 계정 로그인 후 동작 확인

### 3-3. 환불·취소 반영
- Play Console **주문 관리**에서 환불
- 앱 다시 켜면 (또는 화면 포커스 시) `refreshEntitlements()` 가 자동으로 다시 동기화
- 무료로 되돌아가는지 확인

### 3-4. 진단 (디버깅)
WebView 콘솔(`chrome://inspect`) 에서:

```js
HeavensClockBilling.diagnose()
```

다음이 출력됩니다.

- `nativeStore` — Capacitor 환경 여부
- `storeReady` — Play 연결 완료 여부
- `plan` — 현재 권한 (`free` / `yearly` / `lifetime`)
- `products.yearlyPremium`, `products.lifetimePremium` — Play 가 응답한 가격·소유 여부·offer ID 목록
- `basePlanIds` — 기대 Base plan ID (`yearly-autorenew`)

`products.yearlyPremium.offers` 배열에 `yearly-autorenew` 가 보이면 Play Console 설정이 코드와 일치한 것입니다.

---

## 4. 코드 측 구현 요약

| 파일 | 역할 |
|------|------|
| `js/billing.mjs` | Play/Apple 스토어 브리지, 영수증 → entitlement 동기화, `PRODUCT_IDS`·`BASE_PLAN_IDS`·`diagnose()` 정의 |
| `js/billing-bundle.js` | 위 파일을 `HeavensClockBilling` 전역으로 번들 |
| `js/premium-bundle.js` | `premium.html` UI, 구매·복원·에러 처리, store 가격 표시 |
| `js/app-bundle.js` | 앱 시작·포커스 시 `initStore` + `refreshEntitlements` 자동 호출 |
| `premium.html` | 결제 화면, `data-product` 속성으로 상품 식별 |

### 에러 코드 매핑 (사용자 메시지)

| 코드 | 사용자에게 보이는 메시지 키 |
|------|--------------------------|
| `PAYMENT_CANCELLED` | `premium.purchaseCancelled` |
| `STORE_NOT_READY`, `BILLING_UNAVAILABLE`, `SUBSCRIPTIONS_NOT_AVAILABLE` | `premium.billingUnavailable` |
| `PRODUCT_NOT_AVAILABLE` | `premium.productNotAvailable` |
| `NETWORK_ERROR` | `premium.networkError` |
| `PAYMENT_NOT_ALLOWED` | `premium.paymentNotAllowed` |
| `VERIFICATION_FAILED` | `premium.verificationFailed` |
| `ALREADY_OWNED` | `premium.alreadyOwned` |
| 그 외 | `premium.purchaseFailed` |

---

## 5. 출시 체크리스트

- [ ] Play Console 상품 2개 **활성** 상태 (`heavens_clock_lifetime_premium`, `heavens_clock_yearly_premium`)
- [ ] 구독: **`yearly-autorenew`** 라는 ID 로 1년 base plan 추가 완료
- [ ] 두 상품 기본 가격 입력 ($14.99 / $4.99) + 가격 자동 변환
- [ ] 라이선스 테스터 Gmail 등록·기기 로그인
- [ ] 내부 테스트 트랙에 AAB 업로드 완료
- [ ] 본인 폰에서 구매·복원·취소·환불 시나리오 통과
- [ ] `HeavensClockBilling.diagnose()` 출력에서 `offers` 에 `yearly-autorenew` 가 보이는지 확인
- [ ] 개인정보처리방침 URL 등록 (`https://justice929.github.io/heavens-clock/site/privacy.html`)
- [ ] 스토어 등록 정보(아이콘·스크린샷·설명) 완료
- [ ] 가격·국가 설정 검토

---

## 6. 개발 중 테스트 모드 (결제 없이 Premium 체험)

Play 결제 UI까지 가지 않고 Premium 기능만 확인할 때.

### 방법 A — Premium 화면 테스트 패널
1. 메인에서 **✦ 길게 누르기 (~0.7s)** → 안내 문구 표시
2. **✦ 한 번 더 탭** → Premium 화면
3. 화면 아래 **테스트 활성화** 에서 평생/연간 선택

### 방법 B — 콘솔 명령
Chrome `chrome://inspect` 로 WebView 콘솔 열기:
```js
HeavensClockDev.grantLifetime()   // 평생
HeavensClockDev.grantYearly()     // 연간 1년
HeavensClockDev.revoke()          // 무료 복귀
HeavensClockDev.isPremium()       // true/false
HeavensClockBilling.diagnose()    // 상품·권한 상태 점검
```

### 방법 C — PC 브라우저
`npm run web` → `http://localhost:4173/premium.html?test=1`
브라우저에서는 무조건 미리보기 모드로 동작.
