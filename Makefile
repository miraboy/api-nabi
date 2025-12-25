.PHONY: build run dev test clean

# Build production image
build:
	docker build -t api-nabi .

# Run production container
run:
	docker run -p 3000:3000 --name api-nabi-container api-nabi

# Development with hot reload
dev:
	docker-compose -f docker-compose.dev.yml up --build

# Production deployment
prod:
	docker-compose up --build -d

# Run tests in container
test:
	docker build -f Dockerfile.test -t api-nabi-test .
	docker run --rm api-nabi-test

# Stop all containers
stop:
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# Clean up
clean:
	docker system prune -f
	docker volume prune -f

# View logs
logs:
	docker-compose logs -f api-nabi