require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ankit_algorithm_user:Ankit%40123%26user@cluster0.rzdaxj6.mongodb.net/algorithmVisualizer?retryWrites=true&w=majority&appName=Cluster0';

// Schema Definition
const visualizationSchema = new mongoose.Schema({
  algorithm: { type: String, required: true },
  array: { type: [Number], required: true },
  steps: { type: [Object], required: true },
  createdAt: { type: Date, default: Date.now }
});

const Visualization = mongoose.model('Visualization', visualizationSchema);

// Connection and Server Startup
async function initializeServer() {
  try {
    // Database Connection
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000
    });
    
    console.log('✅ MongoDB Connected!');
    
    // Connection Event Listeners
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    // API Endpoints
    app.get('/', (req, res) => {
      res.json({ 
        status: 'Active', 
        message: 'Algorithm Visualizer Backend 🚀',
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
      });
    });

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

    app.post('/api/visualizations', async (req, res) => {
      try {
        const { algorithm, array, steps } = req.body;
        
        if (!Array.isArray(array) || !Array.isArray(steps)) {
  return res.status(400).json({ error: "Invalid data format" });
}

        const newViz = new Visualization({ algorithm, array, steps });
        await newViz.save();

        res.status(201).json({
          status: "success",
          message: "Visualization saved!",
          data: newViz
        });

      } catch (err) {
        res.status(500).json({ 
          error: "Failed to save visualization",
          details: err.message 
        });
      }
    });

    app.get('/api/visualizations', async (req, res) => {
      try {
        const visualizations = await Visualization.find().sort({ createdAt: -1 }).limit(50);
        res.json(visualizations);
      } catch (err) {
        res.status(500).json({ 
          error: "Failed to fetch visualizations",
          details: err.message 
        });
      }
    });

    app.get('/api/visualizations/:id', async (req, res) => {
      try {
        const viz = await Visualization.findById(req.params.id);
        if (!viz) return res.status(404).json({ error: "Visualization not found" });
        res.json(viz);
      } catch (err) {
        res.status(500).json({ 
          error: "Failed to fetch visualization",
          details: err.message 
        });
      }
    });

    app.delete('/api/visualizations/:id', async (req, res) => {
      try {
        const deletedViz = await Visualization.findByIdAndDelete(req.params.id);
        if (!deletedViz) return res.status(404).json({ error: "Visualization not found" });
        res.json({ status: "success", message: "Visualization deleted" });
      } catch (err) {
        res.status(500).json({ 
          error: "Failed to delete visualization",
          details: err.message 
        });
      }
    });

    // Error Handling Middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Something broke!' });
    });

    // Start Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    });

  } catch (err) {
    console.error('❌ Failed to initialize server:', err.message);
    process.exit(1);
  }
}

// Start the application
initializeServer();