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
