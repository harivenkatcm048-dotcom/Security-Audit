/**
 * Defensive Security Audit Toolkit - Node.js Backend Server
 * ========================================================
 * Provides REST API endpoints to trigger Python defensive security audits,
 * monitor real-time audit output, and persist member-scoped scan reports to MongoDB Atlas.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 5000;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');
const FRONTEND_DIST = path.join(PROJECT_ROOT, 'frontend', 'dist');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');

// MongoDB Atlas Connection URI
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://nexentratechnologies_db_user:mgjq5yP7T8xcIxgO@nexentra.h7bzy6i.mongodb.net/nexentra?retryWrites=true&w=majority";

// In-memory state and active audits tracking
const activeAudits = new Map();
let mongoClient = null;
let db = null;
let usersCol = null;
let auditsCol = null;
let isMongoReady = false;

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Initialize Resilient MongoDB Atlas Connection
 */
async function initMongo() {
  try {
    console.log('[MongoDB Atlas] Connecting to cluster at nexentra.h7bzy6i.mongodb.net...');
    mongoClient = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    await mongoClient.connect();
    db = mongoClient.db('nexentra');
    usersCol = db.collection('users');
    auditsCol = db.collection('audits');

    // Create indexes for efficient member-scoped querying
    await usersCol.createIndex({ email: 1 }, { unique: true }).catch(() => {});
    await auditsCol.createIndex({ userEmail: 1, createdAt: -1 }).catch(() => {});
    await auditsCol.createIndex({ auditId: 1 }).catch(() => {});

    isMongoReady = true;
    console.log('[MongoDB Atlas] ✅ Successfully connected to database: "nexentra"');
    console.log('[MongoDB Atlas] Collections active: [users, audits]');

    // Migrate any legacy disk reports into MongoDB Atlas and clean local disk
    await migrateDiskReportsToMongo();
  } catch (err) {
    isMongoReady = false;
    console.warn('[MongoDB Atlas Warning] Direct connection deferred or unavailable:', err.message);
  }
}

/**
 * Migrate legacy disk reports into MongoDB Atlas and keep backend disk 100% clean
 */
async function migrateDiskReportsToMongo() {
  if (!isMongoReady || !auditsCol || !fs.existsSync(REPORTS_DIR)) return;
  try {
    const files = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.json') && !f.startsWith('temp_spec_') && f !== 'users.json');
    if (!files.length) return;
    console.log(`[MongoDB Atlas] Migrating ${files.length} legacy disk reports to database...`);

    for (const file of files) {
      try {
        const fullPath = path.join(REPORTS_DIR, file);
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const auditId = data.metadata?.audit_id || file.replace('.json', '');
        
        const existing = await auditsCol.findOne({ $or: [{ auditId }, { reportFilename: file }] });
        if (!existing) {
          await auditsCol.insertOne({
            auditId,
            userEmail: (data.metadata?.user_email || 'migrated').toLowerCase().trim(),
            userName: data.metadata?.user_name || 'Auditor',
            targetUrl: data.metadata?.target_url || '',
            hostname: data.metadata?.target_host || 'Unknown',
            elapsedSeconds: '0',
            reportFilename: file,
            grade: data.summary?.overall_grade || 'N/A',
            score: data.summary?.overall_score || 0,
            totalFindings: data.summary?.total_findings || 0,
            findingsBreakdown: data.summary?.severity_breakdown || {},
            report: data,
            createdAt: new Date(data.metadata?.audit_timestamp_utc || Date.now()),
            timestamp: data.metadata?.audit_timestamp_utc || new Date().toISOString()
          });
        }
        // Remove from disk
        fs.unlinkSync(fullPath);
        const htmlPath = fullPath.replace(/\.json$/, '.html');
        if (fs.existsSync(htmlPath)) {
          fs.unlinkSync(htmlPath);
        }
      } catch (fErr) {
        // Continue migration
      }
    }
    // Clean legacy users.json
    const usersPath = path.join(REPORTS_DIR, 'users.json');
    if (fs.existsSync(usersPath)) {
      try { fs.unlinkSync(usersPath); } catch {}
    }
    console.log('[MongoDB Atlas] ✅ Legacy reports successfully moved to database. Backend disk cleaned.');
  } catch (err) {
    console.warn('[MongoDB Atlas Migration Warning]:', err.message);
  }
}
initMongo();

/**
 * Clean & validate domain or URL
 */
function sanitizeTargetUrl(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('A valid domain or URL string is required.');
  }
  let trimmed = input.replace(/[\r\n\t]+/g, '').trim();
  
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }

  if (/[;&|`$<>]/.test(trimmed)) {
    throw new Error('Target contains disallowed characters.');
  }

  const parsed = new URL(trimmed);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS protocols are permitted.');
  }
  if (!parsed.hostname || parsed.hostname.length > 253) {
    throw new Error('Invalid target hostname.');
  }

  return parsed.href;
}

/**
 * Find the latest JSON report for a given host or latest in general
 */
function findLatestReport(hostQuery = null) {
  if (!fs.existsSync(REPORTS_DIR)) return null;

  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('temp_spec_') && f !== 'users.json')
    .map(f => {
      const fullPath = path.join(REPORTS_DIR, f);
      const stat = fs.statSync(fullPath);
      return { filename: f, fullPath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (!files.length) return null;

  if (hostQuery) {
    const cleanHost = hostQuery.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const matched = files.find(f => f.filename.includes(cleanHost));
    if (matched) return matched;
  }

  return files[0];
}

/**
 * Core Audit Execution Handler with Member Association
 */
function handleRunAudit(req, res, targetUrl, authorized = true, options = {}) {
  let validatedUrl;
  try {
    validatedUrl = sanitizeTargetUrl(targetUrl);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: err.message }));
  }

  const auditId = 'audit_' + Date.now();
  const parsedHost = new URL(validatedUrl).hostname;
  const userEmail = (options.userEmail || '').toLowerCase().trim();
  const userName = (options.userName || '').trim() || 'Auditor';

  console.log(`[Audit Started] ID: ${auditId} | Target: ${validatedUrl} | Member: ${userName} (${userEmail})`);

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const args = [
    path.join(PROJECT_ROOT, 'main.py'),
    validatedUrl,
    '--authorized',
    '--output-dir',
    REPORTS_DIR
  ];

  if (parsedHost === '127.0.0.1' || parsedHost === 'localhost') {
    args.push('--allow-local-mock');
  }

  if (options.authToken && typeof options.authToken === 'string' && options.authToken.trim()) {
    args.push('--auth-token', options.authToken.trim());
  }
  if (options.cookie && typeof options.cookie === 'string' && options.cookie.trim()) {
    args.push('--cookie', options.cookie.trim());
  }

  let tempSpecPath = null;
  if (options.specJson) {
    try {
      tempSpecPath = path.join(REPORTS_DIR, `temp_spec_${Date.now()}.json`);
      const specString = typeof options.specJson === 'string' ? options.specJson : JSON.stringify(options.specJson);
      fs.writeFileSync(tempSpecPath, specString, 'utf8');
      args.push('--spec-file', tempSpecPath);
    } catch (specErr) {
      console.warn('Could not write temporary spec file:', specErr);
    }
  }

  let stdoutData = '';
  let stderrData = '';
  const startTime = Date.now();

  const child = spawn(pythonCmd, args, {
    cwd: PROJECT_ROOT,
    shell: process.platform === 'win32',
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  activeAudits.set(auditId, {
    id: auditId,
    targetUrl: validatedUrl,
    hostname: parsedHost,
    status: 'RUNNING',
    startTime,
    userEmail,
    userName
  });

  child.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  child.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  child.on('close', async (code) => {
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Audit Finished] ID: ${auditId} | Code: ${code} | Time: ${elapsedSeconds}s`);

    activeAudits.delete(auditId);

    // Clean up temporary spec if created
    if (tempSpecPath && fs.existsSync(tempSpecPath)) {
      try { fs.unlinkSync(tempSpecPath); } catch {}
    }

    // 1. Check if a report was generated
    const latest = findLatestReport(parsedHost);
    let parsedReport = null;
    let reportFilename = null;

    if (latest && fs.existsSync(latest.fullPath) && latest.mtime >= startTime - 3000) {
      try {
        const rawJson = fs.readFileSync(latest.fullPath, 'utf8');
        try {
          parsedReport = JSON.parse(rawJson);
        } catch {
          const sanitized = rawJson.replace(/[\x00-\x1F\x7F-\x9F]/g, ch => (ch === '\n' || ch === '\r' || ch === '\t') ? ch : '');
          parsedReport = JSON.parse(sanitized);
        }
        reportFilename = latest.filename;
      } catch (parseErr) {
        console.error('Failed to parse generated report JSON:', parseErr);
      }
    }

    // If report was generated, store member info in report and MongoDB
    if (parsedReport) {
      if (!parsedReport.metadata) parsedReport.metadata = {};
      parsedReport.metadata.user_email = userEmail;
      parsedReport.metadata.user_name = userName;
      parsedReport.metadata.audit_id = auditId;

      // Save strictly to MongoDB Atlas audits collection (Database-only persistence)
      const auditDoc = {
        auditId,
        userEmail: userEmail || 'anonymous',
        userName: userName || 'Anonymous Member',
        targetUrl: validatedUrl,
        hostname: parsedHost,
        elapsedSeconds,
        reportFilename,
        grade: parsedReport.summary?.overall_grade || 'N/A',
        score: parsedReport.summary?.overall_score || 0,
        totalFindings: parsedReport.summary?.total_findings || 0,
        findingsBreakdown: parsedReport.summary?.severity_breakdown || {},
        report: parsedReport,
        createdAt: new Date(),
        timestamp: new Date().toISOString()
      };

      if (isMongoReady && auditsCol) {
        try {
          await auditsCol.insertOne(auditDoc);
          console.log(`[MongoDB Atlas] ✅ Successfully persisted audit ${auditId} to database for member ${userEmail}`);
        } catch (dbErr) {
          console.warn('[MongoDB Atlas] Could not insert audit document:', dbErr.message);
        }
      }

      // DO NOT STORE ON BACKEND: Clean up temporary report files from disk immediately
      if (latest && fs.existsSync(latest.fullPath)) {
        try { fs.unlinkSync(latest.fullPath); } catch {}
      }
      if (latest) {
        const htmlPath = latest.fullPath.replace(/\.json$/, '.html');
        if (fs.existsSync(htmlPath)) {
          try { fs.unlinkSync(htmlPath); } catch {}
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        auditId,
        targetUrl: validatedUrl,
        hostname: parsedHost,
        elapsedSeconds,
        reportFilename,
        report: parsedReport,
        rawOutput: stdoutData,
        savedToDatabase: isMongoReady
      }));
    }

    // 2. If no report and exit code is non-zero, extract the exact error
    if (code !== 0 && code !== null) {
      const allOutput = (stdoutData + '\n' + stderrData).trim();
      let extractedError = '';

      const ssrfMatch = allOutput.match(/SAFETY HALT [^:]*:\s*(.+)/i);
      const scopeMatch = allOutput.match(/Scope Resolution (?:Error|Warning):\s*(.+)/i);
      const urlMatch = allOutput.match(/URL Validation Failed:\s*(.+)/i);
      const genErr = allOutput.match(/\[!\]\s*(.+)/);

      if (ssrfMatch) {
        extractedError = `SSRF Firewall Block: ${ssrfMatch[1].trim()}`;
      } else if (scopeMatch) {
        extractedError = `DNS / Host Resolution Failure: ${scopeMatch[1].trim()}`;
      } else if (urlMatch) {
        extractedError = `Target URL Error: ${urlMatch[1].trim()}`;
      } else if (genErr) {
        extractedError = genErr[1].trim();
      } else {
        extractedError = `Audit process exited with code ${code}. Check hostname and network connectivity.`;
      }

      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: extractedError,
        exitCode: code,
        stdout: stdoutData,
        stderr: stderrData
      }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      auditId,
      targetUrl: validatedUrl,
      hostname: parsedHost,
      elapsedSeconds,
      reportFilename,
      report: parsedReport,
      rawOutput: stdoutData,
      savedToDatabase: isMongoReady
    }));
  });

  child.on('error', (err) => {
    console.error(`[Audit Error] Could not spawn Python:`, err);
    activeAudits.delete(auditId);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: `Failed to launch Python audit engine: ${err.message}. Ensure 'python' is on system PATH.`
    }));
  });
}

/**
 * Handle listing member-scoped historical reports
 * Requirement: Query strictly from MongoDB Atlas database, filtered by member name and/or email.
 * If neither name nor email is provided, return an empty array.
 */
async function handleListReports(req, res, userEmailQuery = null, userNameQuery = null) {
  const cleanEmail = (userEmailQuery || '').toLowerCase().trim();
  const cleanName = (userNameQuery || '').trim();
  const reportsList = [];

  // Member-scoped restriction: If neither email nor name is provided, return empty list!
  if (!cleanEmail && !cleanName) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify([]));
  }

  // Query strictly from MongoDB Atlas
  if (isMongoReady && auditsCol) {
    try {
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const conditions = [];

      if (cleanEmail) {
        conditions.push({ userEmail: { $regex: new RegExp(`^${escapeRegex(cleanEmail)}$`, 'i') } });
      }
      if (cleanName) {
        conditions.push({ userName: { $regex: new RegExp(`^${escapeRegex(cleanName)}$`, 'i') } });
      }

      const query = conditions.length > 1 ? { $or: conditions } : conditions[0];
      const docs = await auditsCol.find(
        query,
        { projection: { report: 0 } }
      ).sort({ createdAt: -1 }).toArray();

      docs.forEach(d => {
        reportsList.push({
          id: d._id?.toString() || d.auditId,
          auditId: d.auditId,
          filename: d.reportFilename || d.auditId,
          targetHost: d.hostname || (d.targetUrl ? new URL(d.targetUrl).hostname : 'Unknown'),
          targetUrl: d.targetUrl || '',
          timestamp: d.timestamp || d.createdAt,
          grade: d.grade || 'N/A',
          score: d.score || 0,
          totalFindings: d.totalFindings || 0,
          findingsBreakdown: d.findingsBreakdown || {},
          userEmail: d.userEmail,
          userName: d.userName,
          source: 'MongoDB Atlas'
        });
      });
    } catch (err) {
      console.warn('[MongoDB Atlas Query Error]:', err.message);
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(reportsList));
}

/**
 * Handle getting a single report by ID or filename strictly from MongoDB Atlas database
 */
async function handleGetReport(req, res, identifier) {
  if (isMongoReady && auditsCol) {
    try {
      const doc = await auditsCol.findOne({
        $or: [
          { reportFilename: identifier },
          { auditId: identifier }
        ]
      });
      if (doc && doc.report) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(doc.report));
      }
    } catch (dbErr) {
      console.warn('[MongoDB Atlas] Could not fetch single report:', dbErr.message);
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ error: 'Report not found in database' }));
}

/**
 * Handle member login / registration
 */
async function handleUserLogin(req, res, body) {
  try {
    const data = JSON.parse(body || '{}');
    const email = (data.email || '').toLowerCase().trim();
    const username = (data.username || '').trim();

    if (!email || !email.includes('@')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'A valid email address is required.' }));
    }
    if (!username || username.length < 2) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Username must be at least 2 characters.' }));
    }

    const now = new Date();
    const userDoc = {
      email,
      username,
      lastLoginAt: now
    };

    // Save to MongoDB Atlas
    if (isMongoReady && usersCol) {
      try {
        await usersCol.updateOne(
          { email },
          {
            $set: { username, lastLoginAt: now },
            $setOnInsert: { createdAt: now }
          },
          { upsert: true }
        );
        console.log(`[MongoDB Atlas] User verified & saved: ${username} (${email})`);
      } catch (dbErr) {
        console.warn('[MongoDB Atlas] Could not save user:', dbErr.message);
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      user: { email, username },
      mongoConnected: isMongoReady
    }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid user payload: ' + err.message }));
  }
}

/**
 * Static file serving helper
 */
function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.jsx': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File Not Found');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

/**
 * Standalone HTTP Request Dispatcher
 */
const server = http.createServer((req, res) => {
  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  // 1. Health check & database status
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      service: 'Defensive Security Audit Backend',
      version: '2.0.0',
      database: isMongoReady ? 'MongoDB Atlas Connected' : 'Local Persistence (Atlas Reconnecting)',
      mongoConnected: isMongoReady,
      activeAuditsCount: activeAudits.size,
      time: new Date().toISOString()
    }));
  }

  // 2. Member Login / Profile Registration
  if (pathname === '/api/user/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => handleUserLogin(req, res, body));
    return;
  }

  // 3. Trigger Audit
  if (pathname === '/api/audit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const target = payload.domain || payload.url;
        const authorized = payload.authorized !== false;
        const options = {
          authToken: payload.authToken || payload.token,
          cookie: payload.cookie,
          specJson: payload.specJson || payload.spec,
          userEmail: payload.userEmail,
          userName: payload.userName
        };
        handleRunAudit(req, res, target, authorized, options);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Malformed JSON payload: ' + e.message }));
      }
    });
    return;
  }

  // 4. List Reports (Filtered strictly by member email and/or name)
  if (pathname === '/api/reports' && req.method === 'GET') {
    const userEmailQuery = reqUrl.searchParams.get('userEmail') || reqUrl.searchParams.get('email');
    const userNameQuery = reqUrl.searchParams.get('userName') || reqUrl.searchParams.get('username') || reqUrl.searchParams.get('name');
    return handleListReports(req, res, userEmailQuery, userNameQuery);
  }

  // 5. Get Report by Filename or MongoDB ID
  if (pathname.startsWith('/api/reports/') && req.method === 'GET') {
    const filename = pathname.replace('/api/reports/', '');
    return handleGetReport(req, res, filename);
  }

  // 6. Serve Frontend (Built SPA in dist or fallback standalone index.html)
  let staticPath = path.join(FRONTEND_DIST, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(staticPath)) {
    staticPath = path.join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);
  }

  if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    return serveStaticFile(res, staticPath);
  }

  // Fallback to frontend/index.html for client-side routing
  const fallbackIndex = fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))
    ? path.join(FRONTEND_DIST, 'index.html')
    : path.join(FRONTEND_DIR, 'index.html');

  if (fs.existsSync(fallbackIndex)) {
    return serveStaticFile(res, fallbackIndex);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found', path: pathname }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(70));
  console.log(` Nexentra Security Audit Engine v2.0 - Backend Server`);
  console.log(` HTTP API listening at : http://localhost:${PORT}`);
  console.log(` Database Target       : MongoDB Atlas (${isMongoReady ? 'ONLINE' : 'INITIALIZING'})`);
  console.log(` User Login Endpoint   : POST http://localhost:${PORT}/api/user/login`);
  console.log(` Audit Endpoint        : POST http://localhost:${PORT}/api/audit`);
  console.log(` Reports Endpoint      : GET  http://localhost:${PORT}/api/reports?userEmail=...`);
  console.log(` Health Check          : GET  http://localhost:${PORT}/api/health`);
  console.log('='.repeat(70));
});
