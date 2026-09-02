/**
 * Debug Helper - Load this before guest.js to see what's happening
 */

(function() {
    'use strict';

    // Intercept console methods to show on screen
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    let debugDiv = null;

    function createDebugPanel() {
        if (debugDiv) return;

        debugDiv = document.createElement('div');
        debugDiv.id = 'debug-panel';
        debugDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 400px;
            max-height: 300px;
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            font-family: monospace;
            font-size: 11px;
            padding: 10px;
            border-radius: 5px;
            overflow-y: auto;
            z-index: 99999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;

        const header = document.createElement('div');
        header.style.cssText = 'margin-bottom: 5px; color: #fff; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 5px;';
        header.innerHTML = '🔍 Debug Console <button onclick="document.getElementById(\'debug-panel\').remove()" style="float: right; background: #f00; color: #fff; border: none; padding: 2px 8px; cursor: pointer; border-radius: 3px;">Close</button><button onclick="document.querySelector(\'#debug-logs\').innerHTML=\'\'" style="float: right; background: #555; color: #fff; border: none; padding: 2px 8px; cursor: pointer; border-radius: 3px; margin-right: 5px;">Clear</button>';
        
        const logs = document.createElement('div');
        logs.id = 'debug-logs';
        
        debugDiv.appendChild(header);
        debugDiv.appendChild(logs);
        document.body.appendChild(debugDiv);
    }

    function addLog(message, type = 'log') {
        if (!debugDiv) createDebugPanel();
        
        const logs = document.getElementById('debug-logs');
        const entry = document.createElement('div');
        entry.style.margin = '2px 0';
        entry.style.padding = '2px 0';
        
        const color = {
            log: '#0f0',
            error: '#f00',
            warn: '#ff0',
            info: '#0ff'
        }[type] || '#0f0';
        
        entry.style.color = color;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logs.appendChild(entry);
        logs.scrollTop = logs.scrollHeight;
    }

    // Override console methods
    console.log = function(...args) {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
        if (msg.includes('[API Adapter]') || msg.includes('comment') || msg.includes('Supabase')) {
            addLog(msg, 'log');
        }
        originalLog.apply(console, args);
    };

    console.error = function(...args) {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
        addLog('❌ ' + msg, 'error');
        originalError.apply(console, args);
    };

    console.warn = function(...args) {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
        addLog('⚠️ ' + msg, 'warn');
        originalWarn.apply(console, args);
    };

    // Create panel on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createDebugPanel);
    } else {
        createDebugPanel();
    }

    addLog('✅ Debug Helper loaded', 'info');

})();
