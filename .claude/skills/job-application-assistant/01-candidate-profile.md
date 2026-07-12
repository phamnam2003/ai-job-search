# Candidate Profile

<!-- Populated by /setup on 2026-07-12 from documents/cv/CV_Pham_Hai_Nam_Software_Engineer.pdf -->

## Identity
- **Name:** Pham Hai Nam (Phạm Hải Nam)
- **Date of birth:** 15/07/2003
- **Location:** Ha Noi, Vietnam
- **Phone:** 0346294259
- **Email:** namphamhai7@gmail.com
- **GitHub:** https://github.com/phamnam2003
- **LinkedIn:** *(not on CV — add if you have one)*
- **Languages:** Vietnamese (native), English (professional working — technical reading/writing)
- **Status:** Employed — Frontend and Backend Developer at AIONtech (11/2025 – present), open to new opportunities
- **Constraints:** Ha Noi onsite/hybrid, or remote (VN and offshore). Not relocating to HCMC/Da Nang unless fully remote.

## Education

| Degree | Period | Institution | Key Topics |
|--------|--------|-------------|------------|
| **Engineer's degree (Kỹ sư), Information Technology** | *(confirm years)* | **Hanoi Open University (HOU) — Trường Đại học Mở Hà Nội** | Software engineering, data structures & algorithms, databases, computer networks, web development |

## Professional Experience

### Frontend and Backend Developer — AIONtech (11/2025 – Present)
Ha Noi, Vietnam
- Implemented dependency injection with Uber Dig and Fx framework to improve scalability and maintainability of Go backend services
- Refactored and optimized internal packages to improve performance and strengthen application safety
- Implemented background processing with Redis Pub/Sub and Apache Kafka to support business workflows and event-driven logic
- Contributed to the design and optimization of scalable software systems and architectures

### Frontend and Backend Developer — Leeon Group (06/2024 – 10/2025)
Ha Noi, Vietnam
- Built ReactJS web applications with Tailwind CSS and Ant Design
- Took ownership of an existing Go codebase from departing team members — maintained, debugged, and enhanced production projects wired into CI/CD pipelines
- Implemented message-broker and caching solutions: RabbitMQ, Redis (cache, pub/sub, streams), Ristretto local cache, memcached
- Implemented the Worker Pool pattern to manage and execute background tasks efficiently
- Configured secure service connections with SSL/TLS (OpenSSL certificate generation) integrated into Docker containers
- Worked with gRPC in depth: mutual TLS, metadata, interceptors, streaming
- Set up the monitoring stack: Prometheus, Grafana, exporters, Loki; adopted OpenTelemetry for unified traces, metrics, and logs
- Hands-on with Docker (CLI, Compose, Buildx, Dockerfile)

### Full-stack Developer — TLGEO (07/2023 – 02/2024)
Ha Noi, Vietnam
- Built user interfaces with Vue.js and Next.js
- Developed and consumed APIs with ExpressJS and Strapi (open-source Node.js CMS)
- Used Mapbox for government projects in mapping and agriculture
- Contributed to system design using PostgreSQL with the PostGIS extension for spatial data
- Handled deployment: Linux/Ubuntu Server, SSH, Nginx

### Frontend Intern — Lalasoft (04/2023 – 06/2023)
Ha Noi, Vietnam
- Applied Redux Core, Redux Toolkit, and Ant Design to ongoing company projects
- Developed UI for active projects
- Researched and built small internal tools as Chrome Extensions

## Key Projects

### Real Estate — SkyReality (03/2026 – Present) — Backend Developer, team of 7
Platform for managing real-estate leads across marketing campaigns.
- Architected the system: database modeling and backend technology stack decisions
- Developed and structured core backend modules for scalability and maintainability
- Integrated webhook-based event processing from Zalo, Slack, and Telegram bots to automate data collection and workflow triggers
- Implemented OAuth2 authentication with Google Sign-In
- Implemented multipart object upload with checksum verification
- **Stack:** Go (Gin), Kafka, Redis, PostgreSQL, uber-go/dig

### VB — Document AI for C06, Ministry of Public Security (12/2025 – Present) — Backend Developer, team of 9
AI-powered document summarization and task-generation system.
- Architected the system: database modeling and backend technology stack decisions
- Developed and structured core backend modules for scalability and maintainability
- **Stack:** Go (Gin), Kafka, PostgreSQL, Python, Docker, Kubernetes

### STM (Smart Teller Machine) — Sacombank (11/2025 – 01/2026) — Backend Developer, team of 8
Self-service banking system: cash deposit, withdrawal, and account services.
- Refactored STM data export to Excel, improving operational reporting and reconciliation
- Enhanced transaction traceability with step-level logging across STM workflows
- Built asynchronous import/export pipelines to improve scalability and reliability
- Resolved duplicate-data issues and optimized background processing to remove performance bottlenecks
- Applied dependency injection to decouple core components and improve testability
- **Stack:** Go (Gin), Kafka, Oracle Database, SQLite, Prometheus, Grafana, Docker

## Independent / Open-Source Projects

<!-- Added by /expand on 2026-07-12 from github.com/phamnam2003 -->

### `go-http-server/temp` — Go backend template (own GitHub org)
Production-shaped Gin backend template used as the foundation for later projects.
- User registration with `validator/v10`, email verification codes dispatched through a Redis queue (**Asynq**), HTML email templates over SMTP
- **PASETO** token signing with asymmetric keys; Bearer-token middleware; CORS
- Database transactions with explicit commit/rollback; **sqlc** for type-safe query codegen
- Async pattern: return the HTTP response early, complete mail dispatch in a background worker
- Layered architecture (`api/`, `cmd/`, `internal/`, `worker/`, `plugin/pkg/`); API docs via redoc-cli; GitHub Actions CI
- **Stack:** Go 1.23, Gin, PostgreSQL 17, Redis, Asynq, PASETO, sqlc, Docker Compose

### `go-http-server/grpc` — gRPC reference implementation (own GitHub org)
End-to-end gRPC study built from the protocol up, not just the client API.
- All four method types: unary, server streaming, client streaming, bidirectional streaming
- Interceptors for logging, tracing, rate-limiting, authentication, and authorization
- Three connection modes: insecure, server-side TLS, and mutual TLS — with the underlying crypto worked through (TLS 1.0–1.3, AEAD, Diffie-Hellman, MAC, digital certificates)
- `protoc` toolchain, custom serializers, Protocol Buffers over HTTP/2
- **Stack:** Go, gRPC, Protocol Buffers, TLS/mTLS

### `phamnam2003/challenges` — Go engineering study repository
A structured, self-authored curriculum rather than a scratch repo.
- **20 Gang-of-Four design patterns** implemented in Go (9 behavioral, 4 creational, 7 structural)
- 18+ algorithm solutions (hash maps, linked lists, dynamic programming, heaps, bit manipulation)
- Go concurrency: goroutines, channels, `sync`, PubSub, multiplexing
- Technology deep dives: Kafka (offset strategies, admin client, `franz-go`), ScyllaDB/Cassandra (`gocqlx`), OpenTelemetry (traces/metrics/logs), Kubernetes, ELK/Loki, consistent hashing, dependency injection
- Architecture documented with Mermaid diagrams
- **Stack:** Go (86%), Shell, Docker

### `phamnam2003/go-2fa` — Two-factor authentication in Go
- TOTP (time-based one-time password) generation and verification
- Google Authenticator integration: secret key generation, QR code provisioning (base64 data-URI embedding)
- **Stack:** Go, TOTP, QR encoding

## Technical Skills

### Backend (primary)
- **Go** (strong): Gin, gRPC (mTLS, interceptors, streaming), Worker Pool, dependency injection (uber-go/dig, Fx)
- **Node.js**: Express, Strapi
- RESTful API design; microservices architecture
- **gRPC / Protocol Buffers (in depth):** all four method types — unary, server streaming, client streaming, bidirectional streaming; interceptors for rate-limiting, authentication, and authorization; `protoc` toolchain (`protoc-gen-go`, `protoc-gen-go-grpc`); HTTP/2 transport *(GitHub — go-http-server/grpc)*
- **Go concurrency patterns:** goroutines, channels, `sync` package, PubSub, multiplexing/fan-in *(GitHub — phamnam2003/challenges)*
- **Software design:** 20 Gang-of-Four design patterns implemented in Go — 9 behavioral, 4 creational, 7 structural *(GitHub — phamnam2003/challenges)*
- **Data structures & algorithms:** 18+ solved problems — hash maps, linked lists, dynamic programming, heaps, bit manipulation *(GitHub — phamnam2003/challenges)*
- **Clean architecture layering:** `api/` / `cmd/` / `internal/` / `worker/` / `plugin/pkg/` separation *(GitHub — go-http-server/temp)*
- **sqlc** — type-safe Go code generation from SQL *(GitHub — go-http-server/temp)*
- **validator/v10** — request input validation *(GitHub — go-http-server/temp)*
- **WebSocket** — realtime communication *(GitHub — profile bio)*

### Security & Authentication
- **PASETO** — token signing with asymmetric keys *(GitHub — go-http-server/temp)*
- **TOTP / Two-Factor Authentication** — Google Authenticator integration, QR code provisioning, secret key management *(GitHub — phamnam2003/go-2fa)*
- **Bearer token middleware**, CORS configuration *(GitHub — go-http-server/temp)*
- **Cryptography fundamentals:** TLS 1.0–1.3, mutual TLS, AEAD, Diffie-Hellman key exchange, MAC, symmetric/asymmetric encryption, digital certificates *(GitHub — go-http-server/grpc)*
- SSL/TLS certificate generation with OpenSSL; Certbot

### Frontend
- **TypeScript / JavaScript** (strong): ReactJS, Next.js, Vue.js
- State management: Redux, Redux Toolkit, Recoil
- UI: Tailwind CSS, Ant Design; HTML, CSS

### Data & Messaging
- **Databases:** PostgreSQL (incl. PostGIS), MySQL, Oracle, SQLite, MongoDB, ScyllaDB, **Cassandra** *(GitHub — challenges)*
- **Database transactions:** explicit commit/rollback management *(GitHub — go-http-server/temp)*
- **Caching:** Redis (cache, pub/sub, streams), Ristretto, memcached, local caching strategies
- **Messaging:** RabbitMQ (message broker), Apache Kafka (event streaming)
  - **Kafka in depth:** offset strategies, admin client, `franz-go` client library *(GitHub — challenges)*
  - **Asynq** — Redis-backed background task queue for Go *(GitHub — go-http-server/temp)*
- **Distributed systems:** consistent hashing *(GitHub — challenges)*
- **Object storage:** MinIO, RustFS, SeaweedFS, S3-compatible APIs

### Infrastructure & Observability
- **Containers/Orchestration:** Docker (CLI, Compose, Buildx), Kubernetes (Calico CNI, Cilium CNI, Envoy Gateway, Nginx Ingress Controller)
- **CI/CD & GitOps:** GitHub Actions, self-hosted GitLab Runners, ArgoCD
- **Observability:** OpenTelemetry (SDK + Collector), Prometheus, Grafana, Loki, **Jaeger** *(GitHub — profile bio)*, **ELK stack** *(GitHub — challenges)*
- **Web/Infra:** Nginx, Certbot, SSL/TLS, OpenSSL
- **OS:** Linux (Ubuntu, Arch, CentOS), Windows

### Other
- **Python:** Selenium, Scrapy, crawlers
- **Git**, Spec-Kit
- **AI-assisted development:** **Claude Code**, GitHub Copilot, spec-driven workflows
- **Integrations:** SMTP/Gmail mailer with HTML email templates, email-verification flows; Telegram, Zalo, and Slack bot webhooks *(GitHub — go-http-server/temp; CV — SkyReality)*
- **API documentation:** redoc-cli; Mermaid diagrams for architecture docs *(GitHub — go-http-server/temp, challenges)*
- **Open source:** merged pull requests to third-party repositories (GitHub Pull Shark ×2) *(GitHub — profile)*

## Domain Expertise
- **Fintech / banking** — Sacombank STM (self-service banking), AION Bank systems
- **Government / public sector** — C06 (Ministry of Public Security) document AI; TLGEO mapping & agriculture projects
- **Real estate / CRM** — SkyReality lead-management platform
- **Geospatial** — Mapbox, PostGIS

## Publications
*(none)*

## Awards
*(none listed — add if applicable)*

## References
*(none listed — drop reference letters into `documents/references/` and re-run `/setup` to fold them in)*
