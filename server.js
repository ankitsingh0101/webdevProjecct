require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

// ==================== CONFIGURATION ==================== //
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ FATAL: MONGODB_URI environment variable not configured');
  process.exit(1);
}

// ==================== MIDDLEWARE ==================== //
const corsOptions = {
  origin: [
    'https://webdev-projecct.vercel.app', // Production frontend
    'http://localhost:3000'                // Local development
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== DATABASE SCHEMA ==================== //
const visualizationSchema = new mongoose.Schema({
  algorithm: { 
    type: String, 
    required: true,
    enum: ['merge', 'quick', 'bubble', 'selection', 'insertion']
  },
  array: { 
    type: [Number], 
    required: true,
    validate: {
      validator: arr => arr.length > 0,
      message: 'Array cannot be empty'
    }
  },
  steps: { type: [Object], required: true },
  createdAt: { type: Date, default: Date.now }
});

const Visualization = mongoose.model('Visualization', visualizationSchema);

// ==================== API ENDPOINTS ==================== //

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    db: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date(),
    version: process.env.npm_package_version
  });
});

// Get available algorithms
app.get('/api/algorithms', (req, res) => {
  res.json({
    algorithms: ["merge", "quick", "bubble", "selection", "insertion"],
    timeComplexities: {
      merge: "O(n log n)",
      quick: "O(n log n) average",
      bubble: "O(n²)",
      selection: "O(n²)",
      insertion: "O(n²)"
    }
  });
});

// Save visualization
app.post('/api/visualizations', async (req, res) => {
  try {
    const { algorithm, array, steps } = req.body;
    
    if (!algorithm || !array || !steps) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["algorithm", "array", "steps"] 
      });
    }

    const newViz = new Visualization({ algorithm, array, steps });
    await newViz.save();

    res.status(201).json({
      status: "success",
      data: {
        id: newViz._id,
        algorithm: newViz.algorithm,
        createdAt: newViz.createdAt
      }
    });

  } catch (err) {
    console.error('❌ Save error:', err);
    res.status(500).json({ 
      error: "Failed to save visualization",
      details: err.message 
    });
  }
});

// Get all visualizations
app.get('/api/visualizations', async (req, res) => {
  try {
    const visualizations = await Visualization.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-__v -steps'); // Exclude heavy fields

    res.json({
      status: "success",
      count: visualizations.length,
      data: visualizations
    });
  } catch (err) {
    console.error('❌ Load error:', err);
    res.status(500).json({ 
      error: "Failed to fetch visualizations",
      details: err.message 
    });
  }
});

// Get single visualization
app.get('/api/visualizations/:id', async (req, res) => {
  try {
    const viz = await Visualization.findById(req.params.id);
    if (!viz) {
      return res.status(404).json({ 
        error: "Visualization not found",
        id: req.params.id
      });
    }
    res.json({
      status: "success",
      data: viz
    });
  } catch (err) {
    console.error('❌ Load error:', err);
    res.status(500).json({ 
      error: "Failed to fetch visualization",
      details: err.message 
    });
  }
});

// Delete visualization
app.delete('/api/visualizations/:id', async (req, res) => {
  try {
    const deletedViz = await Visualization.findByIdAndDelete(req.params.id);
    if (!deletedViz) {
      return res.status(404).json({ 
        error: "Visualization not found",
        id: req.params.id
      });
    }
    res.json({ 
      status: "success",
      message: "Visualization deleted",
      id: req.params.id
    });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ 
      error: "Failed to delete visualization",
      details: err.message 
    });
  }
});

// ==================== ERROR HANDLING ==================== //
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    path: req.path,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ 
    error: "Internal server error",
    requestId: req.id 
  });
});

// ==================== SERVER STARTUP ==================== //
async function initializeServer() {
  try {
    // Database connection
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    console.log('✅ MongoDB Connected!');
    
    // Connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });

  } catch (err) {
    console.error('❌ Failed to initialize server:', err);
    process.exit(1);
  }
}

initializeServer();