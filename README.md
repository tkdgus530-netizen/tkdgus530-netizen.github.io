# 결혼식 사회자 소개 사이트

GitHub Pages로 공개하는 정적 사이트입니다. 빌드 과정 없이 파일을 올리면 바로 반영됩니다.

- 공개 주소: https://tkdgus530-netizen.github.io/

## 폴더 구조

```
tkdgus530-netizen.github.io/
├── index.html          페이지 뼈대 + 검색·카카오톡 미리보기 정보
├── data/site.json      화면에 나오는 모든 글·후기·일정·사진 목록  ← 평소에는 이것만 고치면 됨
├── images/             사진 파일
├── assets/css/style.css  디자인
├── assets/js/app.js      site.json을 읽어서 화면을 그리는 코드
└── .nojekyll           GitHub Pages가 파일을 그대로 쓰게 하는 표시 (지우지 마세요)
```

화면 순서: 첫 화면 → 후기 → 예식 일정 → 소개 → 서비스 안내 → 앨범 → 문의.
후기·앨범은 항목이 하나도 없으면 섹션과 상단 메뉴에서 자동으로 빠집니다.

## 내용 고치기 (data/site.json)

GitHub 웹에서 `data/site.json` → 연필 아이콘 → 고친 뒤 **Commit changes** 하면 1~2분 뒤 사이트에 반영됩니다.

| 항목 | 위치 | 비고 |
|---|---|---|
| 이름(상단·사진 설명) | `brand` | |
| 첫 화면 제목·소개 | `hero.title`, `hero.lead` | 줄바꿈은 `\n` |
| 프로필 사진 | `hero.photo` | 예: `"images/profile.png"` |
| 카카오톡·메일 | `contact.kakao`, `contact.email` | 카카오톡은 `https://`로 시작 |
| 후기 | `reviews.items` | 아래 형식 참고 |
| 예식 일정 | `schedule.items` | 아래 형식 참고 |
| 소개·경력 | `about.points`, `about.timeline` | |
| 서비스·진행 순서 | `services.items`, `services.steps` | |
| 앨범 사진 | `album.items` | 아래 형식 참고 |
| 마무리 문구·하단 | `cta`, `footer` | |

### 후기 하나

```json
{ "text": "후기 내용", "author": "김○○ 신부님", "year": "2026", "month": "5", "meta": "더채플 강남", "image": "" }
```

`image`에 캡처 이미지 경로(예: `"images/review-01.jpg"`)를 넣으면 후기 위에 이미지가 붙습니다.
여러 장이면 `"images": ["images/review-01.jpg", "images/review-02.jpg"]`처럼 목록으로 넣으면 2열로 보입니다(이때 `image`는 `""`로 두세요).
아티팩트는 후기당 1장만 다루므로, 여러 장은 아티팩트에서 반영하면 빠집니다.

### 예식 일정 하나

```json
{ "date": "2026-11-07", "start": "11:00", "end": "12:30", "area": "서울 강남" }
```

- 시간은 24시간 `HH:MM` 형식, 하루 기준은 **09:00~21:00** 입니다.
- `end`를 비우면 1시간짜리로 계산합니다.
- 09:00~21:00 안에 60분 이상 빈 시간이 없으면 달력에 **마감**으로 표시됩니다.
- `area`는 방문자에게 그대로 보이므로 넓은 지역만 적는 것을 권합니다. 신랑·신부 이름은 넣지 마세요.

### 앨범 사진 하나

```json
{ "src": "images/album-01.jpg", "caption": "2026년 5월 · 야외 웨딩" }
```

## 사진 올리기

1. GitHub에서 `images` 폴더 → **Add file → Upload files** → 사진을 끌어다 놓고 Commit.
2. `data/site.json`에 그 경로(`images/파일이름.jpg`)를 적습니다.

휴대폰 원본 사진은 크기가 크므로, 긴 변 1800px 정도로 줄여 올리면 페이지가 빨라집니다.

## 이름·제목을 바꿨다면

카카오톡 링크 미리보기와 검색 결과는 `index.html` 맨 위의 `<title>`, `description`, `og:*` 값을 씁니다.
`site.json`의 제목·소개를 바꿨다면 이 부분도 같이 바꿔 주세요.

## 내 컴퓨터에서 미리 보기

`index.html`을 더블클릭하면 브라우저 보안 정책 때문에 `site.json`을 못 읽습니다. 폴더에서 아래 명령으로 띄운 뒤 http://localhost:8000 을 여세요.

```bash
python3 -m http.server 8000
```

## GitHub Pages 설정 (처음 한 번)

저장소 **Settings → Pages → Build and deployment**
- Source: **Deploy from a branch**
- Branch: **main** / **(root)** → Save

## 아티팩트(편집 화면)에서 반영하기

claude.ai 아티팩트에서 글·후기·일정·사진을 고치고 저장한 뒤, 아티팩트의 **🌐 공개 사이트에 반영** 버튼을 누르면
claude.ai의 '사회자 사이트 반영' 작업이 실행되어 이 저장소에 자동으로 커밋·푸시합니다. 보통 몇 분 뒤 사이트에 보입니다.

- 이 작업은 `tools/sync_from_artifact.py`로 `data/site.json`, `images/`, `index.html` 맨 위 미리보기 정보만 바꿉니다.
- 작업은 시작할 때와 푸시 바로 전에 항상 `git pull --rebase origin main`으로 최신 상태를 받은 뒤 진행합니다. 충돌이 나면 푸시하지 않고 결과만 알려 줍니다.
- 버튼은 **작업이 등록된 claude.ai 계정**에서만 동작합니다. 다른 계정에서는 아티팩트의 '공개 사이트 파일' 내려받기를 쓰세요.
- 저장소에서 `data/site.json`을 직접 고쳐도 되지만, 그 뒤 아티팩트에서 반영하면 아티팩트 내용으로 덮어씁니다. 한쪽에서만 고치는 것을 권합니다.

## 직접 수정할 때

내 컴퓨터에서 고쳐 올릴 때도 푸시 전에 항상 최신 상태를 먼저 받으세요.

```bash
git pull --rebase origin main
git push origin main
```
