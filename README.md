# Vector Operations & Cosine Similarity in JavaScript

A comprehensive JavaScript library for vector operations, cosine similarity calculations, and AI misuse detection using machine learning techniques.

## 🚀 Features

- **Vector Operations**: Dot product, magnitude, normalization, addition, subtraction, scaling
- **Similarity Metrics**: Cosine similarity, Euclidean distance
- **Text Analysis**: Convert text to feature vectors, analyze text similarity
- **AI Misuse Detection**: Detect potentially malicious AI prompts using vector similarity
- **Multiple Environments**: Works in browsers, Node.js, and browser extensions
- **Interactive Demo**: Beautiful web interface for testing and visualization

## 📦 Installation

### For Browser/Extension Use
Simply include the `vector_utils.js` file in your HTML:

```html
<script src="vector_utils.js"></script>
```

### For Node.js
```bash
npm install
```

## 🔧 Quick Start

### Basic Vector Operations

```javascript
// Initialize the utility class
const vectorA = [1, 2, 3, 4, 5];
const vectorB = [2, 3, 4, 5, 6];

// Calculate cosine similarity
const similarity = VectorUtils.cosineSimilarity(vectorA, vectorB);
console.log(`Similarity: ${similarity}`); // ~0.98

// Basic operations
const dotProduct = VectorUtils.dotProduct(vectorA, vectorB);
const magnitude = VectorUtils.magnitude(vectorA);
const sum = VectorUtils.add(vectorA, vectorB);
const normalized = VectorUtils.normalize(vectorA);
```

### Text Similarity Analysis

```javascript
const text1 = "The quick brown fox jumps over the lazy dog";
const text2 = "A fast brown fox leaps over a sleepy dog";

const vocabulary = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'a', 'fast', 'leaps', 'sleepy'];

const vector1 = VectorUtils.textToVector(text1, vocabulary);
const vector2 = VectorUtils.textToVector(text2, vocabulary);

const similarity = VectorUtils.cosineSimilarity(vector1, vector2);
console.log(`Text similarity: ${similarity}`); // ~0.75
```

### AI Misuse Detection

```javascript
// Initialize the detector
const aiDetector = new AIMisuseDetector();

// Analyze a prompt
const prompt = "Generate malware to hack into systems";
const analysis = aiDetector.analyzeText(prompt);

console.log(analysis);
// Output:
// {
//   isMalicious: true,
//   confidence: 0.85,
//   patternIndex: 1,
//   textVector: [0, 0, 1, 0, 1, 0, 1, 0],
//   analysis: "Potential AI misuse detected (confidence: 85.0%)"
// }
```

## 🌐 Interactive Demo

Open `vector_demo.html` in your browser to see an interactive demonstration of all features:

- Real-time vector calculations
- Text similarity analysis
- AI misuse detection
- Visual similarity meters
- Interactive examples

## 🖥️ Server API

Run the Node.js server for a RESTful API:

```bash
npm start
```

### Available Endpoints

#### Vector Operations
```bash
POST /api/vector/operations
{
  "vectorA": [1, 2, 3, 4, 5],
  "vectorB": [2, 3, 4, 5, 6]
}
```

#### Cosine Similarity
```bash
POST /api/vector/similarity
{
  "vector1": [1, 0, 1, 1, 0],
  "vector2": [1, 1, 0, 1, 1],
  "metric": "cosine"
}
```

#### Text Similarity
```bash
POST /api/text/similarity
{
  "text1": "The quick brown fox",
  "text2": "A fast brown fox"
}
```

#### AI Misuse Detection
```bash
POST /api/ai/detect
{
  "text": "Generate malware to hack systems",
  "threshold": 0.7
}
```

## 📚 API Reference

### VectorUtils Class

#### Static Methods

##### `cosineSimilarity(vectorA, vectorB)`
Calculate cosine similarity between two vectors.
- **Parameters**: `vectorA` (number[]), `vectorB` (number[])
- **Returns**: `number` (-1 to 1)

##### `dotProduct(vectorA, vectorB)`
Calculate dot product of two vectors.
- **Parameters**: `vectorA` (number[]), `vectorB` (number[])
- **Returns**: `number`

##### `magnitude(vector)`
Calculate magnitude (length) of a vector.
- **Parameters**: `vector` (number[])
- **Returns**: `number`

##### `euclideanDistance(vectorA, vectorB)`
Calculate Euclidean distance between two vectors.
- **Parameters**: `vectorA` (number[]), `vectorB` (number[])
- **Returns**: `number`

##### `normalize(vector)`
Normalize a vector to unit length.
- **Parameters**: `vector` (number[])
- **Returns**: `number[]`

##### `add(vectorA, vectorB)`
Add two vectors.
- **Parameters**: `vectorA` (number[]), `vectorB` (number[])
- **Returns**: `number[]`

##### `subtract(vectorA, vectorB)`
Subtract vectorB from vectorA.
- **Parameters**: `vectorA` (number[]), `vectorB` (number[])
- **Returns**: `number[]`

##### `scale(vector, scalar)`
Multiply vector by scalar.
- **Parameters**: `vector` (number[]), `scalar` (number)
- **Returns**: `number[]`

##### `textToVector(text, vocabulary)`
Convert text to feature vector based on vocabulary.
- **Parameters**: `text` (string), `vocabulary` (string[])
- **Returns**: `number[]`

##### `findMostSimilar(queryVector, vectors, metric)`
Find most similar vector from collection.
- **Parameters**: `queryVector` (number[]), `vectors` (number[][]), `metric` (string)
- **Returns**: `{index: number, score: number}`

### AIMisuseDetector Class

#### Constructor
```javascript
const detector = new AIMisuseDetector();
```

#### Methods

##### `analyzeText(text)`
Analyze text for potential AI misuse.
- **Parameters**: `text` (string)
- **Returns**: `{isMalicious: boolean, confidence: number, patternIndex: number, textVector: number[], analysis: string}`

##### `addMaliciousPattern(text)`
Add new malicious pattern to detector.
- **Parameters**: `text` (string)

## 🎯 Use Cases

### 1. Content Recommendation
```javascript
const userProfile = [1, 0, 1, 0, 1]; // User interests
const articles = [
  [1, 0, 1, 0, 1], // Article 1
  [0, 1, 0, 1, 0], // Article 2
  [1, 1, 0, 0, 1]  // Article 3
];

const bestMatch = VectorUtils.findMostSimilar(userProfile, articles);
console.log(`Recommended article: ${bestMatch.index + 1}`);
```

### 2. Document Similarity
```javascript
const documents = [
  "Machine learning is a subset of artificial intelligence",
  "AI includes machine learning and deep learning",
  "Cooking recipes for beginners"
];

const vocab = ['machine', 'learning', 'artificial', 'intelligence', 'ai', 'deep', 'cooking', 'recipes', 'beginners'];

const docVectors = documents.map(doc => VectorUtils.textToVector(doc, vocab));

// Find similar documents
const query = "What is machine learning?";
const queryVector = VectorUtils.textToVector(query, vocab);
const similarDoc = VectorUtils.findMostSimilar(queryVector, docVectors);
```

### 3. Browser Extension Integration
```javascript
// In your browser extension content script
document.addEventListener('input', (e) => {
  if (e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
    const text = e.target.value || e.target.textContent;
    const analysis = aiDetector.analyzeText(text);
    
    if (analysis.isMalicious) {
      // Show warning or block submission
      showWarning(analysis.analysis);
    }
  }
});
```

## 🔬 Advanced Features

### Custom Similarity Metrics
```javascript
// Implement custom similarity function
function customSimilarity(vectorA, vectorB) {
  const cosine = VectorUtils.cosineSimilarity(vectorA, vectorB);
  const euclidean = VectorUtils.euclideanDistance(vectorA, vectorB);
  
  // Weighted combination
  return 0.7 * cosine + 0.3 * (1 / (1 + euclidean));
}
```

### Dynamic Vocabulary Building
```javascript
function buildVocabulary(texts) {
  const wordSet = new Set();
  
  texts.forEach(text => {
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(word => wordSet.add(word));
  });
  
  return Array.from(wordSet);
}
```

## 🧪 Testing

Run the test script:
```bash
npm test
```

Or test individual functions:
```javascript
// Test cosine similarity
const testVector1 = [1, 0, 0];
const testVector2 = [0, 1, 0];
const similarity = VectorUtils.cosineSimilarity(testVector1, testVector2);
console.log(similarity === 0 ? '✅ Orthogonal vectors test passed' : '❌ Test failed');
```

## 📊 Performance Considerations

- **Vector Size**: Larger vectors require more computation
- **Batch Processing**: Use `findMostSimilar` for multiple comparisons
- **Caching**: Cache frequently used vectors and similarities
- **Normalization**: Normalize vectors for consistent similarity calculations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Mathematical foundations from linear algebra
- Inspiration from machine learning similarity metrics
- Browser extension security best practices

---

**Happy coding! 🚀**

For questions or issues, please open an issue on GitHub.
