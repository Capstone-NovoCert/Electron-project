# Novo App Makefile
# 필수 명령어들을 간단하게 실행할 수 있습니다.

.PHONY: help install build web desktop clean dev

# 기본 타겟
help:
	@echo "Novo App - 사용 가능한 명령어:"
	@echo ""
	@echo "  make install    - 모든 의존성 설치"
	@echo "  make build      - 모든 패키지 빌드 (웹 + 데스크톱)"
	@echo "  make web        - 웹 앱 개발 서버 실행 (localhost:3000)"
	@echo "  make desktop    - 데스크톱 앱 실행 (Electron)"
	@echo "  make dev        - 웹과 데스크톱 동시 실행"
	@echo "  make clean      - 모든 빌드 파일 정리"
	@echo ""

# 의존성 설치
install:
	@echo "📦 의존성 설치 중..."
	pnpm install

# 모든 패키지 빌드
build:
	@echo "🔨 모든 패키지 빌드 중..."
	pnpm build

# 웹 앱 개발 서버 실행
web:
	@echo "🌐 웹 앱 개발 서버 실행 중... (http://localhost:3000)"
	pnpm dev:web

# 데스크톱 앱 실행
desktop:
	@echo "🖥️  데스크톱 앱 실행 중..."
	pnpm dev:desktop

# 웹과 데스크톱 동시 실행
dev:
	@echo "🚀 웹과 데스크톱 앱 동시 실행 중..."
	pnpm dev

# 빌드 파일 정리
clean:
	@echo "🧹 빌드 파일 정리 중..."
	pnpm clean

# 웹 앱만 빌드
build-web:
	@echo "🌐 웹 앱 빌드 중..."
	pnpm build:web

# 데스크톱 앱만 빌드
build-desktop:
	@echo "🖥️  데스크톱 앱 빌드 중..."
	pnpm build:desktop
