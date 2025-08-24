/**
 * Vector Utilities for AI Misuse Detection
 * Implements cosine similarity and vector operations in JavaScript
 */

class VectorUtils {
  /**
   * Calculate the dot product of two vectors
   * @param {number[]} vectorA - First vector
   * @param {number[]} vectorB - Second vector
   * @returns {number} Dot product
   */
  static dotProduct(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    return vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
  }

  /**
   * Calculate the magnitude (length) of a vector
   * @param {number[]} vector - Input vector
   * @returns {number} Magnitude
   */
  static magnitude(vector) {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {number[]} vectorA - First vector
   * @param {number[]} vectorB - Second vector
   * @returns {number} Cosine similarity (-1 to 1)
   */
  static cosineSimilarity(vectorA, vectorB) {
    const dotProduct = this.dotProduct(vectorA, vectorB);
    const magnitudeA = this.magnitude(vectorA);
    const magnitudeB = this.magnitude(vectorB);
    
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0; // Avoid division by zero
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate Euclidean distance between two vectors
   * @param {number[]} vectorA - First vector
   * @param {number[]} vectorB - Second vector
   * @returns {number} Euclidean distance
   */
  static euclideanDistance(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    const sumSquaredDiff = vectorA.reduce((sum, a, i) => {
      const diff = a - vectorB[i];
      return sum + diff * diff;
    }, 0);
    
    return Math.sqrt(sumSquaredDiff);
  }

  /**
   * Normalize a vector to unit length
   * @param {number[]} vector - Input vector
   * @returns {number[]} Normalized vector
   */
  static normalize(vector) {
    const mag = this.magnitude(vector);
    if (mag === 0) return vector.map(() => 0);
    
    return vector.map(val => val / mag);
  }

  /**
   * Add two vectors
   * @param {number[]} vectorA - First vector
   * @param {number[]} vectorB - Second vector
   * @returns {number[]} Sum vector
   */
  static add(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    return vectorA.map((a, i) => a + vectorB[i]);
  }

  /**
   * Subtract vectorB from vectorA
   * @param {number[]} vectorA - First vector
   * @param {number[]} vectorB - Second vector
   * @returns {number[]} Difference vector
   */
  static subtract(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    return vectorA.map((a, i) => a - vectorB[i]);
  }

  /**
   * Multiply vector by scalar
   * @param {number[]} vector - Input vector
   * @param {number} scalar - Scalar value
   * @returns {number[]} Scaled vector
   */
  static scale(vector, scalar) {
    return vector.map(val => val * scalar);
  }

  /**
   * Convert text to a simple feature vector (word frequency)
   * @param {string} text - Input text
   * @param {string[]} vocabulary - Vocabulary words
   * @returns {number[]} Feature vector
   */
  static textToVector(text, vocabulary) {
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = {};
    
    // Count word frequencies
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Create feature vector based on vocabulary
    return vocabulary.map(word => wordCount[word] || 0);
  }

  /**
   * Find the most similar vector from a collection
   * @param {number[]} queryVector - Query vector
   * @param {number[][]} vectors - Collection of vectors
   * @param {string} metric - Similarity metric ('cosine' or 'euclidean')
   * @returns {object} Best match with index and similarity score
   */
  static findMostSimilar(queryVector, vectors, metric = 'cosine') {
    let bestMatch = { index: -1, score: metric === 'cosine' ? -1 : Infinity };
    
    vectors.forEach((vector, index) => {
      let score;
      
      if (metric === 'cosine') {
        score = this.cosineSimilarity(queryVector, vector);
        if (score > bestMatch.score) {
          bestMatch = { index, score };
        }
      } else if (metric === 'euclidean') {
        score = this.euclideanDistance(queryVector, vector);
        if (score < bestMatch.score) {
          bestMatch = { index, score };
        }
      }
    });
    
    return bestMatch;
  }
}

// Example usage for AI misuse detection
class AIMisuseDetector {
  constructor() {
    // Sample malicious prompt patterns (simplified feature vectors)
    this.maliciousPatterns = [
      [1, 0, 1, 1, 0, 1, 0, 1], // Pattern 1: "bypass", "security", "hack", "exploit"
      [0, 1, 1, 0, 1, 0, 1, 1], // Pattern 2: "generate", "malware", "virus", "attack"
      [1, 1, 0, 1, 1, 1, 0, 0], // Pattern 3: "crack", "password", "steal", "data"
    ];
    
    this.vocabulary = [
      'bypass', 'security', 'hack', 'exploit',
      'generate', 'malware', 'virus', 'attack'
    ];
    
    this.similarityThreshold = 0.7; // Threshold for detecting malicious content
  }

  /**
   * Analyze text for potential AI misuse
   * @param {string} text - Text to analyze
   * @returns {object} Analysis result
   */
  analyzeText(text) {
    const textVector = VectorUtils.textToVector(text, this.vocabulary);
    const bestMatch = VectorUtils.findMostSimilar(textVector, this.maliciousPatterns, 'cosine');
    
    const isMalicious = bestMatch.score >= this.similarityThreshold;
    
    return {
      isMalicious,
      confidence: bestMatch.score,
      patternIndex: bestMatch.index,
      textVector,
      analysis: isMalicious 
        ? `Potential AI misuse detected (confidence: ${(bestMatch.score * 100).toFixed(1)}%)`
        : 'Text appears safe'
    };
  }

  /**
   * Add new malicious pattern to the detector
   * @param {string} text - Malicious text pattern
   */
  addMaliciousPattern(text) {
    const patternVector = VectorUtils.textToVector(text, this.vocabulary);
    this.maliciousPatterns.push(patternVector);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VectorUtils, AIMisuseDetector };
} else if (typeof window !== 'undefined') {
  window.VectorUtils = VectorUtils;
  window.AIMisuseDetector = AIMisuseDetector;
}
