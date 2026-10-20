# CLAUDE.md

결혼식 사회자(김상현) 소개 사이트. GitHub Pages로 `main` 브랜치 루트를 그대로 공개하는 **빌드 없는 정적 사이트**다.

- 공개 주소: https://tkdgus530-netizen.github.io/
- 저장소: `tkdgus530-netizen/tkdgus530-netizen.github.io` (저장소 주인 = 사회자, 사이트 관리자는 collaborator)
- 언어: 화면 글·커밋 메시지·문서 모두 한국어

## 폴더 구조

```
index.html              뼈대 + <head> 검색·카카오톡 미리보기(og:*) 정보. 화면 내용은 없음
data/site.json          화면에 나오는 모든 내용 (아래 스키마)
images/                 사진. 프로필은 images/profile.<확장자>, 나머지는 images/<이름>.<확장자>
assets/css/style.css    디자인 (색은 :root 변수)
assets/js/app.js        site.json을 fetch 해서 화면을 그리는 보기 전용 코드 (프레임워크 없음, ES5 스타일)
README.md               사람용 안내 (내용 수정·사진·Pages 설정)
.nojekyll               Jekyll 처리 끄기. 지우지 말 것
```

**모든 파일이 공개 사이트에서 그대로 내려받아진다**(이 CLAUDE.md 포함). 비밀번호·토큰·개인 연락처 등은 어떤 파일에도 넣지 않는다.

## 화면 구성 (app.js 렌더 순서)

첫 화면(hero) → 후기 → 예식 일정(달력) → 소개(+경력) → 서비스 안내(+진행 순서) → 앨범 → 문의(CTA) → 푸터.
화면 아래에 카카오톡·메일 문의 바가 항상 고정되어 있다. 상단 메뉴: 후기·일정·소개·서비스·앨범·문의.

- 후기는 `text` 또는 이미지(`image`/`images`)가 있는 것만 보이고, 하나도 없으면 섹션과 메뉴 항목이 사라진다.
- 앨범도 항목이 없으면 섹션과 메뉴 항목이 사라진다.
- 값이 빈 글 칸은 태그 자체를 그리지 않는다 (`tag()` 도우미).

## data/site.json 스키마

```jsonc
{
  "meta":    { "title": "브라우저 탭·미리보기 제목", "siteUrl": "https://tkdgus530-netizen.github.io/" },
  "contact": { "kakao": "https://open.kakao.com/o/...", "email": "..." },
  "brand":   "사회자 김상현",                       // 상단 이름, 사진 alt
  "hero":    { "title": "줄바꿈은 \n", "lead": "...", "photo": "images/profile.png" },
  "reviews": { "heading": "", "lead": "",
               "items": [{ "text": "", "author": "김○○ 신부님", "year": "2026", "month": "5", "meta": "예식장", "image": "",
                          "images": ["images/..."] }] },   // images: 여러 장(선택). image가 있으면 맨 앞에 붙여 보여 준다
  "schedule":{ "heading": "", "lead": "",
               "items": [{ "date": "YYYY-MM-DD", "start": "HH:MM", "end": "HH:MM", "area": "서울 강남" }] },
  "about":   { "heading": "", "intro": "", "points": [{ "title": "", "desc": "" }],
               "careerLead": "", "timeline": [{ "year": "2025", "text": "" }] },
  "services":{ "heading": "", "lead": "", "items": [{ "title": "", "desc": "", "price": "" }],
               "stepsTitle": "", "steps": [{ "title": "", "desc": "" }], "note": "" },
  "album":   { "heading": "", "lead": "", "items": [{ "src": "images/...", "caption": "" }] },
  "cta":     { "title": "", "lead": "" },
  "footer":  ""
}
```

규칙:
- 줄바꿈은 문자열 안의 `\n`. HTML은 넣지 않는다 (모두 이스케이프되어 글자로 보인다).
- 사진·링크 경로는 `images/`, `https://`, `mailto:`로 시작해야만 쓰인다 (`safeUrl`).
- 연·월·시간은 모두 문자열.

### 예식 일정 규칙 (app.js)

- 시간은 24시간 `HH:MM`, 하루 기준 범위 **09:00~21:00** (`T_MIN`, `T_MAX`).
- `end`가 비었거나 `start`보다 이르면 60분짜리로 계산한다.
- 그날 09:00~21:00 안에 **60분 이상** 빈 시간(`MIN_GAP`)이 없으면 달력에 '마감'으로 표시한다.
- 방문자에게는 날짜별로 **잡혀 있는 시간만** 보여 준다. 빈 시간 목록은 보여 주지 않는다.
- 방문자는 이번 달 이전으로 넘길 수 없고, 월 목록에는 오늘 이후 일정만 나온다.
- `area`는 방문자에게 그대로 보인다. 신랑·신부 이름이나 연락처는 일정·후기 어디에도 넣지 않는다.

## 작업 규칙

### Git
- 배포 브랜치는 `main` 하나. 푸시가 곧 배포다(1~2분 뒤 반영).
- **푸시 전에는 항상 `git pull --rebase origin main`으로 최신 상태를 받은 뒤 진행한다.** 작업 시작 때 한 번, 푸시 바로 전에 한 번 더 받는다.
- 충돌이 나면 `git rebase --abort` 후 푸시하지 말고 사용자에게 알린다. `--force` 푸시는 하지 않는다.
- 내용 파일(`data/`, `images/`) 수정과 코드 수정은 커밋을 나눈다.
- 커밋 메시지는 한국어로, 첫 줄에 무엇을 바꿨는지 쓴다.

### 코드를 고칠 때
- `site.json` 필드를 추가·변경하면 `app.js`도 같이 맞춘다.
- 외부 라이브러리나 빌드 단계는 도입하지 않는다. 웹폰트(Google Fonts) 외 외부 스크립트도 넣지 않는다.

### 확인 방법
```bash
python3 -m json.tool data/site.json > /dev/null   # JSON 문법
node --check assets/js/app.js                      # JS 문법
python3 -m http.server 8000                        # http://localhost:8000 (file:// 로 열면 site.json fetch 실패)
```
화면은 폭 390px(휴대폰)과 1200px에서 확인한다. 가로 스크롤이 없어야 하고, 콘솔 오류가 없어야 하며, 달력에서 날짜를 눌러 잡힌 시간이 나오는지 본다.

## 하지 말 것
- 실제로 받지 않은 후기를 지어내지 않는다.
- `.nojekyll`을 지우지 않는다.
