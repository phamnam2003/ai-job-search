---
framework_version: 1.1.1
---

# Candidate Profile

<!-- Populated by /setup on 2026-07-12 from documents/cv/CV_Pham_Hai_Nam_Software_Engineer.pdf -->

## Identity
- **Name:** Pham Hai Nam (Phạm Hải Nam)
- **Date of birth:** 15/07/2003
- **Location:** Ha Noi, Vietnam
- **Phone:** 0346294259
- **Email:** namphamhai7@gmail.com
- **GitHub:** https://github.com/phamnam2003
- **LinkedIn:** https://www.linkedin.com/in/pham-nam-153ab9259/
- **Status:** Employed — Frontend and Backend Developer at AIONtech (11/2025 – present), open to new opportunities
- **Constraints:** Ha Noi onsite/hybrid, or remote (VN and offshore). Not relocating to HCMC/Da Nang unless fully remote.
- **Salary filter band:** **17–40M VND/month**. This is a search filter and nothing else — the
  floor flags postings to skip, the top reflects the published market band for Go backend at
  ~3 years in Ha Noi. It is deliberately *not* a record of what he earns now or of any offer he
  holds; those figures are not kept in this repository, which is public. Do not reconstruct them
  here, do not ask for them in order to fill this bullet in, and **never state a current salary
  or an expected number to a prospective employer** — if an application form demands one, surface
  the question to him rather than answering it from any file.
  The floor is duplicated in CLAUDE.md's deal-breakers and in `04-job-evaluation.md`'s Life
  situation alignment. Change all three together: two floors that disagree make `/scrape` and
  `/rank` enforce different bars, silently.

### Languages
<!-- Every language you can work in professionally, with your honest level. Used by the
Language Gate in 04-job-evaluation.md and by job-scraper/search-queries.md's query-language
generation. Omit any language you don't actually work in - an undeclared language is treated as
a hard no, not a gap to smooth over. -->

| Language | Level | Notes |
|----------|-------|-------|
| Vietnamese | Native | Primary working language |
| English | Professional working | Technical reading/writing. **Not** live/conversational — roles requiring client-facing English, English-first interviews or US-hours standups are a hard deal-breaker (see CLAUDE.md) |

## Education

| Degree | Period | Institution | Key Topics |
|--------|--------|-------------|------------|
| **Engineer's degree (Kỹ sư), Information Technology** | 2021 – 2026 (**graduated**) | **Hanoi Open University (HOU) — Trường Đại học Mở Hà Nội** | Software engineering, data structures & algorithms, databases, computer networks, web development |

**Full-time (chính quy) programme, studied while working from early 2023.** Confirmed by the
candidate 2026-08-08. He arranged his class schedule so that large blocks were free, and used
that time to work. This is the explanation for the pattern a reader otherwise finds implausible:
a 2026 graduation date sitting above roughly three years of professional experience beginning
04/2023. **Say this on CVs** — without it, the graduation year anchors readers to "2026 fresher"
and every seniority claim above it gets silently discounted. *(How hard he worked to make it fit,
including weekends, is context for interviews only — he asked that it stay off the CV.)*

## Professional Experience

### Frontend and Backend Developer — AIONtech (11/2025 – Present)
Ha Noi, Vietnam
- Implemented dependency injection with Uber Dig and Fx framework to improve scalability and maintainability of Go backend services
- Refactored and optimized internal packages to improve performance and strengthen application safety
- Implemented background processing with Redis Pub/Sub and Apache Kafka to support business workflows and event-driven logic
- Pushed realtime updates to clients over WebSocket and Server-Sent Events (SSE)
- Built background task workers and scheduled cron jobs for recurring and long-running operations
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

### Gap: 03/2024 – 05/2024
Between TLGEO and Leeon Group. **Concentrated on university coursework in order to finish the
degree faster** (confirmed 2026-08-08). Not idle time and not a layoff. Worth one line on a CV
where the gap is visible, since an unexplained gap compounds the credibility problem the 2026
graduation date already creates.

### Frontend Intern — Lalasoft (04/2023 – 06/2023)
Ha Noi, Vietnam
- Applied Redux Core, Redux Toolkit, and Ant Design to ongoing company projects
- Developed UI for active projects
- Researched and built small internal tools as Chrome Extensions

## Key Projects

**All three projects below are AIONtech projects** (confirmed 2026-08-08). Always attribute them
to AIONtech on a CV. Left unattributed they read either as concurrent outside work or as an
impossibly fast ramp, and both readings damage credibility.

**Scope of the design work — corrected 2026-08-08 by the candidate.** Earlier versions of this
profile, the master CV and CLAUDE.md all said he "architected the system" end to end. That
overstates it. What he actually did: **proposed design options, which were reviewed and approved
before he built them, and the design he owned covered the modules assigned to him, not the whole
platform.** Use that framing. Do not write "architected the system", "owned the architecture end
to end", or "sole architect" in any future document.

### Real Estate — SkyReality (03/2026 – Present) — AIONtech — Backend Developer, team of 7
Platform for managing real-estate leads across marketing campaigns.
- Proposed the database model and backend stack for the modules he owned; designs were reviewed and approved by the team before implementation
- Developed and structured core backend modules for scalability and maintainability
- Integrated webhook-based event processing from Zalo, Slack, and Telegram bots to automate data collection and workflow triggers
- Implemented OAuth2 authentication with Google Sign-In
- Delivered realtime client updates over WebSocket and Server-Sent Events (SSE); ran recurring and long-running work through background task workers and cron jobs
- Implemented multipart object upload with checksum verification against MinIO object storage
- Built the platform's frontend in Next.js with Shadcn UI and TanStack Query
- Deployed to Kubernetes with ArgoCD GitOps
- **Stack:** Go (Gin), Kafka, Redis, PostgreSQL, uber-go/dig, MinIO; Kubernetes, ArgoCD; Next.js, Shadcn UI, TanStack Query

### VB — Document AI for C06, Ministry of Public Security (12/2025 – Present) — AIONtech — Backend Developer, team of 9
AI-powered document summarization and task-generation system. Built for C06 and now being positioned for other customers — it is a product, not a one-client build.
- Proposed the database model and backend stack for the modules he owned; designs were reviewed and approved by the team before implementation
- Developed and structured core backend modules for scalability and maintainability
- Implemented realtime client updates over WebSocket and Server-Sent Events (SSE), with background task workers and cron jobs for recurring and long-running processing
- Deployed to Kubernetes with ArgoCD GitOps; integrated MinIO object storage
- **Stack:** Go (Gin), Kafka, PostgreSQL, Redis, MinIO, Docker, Kubernetes, ArgoCD
- *(No Python on his side — the AI/Python services are another team's. Confirmed 2026-08-07; an earlier version of this profile wrongly listed Python in this stack.)*

### STM (Smart Teller Machine) — Sacombank (11/2025 – 01/2026) — AIONtech — Backend Developer, team of 8
Self-service banking system: cash deposit, withdrawal, and account services.
- Refactored STM data export to Excel, improving operational reporting and reconciliation
- Diagnosed a failing export (OOM kills and timeouts) down to unbounded query result sets plus duplicate rows; paginated the query path and de-duplicated the output — **same dataset went from 167.8 MB to 16 MB (~90% smaller), OOM kills eliminated and timeouts stopped**
- Enhanced transaction traceability with step-level logging across STM workflows
- Built asynchronous import/export pipelines to improve scalability and reliability
- Added realtime client updates over WebSocket and Server-Sent Events (SSE), plus cron-scheduled background jobs alongside the async import/export workers
- Applied dependency injection to decouple core components and improve testability
- Built the admin frontend in Next.js with Shadcn UI
- **Stack:** Go (Gin), Kafka, Oracle Database, SQLite, Prometheus, Grafana, Docker; Next.js, Shadcn UI

## Independent / Open-Source Projects

<!-- Added by /expand on 2026-07-12 from github.com/phamnam2003 -->

### `go-http-server/temp` — Go backend template (own GitHub org)
Production-shaped Gin backend template used as the foundation for later projects.
- User registration with `validator/v10`, email verification codes dispatched through a Redis queue (**Asynq**), HTML email templates over SMTP
- **JWT** and **PASETO** token signing with asymmetric keys; Bearer-token middleware; CORS
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
- **Testing:** unit and integration tests for business logic, REST APIs, and database interactions in Go and Node.js *(CV — Overview)*
- **gRPC / Protocol Buffers (in depth):** all four method types — unary, server streaming, client streaming, bidirectional streaming; interceptors for rate-limiting, authentication, and authorization; `protoc` toolchain (`protoc-gen-go`, `protoc-gen-go-grpc`); HTTP/2 transport *(GitHub — go-http-server/grpc)*
- **Go concurrency patterns:** goroutines, channels, `sync` package, PubSub, multiplexing/fan-in *(GitHub — phamnam2003/challenges)*
- **Software design:** 20 Gang-of-Four design patterns implemented in Go — 9 behavioral, 4 creational, 7 structural *(GitHub — phamnam2003/challenges)*
- **Data structures & algorithms:** 18+ solved problems — hash maps, linked lists, dynamic programming, heaps, bit manipulation *(GitHub — phamnam2003/challenges)*
- **Clean architecture layering:** `api/` / `cmd/` / `internal/` / `worker/` / `plugin/pkg/` separation *(GitHub — go-http-server/temp)*
- **sqlc** — type-safe Go code generation from SQL *(GitHub — go-http-server/temp)*
- **validator/v10** — request input validation *(GitHub — go-http-server/temp)*
- **Realtime delivery:** WebSocket and Server-Sent Events (SSE) for pushing updates to clients *(CV — AIONtech projects; GitHub — profile bio)*
- **Background & scheduled execution:** background task workers and cron jobs for recurring and long-running operations *(CV — AIONtech projects)*

### Security & Authentication
- **PASETO** — token signing with asymmetric keys *(GitHub — go-http-server/temp)*
- **TOTP / Two-Factor Authentication** — Google Authenticator integration, QR code provisioning, secret key management *(GitHub — phamnam2003/go-2fa)*
- **Bearer token middleware**, CORS configuration *(GitHub — go-http-server/temp)*
- **Cryptography fundamentals:** TLS 1.0–1.3, mutual TLS, AEAD, Diffie-Hellman key exchange, MAC, symmetric/asymmetric encryption, digital certificates *(GitHub — go-http-server/grpc)*
- SSL/TLS certificate generation with OpenSSL; Certbot

### Frontend
- **TypeScript / JavaScript** (strong): ReactJS, Next.js, Vue.js
- State management: Redux, Redux Toolkit, Recoil; **TanStack Query** for server state *(CV — SkyReality)*
- UI: Tailwind CSS, Ant Design, **Shadcn UI**; HTML, CSS
- **Fullstack on flagship projects:** built the Next.js frontends for SkyReality and the Sacombank STM admin UI himself, alongside owning their backends — this is the evidence behind the fullstack positioning, since the project titles read "Backend Developer"

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
- **CI/CD & GitOps:** GitHub Actions, self-hosted GitLab Runners, ArgoCD, **Helm charts**
  - Deployed SkyReality and the VB/C06 document-AI system to Kubernetes via ArgoCD himself *(CV — Projects)*
- **Observability:** OpenTelemetry (SDK + Collector), Prometheus, Grafana, Loki, **Jaeger** *(GitHub — profile bio)*, **ELK stack** *(GitHub — challenges)*
- **Web/Infra:** Nginx, Certbot, SSL/TLS, OpenSSL
- **OS:** Linux (Ubuntu, Arch, CentOS), Windows

### Other
- **Python:** Scrapy and Selenium for web crawling — used to scrape e-commerce product data (Shopee). This is where his Python experience actually is; do **not** attribute Python to the VB/C06 document-AI project.
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
- **2nd prize, Faculty-level Student Scientific Research (2024)** — Hanoi Open University (HOU). Topic: Agile in software development.
- **Encouragement (merit) scholarship** — awarded 3 terms.

<!-- GPA 3.09/4.0 on record but intentionally OMITTED from CVs (below the ~3.2 "impressive" threshold; candidate has ~3 yrs experience so GPA carries little weight). Provide only if an application form requires it. -->


## References
*(none listed — drop reference letters into `documents/references/` and re-run `/setup` to fold them in)*
