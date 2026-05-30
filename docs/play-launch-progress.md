# Heaven's Clock — Play 출시 진행 메모

> **마지막 업데이트:** 2026-05-28  
> 집·다른 PC에서 작업을 이어갈 때 이 문서와 `docs/android-play-billing.md`, `docs/android-release-build.md` 를 함께 보면 됩니다.

---

## 1. 계정·브랜드 정보

| 항목 | 값 |
|------|-----|
| **개발자 표시명 (Play Store)** | `Pax Studio Co.` |
| **법적 이름 (세금·본인확인)** | `PARK JUNG EU` |
| **연락 이메일** | `paxpax13@gmail.com` |
| **Play Console 계정 ID** | `7919650121751387004` |
| **GitHub** | https://github.com/justice929/heavens-clock |
| **웹사이트 (마케팅)** | https://justice929.github.io/heavens-clock/site/ |
| **개인정보처리방침 URL** | https://justice929.github.io/heavens-clock/site/privacy.html |
| **소재지** | 대한민국 (Republic of Korea) |
| **개인정보 시행일** | 2026-06-01 |

---

## 2. 앱 식별자

| 항목 | 값 |
|------|-----|
| **앱 이름** | Heaven's Clock |
| **패키지명** | `com.heavensclock.app` |
| **현재 버전** | `1.0` (versionCode 1) |
| **AAB (로컬 빌드)** | `android/app/release/app-release.aab` (~4.15 MB) |

---

## 3. 인앱 상품 (Play Console ↔ 코드 일치 필수)

| 종류 | Product ID | Base plan ID | 가격 (USD) |
|------|------------|--------------|------------|
| 평생 이용권 | `heavens_clock_lifetime_premium` | (없음) | **$14.99** |
| 연간 구독 | `heavens_clock_yearly_premium` | `yearly-autorenew` | **$4.99 / 년** |

**Play Console 등록 시 참고**

- 평생: **제품 → 일회성 제품**, 구매 옵션 ID 예: `lifetime`, 구매 유형 **구입**, 분류 **디지털 콘텐츠**
- 연간: **제품 → 정기 결제**, Base plan **자동 갱신 · 매년**, 선불/분할 결제 **사용 안 함**

코드 위치: `js/billing.mjs`, `js/premium-bundle.js`, `premium.html` (`data-product`)

---

## 4. 완료한 작업 ✅

### 개발자 계정
- [x] 개발자 이름: `Pax Studio Co.` (등록 완료)
- [x] 가입비 $25 결제
- [x] 본인확인 제출 (검토 대기 중일 수 있음)
- [x] 전화번호 인증
- [x] 15% 서비스 수수료 프로그램 (계정 그룹, 본인 계정만)
- [x] 결제 프로필 / 공개 판매자 정보 (`HEAVENS CLOCK` 카드 명세서명 등)
- [x] W-8 BEN 세금 양식 제출 (상태: **검토 중** 가능, 조약 10% — 기타 저작권 로열티)
- [x] 이름 증빙 서류 업로드 (운전면허/여권 등, 요청 시)

### 앱·배포
- [x] Play Console 앱 생성 (`Heaven's Clock`, 무료, `com.heavensclock.app`)
- [x] Signed AAB 빌드 (`android/app/release/app-release.aab`)
- [x] **내부 테스트** 트랙에 AAB 업로드·출시
- [x] 내부 테스터 이메일 목록 (`Heaven's Clock 내부테스트`, `paxpax13@gmail.com`)
- [x] **라이선스 테스터** (`paxpax13@gmail.com`, `RESPOND_NORMALLY` 또는 LICENSED)
- [x] 폰에서 내부 테스트 **설치 완료**
- [x] **앱 콘텐츠** (개인정보 URL, 광고 없음, 콘텐츠 등급, 데이터 안전, 대상 13+ 등)
- [x] **인앱 상품 2개** 등록 (평생 + 연간 / `yearly-autorenew`)

### 저장소 (GitHub)
- [x] `Pax Studio Co.` 개인정보처리방침 반영 (`site/privacy.html`, `docs/privacy-policy.md`)
- [x] `main` 브랜치 푸시 완료 (로컬 = `origin/main` 동기화됨)

---

## 5. 아직 할 일 ⬜

### 우선 (집에서 바로)
- [ ] **Premium 결제 테스트** (상품 등록 후 15~30분 대기 후)
  - 앱 완전 종료 → 재실행
  - Premium → 연간 / 평생 → Play 결제 시트 (테스터 = 실제 청구 없음)
  - 프리미엄 테마 잠금 해제·앱 재시작 후 유지 확인
  - **구매 복원** 버튼 테스트
- [ ] 디버그 (선택): USB + `chrome://inspect` → `HeavensClockBilling.diagnose()`
  - `storeReady: true`, `offers` 에 `yearly-autorenew` 확인

### 출시 전 필수
- [ ] **스토어 등록정보** (아이콘 512×512, 스크린샷 2장+, 짧은/긴 설명)
- [ ] 본인확인·세금 **승인** 메일 확인
- [ ] (필요 시) 전화번호·휴대기기 액세스 최종 완료

### 이후
- [ ] 내부 테스트에서 시나리오 통과 → **프로덕션** 출시
- [ ] 스토어 심사 (보통 12~48시간)

---

## 6. 집·다른 PC에서 이어하기

### 코드
```powershell
git clone https://github.com/justice929/heavens-clock.git
cd heavens-clock
npm install
```

### Play Console
- https://play.google.com/console → 동일 Google 계정
- 앱: **Heaven's Clock** → 내부 테스트 / 수익 창출 / 앱 콘텐츠

### Keystore (중요 — Git에 없음)
| 항목 | 위치·비고 |
|------|----------|
| Keystore 파일 | `E:\keystores\heavens-clock` (또는 `.jks` 복사본) |
| 백업 | USB + 클라우드 **필수** |
| 비밀번호 | password manager / 종이 (Git 커밋 금지) |
| 로컬 서명 설정 | `android/keystore.properties` (집 PC에서 재생성 또는 백업 복사) |

Keystore 없이는 **기존 앱과 같은 서명으로 업데이트 AAB** 를 올릴 수 없습니다.

### AAB 다시 빌드 (필요 시)
```powershell
# JDK/Android Studio 환경 설정 후
npm run cap:sync
npm run android:bundle:release
# 또는 Android Studio: Generate Signed Bundle
```
자세한 절차: `docs/android-release-build.md`

---

## 7. 자주 쓰는 링크·메뉴

| 목적 | 경로 |
|------|------|
| 내부 테스트 / 테스터 링크 | 테스트 및 출시 → 내부 테스트 → 테스터 |
| 인앱 상품 | Play를 통한 수익 창출 → 제품 → 일회성 제품 / 정기 결제 |
| 라이선스 테스터 | 설정 → 라이선스 테스트 |
| 앱 콘텐츠 | 정책 → 앱 콘텐츠 |
| 스토어 등록정보 | 사용자 늘리기 → 스토어 등록정보 |
| 세금 정보 | 설정 → 결제 프로필 → 미국 세금 정보 |
| 결제 프로필 | 설정 → 결제 프로필 |

---

## 8. 트러블슈팅 요약

| 증상 | 확인 |
|------|------|
| 상품/가격 안 보임 | 등록 후 15~30분 대기, 앱 재시작, Product ID·Base plan ID 오타 |
| 결제 시트 안 뜸 | Play Store = `paxpax13@gmail.com`, 라이선스 테스터 등록 |
| `diagnose()` offers 비어 있음 | Base plan `yearly-autorenew` 활성 여부 |
| 내부 테스트 설치 안 됨 | 테스터 목록·테스트 링크, AAB **사용 가능** 상태 |
| 세금 30% 적용 | W-8 BEN 승인 전 임시; 조약 **기타 저작권 10%** 신청 여부 |

---

## 9. Cursor에서 이어서 작업할 때

예시 프롬프트:

```
Play 출시 이어서 — docs/play-launch-progress.md 기준.
Premium 결제 테스트부터 도와줘.
```

또는:

```
스토어 등록정보(스크린샷, 설명) 작성 도와줘.
```

---

## 10. 관련 문서

| 문서 | 내용 |
|------|------|
| `docs/android-play-billing.md` | Play 상품 ID, 가격, 테스트, `diagnose()` |
| `docs/android-release-build.md` | Keystore, AAB 빌드, Play 첫 업로드 |
| `docs/play-data-safety.md` | 데이터 안전 양식 답안 |
| `docs/privacy-policy.md` | 개인정보처리방침 마스터 |
| `docs/handoff.md` | 프로젝트 전반 인수인계 |

---

## 11. 진행률 한눈에

```
[██████████████████░░] ~90%

완료: 계정, AAB(v9/1.0.8), 내부테스트, 결제 테스트, 앱콘텐츠, 인앱상품,
      스토어 등록정보(en+ko), 그래픽(아이콘·피처·스크린샷), 콘텐츠 등급, Git 동기화
남음: 비공개 테스트(12명·14일) → 프로덕션 출시
```

### 2026-05-31 업데이트
- 스토어 등록정보 입력 완료: 기본 영어(en-US) + 한국어(ko-KR) 번역
- 그래픽 업로드: 아이콘 512(`assets/store/icon-512.png`), 피처 1024×500(`assets/store/feature-1024x500.png`), 폰 스크린샷 4장
- 콘텐츠 등급 제출: ESRB 전체이용가 / PEGI 3 / 브라질 14(인앱결제 사유) — 정상
- **다음**: 개인 계정 정책상 **비공개 테스트 12명·14일** 필요 → `docs/play-closed-testing.md` 참고
- 빌드: versionCode 9 / versionName 1.0.8
