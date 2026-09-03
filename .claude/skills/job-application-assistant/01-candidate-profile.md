---
framework_version: 1.1.1
---

# Candidate Profile

<!-- Populated by /setup on 2026-07-12 from documents/cv/CV_Pham_Hai_Nam_Software_Engineer.pdf -->

> **Reading `documents/cv/` — one guard.** The PDFs in that folder are built on **f8.edu.vn** as a
> *source* for this profile and for the LaTeX CVs. They are **not** the documents he submits.
> `CV_Pham_Hai_Nam_Software_Engineer-1.pdf` still contains *"Architected the system: database
> modeling and backend stack decisions"* on SkyReality and *"Architected system design"* on VB/C06.
> He retracted that phrasing on 2026-08-08 and it is banned everywhere else in this repository —
> **never carry it out of that PDF.** All four `cv/*.tex` files were verified clean of it on
> 2026-09-03. Same file, same check: the SkyReality block duplicates the OAuth2 Google Sign-In
> bullet and leaves *"and multipart upload with checksum verification."* dangling outside any
> bullet. Both are artefacts of the f8 builder, not facts about the work.

## Identity
- **Name:** Pham Hai Nam (Phạm Hải Nam)
- **Date of birth:** 15/07/2003
- **Location:** Ha Noi, Vietnam
- **Phone:** 0346294259
- **Email:** namphamhai7@gmail.com
- **GitHub:** https://github.com/phamnam2003
- **LinkedIn:** https://www.linkedin.com/in/pham-nam-153ab9259/
  **The live profile is stale and nearly empty** — checked 2026-09-03 against
  `documents/linkedin/Linkedin.pdf`. The headline reads *"Student at Hanoi Open University"*, the
  location is set to **Thái Bình** rather than Ha Noi, education shows *2021 – 2025*, and there is
  **no Experience section at all**; he confirmed he has never filled it in. Two consequences.
  *(a)* Infer nothing about him from that profile — every fact in this file comes from his CV, his
  GitHub, or his own answers. *(b)* Treat it as a live job-search problem rather than a cosmetic
  one: a Ha Noi recruiter filtering by location and title never surfaces him, and a recruiter who
  opens it after reading a CV claiming three years finds a student with no jobs listed. The fix
  list is in `02-behavioral-profile.md`'s TODO.
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

### Final-year thesis — event ticketing platform under peak load

*(Added by /setup 2026-09-03 — not previously recorded.)* The graduation project was an
event-ticket sales system, and the part he chose to make the thesis about was **engineering it to
survive the sales-open spike** rather than the CRUD around it. The three techniques he applied:

- **Queue / virtual waiting room** in front of the booking path, to flatten the burst instead of
  letting it hit the database
- **Distributed locking on seat reservation**, with a TTL-based temporary hold, to stop the same
  seat being sold twice under concurrency
- **Redis caching of the seat/inventory map, plus rate limiting and bot/spam protection** on the
  purchase endpoint

**Why this matters for positioning.** It is the one piece of his record where high-concurrency
design is the *stated subject*, not a side effect — and ticket-sales spike handling is a
recognisable, easily-explained system-design story. It pairs naturally with the STM export fix
(167.8 MB → 16 MB, OOM kills eliminated) as evidence that the interest is not theoretical.

**Two limits to respect.** He did *not* say it was load-tested or benchmarked with real numbers, so
**claim the design, never a throughput figure** — no "handled N concurrent users" unless he later
supplies a measurement. And it is university work: on a CV it belongs in Education as a one-line
thesis note, not in Professional Experience.

### Certifications

*(Names confirmed 2026-09-03 from `documents/linkedin/Linkedin.pdf`, replacing the earlier
"exact titles unknown" placeholder. Five ScyllaDB credentials, all listed on his LinkedIn.)*

| Certificate | What it is |
|---|---|
| **S210: Using ScyllaDB Drivers** | ScyllaDB University course |
| **S301: ScyllaDB Operations** | ScyllaDB University course |
| **Alternator Course Completion Certificate** | ScyllaDB University course — Alternator is ScyllaDB's DynamoDB-compatible API |
| **ScyllaDB Labs 2025 Completion Certificate** | Hands-on lab event |
| **LIVE Fall 2024 Advanced Track Completion Certificate** | ScyllaDB University LIVE, advanced track |

**Write the titles exactly as above** on anything that is checked against a record — application
forms, LinkedIn, a certifications field. They were parsed from a line-wrapped LinkedIn sidebar and
he confirmed the split on 2026-09-03; do not re-derive them from the PDF. **Issue dates remain
unknown** — the export lists titles only. The "2025" and "Fall 2024" inside two of the titles are
part of the event names, not issue dates; never convert them into one.

**On a CV, short forms are allowed and `cv/main_example.tex` uses them:** `S210 Drivers; S301
Operations; Alternator; Labs 2025; LIVE Fall 2024 Advanced Track`. Written out in full the five run
to two printed lines, and on 2026-09-03 that second line was what pushed the CV onto a third page.
The S210/S301 codes are the official identifiers, so a verifier can still find all five. Keep the
full titles for the form; keep the short forms for the page budget.

All five are **course- and event-completion certificates** rather than a proctored professional
exam — describe them that way if an application form asks what kind of credential they are.
Corroborating signal that the underlying knowledge is real: the ScyllaDB/Cassandra `gocqlx` deep
dive in `phamnam2003/challenges`.

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
- **Built the Kubernetes cluster himself, on VMware** *(recorded 2026-09-03)* — not a managed
  service and not an inherited cluster. He stood the cluster up from scratch and worked through
  **both** CNIs (Calico on iptables, Cilium on eBPF), Envoy Gateway and Nginx Ingress, then
  deployed to it through ArgoCD with the OpenTelemetry/Prometheus/Grafana/Loki stack on top.
  Earlier versions of this file listed the CNI names as if they were only tools he had used, which
  undersells it by a wide margin. This is also the honest bridge for the **managed-cloud gap**
  (AWS/GCP/Azure): the concepts transfer directly and what is missing is the console and the
  service names — plenty of engineers run EKS without ever having configured a CNI.
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

### Learning — declare as learning, never as delivery experience

*(Recorded by /setup 2026-09-03.)*

- **Rust** — in active self-study, and his stated intent is to bring it up alongside Go and
  TypeScript as a mainstream language for him. **This is the only learning-stage language he wants
  on a CV**, and it belongs in an "Interests / currently learning" line, never in the skills list a
  reader will interview against. No production Rust, no Rust project on GitHub yet.
  *(This supersedes the 2026-07-15 note that Rust was "bio interest only" — it is now deliberate
  study, but the ban on claiming it as working experience is unchanged.)*

**Deliberately excluded from CVs — do not reintroduce.** He knows both and mentioned both, then
chose to leave them off:
- **Java Core** — learned to work through OOP fundamentals, not to build with.
- **.NET / Entity Framework** — self-study plus a personal project, database-first and code-first
  API work. Real but shallow, and listing a second backend ecosystem dilutes the Go-backend
  positioning that the whole search is built around.
Record them here so a future run does not "discover" them as a gap and add them back. If a
specific posting genuinely runs on .NET, that is a reason to reconsider for that one application —
surface the choice to him rather than adding it silently.

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

**Deliberate decision, 2026-09-03: no referees are recorded here.** Asked during `/setup`, he chose
not to declare any — this repository is a public fork, and a referee's name, employer, and role is
someone else's personal data, published without their consent.

- **On a CV, write:** "References available upon request." (`05-cv-templates.md` carries the
  boilerplate line and its per-language variants.)
- **When an application form demands referee details:** surface the request to him and let him
  supply them directly to the employer. Do not fill them in from any file, and do not write them
  back into this repository afterwards.
- Reference *letters* dropped into `documents/references/` are still read by `/setup` for
  behavioral signal — that folder is gitignored, so the letters themselves never leave the
  machine. Only generalised traits reach `02-behavioral-profile.md`; names and contact details
  stay out.
