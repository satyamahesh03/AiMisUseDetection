document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleProtection');
    const statusIndicator = document.getElementById('statusIndicator');
    const viewLogsBtn = document.getElementById('viewLogs');
    const clearLogsBtn = document.getElementById('clearLogs');
    const logsContainer = document.getElementById('logs');
    const totalScansEl = document.getElementById('totalScans');
    const blockedCountEl = document.getElementById('blockedCount');
    const successRateEl = document.getElementById('successRate');

    try {
        chrome.storage.local.get(['protectionEnabled', 'stats'], function(data) {
            if (chrome.runtime.lastError) {
                console.error('Storage error:', chrome.runtime.lastError);
                // Use defaults if storage fails
                updateStatus(true);
                updateStats({ total: 0, blocked: 0 });
                return;
            }
            const isEnabled = data.protectionEnabled !== false; // Default to true
            updateStatus(isEnabled);
            updateStats(data.stats || { total: 0, blocked: 0 });
        });
    } catch (error) {
        console.error('Popup initialization error:', error);
        // Use defaults if everything fails
        updateStatus(true);
        updateStats({ total: 0, blocked: 0 });
    }

    // Toggle protection
    toggleBtn.addEventListener('click', function() {
        try {
            chrome.storage.local.get(['protectionEnabled'], function(data) {
                if (chrome.runtime.lastError) {
                    console.error('Storage error on toggle:', chrome.runtime.lastError);
                    return;
                }
                const newStatus = !(data.protectionEnabled !== false);
                chrome.storage.local.set({ protectionEnabled: newStatus }, function() {
                    if (chrome.runtime.lastError) {
                        console.error('Storage set error:', chrome.runtime.lastError);
                        return;
                    }
                    updateStatus(newStatus);
                    
                    // Notify content script
                    try {
                        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                            if (chrome.runtime.lastError) {
                                console.error('Tabs query error:', chrome.runtime.lastError);
                                return;
                            }
                            if (tabs[0]) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: 'toggleProtection',
                                    enabled: newStatus
                                }, function(response) {
                                    if (chrome.runtime.lastError) {
                                        console.log('Content script message error (expected if no content script):', chrome.runtime.lastError);
                                    }
                                });
                            }
                        });
                    } catch (error) {
                        console.error('Tabs communication error:', error);
                    }
                });
            });
        } catch (error) {
            console.error('Toggle protection error:', error);
        }
    });

    // View logs
    viewLogsBtn.addEventListener('click', function() {
        if (logsContainer.classList.contains('show')) {
            logsContainer.classList.remove('show');
            viewLogsBtn.innerHTML = '<span>View</span><div class="button-arrow">›</div>';
        } else {
            try {
                console.log('Fetching logs from storage...');
                chrome.storage.local.get(['history'], function(data) {
                    if (chrome.runtime.lastError) {
                        console.error('Storage error on view logs:', chrome.runtime.lastError);
                        displayLogs([]);
                        logsContainer.classList.add('show');
                        viewLogsBtn.textContent = 'Hide Logs';
                        return;
                    }
                    console.log('Storage data retrieved:', data);
                    const history = data.history || [];
                    console.log('History array:', history);
                    displayLogs(history);
                    logsContainer.classList.add('show');
                    viewLogsBtn.textContent = 'Hide Logs';
                });
            } catch (error) {
                console.error('View logs error:', error);
                displayLogs([]);
                logsContainer.classList.add('show');
                viewLogsBtn.textContent = 'Hide Logs';
            }
        }
    });



    // Clear logs functionality
    clearLogsBtn.addEventListener('click', function() {
        console.log('Clear logs button clicked');
        if (confirm('Are you sure you want to clear all logs?')) {
            try {
                chrome.storage.local.set({ history: [] }, function() {
                    if (chrome.runtime.lastError) {
                        console.error('Error clearing logs:', chrome.runtime.lastError);
                    } else {
                        console.log('Logs cleared successfully');
                        displayLogs([]);
                        // Also clear stats
                        chrome.storage.local.set({ stats: { total: 0, blocked: 0 } });
                        updateStats({ total: 0, blocked: 0 });
                    }
                });
            } catch (error) {
                console.error('Clear logs error:', error);
            }
        }
    });

    function updateStatus(enabled) {
        if (enabled) {
            toggleBtn.classList.remove('disabled');
            toggleBtn.textContent = 'Disable Protection';
            statusIndicator.className = 'status-indicator active';
            statusIndicator.textContent = 'Active';
        } else {
            toggleBtn.classList.add('disabled');
            toggleBtn.textContent = 'Enable Protection';
            statusIndicator.className = 'status-indicator inactive';
            statusIndicator.textContent = 'Disabled';
        }
    }

    function updateStats(stats) {
        totalScansEl.textContent = stats.total || 0;
        blockedCountEl.textContent = stats.blocked || 0;
        
        // Calculate success rate
        const successRate = stats.total > 0 ? ((stats.total - stats.blocked) / stats.total * 100).toFixed(1) : 0;
        successRateEl.textContent = successRate + '%';
        
        // Add animation to stats
        animateNumber(totalScansEl, stats.total || 0);
        animateNumber(blockedCountEl, stats.blocked || 0);
    }

    function animateNumber(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        if (currentValue !== targetValue) {
            element.classList.add('updated');
            setTimeout(() => {
                element.classList.remove('updated');
            }, 600);
        }
    }

    function displayLogs(history) {
        logsContainer.innerHTML = '';
        console.log('Displaying logs, history:', history);
        
        if (!Array.isArray(history)) {
            console.error('History is not an array:', history);
            logsContainer.innerHTML = `
                <div class="log-item">
                    <div class="log-text">Error loading logs</div>
                    <div class="log-meta">
                        <span>History data is invalid</span>
                    </div>
                </div>
            `;
            return;
        }
        
        // Get last 10 logs and sort by timestamp (newest first)
        const recentLogs = history
            .slice(-10)
            .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending (newest first)
        
        console.log('Recent logs to display (sorted by timestamp, newest first):', recentLogs);
        console.log('Timestamp-based log order verification:');
        recentLogs.forEach((log, index) => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            const date = new Date(log.timestamp).toLocaleDateString();
            console.log(`  ${index + 1}. ${date} ${time} (${log.timestamp}) - ${log.text ? log.text.substring(0, 30) + '...' : 'No text'}`);
        });
        
        if (recentLogs.length === 0) {
            logsContainer.innerHTML = `
                <div class="log-item">
                    <div class="log-text">No blocked content yet</div>
                    <div class="log-meta">
                        <span>Extension only blocks content with ≥65% confidence</span>
                    </div>
                </div>
            `;
            return;
        }
        
        recentLogs.forEach((log, index) => {
            console.log(`Processing log ${index}:`, log);
            
            const logItem = document.createElement('div');
            
            // Handle different possible result formats
            let result = 'safe';
            if (log.result) {
                result = log.result;
            } else if (log.is_malicious !== undefined) {
                result = log.is_malicious ? 'malicious' : 'safe';
            } else if (log.malicious_probability !== undefined) {
                result = log.malicious_probability > 0.5 ? 'malicious' : 'safe';
            }
            
            // Skip low confidence entries in the display
            if (result === 'low_confidence') {
                return;
            }
            
            logItem.className = `log-item ${result}`;
            
            const time = new Date(log.timestamp).toLocaleTimeString();
            const date = new Date(log.timestamp).toLocaleDateString();
            const text = log.text && log.text.length > 50 ? log.text.substring(0, 50) + '...' : (log.text || 'No text');
            
            let confidenceInfo = '';
            if (log.confidence) {
                const confidence = Math.round(log.confidence * 100);
                confidenceInfo = ` • ${confidence}% confidence`;
            } else if (log.malicious_probability !== undefined) {
                const confidence = Math.round(log.malicious_probability * 100);
                confidenceInfo = ` • ${confidence}% confidence`;
            }
            
            // Add order indicator (newest = #1, oldest = #10)
            const orderNumber = index + 1;
            const orderIndicator = orderNumber === 1 ? '' : `#${orderNumber}`;
            
            logItem.innerHTML = `
                <div class="log-text">
                    <span style="margin-right: 8px; font-weight: bold; color: #666;">${orderIndicator}</span>
                    ${text}
                </div>
                <div class="log-meta">
                    <span>${date} at ${time}${confidenceInfo}</span>
                    <span class="log-status ${result}">${result === 'malicious' ? 'Blocked' : 'Safe'}</span>
                </div>
            `;
            logsContainer.appendChild(logItem);
        });
    }

    // Auto-refresh stats every 2 seconds
    setInterval(function() {
        chrome.storage.local.get(['stats'], function(data) {
            updateStats(data.stats || { total: 0, blocked: 0 });
        });
    }, 2000);
    
    // Debug: Log current storage state on popup open
    chrome.storage.local.get(['history', 'stats', 'protectionEnabled'], function(data) {
        console.log('=== POPUP DEBUG INFO ===');
        console.log('Protection enabled:', data.protectionEnabled);
        console.log('Stats:', data.stats);
        console.log('History length:', data.history ? data.history.length : 0);
        
        if (data.history && data.history.length > 0) {
            console.log('=== TIMESTAMP SORTING ANALYSIS ===');
            // Show first few entries (newest)
            console.log('First 3 entries (newest):');
            data.history.slice(0, 3).forEach((log, index) => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                const date = new Date(log.timestamp).toLocaleDateString();
                console.log(`  ${index + 1}. ${date} ${time} (${log.timestamp})`);
            });
            
            // Show last few entries (oldest)
            console.log('Last 3 entries (oldest):');
            data.history.slice(-3).forEach((log, index) => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                const date = new Date(log.timestamp).toLocaleDateString();
                console.log(`  ${index + 1}. ${date} ${time} (${log.timestamp})`);
            });
            
            // Verify sorting
            const isSorted = data.history.every((log, index) => {
                if (index === 0) return true;
                return log.timestamp <= data.history[index - 1].timestamp;
            });
            console.log('Array is properly sorted (newest first):', isSorted);
        }
        
        console.log('========================');
    });
    
    // Also refresh when popup opens
    chrome.storage.local.get(['stats'], function(data) {
        updateStats(data.stats || { total: 0, blocked: 0 });
    });

    // Add loading animation for better UX
    function showLoading() {
        toggleBtn.innerHTML = '<span class="loading"></span> Updating...';
        toggleBtn.disabled = true;
    }

    function hideLoading() {
        toggleBtn.disabled = false;
        chrome.storage.local.get(['protectionEnabled'], function(data) {
            updateStatus(data.protectionEnabled !== false);
        });
    }

});