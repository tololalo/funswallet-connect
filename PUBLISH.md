# 배포 가이드 — @funswallet/connect (npm)

> 스코프 패키지(`@funswallet/connect`)를 npm에 공개 배포하는 절차.
> 패키지는 이미 배포 준비 완료 상태. `npm publish` 시 `prepublishOnly`가
> 자동으로 빌드하고, `publishConfig.access=public` 이 공개 설정을 처리함.

---

## 1회만 — npm 조직(org) 생성

스코프 `@funswallet` 를 쓰려면 npm에 같은 이름의 조직이 필요합니다.

1. https://www.npmjs.com 로그인
2. 우측 상단 아바타 → **Add Organization**
3. 조직 이름: **`funswallet`** (정확히 이 철자 — 스코프와 일치해야 함)
4. 플랜: **Free** 선택 (공개 패키지 무제한, 무료)
5. 생성 완료

> 이미 누가 `funswallet` org를 선점했다면 이름을 바꾸거나
> 스코프 없는 `funswallet-connect` 로 전환해야 함 (그땐 알려주세요).

---

## 매 배포 — 명령

```bash
cd ~/funswallet/funswallet-connect

# 1. 로그인 (브라우저로 인증창 열림)
npm login

# 2. 로그인 확인
npm whoami

# 3. (선택) 실제로 올리기 전에 점검 — 업로드는 안 함
npm publish --dry-run

# 4. 배포
npm publish
```

- `npm publish` 가 자동으로:
  - `prepublishOnly` → `npm run build` (dist 새로 빌드)
  - `publishConfig.access=public` → 공개 패키지로 게시
- **2단계 인증(2FA)** 켜둔 계정이면 OTP(인증 코드) 입력 프롬프트가 뜸 → 인증 앱 코드 입력

---

## 배포 후 확인

```bash
# 메타데이터 조회
npm view @funswallet/connect

# 깨끗한 폴더에서 설치 테스트
cd /tmp && mkdir funs-test && cd funs-test && npm init -y
npm install @funswallet/connect
node -e "console.log(Object.keys(require('@funswallet/connect')))"
```

CDN은 배포 후 **자동**으로 동작 (별도 작업 없음):

- esm.sh: `https://esm.sh/@funswallet/connect`
- jsDelivr: `https://cdn.jsdelivr.net/npm/@funswallet/connect/dist/funs-connect.global.js`
- unpkg: `https://unpkg.com/@funswallet/connect`

> CDN 반영은 보통 몇 분 내. jsDelivr는 최대 12h 캐시될 수 있음.

---

## 다음 버전 올릴 때

코드 수정 후:

```bash
npm version patch   # 0.1.0 → 0.1.1 (버그픽스)
# npm version minor # 0.1.0 → 0.2.0 (기능 추가)
git push && git push --tags
npm publish
```

`npm version` 이 package.json 버전 올리고 git 태그까지 만들어줌.
**같은 버전은 재배포 불가** — 반드시 버전을 올려야 함.

---

## 개발자가 쓰는 법 (배포 후 공유용)

```js
import { connectFunsWallet } from '@funswallet/connect';
const provider = await connectFunsWallet({ projectId: 'THEIR_WC_ID' });
const [address] = await provider.request({ method: 'eth_requestAccounts' });
```

자세한 사용법은 `README.md` 참고.
