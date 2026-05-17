# Heaven's Clock 작업 인수인계 메모

## 현재 저장소

- GitHub: https://github.com/justice929/heavens-clock
- 공개 상태: Private
- 기본 브랜치: main
- 앱 이름: Heaven's Clock / 천국의 시계
- 앱 컨셉: Memento Mori 기반 생애 카운트다운 시계

## 현재까지 구현된 것

- 웹 앱 메인 화면
  - 남은 생애를 연/일/시/분/초로 실시간 표시
  - 중앙에 남은 생애 퍼센트 표시
  - 원형 링 애니메이션
  - Calm / Impact 모드 전환
  - 기본 테마 및 프리미엄 후보 테마 버튼

- 온보딩 화면
  - 언어 선택
  - 생년월일 입력
  - 태어난 시간 입력
  - 희망 수명 입력
  - 설정 버튼을 통해 다시 진입 가능
  - Android WebView 안정성을 위해 일반 번들 스크립트 사용

- 다국어 지원
  - 19개 언어 JSON 파일 구성
  - 영어/한국어 포함 주요 온보딩 문구 번역
  - `onboarding.editSubtitle` 같은 키 이름이 화면에 그대로 나오던 문제 수정

- Android 앱
  - Capacitor 기반 Android 프로젝트 생성
  - Samsung Z Fold 기기에서 APK 설치 및 실행 확인
  - Android WebView에서 JS가 멈추던 문제를 `app-bundle.js`, `onboarding-bundle.js`로 해결

- Android 홈 화면 위젯 MVP
  - 남은 일수, 퍼센트, 명언 표시
  - WebView에서 Native SharedPreferences로 위젯 데이터 전달

- 문서
  - `docs/iap-plan.md`: 인앱 결제 계획
  - `docs/ios-roadmap.md`: iOS / WidgetKit 후속 계획

## 최근 해결한 주요 문제

- 앱이 바로 메인 화면으로 뜨고 멈춘 듯 보이던 문제
  - 원인: Android WebView에서 module script 초기화가 안정적으로 실행되지 않음
  - 해결: `js/app-bundle.js`, `js/onboarding-bundle.js`로 일반 스크립트화

- 설정 버튼, 테마 버튼이 동작하지 않던 문제
  - 원인: 메인 JS 초기화 실패
  - 해결: 번들 스크립트로 교체 후 Android 재빌드/재설치

- 온보딩 번역 키가 화면에 그대로 보이던 문제
  - 예: `onboarding.editSubtitle`
  - 원인: 영어/한국어 외 언어 파일에 일부 키 누락
  - 해결: 19개 언어의 온보딩 필수 키 검사 및 누락 번역 추가

- `npm run cap:sync`가 Windows/OneDrive/비ASCII 경로에서 충돌하던 문제
  - 원인 후보: `fs.cpSync`와 경로 문제
  - 해결: `scripts/prepare-web.js`를 재귀 복사 방식으로 수정

## 사무실 컴퓨터에서 이어서 작업하는 방법

1. GitHub에 로그인한다.
2. 저장소를 내려받는다.

```powershell
git clone https://github.com/justice929/heavens-clock.git
cd heavens-clock
```

3. Node 패키지를 설치한다.

```powershell
npm install
```

4. Android Studio / Android SDK가 설치되어 있어야 한다.
5. Android SDK 경로가 필요하면 `android/local.properties` 파일을 사무실 컴퓨터에 맞게 만든다.

예시:

```properties
sdk.dir=C:\\Users\\USER\\AppData\\Local\\Android\\Sdk
```

6. 웹 자산을 Android 앱에 반영한다.

```powershell
npm run prepare:web
npx cap sync android
```

7. Android 앱 빌드:

```powershell
cd android
.\gradlew.bat assembleDebug
```

## 주의할 점

- `android/local.properties`는 개인 PC 경로가 들어가므로 GitHub에 올리지 않는다.
- `www/`, `node_modules/`, Android 빌드 결과물은 자동 생성 파일이라 GitHub에 올리지 않는다.
- 현재 저장소는 Private이므로 사무실 컴퓨터에서도 GitHub 계정 `justice929` 권한으로 접근해야 한다.
- 새 작업을 시작하기 전에는 항상 최신 코드를 받는다.

```powershell
git pull
```

## 다음 작업 후보

- 온보딩 UI를 더 감성적으로 다듬기
- 언어별 문장 품질 검수
- 테마를 실제 판매 가능한 스킨 구조로 확장
- 위젯 디자인 고도화
- 인앱 결제 실제 연동 준비
- iOS 프로젝트 및 WidgetKit 구현
- 앱 아이콘 / 스플래시 / 스토어 이미지 제작

