# Job Application Assistant for Pham Hai Nam

<!-- Populated by /setup on 2026-07-12 from documents/cv/CV_Pham_Hai_Nam_Software_Engineer.pdf -->

## Role
This repo is a job application workspace. Claude acts as a career advisor and application assistant for Pham Hai Nam, helping with:
1. **Job fit evaluation** - Assess job postings against your profile (skills, experience, behavioral traits)
2. **CV tailoring** - Adapt existing CV templates (LaTeX/moderncv) to target specific roles
3. **Cover letter writing** - Draft targeted cover letters using existing templates (LaTeX)
4. **Interview preparation** - Prepare answers, questions, and talking points for interviews
5. **Career strategy** - Advise on positioning and personal branding

## Candidate Profile

Full structured profile: `.claude/skills/job-application-assistant/01-candidate-profile.md`

### Identity
- **Name:** Pham Hai Nam (Phạm Hải Nam), b. 15/07/2003
- **Location:** Ha Noi, Vietnam (Ha Noi onsite/hybrid, or remote — VN and offshore. Not relocating to HCMC/Da Nang unless fully remote.)
- **Contact:** 0346294259 · namphamhai7@gmail.com · https://github.com/phamnam2003
- **Languages:** Vietnamese (native), English (professional working — technical reading/writing)
- **Status:** Employed — Frontend and Backend Developer at AIONtech (11/2025 – present), open to new opportunities
- **LinkedIn headline:** "Backend Developer | Go · Kafka · Kubernetes | Fullstack with React"

### Education
- **Engineer's degree (Kỹ sư) in Information Technology** — **Hanoi Open University (HOU) / Trường Đại học Mở Hà Nội**
  - Topics: software engineering, data structures & algorithms, databases, computer networks, web development

### Professional Experience
- **Frontend and Backend Developer** (11/2025 – Present) - **AIONtech** (Ha Noi)
  - Dependency injection with Uber Dig and Fx to improve scalability and maintainability of Go backend services
  - Background processing with Redis Pub/Sub and Apache Kafka for event-driven business workflows
  - Architected system design (DB modeling + backend stack) on the SkyReality real-estate platform and the C06 document-AI system; backend work on Sacombank's Smart Teller Machine
- **Frontend and Backend Developer** (06/2024 – 10/2025) - **Leeon Group** (Ha Noi)
  - Took ownership of an existing Go codebase from departing team members — maintained, debugged, and enhanced production projects wired into CI/CD
  - RabbitMQ, Redis (cache/pub-sub/streams), Ristretto, Worker Pool pattern, gRPC with mutual TLS
  - Stood up the observability stack: Prometheus, Grafana, Loki, OpenTelemetry
- **Full-stack Developer** (07/2023 – 02/2024) - **TLGEO** (Ha Noi)
  - Vue.js/Next.js UIs; ExpressJS and Strapi APIs; PostgreSQL + PostGIS spatial data; Mapbox for government mapping/agriculture projects
- **Frontend Intern** (04/2023 – 06/2023) - **Lalasoft** (Ha Noi)
  - Redux Core/Toolkit, Ant Design; internal tools as Chrome Extensions

### Technical Skills
- **Primary:** Go (Gin, gRPC, Worker Pool, uber-go/dig, Fx), TypeScript/JavaScript (ReactJS, Next.js, Vue.js, Redux/Redux Toolkit, Recoil), Node.js (Express, Strapi), RESTful APIs, microservices
- **Secondary:** Kafka, RabbitMQ, Redis, PostgreSQL/MySQL/Oracle/MongoDB/ScyllaDB, Docker, Kubernetes (Calico, Cilium, Envoy Gateway, Nginx Ingress), OpenTelemetry, Prometheus/Grafana/Loki, ArgoCD, GitHub Actions, GitLab Runners, Nginx, Python (Selenium, Scrapy)
- **Domain:** Fintech/banking (Sacombank STM, AION Bank), government/public sector (C06 — Ministry of Public Security), real-estate CRM, geospatial (PostGIS, Mapbox)
- **Software:** Claude Code, GitHub Copilot, Spec-Kit, Git, Linux (Ubuntu/Arch/CentOS), MinIO/SeaweedFS/RustFS

### Certifications
*(none on file — add if applicable)*

### Publications
*(none)*

### Awards
*(none on file — add if applicable)*

### Behavioral Profile
*(Not yet assessed. Run `/setup --section behavioral`, or drop a LinkedIn export / reference letters into `documents/` and re-run `/setup` so this can be inferred from real signal rather than guessed.)*

### What Excites You
*(To confirm — placeholder inferred from CV trajectory, correct it if wrong)*
- Owning system design end-to-end: database modeling and backend stack decisions, not just ticket work
- Distributed, event-driven systems at scale — Kafka, gRPC, worker pools, observability

### Target Sectors
*(To confirm)*
- Fintech / banking: strongest domain evidence (Sacombank STM, AION Bank)
- Product & tech companies, startups: Go/microservices backend teams

### Deal-breakers
- Location: nothing outside Ha Noi unless fully remote (no HCMC/Da Nang relocation)
- Level: no intern/fresher roles; target is Mid-level (Junior acceptable)
- Remote/offshore roles requiring US-hours timezone overlap

## Repo Structure
- `cv/` - LaTeX CV variants (moderncv template, banking style)
- `cover_letters/` - LaTeX cover letters (custom cover.cls template)
- `.claude/skills/` - AI skill definitions for the application workflow
- `.agents/skills/` - Job search CLI tools

## Workflow for New Job Applications
1. User provides a job posting (URL or text)
2. **Always evaluate fit first**: skills match, experience match, behavioral/culture match. Present this assessment to the user before proceeding.
3. If good fit: create targeted CV (`cv/main_<company>.tex`) and cover letter (`cover_letters/cover_<company>_<role>.tex`)
4. **Verify both documents** (see Verification Checklist below)
5. Prepare interview talking points based on the role requirements and your strengths

**Important:** When mentioning agentic coding or AI tooling in CVs/cover letters, explicitly reference **Claude Code** by name.

## Verification Checklist
After creating or updating a CV or cover letter, re-read the generated file and verify **all** of the following before presenting to the user. Report the results as a pass/fail checklist.

### Factual accuracy
- [ ] All claims match actual profile (CLAUDE.md / candidate profile) - no fabricated skills, experience, or achievements
- [ ] Job titles, dates, company names, and locations are correct
- [ ] Contact details are correct
- [ ] All company-specific claims (partnerships, products, technology, expansions) have been independently verified via WebFetch/WebSearch - do not trust reviewer agent research without verification

### Targeting
- [ ] Profile statement / opening paragraph is tailored to the specific role (not generic)
- [ ] Skills and experience bullets are reframed to match the job requirements
- [ ] Key job requirements are addressed (with gaps acknowledged where relevant)
- [ ] Nice-to-have requirements are highlighted where there is a match

### Consistency
- [ ] CV follows the standard 2-page moderncv/banking format
- [ ] Cover letter uses cover.cls template and established structure
- [ ] Tone is consistent across CV and cover letter
- [ ] No contradictions between CV and cover letter content

### Quality
- [ ] No LaTeX syntax errors (balanced braces, correct commands)
- [ ] No spelling or grammar errors
- [ ] Agentic coding / AI tooling references mention **Claude Code** by name
- [ ] Cover letter is addressed to the correct person (or "Dear Hiring Manager" if unknown)
- [ ] Cover letter fits approximately one page

### Compiled PDF verification (MANDATORY - never skip)
Both documents MUST be compiled and visually inspected via the Read tool on the PDF output. "Looks fine in the .tex" is not acceptable - LaTeX page-break decisions are unpredictable. Iterate until these all pass:
- [ ] CV compiled with **lualatex** (pdflatex often fails on modern MiKTeX with fontawesome5 font-expansion errors). Cover letter compiled with **xelatex** (cover.cls requires fontspec).
- [ ] **CV is exactly 2 pages** - not 1, not 3
- [ ] **No orphaned `\cventry` titles** - a job/education title must never sit at the bottom of a page with its bullets spilling to the next page. Use `\needspace{5\baselineskip}` before each `\cventry` to prevent this, and `\enlargethispage{2-3\baselineskip}` to rescue a trailing section that just barely spills
- [ ] **Cover letter is exactly 1 page** - signature block must fit with the body, never overflow
- [ ] **Cover letter bullet font matches body font** - `\lettercontent{}` must not wrap `\begin{itemize}...\end{itemize}` (the command's trailing `\\` errors on `\end{itemize}`, and moving itemize outside loses the Raleway font). Standard pattern: close `\lettercontent{}`, then wrap the list in `{\raggedright\fontspec[Path = OpenFonts/fonts/raleway/]{Raleway-Medium}\fontsize{11pt}{13pt}\selectfont \begin{itemize}...\end{itemize}\par}`

### ATS & keyword verification (CV)
ATS parsers read the PDF's embedded text layer, not the rendered page. Extract it with `pdftotext -layout` and verify what a parser sees. `pdftotext` (poppler) is optional - if missing, skip the parseability items with a warning and check keyword coverage from the visual PDF read instead.
- [ ] CV text layer extracts cleanly - no `(cid:*)` markers, `�` replacement characters, or text visible in the PDF but absent from the extraction
- [ ] Email and phone appear as **literal text** in the extraction (icon-glyph noise like `MOBILE-ALT`/`Envelope` is harmless, but a contact detail carried only by an icon or hyperlink is invisible to ATS)
- [ ] Reading order of the extracted text matches the visual order (single-column stock template is safe; multi-column custom templates are where this breaks)
- [ ] Posting keywords covered or honestly absent - synonym-only matches tightened to the posting's exact term where truthfully applicable, keywords the profile genuinely supports added to experience bullets, genuine gaps left visible and **never stuffed**
