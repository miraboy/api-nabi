# Docker Setup for API Nabi

## Quick Start

### Production
```bash
# Build and run with docker-compose
docker-compose up --build -d

# Or use Makefile
make prod
```

### Development
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Or use Makefile
make dev
```

## Available Commands

### Docker Compose
```bash
# Production
docker-compose up --build -d
docker-compose down
docker-compose logs -f

# Development
docker-compose -f docker-compose.dev.yml up --build
docker-compose -f docker-compose.dev.yml down
```

### Makefile Commands
```bash
make build    # Build production image
make run      # Run production container
make dev      # Development with hot reload
make prod     # Production deployment
make test     # Run tests in container
make stop     # Stop all containers
make clean    # Clean up Docker resources
make logs     # View container logs
```

### Manual Docker Commands
```bash
# Build image
docker build -t api-nabi .

# Run container
docker run -p 3000:3000 --name api-nabi-container api-nabi

# Run tests
docker build -f Dockerfile.test -t api-nabi-test .
docker run --rm api-nabi-test
```

## Environment Variables

Production environment variables are configured in `docker-compose.yml`:

- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET` - Change in production!
- `DB_PATH=/app/data/database.sqlite`
- `ALLOWED_ORIGINS`
- `RATE_LIMIT_*` settings

## Data Persistence

SQLite database is persisted using Docker volumes:
- Volume: `sqlite_data`
- Mount point: `/app/data`

## Health Check

The container includes health checks:
- Endpoint: `http://localhost:3000/api/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

## Access

Once running, the API is available at:
- **API**: http://localhost:3000/api
- **Health**: http://localhost:3000/api/health
- **Swagger**: http://localhost:3000/api-docs