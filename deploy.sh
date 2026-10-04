#!/usr/bin/env bash
# ========================================================
# 성경 66권 장별 핵심 구절 암송 플랫폼 - 원클릭 배포 스크립트
# 사용법: ./deploy.sh 또는 npm run deploy
# ========================================================
set -e

echo "🚀 [1/3] 프로덕션 빌드 (Vite Build) 시작..."
npm run build

echo "💾 [2/3] Git 저장소 확인 및 변경사항 커밋..."
if [ ! -d .git ]; then
  git init
  git branch -M main
fi

git add .
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  COMMIT_MSG="feat: $(date '+%Y-%m-%d %H:%M:%S') 구절 암송 기능 업데이트 및 배포"
  echo "  -> 커밋 메시지: ${COMMIT_MSG}"
  git commit -m "${COMMIT_MSG}"
else
  echo "  -> 새로 커밋할 변경사항이 없습니다."
fi

echo "🌐 [3/3] GitHub 배포 진행..."
if git remote | grep -q "origin"; then
  echo "  -> GitHub origin main 브랜치로 푸시..."
  git push origin main || echo "  ⚠️ GitHub push 실패 (원격 저장소 주소 또는 로그인 토큰 확인 필요)"
fi

echo "  -> gh-pages 정적 호스팅 배포 실행..."
npx gh-pages -d dist

echo ""
echo "✨ 배포가 완료되었습니다!"
echo "📌 GitHub 저장소의 Settings -> Pages 메뉴에서 'Deploy from a branch' (gh-pages) 또는 'GitHub Actions'가 활성화되어 있는지 확인해주세요."
