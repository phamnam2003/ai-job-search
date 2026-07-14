# Interview Preparation Guide

<!-- SETUP: STAR examples are personalized by running /setup based on your actual experience -->

## STAR Format

Structure answers as: **Situation** (context), **Task** (your responsibility), **Action** (what you did), **Result** (outcome).

Keep answers to 1-2 minutes. Be specific. End with what you learned or would do differently.

## Ready-Made STAR Examples

<!-- These are populated by /setup from your actual experience. Below are templates showing the format. -->

### 1. [PROJECT_NAME] ([SKILL_DEMONSTRATED])
**S:** [CONTEXT - what was happening, what was the problem]
**T:** [YOUR RESPONSIBILITY - what you specifically needed to do]
**A:** [WHAT YOU DID - specific actions, tools, methods]
**R:** [OUTCOME - measurable results, adoption, impact]
**Use for:** "[QUESTION_TYPE_1]", "[QUESTION_TYPE_2]"

### 2. [PROJECT_NAME] ([SKILL_DEMONSTRATED])
**S:** [CONTEXT]
**T:** [YOUR RESPONSIBILITY]
**A:** [WHAT YOU DID]
**R:** [OUTCOME]
**Use for:** "[QUESTION_TYPE_1]", "[QUESTION_TYPE_2]"

### 3. [PROJECT_NAME] ([SKILL_DEMONSTRATED])
**S:** [CONTEXT]
**T:** [YOUR RESPONSIBILITY]
**A:** [WHAT YOU DID]
**R:** [OUTCOME]
**Use for:** "[QUESTION_TYPE_1]", "[QUESTION_TYPE_2]"

<!-- Add more STAR examples as needed. Aim for 4-6 covering different competencies. -->

## STAR Candidates (Complete Manually)

<!-- Seeded by /setup on 2026-07-15 from CV projects + behavioral answers. The Situation/Task/
     Action are drafted from real work; fill each **Result** with a concrete outcome or metric
     before using in an interview. Do not invent numbers. -->

### Architecture ownership on SkyReality (system design & DB modeling)
**Source:** CV — SkyReality, backend developer, team of 7 (03/2026–present)
**What happened:** Given a new real-estate lead-management platform, you owned the database model and backend stack decisions, then built the core modules and webhook-based event ingestion from Zalo/Slack/Telegram.
**Why it matters:** Best evidence for "you will own the backend" / system-design / data-modeling questions, and for how you make architectural decisions (your stated "research deeply, then commit" style).
**S/T/A/R stub:**
- Situation: New platform, greenfield backend, small team; leads arrive from multiple external channels (Zalo, Slack, Telegram) and marketing campaigns.
- Task: Decide the data model and backend architecture, then deliver scalable core modules and reliable event ingestion.
- Action: Modeled the schema in PostgreSQL; chose Gin + Kafka + Redis + uber-go/dig; built webhook event processing, OAuth2 Google Sign-In, and multipart upload with checksum verification.
- Result: _(fill: e.g. leads/day ingested, number of channels automated, latency, what the design enabled the team to ship next)_

### Async pipelines & bottleneck removal on Sacombank STM (performance / distributed)
**Source:** CV — Sacombank Smart Teller Machine, backend developer, team of 8 (11/2025–01/2026)
**What happened:** On a live self-service banking system, you rebuilt data import/export as async pipelines, added step-level transaction logging, and resolved duplicate-data issues that were causing performance bottlenecks.
**Why it matters:** Strongest story for performance/optimization, event-driven design, and working in a regulated fintech context. Good answer for "tell me about a time you fixed a performance problem."
**S/T/A/R stub:**
- Situation: STM export/reporting was slow and reconciliation was error-prone; background processing had duplicate-data issues and bottlenecks.
- Task: Improve scalability and reliability of import/export and make transactions traceable.
- Action: Built asynchronous import/export pipelines (Kafka), added step-level logging across STM workflows, applied dependency injection to decouple components, and fixed the duplicate-data root cause.
- Result: _(fill: e.g. export time before/after, duplicate rate eliminated, reconciliation effort saved)_

### Taking over an inherited Go codebase (ownership of ambiguous work)
**Source:** CV — Leeon Group, frontend & backend developer (06/2024–10/2025)
**What happened:** Team members left and you took ownership of an existing production Go codebase wired into CI/CD — maintaining, debugging, and enhancing it, then stood up the full observability stack.
**Why it matters:** Answers "tell me about a time you had to own something unfamiliar" and the maintenance/legacy question honestly (you're fine inheriting code when there's real engineering to do, not pure maintenance).
**S/T/A/R stub:**
- Situation: Original authors departed; production Go services needed to keep running and improving with no handover.
- Task: Understand, stabilize, and extend the codebase without breaking the products depending on it.
- Action: Read into the code, fixed and enhanced production projects in CI/CD; added RabbitMQ/Redis/Ristretto, Worker Pool background processing, gRPC with mTLS; built Prometheus/Grafana/Loki + OpenTelemetry observability.
- Result: _(fill: e.g. uptime/incidents, features shipped, what observability caught)_

### Depth-first learning: gRPC & the challenges repo (self-directed learning)
**Source:** GitHub — go-http-server/grpc, phamnam2003/challenges
**What happened:** You built gRPC from the protocol up (all four method types, interceptors, three TLS modes, underlying crypto) and authored a structured Go curriculum (20 GoF patterns, 18+ algorithm solutions, Kafka/ScyllaDB/OTel deep dives).
**Why it matters:** Direct ammunition for design-pattern and DSA rounds, and for "how do you learn something new?" Shows the research-then-commit style with concrete artifacts.
**S/T/A/R stub:**
- Situation: Wanted to understand gRPC and distributed-systems building blocks beyond surface API use.
- Task: Learn them well enough to build and explain from first principles.
- Action: Implemented gRPC down to TLS/AEAD/Diffie-Hellman; wrote all 20 GoF patterns in Go; documented architecture in Mermaid.
- Result: _(fill: how you've reused this at work — e.g. gRPC mTLS at Leeon Group, a pattern you applied to a real design)_

## Common Tough Questions

### "Why did you leave [previous company]?"
> [PREPARE YOUR ANSWER - be honest, forward-looking, no negativity about former employer]

### "You don't have [specific skill/experience]."
> [PREPARE YOUR ANSWER - acknowledge the gap, bridge to adjacent experience, show willingness to learn]

### "Where do you see yourself in 5 years?"
> [PREPARE YOUR ANSWER - show ambition aligned with the role's growth path]

### "What's your biggest weakness?"
> [PREPARE YOUR ANSWER - genuine weakness with concrete mitigation strategy]

### "Why this company specifically?"
> Customize per company. Must reference: specific projects, company values, market position, or team structure. Never give a generic answer.

## Questions You Should Ask Interviewers

### About the Role
- "What does a typical week look like in this role?"
- "What would success look like in the first 6 months?"
- "What's the biggest challenge the team is facing right now?"

### About the Team
- "How big is the team, and how do you divide work?"
- "What does the development/project lifecycle look like, from idea to production?"
- "How do you onboard new team members?"

### About Tech & Growth
- "What's your current tech stack for [relevant area]?"
- "Is there room to grow into more architectural or strategic decisions?"
- "How does the team stay current with new tools and methods?"

### About Culture (use these to prevent disappointment)
- "How would you describe the team culture?"
- "What does professional development look like here?"
- "Is there flexibility for remote/hybrid work?"
- "What's the balance between development/new projects and maintenance work?"
- "How would you describe the leadership style in this team?"
- "What do people who thrive here have in common?"

## Phone/Video Interview Tips
- Have STAR examples written out (use this file)
- Keep a glass of water nearby
- Smile when speaking (it changes your tone)
- Ask for clarification if a question is vague
- It's OK to take 5 seconds to think before answering
- End with: "Is there anything else you'd like to know about my background?"

## After the Application (Best Practice)

### Follow-Up Etiquette
- **Don't call to "stand out"** or to learn more about the role post-submission - this risks a negative impression
- If the employer specified a timeline, respect it and wait
- If no timeline was given and significant time has passed (2+ weeks), a brief call to ask about status is acceptable
- If you have genuinely new, relevant information to share, a short follow-up is fine

### Thank-You Notes
- When you receive any update (interview invitation, rejection, or status update), send a brief thank-you message
- Express appreciation for their time and the process
- Keep it short (2-3 sentences)

## Roleplay Guidelines
When the user asks for interview practice:
1. Ask which role/company to simulate
2. Start with easy warm-up questions ("Tell me about yourself")
3. Progress to role-specific technical questions
4. Include 1-2 behavioral questions using the competencies from the job posting
5. End with a tough question or curveball
6. After each answer, give brief feedback: what worked, what to sharpen
7. Suggest which STAR example would work best for each question
