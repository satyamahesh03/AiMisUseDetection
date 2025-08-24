document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleProtection');
    const statusIndicator = document.getElementById('statusIndicator');
    const viewLogsBtn = document.getElementById('viewLogs');
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
                chrome.storage.local.get(['history'], function(data) {
                    if (chrome.runtime.lastError) {
                        console.error('Storage error on view logs:', chrome.runtime.lastError);
                        displayLogs([]);
                        logsContainer.classList.add('show');
                        viewLogsBtn.textContent = 'Hide Logs';
                        return;
                    }
                    const history = data.history || [];
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

    function updateStatus(enabled) {
        if (enabled) {
            toggleBtn.classList.remove('disabled');
            toggleBtn.textContent = 'Disable Protection';
            statusIndicator.className = 'status-indicator active';
            statusIndicator.textContent = '🔒 Active';
        } else {
            toggleBtn.classList.add('disabled');
            toggleBtn.textContent = 'Enable Protection';
            statusIndicator.className = 'status-indicator inactive';
            statusIndicator.textContent = '⚠️ Disabled';
        }
    }

    function updateStats(stats) {
        totalScansEl.textContent = stats.total || 0;
        blockedCountEl.textContent = stats.blocked || 0;
        
        // Calculate success rate
        const successRate = stats.total > 0 ? ((stats.total - stats.blocked) / stats.total * 100).toFixed(1) : 100;
        successRateEl.textContent = successRate + '%';
        
        // Add animation to stats
        animateNumber(totalScansEl, stats.total || 0);
        animateNumber(blockedCountEl, stats.blocked || 0);
    }

    function animateNumber(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        if (currentValue !== targetValue) {
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }

    function displayLogs(history) {
        logsContainer.innerHTML = '';
        const recentLogs = history.slice(-10).reverse(); // Show last 10
        
        if (recentLogs.length === 0) {
            logsContainer.innerHTML = `
                <div class="log-item">
                    <div class="log-text">No activity recorded yet</div>
                    <div class="log-meta">
                        <span>Start using the extension to see activity</span>
                    </div>
                </div>
            `;
            return;
        }
        
        recentLogs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = `log-item ${log.result}`;
            
            const time = new Date(log.timestamp).toLocaleTimeString();
            const date = new Date(log.timestamp).toLocaleDateString();
            const text = log.text && log.text.length > 50 ? log.text.substring(0, 50) + '...' : (log.text || 'No text');
            
            let confidenceInfo = '';
            if (log.confidence) {
                const confidence = Math.round(log.confidence * 100);
                confidenceInfo = ` • ${confidence}% confidence`;
            }
            
            logItem.innerHTML = `
                <div class="log-text">${text}</div>
                <div class="log-meta">
                    <span>${date} at ${time}${confidenceInfo}</span>
                    <span class="log-status ${log.result}">${log.result === 'malicious' ? 'Blocked' : 'Safe'}</span>
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