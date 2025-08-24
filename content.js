console.log('=== AI Misuse Detection extension loaded! ===');

function isExtensionContextValid() {
    try {
        return chrome && chrome.runtime && chrome.runtime.id;
    } catch (error) {
        return false;
    }
}

function sendMessageToBackground(message, callback) {
    if (!isExtensionContextValid()) {
        console.log('Extension context invalid, skipping message:', message);
        return;
    }
    
    try {
        chrome.runtime.sendMessage(message, function(response) {
            if (chrome.runtime.lastError) {
                console.log('Runtime error:', chrome.runtime.lastError);
                return;
            }
            if (callback) callback(response);
        });
    } catch (error) {
        console.log('Error sending message to background:', error);
    }
}

// Enhanced element detection for chatbots and AI interfaces
function findChatElements() {
    const selectors = [
        // Traditional inputs
        'input[type="text"]',
        'input[type="email"]',
        'input[type="search"]',
        'input[type="url"]',
        'textarea',
        
        // Contenteditable elements (common in chatbots)
        '[contenteditable="true"]',
        '[contenteditable]',
        
        // Common chatbot selectors
        '[data-testid*="chat"]',
        '[data-testid*="input"]',
        '[data-testid*="message"]',
        '[data-testid*="prompt"]',
        '[data-testid*="composer"]',
        
        // ChatGPT specific
        '[data-id="root"] textarea',
        '[data-id="root"] [contenteditable]',
        '#prompt-textarea',
        '.prompt-textarea',
        '[placeholder*="Message"]',
        '[placeholder*="Send a message"]',
        '[placeholder*="Ask me anything"]',
        
        // Claude specific
        '[data-testid="composer-input"]',
        '[data-testid="composer-textarea"]',
        
        // Bard/Gemini specific
        '[data-testid="chat-input"]',
        '[data-testid="input-box"]',
        
        // Generic AI chat patterns
        '.chat-input',
        '.message-input',
        '.prompt-input',
        '.composer',
        '.input-area',
        '.chat-composer',
        '.message-composer',
        
        // Role-based selectors
        '[role="textbox"]',
        '[role="combobox"]',
        '[role="searchbox"]',
        
        // Common class patterns
        '.ProseMirror',
        '.ql-editor',
        '.DraftEditor-root',
        '.public-DraftEditor-content',
        
        // Iframe content (for embedded chatbots)
        'iframe'
    ];
    
    let elements = [];
    
    // Find elements using selectors
    selectors.forEach(selector => {
        try {
            const found = document.querySelectorAll(selector);
            elements = elements.concat(Array.from(found));
        } catch (error) {
            console.log('Selector error:', selector, error);
        }
    });
    
    // Simple fallback: ensure all textareas and contenteditable elements are included
    const allTextareas = document.querySelectorAll('textarea');
    const allContentEditable = document.querySelectorAll('[contenteditable]');
    
    elements = elements.concat(Array.from(allTextareas));
    elements = elements.concat(Array.from(allContentEditable));
    
    // Remove duplicates
    elements = [...new Set(elements)];
    
    console.log('Found chat elements:', elements.length);
    return elements;
}

// Intelligent content analysis
async function analyzeTextIntelligently(text) {
    return new Promise((resolve, reject) => {
        // Check if extension context is still valid
        if (!isExtensionContextValid()) {
            console.log('Extension context invalid, using fallback analysis');
            // Fallback to local analysis
            const fallbackResult = analyzeTextLocally(text);
            resolve(fallbackResult);
            return;
        }
        
        try {
            chrome.runtime.sendMessage({
                action: 'analyzeText',
                text: text
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('Error in intelligent analysis:', chrome.runtime.lastError);
                    // Fallback to local analysis
                    const fallbackResult = analyzeTextLocally(text);
                    resolve(fallbackResult);
                } else {
                    resolve(response);
                }
            });
        } catch (error) {
            console.error('Exception in message sending:', error);
            // Fallback to local analysis
            const fallbackResult = analyzeTextLocally(text);
            resolve(fallbackResult);
        }
    });
}

// Local fallback analysis (simplified version of background.js logic)
function analyzeTextLocally(text) {
    console.log('Using local fallback analysis for:', text.substring(0, 50));
    
    if (!text || text.trim().length < 5) {
        return {
            result: 'safe',
            confidence: 0.5,
            intent: 'unknown',
            reasoning: ['Text too short'],
            risk_level: 'low'
        };
    }
    
    const text_lower = text.toLowerCase();
    
    // Check for safe patterns first
    const safe_patterns = [
        'how to kill mosquitos', 'how to kill bugs', 'how to kill insects',
        'how to kill pests', 'how to kill weeds', 'how to kill time',
        'how to kill bacteria', 'how to kill germs', 'how to kill viruses',
        'how to get rid of mosquitos', 'how to get rid of bugs',
        'how to control mosquitos', 'how to control pests',
        'how to eliminate mosquitos', 'how to eliminate bugs'
    ];
    
    for (const pattern of safe_patterns) {
        if (text_lower.includes(pattern)) {
            return {
                result: 'safe',
                confidence: 0.1,
                intent: 'educational',
                reasoning: [`Safe pattern detected: ${pattern}`],
                risk_level: 'low'
            };
        }
    }
    
    // Check for high risk patterns
    const high_risk_patterns = [
        'how to kill a person', 'how to kill someone', 'how to murder', 'how to assassinate',
        'how to make a bomb', 'how to create explosives', 'how to build a bomb',
        'how to hack into', 'how to steal', 'how to create a scam',
        'how do i kill myself', 'how to commit suicide', 'how to end my life',
        'how to poison someone', 'how to poison food',
        'create deepfake', 'make deepfake', 'generate deepfake',
        'create fake', 'make fake', 'generate fake'
    ];
    
    for (const pattern of high_risk_patterns) {
        if (text_lower.includes(pattern)) {
            return {
                result: 'malicious',
                confidence: 0.95,
                intent: 'malicious',
                reasoning: [`High risk pattern detected: ${pattern}`],
                risk_level: 'high'
            };
        }
    }
    
    // Check for personal information
    const personal_info_patterns = [
        'my credit card', 'my social security', 'my password',
        'my bank account', 'my phone number', 'my address',
        'my birthday', 'my driver license', 'my email'
    ];
    
    for (const pattern of personal_info_patterns) {
        if (text_lower.includes(pattern)) {
            return {
                result: 'malicious',
                confidence: 0.9,
                intent: 'personal_info',
                reasoning: [`Personal information detected: ${pattern}`],
                risk_level: 'high'
            };
        }
    }
    
    // Default safe
    return {
        result: 'safe',
        confidence: 0.3,
        intent: 'unknown',
        reasoning: ['No malicious patterns detected'],
        risk_level: 'low'
    };
}

// Extract text from various element types
function extractTextFromElement(element) {
    if (element.contentEditable === 'true' || element.contentEditable === '') {
        return element.textContent || element.innerText || '';
    } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        return element.value || '';
    } else if (element.tagName === 'DIV' || element.tagName === 'P' || element.tagName === 'SPAN') {
        return element.textContent || element.innerText || '';
    }
    return '';
}

// Observe and monitor an element
function observeElement(element) {
    if (element.hasAttribute('data-ai-detector-monitored')) {
        return; // Already monitored
    }
    
    element.setAttribute('data-ai-detector-monitored', 'true');
    
    console.log('Monitoring element:', element.tagName, element.className);
    
    // Add input event listeners
    const events = ['input', 'keyup', 'paste', 'drop'];
    events.forEach(eventType => {
        element.addEventListener(eventType, handleElementInput, true);
    });
}

// Performance optimizations
let analysisCache = new Map(); // Cache analysis results
let lastAnalysisTime = 0;
const ANALYSIS_COOLDOWN = 100; // Minimum time between analyses

// Optimized text analysis with caching
async function analyzeTextOptimized(text) {
    const textHash = text.toLowerCase().trim();
    
    // Check cache first
    if (analysisCache.has(textHash)) {
        return analysisCache.get(textHash);
    }
    
    // Rate limiting
    const now = Date.now();
    if (now - lastAnalysisTime < ANALYSIS_COOLDOWN) {
        return { malicious: false, confidence: 0.5, reason: 'Rate limited' };
    }
    lastAnalysisTime = now;
    
    // Quick check for obvious patterns first
    const quickResult = quickAnalysis(text);
    if (quickResult.confidence > 0.8) {
        analysisCache.set(textHash, quickResult);
        return quickResult;
    }
    
    // Full analysis only if needed
    const result = await analyzeTextIntelligently(text);
    analysisCache.set(textHash, result);
    
    // Limit cache size
    if (analysisCache.size > 100) {
        const firstKey = analysisCache.keys().next().value;
        analysisCache.delete(firstKey);
    }
    
    return result;
}

// Quick analysis for obvious patterns
function quickAnalysis(text) {
    const text_lower = text.toLowerCase();
    
    // Obvious malicious patterns
    const obvious_malicious = [
        'how to kill a person', 'how to make a bomb', 'how to hack a computer',
        'create nude image', 'how to steal', 'how to cheat in exam'
    ];
    
    if (obvious_malicious.some(pattern => text_lower.includes(pattern))) {
        return { malicious: true, confidence: 0.9, reason: 'Obvious malicious pattern' };
    }
    
    // Obvious safe patterns
    const obvious_safe = [
        'how to kill mosquitos', 'how to become rich', 'how to create a website',
        'what is deepfake', 'why people commit suicide'
    ];
    
    if (obvious_safe.some(pattern => text_lower.includes(pattern))) {
        return { malicious: false, confidence: 0.8, reason: 'Obvious safe pattern' };
    }
    
    return { malicious: false, confidence: 0.3, reason: 'Needs full analysis' };
}

// Debounce function to prevent multiple rapid calls
let analysisTimeout = null;
let lastAnalyzedText = '';

// Handle input from any monitored element
function handleElementInput(e) {
    // Check if protection is enabled
    if (!protectionEnabled) {
        console.log('Protection disabled, skipping analysis');
        return;
    }
    
    const element = e.target;
    const text = extractTextFromElement(element);
    
    // Clear previous timeout
    if (analysisTimeout) {
        clearTimeout(analysisTimeout);
    }
    
    // Debounce analysis to prevent multiple rapid calls (200ms delay)
    analysisTimeout = setTimeout(() => {
        // Skip if text is too short or same as last analyzed
        if (text.length < 10 || text === lastAnalyzedText) {
            return;
        }
        
        lastAnalyzedText = text;
        console.log('=== Element input changed: ===', text.substring(0, 50));
        
        // Quick check for obvious malicious content (more specific patterns)
        const lowerText = text.toLowerCase();
        
        // Only check for obvious malicious patterns if text is complete enough
        if (text.length >= 15) {
            const obviousMalicious = [
                'how to kill a person', 'how to kill someone', 'how to murder someone',
                'how to make a bomb', 'how to create a bomb', 'how to build a bomb',
                'how to hack into', 'how to hack computer', 'how to hack system',
                'create nude image', 'make nude image', 'generate nude image',
                'create porn video', 'make porn video', 'generate porn video',
                'kill myself', 'how to commit suicide', 'how to end my life',
                'how to poison someone', 'how to poison food'
            ];
            
            const isObviouslyMalicious = obviousMalicious.some(pattern => lowerText.includes(pattern));
            
            if (isObviouslyMalicious) {
                // Immediately clear and block obvious malicious content
                if (element.contentEditable === 'true' || element.contentEditable === '') {
                    element.textContent = '';
                    element.innerHTML = '';
                } else {
                    element.value = '';
                }
                
                showNotification('Malicious content detected and cleared! (Quick detection)');
                console.log('⚠️ Obvious malicious content detected and cleared immediately:', text);
                lastAnalyzedText = '';
                return;
            }
        }
        
        analyzeTextOptimized(text).then(analysis => {
            console.log('Element ML analysis result:', analysis);
            
            // Debug: Check if analysis is valid
            if (!analysis) {
                console.error('❌ Analysis result is null or undefined!');
                return;
            }
            
            // Handle error objects from background script
            if (analysis.error || analysis.message) {
                console.error('❌ Background script error:', analysis.error || analysis.message);
                return;
            }
            
            if (!analysis.result) {
                console.error('❌ Analysis result missing "result" property!');
                console.log('Available properties:', Object.keys(analysis));
                return;
            }
            
            if (analysis.result === 'malicious') {
                // Clear dangerous content immediately
                if (element.contentEditable === 'true' || element.contentEditable === '') {
                    element.textContent = '';
                    element.innerHTML = '';
                } else {
                    element.value = '';
                }
                
                // Show notification with ML results
                const confidence = Math.round(analysis.confidence * 100);
                showNotification(`Malicious content detected and cleared! (${confidence}% confidence)`);
                
                console.log('⚠️ Harmful content detected and cleared:', text);
                
                // Log to background script
                sendMessageToBackground({
                    action: 'logAttempt',
                    payload: {
                        result: 'malicious',
                        text: text,
                        timestamp: Date.now(),
                        url: window.location.href,
                        ml_prediction: analysis.ml_prediction,
                        confidence: analysis.confidence,
                        malicious_probability: analysis.malicious_probability,
                        elementType: element.tagName,
                        isContentEditable: element.contentEditable === 'true'
                    }
                }, function(response) {
                    console.log('Element log response:', response);
                });
                
                // Clear the last analyzed text to allow future analysis
                lastAnalyzedText = '';
            } else {
                console.log('Content is safe, no visual feedback needed');
            }
        }).catch(error => {
            console.error('Error in ML analysis:', error);
        });
    }, 200); // 200ms delay for faster response
}

// Notification deduplication
let lastNotificationMessage = '';
let notificationTimeout = null;

function showNotification(message) {
    // Prevent duplicate notifications
    if (message === lastNotificationMessage) {
        return;
    }
    
    // Clear previous notification timeout
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('[data-ai-detector-notification]');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.remove();
        }
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.setAttribute('data-ai-detector-notification', 'true');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                margin-left: auto;
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
            ">×</button>
        </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Store current message
    lastNotificationMessage = message;
    
    // Auto-remove after 3 seconds (faster)
    notificationTimeout = setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
        lastNotificationMessage = '';
    }, 3000);
}

// Global variable to track protection status
let protectionEnabled = true;

// Initialize extension
function initExtension() {
    console.log('=== Initializing extension... ===');
    
    // Check if extension is still valid
    if (!isExtensionContextValid()) {
        console.log('Extension context invalid, stopping initialization');
        return;
    }
    
    // Load initial protection status
    try {
        chrome.storage.local.get(['protectionEnabled'], function(data) {
            protectionEnabled = data.protectionEnabled !== false; // Default to true
            console.log('Initial protection status:', protectionEnabled ? 'ENABLED' : 'DISABLED');
        });
    } catch (error) {
        console.log('Storage access failed, using default protection enabled');
        protectionEnabled = true;
    }
    
    // Find and monitor all chat elements
    const chatElements = findChatElements();
    chatElements.forEach(element => {
        observeElement(element);
    });
    
    // Monitor for dynamically added elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if the new element is a chat element
                    const newChatElements = findChatElements.call(node.ownerDocument || document);
                    newChatElements.forEach(element => {
                        if (!element.hasAttribute('data-ai-detector-monitored')) {
                            observeElement(element);
                        }
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Periodic check to reinitialize if context is lost
    setInterval(() => {
        if (!isExtensionContextValid()) {
            console.log('Extension context lost, attempting to reinitialize...');
            // Clear monitored attributes to allow re-monitoring
            document.querySelectorAll('[data-ai-detector-monitored]').forEach(el => {
                el.removeAttribute('data-ai-detector-monitored');
            });
            // Reinitialize
            initExtension();
        }
    }, 10000); // Check every 10 seconds
}

// Run immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExtension);
} else {
    initExtension();
}