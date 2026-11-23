# Campus Student Helpdesk
Ajay Kumar · B.Tech CSE (AI/ML), third year · Roll 202410101240016

A campus-wide helpdesk for cloud practicals, IT, academics, attendance, exams, fees, documents, hostel, facilities, library and transport. Other / Not sure routes to a coordinator. Students may describe problems in Hindi, English or Hinglish.

## Quick demo on Windows
Install Node.js 22 or newer. Extract the ZIP, open the folder containing package.json in VS Code, and run:

    npm ci
    npm run build
    npm run demo

Open http://127.0.0.1:3000. This local-only demo resets on restart. Stop with Ctrl+C.

| Role | Email | Demo password |
| --- | --- | --- |
| Student | student@campus.test | CampusDemo2026! |
| Cloud faculty | staff1@campus.test | CampusDemo2026! |
| Attendance coordinator | staff3@campus.test | CampusDemo2026! |
| Admin | admin@campus.test | CampusDemo2026! |

## MongoDB mode for assessment
1. Start MongoDB Community locally or obtain a MongoDB Atlas connection string. In PowerShell run:
   
       Copy-Item .env.example .env

2. Set MONGODB_URI in .env. Generate a private JWT_SECRET using the command below. Choose a separate SEED_PASSWORD of at least 12 characters for local demonstration accounts.
   
       node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

3. After npm ci and npm run build, run npm run seed then npm start. Records persist in MongoDB across restarts. Sign in with the sample emails above using your seed password. Registration always creates a student. Re-running the seed command does not reset passwords.
4. For hosting, use a separate MongoDB database and private staff credentials. Set MONGODB_URI and JWT_SECRET privately on the host, build using npm ci and npm run build, and start with node backend/server.js. Use HTTPS and generate QR codes on the final domain. Keep local demo credentials off public deployments.
5. Run npm test for the integration workflow. Tests use an ephemeral server on port 32191 and in-memory data.

## Architecture
React in frontend/main.jsx calls Express in backend/server.js. JWT identifies the user. The server checks ownership, team and role. The data layer in backend/data.js uses Mongoose in persistent mode. The separate local demo adapter uses memory. Server-sent events refresh the interface when records change, with ten-second polling as a fallback.

| Collection | Data and relationships |
| --- | --- |
| users | Unique email, password hash, role and team |
| tickets | owner references users._id, category routes to team, private screenshot, asset, revision and history |
| fixes | Staff-authored guidance by category and title |
| incidents | Shared issue, team and unique follower user IDs |

## REST API
All paths begin with /api. Config and authentication are public. Other routes require a Bearer token.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /config | Categories and destination teams |
| POST | /auth/register, /auth/login | Student registration and signed login |
| GET, POST | /tickets | Role-filtered requests and new reports |
| PATCH, DELETE | /tickets/:id | Edit, assign, start, resolve, confirm, reopen or delete an open owned report |
| GET, POST | /fixes | Help articles and staff publication |
| GET, POST | /incidents | Shared issue board and staff announcements |
| PATCH | /incidents/:id | Join once or mark resolved |
| GET | /events | Authenticated change notifications |

Students view their own tickets. Staff see their team's queue. Admins can reassign tickets. Stale edits receive HTTP 409. Private screenshots accept PNG/JPEG up to 500 KB. QR codes prefill a device. Suggestions use category and keyword scoring. Four starter cloud articles are sample guidance for faculty review.

## Two-minute viva walkthrough
1. As student, select Cloud labs and enter “AWS EBS volume attach”. Expand the fix and choose “Solved my issue”.
2. Report an attendance problem. In another browser profile sign in as staff3, start work and resolve it with a note. Return as student and confirm or reopen.
3. As staff, publish a campus incident. As student, choose “Me too”. Resolve it as staff.
4. Generate a QR label for Lab 2 PC-12. A phone can scan labels generated on a reachable campus address or live domain.
5. Explain how a private complaint differs from a shared incident. Staff write public announcements separately.

## Submission
Title: Campus Student Helpdesk with QR Reporting and Cloud Lab Support.
Use the official form, verify your class/section and the requested upload format. For GitHub, publish source with the supplied .gitignore and keep .env private.

## QR lookup, reusable fixes and the help assistant
Scanning a label starts a report and queries aggregate open-report count and work status for the same device. Other students' ticket titles, photos and identities stay private. In a resolved ticket, authorized staff can expand **Save as verified fix**, review the suggested public text, remove private information and publish. Repeated clicks produce one article per ticket.

Type an issue title and click **Find similar cases and help**. Python 3 (standard library only) ranks published guidance and the user's accessible resolved cases with corpus-fitted TF-IDF cosine similarity. Set PYTHON_BIN if the Python executable has another name. The server falls back to keyword matching when Python is unavailable. The new routes are GET /api/devices/open?asset=..., POST /api/tickets/:id/publish and POST /api/assist.

Optional local GenAI: run Ollama on the backend computer with a downloaded text model. Set OLLAMA_MODEL in .env to that installed model's exact name and start in MongoDB mode. For the local demo use PowerShell's environment variable before npm run demo. The planner selects search, similar cases or a category draft; the student reviews and saves it. Generated guidance uses published help articles. The default mode runs without a model download or paid API. Live model output depends on your installed model.

## Verification
npm test exercises the in-memory API workflow, role restrictions, stale updates, reusable fixes, model-free retrieval, privacy-preserving device counts, incident deduplication and resolution. The build compiles the React UI. Live MongoDB and live local-model checks require those services. To verify persistence, create a request in MongoDB mode, restart the backend, sign in again and check that the same request and history remain.

## GitHub and deployment package
The included workflow builds the frontend, runs the demo API tests and checks MongoDB persistence with a MongoDB 7 service when pushed to GitHub. To run the same database check on your test instance, use node --env-file=.env backend/persistence-check.js. It inserts and removes its own probe record. The Dockerfile builds the frontend and ships Node + Python. Supply MONGODB_URI and JWT_SECRET through your hosting platform, expose port 3000, and use a separate non-public provisioning step for staff accounts.
