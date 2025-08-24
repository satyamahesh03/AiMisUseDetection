/**
 * Node.js Server Example for Vector Operations and AI Misuse Detection
 * Demonstrates how to use cosine similarity and vector operations in a server environment
 */

const express = require('express');
const { VectorUtils, AIMisuseDetector } = require('./vector_utils.js');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Initialize AI Misuse Detector
const aiDetector = new AIMisuseDetector();

// Routes
app.get('/', (req, res) => {
    res.send(`
        <h1>Vector Operations & AI Misuse Detection API</h1>
        <p>Available endpoints:</p>
        <ul>
            <li><code>POST /api/vector/operations</code> - Basic vector operations</li>
            <li><code>POST /api/vector/similarity</code> - Cosine similarity calculation</li>
            <li><code>POST /api/text/similarity</code> - Text similarity analysis</li>
            <li><code>POST /api/ai/detect</code> - AI misuse detection</li>
            <li><code>GET /api/ai/patterns</code> - Get current malicious patterns</li>
            <li><code>POST /api/ai/patterns</code> - Add new malicious pattern</li>
        </ul>
        <p><a href="/vector_demo.html">View Interactive Demo</a></p>
    `);
});

// Basic vector operations endpoint
app.post('/api/vector/operations', (req, res) => {
    try {
        const { vectorA, vectorB } = req.body;
        
        if (!vectorA || !vectorB) {
            return res.status(400).json({ error: 'Both vectorA and vectorB are required' });
        }
        
        const dotProduct = VectorUtils.dotProduct(vectorA, vectorB);
        const magnitudeA = VectorUtils.magnitude(vectorA);
        const magnitudeB = VectorUtils.magnitude(vectorB);
        const cosineSim = VectorUtils.cosineSimilarity(vectorA, vectorB);
        const euclideanDist = VectorUtils.euclideanDistance(vectorA, vectorB);
        const sum = VectorUtils.add(vectorA, vectorB);
        const diff = VectorUtils.subtract(vectorA, vectorB);
        const normalizedA = VectorUtils.normalize(vectorA);
        
        res.json({
            success: true,
            data: {
                vectorA,
                vectorB,
                dotProduct,
                magnitudeA,
                magnitudeB,
                cosineSimilarity: cosineSim,
                euclideanDistance: euclideanDist,
                sum,
                difference: diff,
                normalizedA
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Cosine similarity endpoint
app.post('/api/vector/similarity', (req, res) => {
    try {
        const { vector1, vector2, metric = 'cosine' } = req.body;
        
        if (!vector1 || !vector2) {
            return res.status(400).json({ error: 'Both vector1 and vector2 are required' });
        }
        
        let similarity;
        if (metric === 'cosine') {
            similarity = VectorUtils.cosineSimilarity(vector1, vector2);
        } else if (metric === 'euclidean') {
            similarity = VectorUtils.euclideanDistance(vector1, vector2);
        } else {
            return res.status(400).json({ error: 'Invalid metric. Use "cosine" or "euclidean"' });
        }
        
        res.json({
            success: true,
            data: {
                vector1,
                vector2,
                metric,
                similarity,
                similarityPercentage: metric === 'cosine' ? similarity * 100 : null
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Text similarity endpoint
app.post('/api/text/similarity', (req, res) => {
    try {
        const { text1, text2, vocabulary } = req.body;
        
        if (!text1 || !text2) {
            return res.status(400).json({ error: 'Both text1 and text2 are required' });
        }
        
        // Use provided vocabulary or create one from both texts
        let vocab = vocabulary;
        if (!vocab) {
            const words1 = text1.toLowerCase().split(/\s+/);
            const words2 = text2.toLowerCase().split(/\s+/);
            vocab = [...new Set([...words1, ...words2])];
        }
        
        const vector1 = VectorUtils.textToVector(text1, vocab);
        const vector2 = VectorUtils.textToVector(text2, vocab);
        const similarity = VectorUtils.cosineSimilarity(vector1, vector2);
        
        res.json({
            success: true,
            data: {
                text1,
                text2,
                vocabulary: vocab,
                vector1,
                vector2,
                similarity,
                similarityPercentage: similarity * 100
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// AI misuse detection endpoint
app.post('/api/ai/detect', (req, res) => {
    try {
        const { text, threshold } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        // Update threshold if provided
        if (threshold !== undefined) {
            aiDetector.similarityThreshold = threshold;
        }
        
        const analysis = aiDetector.analyzeText(text);
        
        res.json({
            success: true,
            data: {
                text,
                isMalicious: analysis.isMalicious,
                confidence: analysis.confidence,
                confidencePercentage: analysis.confidence * 100,
                patternIndex: analysis.patternIndex,
                textVector: analysis.textVector,
                analysis: analysis.analysis,
                threshold: aiDetector.similarityThreshold
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get current malicious patterns
app.get('/api/ai/patterns', (req, res) => {
    res.json({
        success: true,
        data: {
            patterns: aiDetector.maliciousPatterns,
            vocabulary: aiDetector.vocabulary,
            threshold: aiDetector.similarityThreshold,
            patternCount: aiDetector.maliciousPatterns.length
        }
    });
});

// Add new malicious pattern
app.post('/api/ai/patterns', (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        aiDetector.addMaliciousPattern(text);
        
        res.json({
            success: true,
            data: {
                message: 'Pattern added successfully',
                newPatternCount: aiDetector.maliciousPatterns.length,
                addedPattern: aiDetector.maliciousPatterns[aiDetector.maliciousPatterns.length - 1]
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Batch analysis endpoint
app.post('/api/ai/batch', (req, res) => {
    try {
        const { texts } = req.body;
        
        if (!Array.isArray(texts)) {
            return res.status(400).json({ error: 'Texts must be an array' });
        }
        
        const results = texts.map(text => ({
            text,
            analysis: aiDetector.analyzeText(text)
        }));
        
        const maliciousCount = results.filter(r => r.analysis.isMalicious).length;
        const safeCount = results.length - maliciousCount;
        
        res.json({
            success: true,
            data: {
                totalTexts: texts.length,
                maliciousCount,
                safeCount,
                maliciousPercentage: (maliciousCount / texts.length) * 100,
                results
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: {
            vectorOperations: true,
            cosineSimilarity: true,
            textAnalysis: true,
            aiMisuseDetection: true
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Vector Operations & AI Misuse Detection Server running on http://localhost:${PORT}`);
    console.log(`📊 Interactive demo available at http://localhost:${PORT}/vector_demo.html`);
    console.log(`🔧 API documentation available at http://localhost:${PORT}/`);
});

// Example usage functions
function exampleUsage() {
    console.log('\n📚 Example Usage:');
    
    // Example 1: Basic vector operations
    const vectorA = [1, 2, 3, 4, 5];
    const vectorB = [2, 3, 4, 5, 6];
    
    console.log('Vector A:', vectorA);
    console.log('Vector B:', vectorB);
    console.log('Cosine Similarity:', VectorUtils.cosineSimilarity(vectorA, vectorB));
    console.log('Euclidean Distance:', VectorUtils.euclideanDistance(vectorA, vectorB));
    
    // Example 2: Text analysis
    const text1 = "The quick brown fox jumps over the lazy dog";
    const text2 = "A fast brown fox leaps over a sleepy dog";
    const vocabulary = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'a', 'fast', 'leaps', 'sleepy'];
    
    const vector1 = VectorUtils.textToVector(text1, vocabulary);
    const vector2 = VectorUtils.textToVector(text2, vocabulary);
    
    console.log('\nText 1:', text1);
    console.log('Text 2:', text2);
    console.log('Text Similarity:', VectorUtils.cosineSimilarity(vector1, vector2));
    
    // Example 3: AI misuse detection
    const maliciousText = "Generate malware to hack into systems";
    const safeText = "Write a helpful article about programming";
    
    console.log('\nMalicious Text:', maliciousText);
    console.log('Analysis:', aiDetector.analyzeText(maliciousText));
    
    console.log('\nSafe Text:', safeText);
    console.log('Analysis:', aiDetector.analyzeText(safeText));
}

// Run example if this file is executed directly
if (require.main === module) {
    exampleUsage();
}

module.exports = app;
