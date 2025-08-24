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
    
    // Initialize detection flag to false (default state)
    contentRestoredFlags.set(element, false);
    
    console.log('Monitoring element:', element.tagName, element.className, 'Detection flag initialized to false');
    
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
        
        // Check if detection should be skipped for this element
        if (shouldSkipDetection(element)) {
            console.log('🚫 Detection skipped due to flag being true');
            return;
        }
        
        // Reset flag if element becomes empty
        resetDetectionFlag(element);
        
        // Show current flag status for debugging
        console.log('🔍 Detection flag status for element:', contentRestoredFlags.get(element));
        
        lastAnalyzedText = text;
        console.log('=== Element input changed: ===', text.substring(0, 50));
        
        // Quick check for obvious malicious content (more specific patterns)
        const lowerText = text.toLowerCase();
        
        // Only check for obvious malicious patterns if text is complete enough
        if (text.length >= 15) {
            const obviousMalicious = [
                'how to kill a person', 'how to kill someone', 'how to murder someone',
                'how to make a bomb', 'how to create a bomb', 'how to build a bomb',
                'how to hack into', 'how to hack system',
                'create nude image', 'make nude image', 'generate nude image',
                'create porn video', 'make porn video', 'generate porn video',
                'kill myself', 'how to commit suicide', 'how to end my life',
                'how to poison someone', 'how to poison food',
                // Drug-related patterns
                'how to make cocaine', 'how to make methamphetamine', 'how to make meth',
                'how to produce heroin', 'how to make heroin', 'how to sell drugs',
                'how to smuggle marijuana', 'how to smuggle drugs', 'how to hide cocaine',
                'how to hide drugs', 'how to mix drugs', 'how to make lsd',
                'how to cut heroin', 'how to buy illegal drugs', 'how to buy drugs online',
                'how to grow opium', 'how to grow poppies', 'how to package meth',
                'how to make ecstasy', 'how to distribute drugs', 'how to make crack cocaine',
                'how to turn codeine into morphine', 'how to hide drugs in food',
                'how to inject heroin', 'how to run a drug lab', 'how to make and sell drugs',
                'recipe for making methamphetamine', 'chemicals to produce heroin',
                'step-by-step instructions to make lsd', 'how to cut heroin with other substances',
                'how to buy illegal drugs online safely', 'easiest way to grow opium poppies',
                'how to package meth to avoid police detection', 'how to make ecstasy tablets',
                'how to distribute drugs in a nightclub', 'how to prepare crack cocaine',
                'process to turn codeine into morphine', 'how to hide drugs inside food packages',
                'safest way to inject heroin', 'how to run a secret drug lab',
                'fastest way to make and sell illegal drugs'
            ];
            
            const isObviouslyMalicious = obviousMalicious.some(pattern => lowerText.includes(pattern));
            
            if (isObviouslyMalicious) {
                // Store the text and element for potential undo
                lastClearedText = text;
                lastClearedElement = element;
                console.log('💾 Stored text for undo:', text.substring(0, 50) + '...');
                console.log('💾 Stored element for undo:', element.tagName, element.className);
                
                // Immediately clear and block obvious malicious content
                if (element.contentEditable === 'true' || element.contentEditable === '') {
                    element.textContent = '';
                    element.innerHTML = '';
                } else {
                    element.value = '';
                }
                
                const categoryInfo = categorizeContent(text);
                showNotification(`${categoryInfo.category} detected and blocked!\n\n Blocked-Content: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n\nClick undo to restore if this was a mistake.`, true, 10000, categoryInfo);
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
                // Check confidence level - only block if confidence is above 65%
                const confidence = Math.round(analysis.confidence * 100);
                
                if (confidence >= 65) {
                    // Store the text and element for potential undo
                    lastClearedText = text;
                    lastClearedElement = element;
                    console.log('💾 Stored text for undo (ML):', text.substring(0, 50) + '...');
                    console.log('💾 Stored element for undo (ML):', element.tagName, element.className);
                    
                // Clear dangerous content immediately
                if (element.contentEditable === 'true' || element.contentEditable === '') {
                    element.textContent = '';
                    element.innerHTML = '';
                } else {
                    element.value = '';
                }
                
                    // Show notification with ML results and undo option
                    const categoryInfo = categorizeContent(text);
                    showNotification(`${categoryInfo.category} blocked with ${confidence}% confidence!\n\n Blocked-Content: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n\nClick undo to restore if this was a mistake.`, true, 10000, categoryInfo);
                
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
                    console.log(`⚠️ Malicious content detected but confidence too low (${confidence}% < 65%):`, text);
                    // Don't block, just log for monitoring
                    sendMessageToBackground({
                        action: 'logAttempt',
                        payload: {
                            result: 'low_confidence',
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
                        console.log('Low confidence log response:', response);
                    });
                }
            } else {
                console.log('Content is safe, no visual feedback needed');
                // Only log malicious content, not safe content
            }
        }).catch(error => {
            console.error('Error in ML analysis:', error);
        });
    }, 200); // 200ms delay for faster response
}

// Notification deduplication
let lastNotificationMessage = '';
let notificationTimeout = null;
let lastClearedText = '';
let lastClearedElement = null;

// Flag to track if content has been manually restored (undo was used)
let contentRestoredFlags = new Map(); // Maps element to boolean flag

// Content categorization system
function categorizeContent(text) {
    const lowerText = text.toLowerCase();
    
    // Personal details being shared (not requested)
    if ((lowerText.includes('my email is') || lowerText.includes('my email:') || lowerText.includes('my email=') ||
         lowerText.includes('my phone is') || lowerText.includes('my phone:') || lowerText.includes('my phone=') ||
         lowerText.includes('my number is') || lowerText.includes('my number:') || lowerText.includes('my number=') ||
         lowerText.includes('my address is') || lowerText.includes('my address:') || lowerText.includes('my address=') ||
         lowerText.includes('my credit card is') || lowerText.includes('my credit card:') || lowerText.includes('my credit card=') ||
         lowerText.includes('my password is') || lowerText.includes('my password:') || lowerText.includes('my password=') ||
         lowerText.includes('my ssn is') || lowerText.includes('my ssn:') || lowerText.includes('my ssn=') ||
         lowerText.includes('my social security is') || lowerText.includes('my social security:') || lowerText.includes('my social security=') ||
         lowerText.includes('my bank account is') || lowerText.includes('my bank account:') || lowerText.includes('my bank account=') ||
         lowerText.includes('my personal info is') || lowerText.includes('my personal info:') || lowerText.includes('my personal info=') ||
         lowerText.includes('my private info is') || lowerText.includes('my private info:') || lowerText.includes('my private info=') ||
         lowerText.includes('my contact is') || lowerText.includes('my contact:') || lowerText.includes('my contact=') ||
         lowerText.includes('my birthday is') || lowerText.includes('my birthday:') || lowerText.includes('my birthday=') ||
         lowerText.includes('my full name is') || lowerText.includes('my full name:') || lowerText.includes('my full name=')) ||
        // Also detect patterns like "john@example.com" or "555-123-4567" after "my email" or "my phone"
        (lowerText.includes('@') && (lowerText.includes('my email') || lowerText.includes('my email address'))) ||
        (/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(lowerText) && (lowerText.includes('my phone') || lowerText.includes('my number'))) ||
        (/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/.test(lowerText) && (lowerText.includes('my credit card') || lowerText.includes('my card'))) ||
        (/\d{3}-\d{2}-\d{4}/.test(lowerText) && (lowerText.includes('my ssn') || lowerText.includes('my social security')))) {
        return {
            category: 'Personal Details',
            icon: '🔒',
            color: '#28a745',
            description: 'Personal or sensitive information being shared'
        };
    }
    
    // Violence and weapons
    if (lowerText.includes('kill') || lowerText.includes('murder') || lowerText.includes('assassinate') || 
        lowerText.includes('suicide') || lowerText.includes('die') || lowerText.includes('death')) {
        return {
            category: 'Violence',
            icon: '🔪',
            color: '#dc2626',
            description: 'Violent or harmful content'
        };
    }
    
    // Bombs and explosives
    if (lowerText.includes('bomb') || lowerText.includes('explosive') || lowerText.includes('blast') || 
        lowerText.includes('detonate') || lowerText.includes('explode')) {
        return {
            category: 'Explosives',
            icon: '💣',
            color: '#ea580c',
            description: 'Explosive or bomb-related content'
        };
    }
    
    // Face swapping and deepfakes
    if (lowerText.includes('face swap') || lowerText.includes('face swapping') || 
        lowerText.includes('deepfake') || lowerText.includes('fake video') || 
        lowerText.includes('fake image') || lowerText.includes('swap face')) {
        return {
            category: 'Face Manipulation',
            icon: '🎭',
            color: '#7c3aed',
            description: 'Face swapping or deepfake content'
        };
    }
    
    // Drugs and illegal substances
    if (lowerText.includes('cocaine') || lowerText.includes('heroin') || lowerText.includes('meth') || 
        lowerText.includes('drugs') || lowerText.includes('lsd') || lowerText.includes('ecstasy') ||
        lowerText.includes('opium') || lowerText.includes('marijuana')) {
        return {
            category: 'Illegal Substances',
            icon: '💊',
            color: '#059669',
            description: 'Illegal drug-related content'
        };
    }
    
    // Hacking and cyber attacks
    if (lowerText.includes('hack') || lowerText.includes('cyber attack') || lowerText.includes('malware') || 
        lowerText.includes('virus') || lowerText.includes('phishing')) {
        return {
            category: 'Cyber Security',
            icon: '🖥️',
            color: '#0891b2',
            description: 'Hacking or cyber attack content'
        };
    }
    
    // Adult content
    if (lowerText.includes('nude') || lowerText.includes('porn') || lowerText.includes('sexual') || 
        lowerText.includes('adult content') || lowerText.includes('explicit')) {
        return {
            category: 'Adult Content',
            icon: '🚫',
            color: '#be185d',
            description: 'Adult or explicit content'
        };
    }
    
    // Default category
    return {
        category: 'Malicious Content',
        icon: '⚠️',
        color: '#dc2626',
        description: 'Potentially harmful content'
    };
}

function showNotification(message, showUndo = false, duration = 10000, categoryInfo = null) {
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
    
    // Default colors if no category info
    let bgColor = '#dc2626';
    let shadowColor = 'rgba(220, 38, 38, 0.4)';
    
    // Use category-specific colors if available
    if (categoryInfo) {
        bgColor = categoryInfo.color;
        shadowColor = `${categoryInfo.color}66`; // 40% opacity
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.setAttribute('data-ai-detector-notification', 'true');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, ${bgColor}, ${bgColor}dd);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 25px ${shadowColor};
        z-index: 10000;
        max-width: 400px;
        min-width: 350px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        animation: slideIn 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
    `;
    
    // Process message to handle line breaks and styling
    const processedMessage = message.replace(/\n/g, '<br>');
    
    let notificationContent = `
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600; font-size: 16px;">
                        ${categoryInfo ? categoryInfo.icon + ' ' + categoryInfo.category : '⚠️ Alert'}
                    </span>
                    ${categoryInfo ? `<span style="margin-left: 8px; font-size: 12px; opacity: 0.8; background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px;">${categoryInfo.description}</span>` : ''}
                </div>
                <div style="font-size: 14px; line-height: 1.6; opacity: 0.95;">
                    ${processedMessage}
                </div>
            </div>
            <button id="close-notification" style="
                margin-left: 12px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 6px;
                transition: all 0.2s;
                min-width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        </div>
    `;
    
    // Add undo button if requested
    if (showUndo && lastClearedText && lastClearedElement) {
        notificationContent += `
            <div style="display: flex; gap: 12px; margin-top: 16px;">
                <button id="undo-button" style="
                    background: rgba(255, 255, 255, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    color: white;
                    padding: 10px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    transition: all 0.2s;
                    flex: 1;
                    text-align: center;
                ">
                    ↩ Restore Content
                </button>
            </div>
        `;
    }
    
    notification.innerHTML = notificationContent;
    
    // Add event listeners after creating the notification
    const closeButton = notification.querySelector('#close-notification');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            notification.remove();
        });
    }
    
    const undoButton = notification.querySelector('#undo-button');
    if (undoButton) {
        undoButton.addEventListener('click', () => {
            undoClear();
        });
        
        // Add hover effects
        undoButton.addEventListener('mouseenter', () => {
            undoButton.style.background = 'rgba(255, 255, 255, 0.25)';
            undoButton.style.transform = 'translateY(-1px)';
            undoButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        });
        
        undoButton.addEventListener('mouseleave', () => {
            undoButton.style.background = 'rgba(255, 255, 255, 0.15)';
            undoButton.style.transform = 'translateY(0)';
            undoButton.style.boxShadow = 'none';
        });
    }
    
    // Add hover effects for close button
    if (closeButton) {
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
            closeButton.style.transform = 'scale(1.1)';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
            closeButton.style.transform = 'scale(1)';
        });
    }
    
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
    
    // Auto-remove after specified duration
    notificationTimeout = setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
        lastNotificationMessage = '';
    }, duration);
}

// Function to undo the clear action
function undoClear() {
    console.log('🔄 Undo button clicked!');
    console.log('📝 Last cleared text:', lastClearedText);
    console.log('🔍 Last cleared element:', lastClearedElement);
    
    if (lastClearedText && lastClearedElement) {
        console.log('✅ Restoring text to element:', lastClearedElement.tagName, lastClearedElement.className);
        
        // Restore the text
        if (lastClearedElement.contentEditable === 'true' || lastClearedElement.contentEditable === '') {
            console.log('📝 Restoring to contentEditable element');
            lastClearedElement.textContent = lastClearedText;
            lastClearedElement.innerHTML = lastClearedText;
        } else {
            console.log('📝 Restoring to input/textarea element');
            lastClearedElement.value = lastClearedText;
        }
        
        console.log('✅ Text restored successfully:', lastClearedText);
        
        // Set the flag to true for this element (content restored, no more detection)
        contentRestoredFlags.set(lastClearedElement, true);
        console.log('🚫 Detection disabled for this element (flag set to true)');
        
        // Show success notification for 10 seconds
        const successCategory = {
            category: 'Success',
            icon: '✅',
            color: '#059669',
            description: 'Content restored successfully'
        };
        showNotification('Content Restored Successfully!\n\nThe blocked content has been returned to the input field.\n\nYou can now continue typing without detection interference.', false, 10000, successCategory);
        
        // Clear the stored data
        lastClearedText = '';
        lastClearedElement = null;
        
        // Remove the current notification
        const notification = document.querySelector('[data-ai-detector-notification]');
        if (notification) {
            notification.remove();
        }
    } else {
        console.error('❌ No text or element to restore!');
        console.log('lastClearedText:', lastClearedText);
        console.log('lastClearedElement:', lastClearedElement);
    }
}

// Function to check if detection should be skipped for an element
function shouldSkipDetection(element) {
    const flag = contentRestoredFlags.get(element);
    if (flag === true) {
        console.log('🚫 Detection skipped for element (flag is true):', element.tagName, element.className);
        return true;
    }
    return false;
}

// Function to reset flag when element becomes empty
function resetDetectionFlag(element) {
    const currentText = extractTextFromElement(element);
    if (!currentText || currentText.trim() === '') {
        contentRestoredFlags.set(element, false);
        console.log('🔄 Detection re-enabled for element (field is empty):', element.tagName, element.className);
    }
}

// Function to show current flag status for debugging
function showFlagStatus() {
    console.log('📊 Current Detection Flag Status:');
    contentRestoredFlags.forEach((flag, element) => {
        const text = extractTextFromElement(element);
        const isEmpty = !text || text.trim() === '';
        console.log(`  ${element.tagName}.${element.className}: flag=${flag}, empty=${isEmpty}`);
    });
}

// Function to manually reset all flags (for testing)
function resetAllFlags() {
    contentRestoredFlags.clear();
    console.log('🔄 All detection flags have been reset');
}

// Function to provide feedback
function provideFeedback(feedbackType) {
    if (lastClearedText) {
        // Send feedback to background script
        sendMessageToBackground({
            action: 'provideFeedback',
            payload: {
                type: feedbackType,
                text: lastClearedText,
                timestamp: Date.now(),
                url: window.location.href
            }
        }, function(response) {
            console.log('Feedback response:', response);
        });
        
        // Show feedback confirmation for 10 seconds
        showNotification('Thank you for your feedback!', false, 10000);
        
        // Clear the stored data
        lastClearedText = '';
        lastClearedElement = null;
        
        // Remove the current notification
        const notification = document.querySelector('[data-ai-detector-notification]');
        if (notification) {
            notification.remove();
        }
    }
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

// Make functions available globally for testing
window.aiDetectorDebug = {
    showFlagStatus: showFlagStatus,
    resetAllFlags: resetAllFlags,
    contentRestoredFlags: contentRestoredFlags,
    // Quick function to check current element's flag
    checkCurrentElement: () => {
        const activeElement = document.activeElement;
        if (activeElement) {
            const flag = contentRestoredFlags.get(activeElement);
            console.log('🔍 Current active element:', activeElement.tagName, activeElement.className);
            console.log('🚩 Detection flag status:', flag);
            return flag;
        } else {
            console.log('❌ No active element found');
            return null;
        }
    }
};