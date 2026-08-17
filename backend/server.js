// backend/server.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer'); // For file uploads
const { spawn } = require('child_process'); // To run Python
const path = require('path');
const fs = require('fs');
const helmet = require('helmet'); // Security headers
const xss = require('xss'); // Input sanitization
const { z } = require('zod'); // Schema validation
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// --- SETUP ---

// Load the service account key
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

// Configure middleware
app.use(helmet()); // Basic security headers
app.use(helmet.hsts({
  maxAge: 31536000, 
  includeSubDomains: true,
  preload: true
}));

app.use(cors({ 
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST'] 
})); 
app.use(express.json({ limit: '1mb' })); 

// Audit Logger Middleware
const auditLogger = (req, res, next) => {
  console.log(`[AUDIT] ${new Date().toISOString()} | IP: ${req.ip} | Route: ${req.originalUrl}`);
  next();
};

// Firebase Auth Middleware
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Unauthorized. No token provided.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).send({ message: 'Unauthorized. Invalid token.' });
  }
};

// --- FILE UPLOAD SETUP ---
// This ensures the 'uploads' folder exists so the server doesn't error out
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow CSVs or text files
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV allowed.'));
    }
  }
});

// --- ROUTES ---

// --- LIVE MARKET DATA CACHING ---
let marketCache = {
  data: null,
  lastFetch: 0
};

/**
 * API Endpoint for Live Market Ticker
 */
app.get('/api/market/ticker', async (req, res) => {
  const SYMBOLS = [
    '^NSEI', // NIFTY 50
    '^BSESN', // SENSEX
    'BTC-USD', 
    'GC=F', // GOLD
    'INR=X', // USD/INR
    'RELIANCE.NS',
    'HDFCBANK.NS',
    'TCS.NS'
  ];

  // Map to frontend expected names
  const DISPLAY_MAP = {
    '^NSEI': 'NIFTY50',
    '^BSESN': 'SENSEX',
    'BTC-USD': 'BTC/USD',
    'GC=F': 'GOLD',
    'INR=X': 'USD/INR',
    'RELIANCE.NS': 'RELIANCE',
    'HDFCBANK.NS': 'HDFCBANK',
    'TCS.NS': 'TCS'
  };

  const now = Date.now();
  // Basic 10-second cache to prevent rate-limiting from multiple clients
  if (marketCache.data && (now - marketCache.lastFetch) < 10000) {
    return res.json(marketCache.data);
  }

  try {
    const quotes = await yahooFinance.quote(SYMBOLS);
    
    const formattedData = quotes.map(q => ({
      symbol: DISPLAY_MAP[q.symbol] || q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChangePercent
    }));

    marketCache = {
      data: formattedData,
      lastFetch: now
    };

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error);
    // If rate-limited or error, serve cache if available
    if (marketCache.data) {
      return res.json(marketCache.data);
    }
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});


// Test route
app.get('/', (req, res) => {
  res.send('Hello from the Personalized CA backend with Analytics!');
});

/**
 * API Endpoint: Automated Data Analytics (The "GitHub" Replication)
 * This takes a CSV file and sends it to our Python engine
 */
app.post('/api/analytics/upload', verifyFirebaseToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send({ message: 'No file uploaded.' });

    const filePath = req.file.path;

    // 1. Call the Python script (Make sure analytics/auto_analyzer.py exists!)
    const pythonProcess = spawn('python', [
        path.join(__dirname, '../analytics/auto_analyzer.py'),
        filePath
    ]);

    let rawData = '';

    // 2. Collect data from Python
    pythonProcess.stdout.on('data', (data) => {
        rawData += data.toString();
    });

    // 3. Handle errors from Python
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    // 4. When Python is finished, send results to React
    pythonProcess.on('close', (code) => {
        // Clean up: Delete the temp file from the uploads folder
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        try {
            const result = JSON.parse(rawData);
            res.json(result);
        } catch (e) {
            res.status(500).json({ 
                error: "Analysis failed", 
                message: "Python script did not return valid JSON. Check your Python code." 
            });
        }
    });
});

/**
 * API Endpoint for User Registration
 */
const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  userType: z.enum(['Student', 'Individual', 'Business']),
});

app.post('/api/auth/register', auditLogger, async (req, res) => {
  try {
    const parsedData = registrationSchema.parse(req.body);
    const { email, password, name, userType } = parsedData;
    
    // Sanitize user inputs
    const sanitizedName = xss(name);
    const sanitizedUserType = xss(userType);

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: sanitizedName,
    });

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      name: sanitizedName,
      email: email,
      userType: sanitizedUserType, 
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).send({ uid: userRecord.uid, message: 'User created successfully!' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send({ message: 'Validation failed.', errors: error.errors });
    }
    if (error.code === 'auth/email-already-exists') {
        return res.status(409).send({ message: 'Email is already in use.' });
    }
    res.status(500).send({ message: 'Error creating user.', error: error.message });
  }
});

/**
 * API Endpoint for Google Sign-In
 */
app.post('/api/auth/google', auditLogger, async (req, res) => {
    try {
        const { token, userType } = req.body;
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { uid, name, email, picture } = decodedToken;
        
        // Sanitize user inputs
        const sanitizedName = xss(name || 'Google User');
        const sanitizedUserType = xss(userType || 'Student');

        const userRef = admin.firestore().collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            await userRef.set({
                name: sanitizedName,
                email: email,
                userType: sanitizedUserType, 
                photoURL: picture || '', 
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            res.status(201).send({ uid, message: 'User profile created successfully.' });
        } else {
            res.status(200).send({ uid, message: 'User logged in successfully.' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error with Google Sign-In.', error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});