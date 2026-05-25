# Heaven's Clock — Google Play Billing 출시 가이드

앱 결제 흐름은 코드 측 구현이 끝났습니다. 이 문서는 **Play Console**에서 실제 상품·테스터·릴리스를 연결하는 순서입니다.

---

## 1. 상품 ID

코드 (`js/billing.mjs`, `js/premium-bundle.js`, `premium.html`) 는 다음 두 개의 상품을 사용합니다. **Play Console 에서 동일한 ID로 생성해야 합니다.**

| 종류 | Product ID | Play 유형 |
|------|------------|-----------|
| 평생 이용권 | `heavens_clock_lifetime_premium` | 인앱 상품 (일회성, Non-consumable) |
| 연간 구독 | `heavens_clock_yearly_premium` | 구독 (Auto-renewing, 1년 Base plan) |

ID를 바꾸려면 위 3개 파일과 이 표를 모두 일치시켜야 합니다.

---

## 2. Play Console 1회 세팅

### 2-1. 앱 생성·번들 업로드
1. [Play Console](https://play.google.com/console) → 앱 만들기 (`com.heavensclock.app`)
2. **앱 무결성 → Play 앱 서명** 활성화
3. **테스트 → 내부 테스트**에 최초 AAB 업로드 (없으면 상품 등록이 막힙니다)
   ```powershell
   npm run cap:sync
   # Android Studio 열고 Build > Generate Signed Bundle / APK
   ```

### 2-2. 평생 상품 (인앱 상품)
1. **수익 창출 → 상품 → 인앱 상품 → 상품 만들기**
2. 상품 ID: `heavens_clock_lifetime_premium`
3. 이름·설명·기본 가격 입력
4. 상태 **활성**

### 2-3. 연간 구독
1. **수익 창출 → 상품 → 구독 → 구독 만들기**
2. 상품 ID: `heavens_clock_yearly_premium`
3. 이름·혜택·태그 입력
4. **기본 요금제 (Base plan) 추가**
   - 결제 주기: **1년**
   - 자동 갱신: **사용**
   - 무료 체험을 줄 거면 별도 Offer로 추가 (지금은 생략 권장)
5. 상태 **활성**

### 2-4. 라이선스 테스터
1. **설정 → 라이선스 테스트**
2. 본인 Gmail 추가 → **응답: LICENSED**
3. 같은 Gmail로 폰에 Play Store 로그인 → 테스트 결제 시 실제 청구 안 됨

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

---

## 4. 코드 측 구현 요약

| 파일 | 역할 |
|------|------|
| `js/billing.mjs` | Play/Apple 스토어 브리지, 영수증 → entitlement 동기화 |
| `js/billing-bundle.js` | 위 파일을 `HeavensClockBilling` 전역으로 번들 |
| `js/premium-bundle.js` | `premium.html` UI, 구매·복원·에러 처리 |
| `js/app-bundle.js` | 앱 시작·포커스 시 `initStore` + `refreshEntitlements` 자동 호출 |
| `premium.html` | 결제 화면 |

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

- [ ] Play Console 상품 2개 **활성** 상태인지 확인
- [ ] 구독: **1년 base plan** 추가 완료
- [ ] 라이선스 테스터 Gmail 등록·기기 로그인
- [ ] 내부 테스트 트랙에 AAB 업로드 완료
- [ ] 본인 폰에서 구매·복원·취소·환불 시나리오 통과
- [ ] 개인정보처리방침 URL 등록
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
```

### 방법 C — PC 브라우저
`npm run web` → `http://localhost:4173/premium.html?test=1`
브라우저에서는 무조건 미리보기 모드로 동작.
