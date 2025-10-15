// Import necessary libraries
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- SETUP ---

// Load the service account key
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Create an instance of an Express application
const app = express();

// Configure middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON request bodies

// --- API ROUTES ---

// Test route to ensure the server is running
app.get('/', (req, res) => {
  res.send('Hello from the Personalized CA backend!');
});

/**
 * API Endpoint for User Registration (Email/Password)
 * Expects: { email, password, name, userType } in the request body
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, userType } = req.body;

    // 1. Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // 2. Create the user profile in Firestore Database
    // We use the UID from the auth record as the document ID
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      name: name,
      email: email,
      userType: userType, // 'Student', 'Individual', or 'Business'
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Successfully created new user: ${name} (${userRecord.uid})`);
    res.status(201).send({ uid: userRecord.uid, message: 'User created successfully!' });

  } catch (error) {
    console.error('Error creating user:', error.message);
    // Handle specific errors, like email already in use
    if (error.code === 'auth/email-already-exists') {
        return res.status(409).send({ message: 'Email is already in use.' });
    }
    res.status(500).send({ message: 'Error creating user.', error: error.message });
  }
});


/**
 * API Endpoint for Handling Google Sign-In
 * This is a "sign-up or sign-in" endpoint.
 * Expects: { token, userType } in the request body
 * The 'token' is the ID token from the frontend Google Sign-In.
 * The 'userType' is needed ONLY on the first sign-up.
 */
app.post('/api/auth/google', async (req, res) => {
    try {
        const { token, userType } = req.body;

        // 1. Verify the ID token sent from the frontend
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { uid, name, email } = decodedToken;

        // 2. Check if the user already exists in Firestore
        const userRef = admin.firestore().collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            // User exists, just log them in
            console.log(`User already exists, logging in: ${name} (${uid})`);
            res.status(200).send({ uid, message: 'User logged in successfully.' });
        } else {
            // User does not exist, this is their first time signing up with Google
            // Create their profile in Firestore
            await userRef.set({
                name: name,
                email: email,
                userType: userType, // Critical for new users
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`New user from Google Sign-In, profile created: ${name} (${uid})`);
            res.status(201).send({ uid, message: 'User profile created successfully.' });
        }

    } catch (error) {
        console.error('Error with Google Sign-In:', error.message);
        res.status(500).send({ message: 'Error with Google Sign-In.', error: error.message });
    }
});


// --- SERVER START ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});