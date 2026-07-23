# Project Archive

포트폴리오 프로젝트를 카테고리별로 정리하고, 작업물과 기획 의도, 프로젝트 정보, 핵심 개선 내용을 갤러리 형식으로 보여주는 정적 웹페이지입니다.

## 파일 구조

```text
gallery/
├─ index.html
├─ banner.html
├─ product.html
├─ video.html
├─ editorial.html
├─ assets/
│  ├─ images/
│  │  ├─ placeholders/
│  │  └─ projects/
│  └─ icons/
├─ css/
│  └─ gallery.css
├─ js/
│  ├─ projects.js
│  ├─ project-service.js
│  └─ gallery.js
└─ README.md
```

## 페이지 설명

- `index.html`: 프로젝트 카드 목록, 카테고리 필터, 선택 프로젝트 요약 패널
- `banner.html`: 가로형 배너 뷰어, 썸네일, 프로젝트 정보 패널
- `product.html`: 세로형 상세페이지 내부 스크롤 뷰어, 섹션 썸네일, 정보 패널
- `video.html`: 영상 커버와 플레이어 UI, 영상 썸네일, 길이 표시
- `editorial.html`: 브로슈어/카탈로그 펼침면 뷰어, 페이지 번호, 썸네일

## 샘플 데이터 수정 방법

샘플 프로젝트 데이터는 `js/projects.js`에서 수정합니다. 각 프로젝트는 `id`, `title`, `category`, `type`, `period`, `role`, `tools`, `summary`, `improvementTitle`, `improvements`, `intention`, `files`를 포함합니다.

데이터를 가져오는 함수는 `js/project-service.js`에만 모아두었습니다. 추후 Firebase로 전환할 때는 이 파일의 함수 내부를 비동기 데이터 호출로 바꾸면 렌더링 코드 수정 범위를 줄일 수 있습니다.

## 실제 이미지 교체 방법

1. 실제 작업물 이미지를 `assets/images/projects/`에 넣습니다.
2. `js/projects.js`의 `files.src`와 `files.thumbnail` 경로를 새 파일명으로 바꿉니다.
3. 이미지 설명은 `alt`, `title`, `description`, `meta` 값을 함께 수정합니다.

이미지가 없거나 경로가 잘못되어도 `assets/images/placeholders/image-placeholder.png`가 대신 보이도록 처리되어 있습니다.

## 상세 페이지 연결 방법

카테고리별 대표 상세 페이지는 다음 파일로 연결됩니다.

- `banner`: `banner.html`
- `product`: `product.html`
- `video`: `video.html`
- `editorial`: `editorial.html`

새 상세 페이지를 추가하려면 HTML 파일을 복제하고 `body`의 `data-project-id` 값을 원하는 프로젝트 `id`로 변경하면 됩니다.

## 로컬 실행 방법

빌드 도구가 필요 없습니다. `index.html`을 브라우저에서 열면 바로 확인할 수 있습니다.

## GitHub Pages 배포 방법

1. `gallery` 폴더 전체를 저장소에 업로드합니다.
2. GitHub 저장소의 Settings > Pages에서 배포 브랜치와 폴더를 선택합니다.
3. 루트에 배포할 경우 `gallery` 내부 파일을 루트로 옮기거나, Pages 경로를 `gallery`가 포함된 위치로 맞춥니다.

## 추후 Firebase 연결 안내

2차 개발에서 Firebase를 붙일 경우 우선 수정할 파일은 `js/project-service.js`입니다. 현재 정적 배열을 읽는 `getProjects()`, `getProjectById(id)`, `getProjectsByCategory(category)`를 Firestore 조회 함수로 교체하면 됩니다.

관리자 기능, 이미지 업로드, 드래그 정렬, 인증 기능은 이번 MVP에 포함하지 않았습니다.
