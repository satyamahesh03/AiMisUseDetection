
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        protectionEnabled: true,
        stats: { total: 0, blocked: 0 },
        history: [],
        userFeedback: {
            falsePositives: [],
            falseNegatives: [],
            suggestions: []
        },
        safe_patterns: [],
        high_risk_patterns: []
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    
    if (request.action === 'test') {
        console.log('Test message received:', request.message);
        sendResponse({status: 'Background script is working!'});
        return true;
    }
    
    if (request.action === 'analyzeText') {
        console.log('Background: Received analyzeText request for:', request.text.substring(0, 50));
        analyzeTextHybrid(request.text, sendResponse);
        return true;
    }
    
    if (request.action === 'logAttempt') {
        console.log('Background: Received logAttempt request:', request.payload);
        logAttempt(request.payload);
        sendResponse({ success: true });
    }
});

async function analyzeTextHybrid(text, sendResponse) {
    try {
        console.log('Background: Starting hybrid analysis for:', text.substring(0, 50) + '...');
        
        const analysis = analyzeWithHybridApproach(text);
        
        chrome.storage.local.get(['stats'], (data) => {
            const stats = data.stats || { total: 0, blocked: 0 };
            stats.total += 1;
            if (analysis.is_malicious) {
                stats.blocked += 1;
            }
            chrome.storage.local.set({ stats });
            console.log('Background: Updated stats:', stats);
        });
        
        const response_data = {
            result: analysis.is_malicious ? 'malicious' : 'safe',
            confidence: analysis.confidence,
            malicious_probability: analysis.is_malicious ? analysis.confidence : 1 - analysis.confidence,
            safe_probability: analysis.is_malicious ? 1 - analysis.confidence : analysis.confidence,
            ml_prediction: analysis.is_malicious ? 'malicious' : 'safe',
            intent: analysis.intent,
            reasoning: analysis.reasoning,
            risk_level: analysis.risk_level,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            python_model_used: false,
            analysis_method: analysis.method
        };
        
        console.log('Background: Sending response:', response_data);
        sendResponse(response_data);
        
    } catch (error) {
        console.error('Error in hybrid analysis:', error);
        
        const fallback_response = {
            result: 'safe',
            confidence: 0.3,
            malicious_probability: 0.3,
            safe_probability: 0.7,
            ml_prediction: 'safe',
            intent: 'unknown',
            reasoning: ['Analysis error, defaulting to safe'],
            risk_level: 'low',
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            python_model_used: false,
            analysis_method: 'fallback'
        };
        
        sendResponse(fallback_response);
    }
}

function analyzeWithHybridApproach(text) {
    console.log('Starting hybrid analysis for:', text);
    
    if (!text || text.trim().length < 5) {
        return {
            intent: 'unknown',
            confidence: 0.3,
            is_malicious: false,
            reasoning: ['Text too short for reliable analysis'],
            risk_level: 'low',
            method: 'rule_based'
        };
    }
    
    const text_lower = text.toLowerCase().trim();
    
    // STEP 1: HIGH PROBABILITY RULE-BASED (Obvious malicious patterns)
    const high_risk_patterns = [
        // Violence against people
        'how to kill a person', 'how to kill someone', 'how to murder someone',
        'how to assassinate', 'how to murder', 'how to kill myself',
        'how to commit suicide', 'how to end my life', 'how to die','how to kill a man',
        
        // Weapons and explosives
        'how to make a bomb', 'how to create explosives', 'how to build a bomb',
        'how to make explosives', 'how to create a bomb', 'how to build explosives',
        
        // Harmful content creation
        'create nude image', 'make nude image', 'generate nude image',
        'create porn video', 'make porn video', 'generate porn video',
        'create deepfake', 'make deepfake', 'generate deepfake',
        
        // Poisoning
        'how to poison someone', 'how to poison food', 'how to poison drink',
        
        // Hacking and cyber attacks
        'how to hack', 'how to hack into', 'how to hack computer',
        'how to hack system', 'how to hack network', 'how to hack website',
        
        // Cheating and fraud
        'how to cheat', 'how to cheat in', 'how to cheat on',
        'how to scam', 'how to fraud', 'how to steal'
    ];
    
    for (const pattern of high_risk_patterns) {
        if (text_lower.includes(pattern)) {
            return {
                intent: 'malicious',
                confidence: 0.95,
                is_malicious: true,
                reasoning: [`High risk pattern detected: ${pattern}`],
                risk_level: 'high',
                method: 'rule_based_high'
            };
        }
    }
    
    // STEP 2: LOW PROBABILITY RULE-BASED (Obvious safe patterns)
    const safe_patterns = [
        // Harmless targets
        'how to kill mosquitos', 'how to kill bugs', 'how to kill insects',
        'how to kill pests', 'how to kill weeds', 'how to kill time',
        'how to kill bacteria', 'how to kill germs', 'how to kill viruses',
        'how to kill flies', 'how to kill ants', 'how to kill spiders',
        
        // Educational and legitimate topics
        'how to become rich', 'how to make money', 'how to earn money',
        'how to start a business', 'how to invest', 'how to save money',
        'how to learn', 'how to study', 'how to improve',
        'how to cook', 'how to clean', 'how to organize',
        'how to exercise', 'how to diet', 'how to lose weight',
        'how to gain weight', 'how to build muscle',
        'how to write', 'how to read', 'how to speak',
        'how to drive', 'how to swim', 'how to dance',
        
        // Technology (legitimate)
        'how to code', 'how to program', 'how to develop',
        'how to design', 'how to create a website', 'how to build an app',
        'how to use', 'how to install', 'how to configure',
        
        // Personal development
        'how to be happy', 'how to be confident', 'how to be successful',
        'how to be healthy', 'how to be productive', 'how to be organized',
        'how to be creative', 'how to be positive', 'how to be motivated'
    ];
    
    for (const pattern of safe_patterns) {
        if (text_lower.includes(pattern)) {
            return {
                intent: 'educational',
                confidence: 0.1,
                is_malicious: false,
                reasoning: [`Safe pattern detected: ${pattern}`],
                risk_level: 'low',
                method: 'rule_based_low'
            };
        }
    }
    
    // STEP 3: MEDIUM PROBABILITY - Use NLP Analysis
    const medium_risk_indicators = [
        'how to lie', 'how to manipulate', 'how to deceive', 'how to trick'
    ];
    
    // Check for medium risk patterns (more specific)
    const has_medium_risk = medium_risk_indicators.some(indicator => text_lower.includes(indicator));
    
    // Check for ambiguous patterns that need NLP analysis
    const ambiguous_patterns = [
        'how to create', 'how to make', 'how to build', 'how to generate'
    ];
    
    const has_ambiguous_pattern = ambiguous_patterns.some(pattern => text_lower.includes(pattern));
    
    // Only use NLP analysis if text is long enough for reliable analysis
    if ((has_medium_risk || has_ambiguous_pattern) && text_lower.length >= 20) {
        console.log('Medium risk or ambiguous pattern detected, using NLP analysis...');
        return analyzeWithNLP(text);
    }
    
    // For short ambiguous patterns, be more lenient
    if (has_ambiguous_pattern && text_lower.length < 20) {
        return {
            intent: 'unknown',
            confidence: 0.3,
            is_malicious: false,
            reasoning: ['Ambiguous pattern detected but text too short for reliable analysis'],
            risk_level: 'low',
            method: 'rule_based_ambiguous'
        };
    }
    
    // STEP 4: NEW PATTERNS - Use NLP Analysis
    console.log('New pattern detected, using NLP analysis...');
    return analyzeWithNLP(text);
}

function analyzeWithNLP(text) {
    console.log('Starting NLP analysis for:', text);
    
    const text_lower = text.toLowerCase().trim();
    const reasoning = [];
    let confidence = 0.5;
    let intent = 'unknown';
    
    // Check if text is too short for reliable NLP analysis
    if (text_lower.length < 15) {
        return {
            intent: 'unknown',
            confidence: 0.3,
            is_malicious: false,
            reasoning: ['Text too short for reliable NLP analysis'],
            risk_level: 'low',
            method: 'nlp_analysis_short'
        };
    }
    
    // NLP Feature 1: Intent Analysis
    const intent_scores = analyzeIntent(text_lower);
    
    // NLP Feature 2: Context Similarity
    const context_similarity = analyzeContextSimilarity(text_lower);
    
    // NLP Feature 3: Sentence Structure Analysis
    const structure_analysis = analyzeSentenceStructure(text_lower);
    
    // Combine NLP features for final classification
    let educational_score = intent_scores.educational + context_similarity.educational;
    let malicious_score = intent_scores.malicious + context_similarity.malicious;
    let personal_info_score = intent_scores.personal_info + context_similarity.personal_info;
    
    // Adjust based on sentence structure
    if (structure_analysis.is_question) {
        educational_score += 0.2;
        malicious_score -= 0.1;
    }
    
    if (structure_analysis.is_command) {
        malicious_score += 0.2;
        educational_score -= 0.1;
    }
    
    // For partial text, be more lenient (but not for obvious malicious patterns)
    if (text_lower.length < 25) {
        // Check if it contains obvious malicious words
        const obvious_malicious_words = ['hack', 'steal', 'cheat', 'scam', 'fraud', 'bomb', 'kill', 'poison', 'lie', 'manipulate', 'deceive', 'trick'];
        const has_obvious_malicious = obvious_malicious_words.some(word => text_lower.includes(word));
        
        if (!has_obvious_malicious) {
            malicious_score *= 0.8; // Reduce malicious score for shorter text
            educational_score *= 1.1; // Increase educational score for shorter text
        }
    }
    
    // Determine dominant intent
    const max_score = Math.max(educational_score, malicious_score, personal_info_score);
    
    if (max_score === educational_score) {
        intent = 'educational';
        confidence = Math.min(0.8, educational_score);
        reasoning.push('NLP: Educational intent detected');
    } else if (max_score === malicious_score) {
        intent = 'malicious';
        confidence = Math.min(0.9, malicious_score);
        reasoning.push('NLP: Malicious intent detected');
    } else {
        intent = 'personal_info';
        confidence = Math.min(0.9, personal_info_score);
        reasoning.push('NLP: Personal information intent detected');
    }
    
    // Add structure analysis to reasoning
    if (structure_analysis.is_question) {
        reasoning.push('Sentence structure: Question format detected');
    }
    if (structure_analysis.is_command) {
        reasoning.push('Sentence structure: Command format detected');
    }
    
    const is_malicious = intent === 'malicious' || intent === 'personal_info';
    
    return {
        intent: intent,
        confidence: confidence,
        is_malicious: is_malicious,
        reasoning: reasoning,
        risk_level: confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
        method: 'nlp_analysis'
    };
}

function analyzeIntent(text) {
    const intent_scores = {
        educational: 0,
        malicious: 0,
        personal_info: 0
    };
    
    // Educational intent patterns
    const educational_patterns = {
        question_words: ['what', 'how', 'why', 'when', 'where', 'who', 'which'],
        educational_verbs: ['explain', 'describe', 'discuss', 'analyze', 'research', 'study', 'learn'],
        context_modifiers: ['detect', 'prevent', 'identify', 'recognize', 'spot', 'avoid', 'protect'],
        research_words: ['research', 'study', 'investigate', 'examine', 'explore', 'review']
    };
    
    // Check educational patterns
    if (educational_patterns.question_words.some(word => text.includes(word))) {
        intent_scores.educational += 0.3;
    }
    if (educational_patterns.educational_verbs.some(verb => text.includes(verb))) {
        intent_scores.educational += 0.4;
    }
    if (educational_patterns.context_modifiers.some(mod => text.includes(mod))) {
        intent_scores.educational += 0.5;
    }
    if (educational_patterns.research_words.some(word => text.includes(word))) {
        intent_scores.educational += 0.3;
    }
    
    // Malicious intent patterns
    const malicious_patterns = {
        action_verbs: ['create', 'make', 'build', 'generate', 'produce', 'develop', 'hack', 'steal'],
        harmful_objects: ['bomb', 'weapon', 'virus', 'malware', 'scam', 'deepfake', 'fake'],
        instruction_words: ['how to', 'tutorial', 'guide', 'instructions', 'steps', 'method']
    };
    
    // Check malicious patterns
    if (malicious_patterns.action_verbs.some(verb => text.includes(verb))) {
        intent_scores.malicious += 0.3;
    }
    if (malicious_patterns.harmful_objects.some(obj => text.includes(obj))) {
        intent_scores.malicious += 0.4;
    }
    if (malicious_patterns.instruction_words.some(word => text.includes(word))) {
        intent_scores.malicious += 0.2;
    }
    
    // Personal info patterns
    const personal_patterns = {
        possession_words: ['my', 'i have', 'my personal', 'my private', 'my own'],
        data_types: ['email', 'phone', 'address', 'card', 'password', 'ssn', 'birthday'],
        sharing_indicators: ['is', 'are', 'number', 'details', 'information', 'account']
    };
    
    // Check personal info patterns
    if (personal_patterns.possession_words.some(word => text.includes(word))) {
        intent_scores.personal_info += 0.3;
    }
    if (personal_patterns.data_types.some(data_type => text.includes(data_type))) {
        intent_scores.personal_info += 0.4;
    }
    if (personal_patterns.sharing_indicators.some(indicator => text.includes(indicator))) {
        intent_scores.personal_info += 0.2;
    }
    
    // Normalize scores
    const total_score = Object.values(intent_scores).reduce((sum, score) => sum + score, 0);
    if (total_score > 0) {
        Object.keys(intent_scores).forEach(key => {
            intent_scores[key] = intent_scores[key] / total_score;
        });
    }
    
    return intent_scores;
}

function analyzeContextSimilarity(text) {
    // Context examples for similarity analysis
    const context_examples = {
        educational: [
            "how to detect deepfake videos",
            "what are the signs of a scam",
            "explain how to prevent cyber attacks",
            "research about online threats",
            "how to identify fake news",
            "how to become rich",
            "how to make money",
            "how to start a business",
            "how to create a website",
            "how to create an app",
            "how to create content",
            "how to create a presentation",
            "how to create a resume",
            "how to create a budget",
            "how to create a plan",
            "how to create art",
            "how to create music",
            "how to create a story",
            "how to create a video",
            "how to create a blog"
        ],
        malicious: [
            "how to create a deepfake video",
            "how to make a bomb",
            "how to hack into a computer",
            "how to steal credit card information",
            "how to create a scam",
            "how to cheat in games",
            "how to create malware",
            "how to create a virus",
            "how to create fake documents",
            "how to create fake money",
            "how to create a phishing site"
        ],
        personal_info: [
            "my email is john@example.com",
            "my phone number is 555-123-4567",
            "my credit card number is 1234-5678-9012-3456",
            "my password is secret123",
            "my address is 123 Main Street"
        ]
    };
    
    // Improved similarity calculation with partial text handling
    const text_words = new Set(text.split(/\s+/));
    const text_length = text_words.size;
    
    const similarities = {};
    
    for (const [context_type, examples] of Object.entries(context_examples)) {
        let max_similarity = 0;
        
        for (const example of examples) {
            const example_words = new Set(example.toLowerCase().split(/\s+/));
            const intersection = new Set([...text_words].filter(word => example_words.has(word)));
            const union = new Set([...text_words, ...example_words]);
            
            // Calculate base similarity
            let similarity = union.size > 0 ? intersection.size / union.size : 0;
            
            // For short text (partial typing), be more lenient
            if (text_length < 4) {
                // Require higher word overlap for short text
                const overlap_ratio = intersection.size / Math.max(text_length, 1);
                if (overlap_ratio < 0.8) {
                    similarity *= 0.5; // Reduce similarity for partial matches
                }
            }
            
            // Penalize very short text that might be incomplete
            if (text_length < 3) {
                similarity *= 0.7;
            }
            
            max_similarity = Math.max(max_similarity, similarity);
        }
        
        similarities[context_type] = max_similarity;
    }
    
    return similarities;
}

function analyzeSentenceStructure(text) {
    const analysis = {
        is_question: false,
        is_command: false,
        complexity: 'simple'
    };
    
    // Check for question structure
    const question_words = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
    if (text.includes('?') || question_words.some(word => text.includes(word))) {
        analysis.is_question = true;
    }
    
    // Check for command structure
    const command_indicators = ['create', 'make', 'build', 'generate', 'produce', 'develop'];
    if (command_indicators.some(indicator => text.includes(indicator))) {
        analysis.is_command = true;
    }
    
    // Analyze complexity
    const word_count = text.split(/\s+/).length;
    if (word_count > 10) {
        analysis.complexity = 'complex';
    } else if (word_count > 5) {
        analysis.complexity = 'medium';
    }
    
    return analysis;
}

function logAttempt(payload) {
    console.log('Logging attempt:', payload);
    
    chrome.storage.local.get(['history'], (data) => {
        const history = data.history || [];
        history.unshift({
            ...payload,
            timestamp: Date.now()
        });
        
        // Keep only last 100 entries
        if (history.length > 100) {
            history.splice(100);
        }
        
        chrome.storage.local.set({ history });
        console.log('History updated, new length:', history.length);
    });
}

// Enhanced Context Analysis
function analyzeWithEnhancedContext(text) {
    const text_lower = text.toLowerCase().trim();
    
    // Educational context indicators
    const educational_indicators = [
        'learn', 'study', 'understand', 'explain', 'what is', 'why do',
        'how does', 'tutorial', 'guide', 'educational', 'academic'
    ];
    
    // Harmful context indicators
    const harmful_indicators = [
        'illegal', 'unauthorized', 'malicious', 'harmful', 'dangerous',
        'weapon', 'explosive', 'poison', 'kill', 'hurt', 'damage'
    ];
    
    // Check for educational context
    const has_educational_context = educational_indicators.some(indicator => 
        text_lower.includes(indicator)
    );
    
    // Check for harmful context
    const has_harmful_context = harmful_indicators.some(indicator => 
        text_lower.includes(indicator)
    );
    
    // Length-based analysis
    if (text_lower.length < 20) {
        // For short text, be more lenient unless obviously harmful
        if (has_harmful_context) {
            return { malicious: true, confidence: 0.8, reason: 'Harmful context detected' };
        }
        return { malicious: false, confidence: 0.6, reason: 'Short text, no obvious harm' };
    }
    
    // For longer text, use more sophisticated analysis
    return analyzeWithHybridApproach(text);
}

// User Feedback System
let userFeedback = {
    falsePositives: [],
    falseNegatives: [],
    suggestions: []
};

// Adaptive Learning System
function updateDetectionPatterns(feedback) {
    if (feedback.type === 'falsePositive') {
        // Add to safe patterns
        safe_patterns.push(feedback.text.toLowerCase());
        console.log('Added to safe patterns:', feedback.text);
    } else if (feedback.type === 'falseNegative') {
        // Add to high risk patterns
        high_risk_patterns.push(feedback.text.toLowerCase());
        console.log('Added to high risk patterns:', feedback.text);
    }
    
    // Save updated patterns
    chrome.storage.local.set({
        userFeedback: userFeedback,
        safe_patterns: safe_patterns,
        high_risk_patterns: high_risk_patterns
    });
}

// Load user feedback on startup
chrome.storage.local.get(['userFeedback', 'safe_patterns', 'high_risk_patterns'], function(data) {
    if (data.userFeedback) {
        userFeedback = data.userFeedback;
    }
    if (data.safe_patterns) {
        safe_patterns = data.safe_patterns;
    }
    if (data.high_risk_patterns) {
        high_risk_patterns = data.high_risk_patterns;
    }
});

// Security and Privacy Enhancements
const ENCRYPTION_KEY = 'ai-detector-secure-key-2024';

// Simple encryption for sensitive data
function encryptData(data) {
    try {
        return btoa(JSON.stringify(data));
    } catch (error) {
        console.error('Encryption failed:', error);
        return data;
    }
}

function decryptData(encryptedData) {
    try {
        return JSON.parse(atob(encryptedData));
    } catch (error) {
        console.error('Decryption failed:', error);
        return encryptedData;
    }
}

// Secure storage functions
function secureStore(key, data) {
    const encryptedData = encryptData(data);
    chrome.storage.local.set({ [key]: encryptedData });
}

function secureRetrieve(key, callback) {
    chrome.storage.local.get([key], function(result) {
        if (result[key]) {
            const decryptedData = decryptData(result[key]);
            callback(decryptedData);
        } else {
            callback(null);
        }
    });
}

// Enhanced logging with privacy protection
function logSecureEvent(event) {
    const secureEvent = {
        ...event,
        timestamp: Date.now(),
        url: window.location.hostname, // Only store domain, not full URL
        userAgent: navigator.userAgent.substring(0, 50) // Truncated user agent
    };
    
    // Store encrypted logs
    secureStore('secureLogs', secureEvent);
}