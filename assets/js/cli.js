// Web Serial Terminal Interface
"use strict";

let port;
let reader;
let inputDone;
let outputDone;
let inputStream;
let outputStream;

// DOM elements
const log = document.getElementById("log");
const cmdBox = document.getElementById("cmdBox");
const buttonCon = document.getElementById("buttonCon");
const buttonDis = document.getElementById("buttonDis");
const sendBtn = document.getElementById("sendBtn");
const clearLogBtn = document.getElementById("clearLog");
const exportLogBtn = document.getElementById("exportLog");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const notSupported = document.getElementById("notSupported");
const baudRateSelect = document.getElementById("baudRate");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const settingsOverlay = document.getElementById("settingsOverlay");
const closeSettings = document.getElementById("closeSettings");
const testModeToggle = document.getElementById("testModeToggle");
const lineEndingSelect = document.getElementById("lineEnding");
const showTimestampsToggle = document.getElementById("showTimestamps");
const autoReconnectToggle = document.getElementById("autoReconnect");
const reconnectIntervalInput = document.getElementById("reconnectInterval");
const reconnectIntervalGroup = document.getElementById("reconnectIntervalGroup");
const presetSelect = document.getElementById("presetSelect");
const presetNameInput = document.getElementById("presetNameInput");
const savePresetBtn = document.getElementById("savePreset");
const deletePresetBtn = document.getElementById("deletePreset");
const presetModal = document.getElementById("presetModal");
const presetOverlay = document.getElementById("presetOverlay");
const closePresetModal = document.getElementById("closePresetModal");
const presetSelectModal = document.getElementById("presetSelectModal");
const connectWithPresetBtn = document.getElementById("connectWithPreset");
const cancelPresetBtn = document.getElementById("cancelPreset");

// Test mode variables (hidden in production)
// Enable test mode via URL parameter: ?test=true
// Default: OFF (set to false)
const urlParams = new URLSearchParams(window.location.search);
let isTestMode = urlParams.get('test') === 'true' ? true : false;
let testInterval = null;

// Command history for terminal-like behavior
let commandHistory = [];
let historyIndex = -1;
let currentInputBeforeHistory = '';

// Feature flags and settings
let showTimestamps = false;
let autoReconnect = false;
let reconnectInterval = 5; // seconds
let reconnectTimeout = null;
let lineEnding = 'CRLF'; // CRLF, LF, or CR

// Connection presets storage
let connectionPresets = JSON.parse(localStorage.getItem('cliPresets') || '{}');
let testCommands = {
  "help": "Available commands: help, info, status, echo [text], ping, time, version",
  "info": "Web Serial Terminal Test Mode\nDevice: Virtual Serial Emulator v1.0\nBaud Rate: " + (document.getElementById("baudRate")?.value || "115200"),
  "status": "Status: Connected (Test Mode)\nUptime: Simulating connection\nData integrity: 100%",
  "ping": "PONG! Response time: <1ms (simulated)",
  "time": function() { return "Current time: " + new Date().toLocaleTimeString(); },
  "version": "Serial Terminal Emulator v1.0.0\nBuilt for testing purposes",
  "echo": function(args) { return args ? "Echo: " + args : "Echo: (no arguments)"; }
};

    document.addEventListener("DOMContentLoaded", () => {
      buttonCon.addEventListener("click", clickConnect);
      buttonDis.addEventListener("click", clickDisconnect);
      sendBtn.addEventListener("click", handleSend);
      clearLogBtn.addEventListener("click", clearLog);
      cmdBox.addEventListener("keydown", handleKeyDown);
      cmdBox.addEventListener("input", autoResizeTextarea);

      // Settings modal functionality
      settingsBtn.addEventListener("click", showSettings);
      closeSettings.addEventListener("click", hideSettings);
      settingsOverlay.addEventListener("click", hideSettings);
      
      // Preset modal functionality
      if (closePresetModal) {
        closePresetModal.addEventListener("click", hidePresetModal);
      }
      if (presetOverlay) {
        presetOverlay.addEventListener("click", hidePresetModal);
      }
      if (connectWithPresetBtn) {
        connectWithPresetBtn.addEventListener("click", connectWithPreset);
      }
      if (cancelPresetBtn) {
        cancelPresetBtn.addEventListener("click", hidePresetModal);
      }
      // Allow Enter key to connect with preset
      if (presetSelectModal) {
        presetSelectModal.addEventListener("keydown", (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            connectWithPreset();
          }
        });
      }
      
      // Test mode toggle only available in development (hidden in production)
      // Can also be enabled via URL parameter: ?test=true
      if (testModeToggle) {
        // Sync toggle state with URL parameter or current state
        testModeToggle.checked = isTestMode;
        testModeToggle.addEventListener("change", toggleTestMode);
      }
      // Initialize test mode from URL parameter if present
      toggleTestMode();

      // Load saved settings
      loadSettings();
      
      // Initialize UI elements
      if (showTimestampsToggle) {
        showTimestampsToggle.checked = showTimestamps;
        showTimestampsToggle.addEventListener("change", (e) => {
          showTimestamps = e.target.checked;
          saveSettings();
        });
      }
      
      if (autoReconnectToggle) {
        autoReconnectToggle.checked = autoReconnect;
        autoReconnectToggle.addEventListener("change", (e) => {
          autoReconnect = e.target.checked;
          if (reconnectIntervalGroup) {
            reconnectIntervalGroup.style.display = autoReconnect ? 'flex' : 'none';
          }
          saveSettings();
          if (!autoReconnect) {
            clearReconnectTimeout();
          }
        });
      }
      
      if (reconnectIntervalInput) {
        reconnectIntervalInput.value = reconnectInterval;
        reconnectIntervalInput.addEventListener("change", (e) => {
          reconnectInterval = parseInt(e.target.value) || 5;
          saveSettings();
        });
      }
      
      if (lineEndingSelect) {
        lineEndingSelect.value = lineEnding;
        lineEndingSelect.addEventListener("change", (e) => {
          lineEnding = e.target.value;
          saveSettings();
        });
      }
      
      // Export log functionality
      if (exportLogBtn) {
        exportLogBtn.addEventListener("click", exportLog);
      }
      
      // Connection presets
      if (presetSelect) {
        loadPresets();
        presetSelect.addEventListener("change", loadPreset);
      }
      if (savePresetBtn) {
        savePresetBtn.addEventListener("click", savePreset);
      }
      if (deletePresetBtn) {
        deletePresetBtn.addEventListener("click", deletePreset);
      }
      // Allow Enter key to save preset
      if (presetNameInput) {
        presetNameInput.addEventListener("keydown", (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            savePreset();
          }
        });
      }
      
      // Show/hide reconnect interval based on auto-reconnect toggle
      if (reconnectIntervalGroup && autoReconnectToggle) {
        reconnectIntervalGroup.style.display = autoReconnectToggle.checked ? 'flex' : 'none';
      }

      // Enable send button when there's text in the input
      cmdBox.addEventListener("input", () => {
        sendBtn.disabled = !cmdBox.value.trim();
      });

      // Feature detection
      if ("serial" in navigator) {
        notSupported.classList.add("hidden");
      } else {
        notSupported.classList.remove("hidden");
      }

      setUIDisconnected();
      updateStatus("Disconnected", false);

      // Position terminal header after elements are rendered
      setTimeout(positionTerminalHeader, 100);
    });

function updateStatus(text, connected) {
  statusText.textContent = text;
  statusDot.classList.toggle("connected", connected);
}

function setUIConnected() {
  log.classList.remove("empty");
  buttonCon.disabled = true;
  buttonDis.disabled = false;
  sendBtn.disabled = !cmdBox.value.trim();
  cmdBox.focus();
  updateStatus("Connected", true);
}

function setUIDisconnected() {
  buttonCon.disabled = false;
  buttonDis.disabled = true;
  sendBtn.disabled = true;
  cmdBox.value = "";
  updateStatus("Disconnected", false);
}

    function sendCommand() {
      const command = cmdBox.value.trim();
      if (command && port) {
        // Add command to history (avoid duplicates if same as last command)
        if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== command) {
          commandHistory.push(command);
          // Limit history to last 100 commands
          if (commandHistory.length > 100) {
            commandHistory.shift();
          }
        }
        // Reset history index
        historyIndex = -1;
        currentInputBeforeHistory = '';
        
        // Display sent message in chat format
        writeSentMessage(command);
        
        if (isTestMode && port === "test") {
          // Handle test mode commands
          handleTestCommand(command);
        } else {
          // Real serial communication
          writeToStream(command);
        }
        cmdBox.value = "";
        cmdBox.style.height = 'auto'; // Reset height
        sendBtn.disabled = true;
      }
    }

    function clearLog() {
      log.innerHTML = "";
      log.classList.add("empty");
    }

    // Scroll to bottom with multiple attempts for reliability
    function scrollToBottom() {
      if (!log) return;
      const terminalContent = log.closest('.terminal-content');
      if (terminalContent) {
        // Scroll the terminal-content container to bottom
        terminalContent.scrollTop = terminalContent.scrollHeight;
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        navigateHistory('up');
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        navigateHistory('down');
      }
    }

    // Navigate through command history
    function navigateHistory(direction) {
      if (commandHistory.length === 0) return;
      
      // Save current input if we're starting to navigate history
      if (historyIndex === -1 && cmdBox.value.trim() !== '') {
        currentInputBeforeHistory = cmdBox.value;
      }
      
      if (direction === 'up') {
        // Move up in history
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          cmdBox.value = commandHistory[commandHistory.length - 1 - historyIndex];
          sendBtn.disabled = !cmdBox.value.trim();
        }
      } else if (direction === 'down') {
        // Move down in history
        if (historyIndex > 0) {
          historyIndex--;
          cmdBox.value = commandHistory[commandHistory.length - 1 - historyIndex];
          sendBtn.disabled = !cmdBox.value.trim();
        } else if (historyIndex === 0) {
          // Reached the bottom, restore original input
          historyIndex = -1;
          cmdBox.value = currentInputBeforeHistory;
          sendBtn.disabled = !cmdBox.value.trim();
          currentInputBeforeHistory = '';
        }
      }
      
      // Auto-resize after changing value
      autoResizeTextarea();
    }

    // Auto-resize textarea
    function autoResizeTextarea() {
      if (!cmdBox) return;
      cmdBox.style.height = 'auto';
      cmdBox.style.height = Math.min(cmdBox.scrollHeight, 120) + 'px';
    }

    async function handleSend() {
      const message = cmdBox.value.trim();
      if (!message || port) {
        // Only send if we have a message and a serial connection
        sendCommand();
      }
    }

/**
 * @name connect
 * Opens a Web Serial connection or simulates connection in test mode.
 */
async function connect() {
  if (isTestMode) {
    // Test mode connection
    updateStatus("Connecting (Test Mode)...", false);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set up test mode
    port = "test"; // Mock port
    setUIConnected();

    // Start test data simulation
    startTestSimulation();

    updateStatus("Connected (Test Mode)", true);
    return;
  }

  // Real Web Serial connection
  try {
    updateStatus("Connecting...", false);
    port = await navigator.serial.requestPort();
  } catch (err) {
    console.log("No port selected...");
    // Show user-friendly message when port selection is cancelled
    updateStatus("Connection cancelled", false);
    return;
  }

  // Get serial options from UI
  const baudRate = parseInt(baudRateSelect.value);
  const dataBits = parseInt(document.getElementById("dataBits").value);
  const parity = document.getElementById("parity").value;
  const stopBits = parseInt(document.getElementById("stopBits").value);

  // Wait for the port to open.
  try {
    await port.open({
      baudRate: baudRate,
      dataBits: dataBits,
      parity: parity,
      stopBits: stopBits
    });
  } catch (err) {
    console.error("Failed to open port:", err);
    // Show the actual error message to the user
    const errorMessage = err.message || err.toString();
    updateStatus("Failed to connect: " + errorMessage, false);

    // Also log the error to the terminal for better visibility
    writeReceivedMessage("Connection failed: " + errorMessage);

    port = null;
    
    // Schedule auto-reconnect if enabled
    if (autoReconnect) {
      scheduleReconnect();
    }
    
    return;
  }

  // Update UI
  setUIConnected();
  
  // Clear any pending reconnect timeout since we're connected
  clearReconnectTimeout();

  // Setup the output stream.
  const encoder = new TextEncoderStream();
  outputDone = encoder.readable.pipeTo(port.writable);
  outputStream = encoder.writable;

  // Setup the input stream.
  let decoder = new TextDecoderStream();
  inputDone = port.readable.pipeTo(decoder.writable);
  inputStream = decoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer()));

  reader = inputStream.getReader();
  readLoop();
}

/**
 * @name disconnect
 * Closes the Web Serial connection or test mode.
 */
async function disconnect() {
  if (isTestMode && port === "test") {
    // Test mode disconnect
    updateStatus("Disconnecting (Test Mode)...", false);

    // Stop test simulation
    stopTestSimulation();

    port = null;
    setUIDisconnected();
    updateStatus("Disconnected", false);
    return;
  }

  // Real Web Serial disconnect
  updateStatus("Disconnecting...", false);

  // Close the input stream (reader).
  if (reader) {
    await reader.cancel();
    await inputDone.catch(() => {});
    reader = null;
    inputDone = null;
  }

  // Close the output stream.
  if (outputStream) {
    await outputStream.getWriter().close();
    await outputDone;
    outputStream = null;
    outputDone = null;
  }

  // Close the port.
  if (port) {
    try {
      await port.close();
    } catch (err) {
      console.error("Error closing port:", err);
    }
    port = null;
  }

  setUIDisconnected();
  
  // Clear any auto-reconnect timeout
  clearReconnectTimeout();
  
  // Schedule auto-reconnect if enabled
  if (autoReconnect) {
    scheduleReconnect();
  }
}

/**
 * @name clickConnect
 * Click handler for the connect button.
 */
async function clickConnect() {
  if (port) {
    await disconnect();
    return;
  }
  
  // Show preset selection dialog
  showPresetModal();
}

/**
 * Show preset selection modal
 */
function showPresetModal() {
  if (!presetModal) {
    // If modal doesn't exist, connect directly
    connect();
    return;
  }
  
  // Load presets into modal dropdown
  if (presetSelectModal) {
    presetSelectModal.innerHTML = '<option value="">-- No Preset (Use Current Settings) --</option>';
    Object.keys(connectionPresets).forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      presetSelectModal.appendChild(option);
    });
  }
  
  presetModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

/**
 * Hide preset selection modal
 */
function hidePresetModal() {
  if (presetModal) {
    presetModal.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

/**
 * Connect with selected preset
 */
async function connectWithPreset() {
  const presetName = presetSelectModal?.value;
  
  if (presetName && connectionPresets[presetName]) {
    // Load preset settings
    const preset = connectionPresets[presetName];
    if (baudRateSelect) baudRateSelect.value = preset.baudRate || '115200';
    const dataBits = document.getElementById("dataBits");
    if (dataBits) dataBits.value = preset.dataBits || '8';
    const parity = document.getElementById("parity");
    if (parity) parity.value = preset.parity || 'none';
    const stopBits = document.getElementById("stopBits");
    if (stopBits) stopBits.value = preset.stopBits || '1';
    if (lineEndingSelect) lineEndingSelect.value = preset.lineEnding || 'CRLF';
    lineEnding = preset.lineEnding || 'CRLF';
  }
  
  // Hide modal and connect
  hidePresetModal();
  await connect();
}

/**
 * @name clickDisconnect
 * Click handler for the disconnect button.
 */
async function clickDisconnect() {
  if (port) {
    await disconnect();
  }
}

/**
 * @name readLoop
 * Reads data from the input stream and displays it on screen.
 */
    async function readLoop() {
      while (true) {
        const { value, done } = await reader.read();
        if (value) {
          // Remove empty state styling when first data arrives
          log.classList.remove("empty");
          // Display received message in chat format (this already handles scrolling)
          writeReceivedMessage(value);
        }
        if (done) {
          console.log("[readLoop] DONE", done);
          reader.releaseLock();
          
          // If auto-reconnect is enabled and we're disconnected, try to reconnect
          if (autoReconnect && !port) {
            scheduleReconnect();
          }
          
          break;
        }
      }
    }

/**
 * @name writeToStream
 * Gets a writer from the output stream and send the lines.
 * @param  {...string} lines lines to send
 */
    function writeToStream(...lines) {
      const writer = outputStream.getWriter();
      // Get line ending based on setting
      let ending = "\r\n"; // Default CRLF
      if (lineEnding === "LF") ending = "\n";
      else if (lineEnding === "CR") ending = "\r";
      
      lines.forEach((line) => {
        console.log("[SEND]", line);

        // Scroll to bottom with multiple attempts for reliability
        scrollToBottom();
        requestAnimationFrame(() => {
          scrollToBottom();
        });
        setTimeout(() => {
          scrollToBottom();
        }, 50);

        writer.write(line + ending);
      });
      writer.releaseLock();
    }

/**
 * @name LineBreakTransformer
 * TransformStream to parse the stream into lines.
 */
class LineBreakTransformer {
  constructor() {
    // A container for holding stream data until a new line.
    this.container = "";
  }

  transform(chunk, controller) {
    // Handle incoming chunk
    this.container += chunk;
    const lines = this.container.split("\r\n");
    this.container = lines.pop();
    lines.forEach((line) => controller.enqueue(line));
  }

  flush(controller) {
    // Flush the stream.
    controller.enqueue(this.container);
  }
}

// Settings modal functions
function showSettings() {
  settingsModal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Prevent background scrolling
}

function hideSettings() {
  settingsModal.classList.add("hidden");
  document.body.style.overflow = ""; // Restore scrolling
}

// Settings management
function saveSettings() {
  const settings = {
    showTimestamps: showTimestamps,
    autoReconnect: autoReconnect,
    reconnectInterval: reconnectInterval,
    lineEnding: lineEnding
  };
  localStorage.setItem('cliSettings', JSON.stringify(settings));
}

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem('cliSettings') || '{}');
  showTimestamps = saved.showTimestamps || false;
  autoReconnect = saved.autoReconnect || false;
  reconnectInterval = saved.reconnectInterval || 5;
  lineEnding = saved.lineEnding || 'CRLF';
  
  // Update UI
  if (showTimestampsToggle) showTimestampsToggle.checked = showTimestamps;
  if (autoReconnectToggle) autoReconnectToggle.checked = autoReconnect;
  if (reconnectIntervalInput) reconnectIntervalInput.value = reconnectInterval;
  if (lineEndingSelect) lineEndingSelect.value = lineEnding;
}

// Connection presets
function loadPresets() {
  if (!presetSelect) return;
  
  presetSelect.innerHTML = '<option value="">-- Select Preset --</option>';
  Object.keys(connectionPresets).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    presetSelect.appendChild(option);
  });
}

function loadPreset() {
  const presetName = presetSelect.value;
  if (!presetName || !connectionPresets[presetName]) {
    if (presetNameInput) presetNameInput.value = '';
    return;
  }
  
  const preset = connectionPresets[presetName];
  if (baudRateSelect) baudRateSelect.value = preset.baudRate || '115200';
  const dataBits = document.getElementById("dataBits");
  if (dataBits) dataBits.value = preset.dataBits || '8';
  const parity = document.getElementById("parity");
  if (parity) parity.value = preset.parity || 'none';
  const stopBits = document.getElementById("stopBits");
  if (stopBits) stopBits.value = preset.stopBits || '1';
  if (lineEndingSelect) lineEndingSelect.value = preset.lineEnding || 'CRLF';
  lineEnding = preset.lineEnding || 'CRLF';
  
  // Update preset name input with selected preset name
  if (presetNameInput) presetNameInput.value = presetName;
}

function savePreset() {
  const name = presetNameInput?.value.trim();
  if (!name) {
    alert('Please enter a preset name');
    return;
  }
  
  connectionPresets[name] = {
    baudRate: baudRateSelect?.value || '115200',
    dataBits: document.getElementById("dataBits")?.value || '8',
    parity: document.getElementById("parity")?.value || 'none',
    stopBits: document.getElementById("stopBits")?.value || '1',
    lineEnding: lineEndingSelect?.value || 'CRLF'
  };
  
  localStorage.setItem('cliPresets', JSON.stringify(connectionPresets));
  loadPresets();
  presetSelect.value = name;
  presetNameInput.value = ''; // Clear input after saving
}

function deletePreset() {
  const presetName = presetSelect.value;
  if (!presetName || !confirm(`Delete preset "${presetName}"?`)) return;
  
  delete connectionPresets[presetName];
  localStorage.setItem('cliPresets', JSON.stringify(connectionPresets));
  loadPresets();
  if (presetNameInput) presetNameInput.value = ''; // Clear input after deletion
}

// Export log functionality
function exportLog() {
  if (!log) return;
  
  // Get all text content from log
  const messages = log.querySelectorAll('.message-content');
  let logText = '';
  
  messages.forEach(msg => {
    logText += msg.textContent + '\n';
  });
  
  if (!logText.trim()) {
    alert('Log is empty');
    return;
  }
  
  // Create download link
  const blob = new Blob([logText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cli-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Also copy to clipboard
  navigator.clipboard.writeText(logText).then(() => {
    // Visual feedback
    const originalText = exportLogBtn.textContent;
    exportLogBtn.textContent = 'Copied!';
    setTimeout(() => {
      exportLogBtn.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy to clipboard:', err);
  });
}

function toggleTestMode() {
  // Test mode toggle only available in development (hidden in production)
  // Can also be enabled via URL parameter: ?test=true
  // Default: OFF
  if (!testModeToggle) {
    // If no toggle exists, check URL parameter (defaults to false)
    const urlParams = new URLSearchParams(window.location.search);
    isTestMode = urlParams.get('test') === 'true' ? true : false;
  } else {
    isTestMode = testModeToggle.checked;
  }
  
  if (isTestMode) {
    // Hide the browser support warning in test mode
    notSupported.classList.add("hidden");
  } else {
    // Show warning if browser doesn't support Web Serial
    if (!("serial" in navigator)) {
      notSupported.classList.remove("hidden");
    }
  }
}

// Position terminal header below ASCII banner
function positionTerminalHeader() {
  const terminalHeader = document.querySelector('.terminal-header');
  const terminalContent = document.querySelector('.terminal-content');

  if (terminalHeader && terminalContent) {
    const headerHeight = terminalHeader.offsetHeight;
    terminalHeader.style.top = '0px';
    // Padding is now handled in CSS, but we can ensure it's correct
    terminalContent.style.paddingTop = headerHeight + 16 + 'px';
  }
}

// Test mode functions
function startTestSimulation() {
  // Simulate periodic data reception
  testInterval = setInterval(() => {
    if (port === "test" && Math.random() < 0.1) { // 10% chance every 2 seconds
      const testData = [
        "System heartbeat",
        "Memory usage: " + Math.floor(Math.random() * 100) + "%",
        "Sensor reading: " + (Math.random() * 5).toFixed(2) + "V",
        "Timestamp: " + new Date().toLocaleTimeString()
      ];
      const randomData = testData[Math.floor(Math.random() * testData.length)];
      writeToLog(randomData);
    }
  }, 2000);
}

function stopTestSimulation() {
  if (testInterval) {
    clearInterval(testInterval);
    testInterval = null;
  }
}

function handleTestCommand(command) {
  setTimeout(() => {
    const cmd = command.toLowerCase().trim();
    let response = "";

    if (cmd.startsWith("echo ")) {
      const args = command.substring(5);
      response = testCommands.echo(args);
    } else if (testCommands[cmd]) {
      response = typeof testCommands[cmd] === 'function' ? testCommands[cmd]() : testCommands[cmd];
    } else {
      // Echo back unknown commands with a response
      response = "Unknown command: '" + command + "'. Type 'help' for available commands.";
    }

    writeReceivedMessage(response);
  }, 100 + Math.random() * 300); // Simulate response delay
}

function writeToLog(text) {
  // Legacy function - now uses received message format for backward compatibility
  writeReceivedMessage(text);
}

// Write sent message with chat-style formatting
function writeSentMessage(message) {
  if (log.classList.contains("empty")) {
    log.innerHTML = "";
    log.classList.remove("empty");
  }
  // Use HTML to style sent messages differently - compact chat style
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message sent-message';
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = message;
  messageDiv.appendChild(contentDiv);
  log.appendChild(messageDiv);
  
  // Auto-scroll to bottom with multiple attempts
  scrollToBottom();
  requestAnimationFrame(() => {
    scrollToBottom();
  });
  setTimeout(() => {
    scrollToBottom();
  }, 50);
}

// Write received message with chat-style formatting
function writeReceivedMessage(message) {
  if (log.classList.contains("empty")) {
    log.innerHTML = "";
    log.classList.remove("empty");
  }
  // Use HTML to style received messages differently - compact chat style
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message received-message';
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // Add timestamp if enabled
  let displayText = message;
  if (showTimestamps) {
    const timestamp = new Date().toLocaleTimeString();
    displayText = `[${timestamp}] ${message}`;
  }
  
  contentDiv.textContent = displayText;
  messageDiv.appendChild(contentDiv);
  log.appendChild(messageDiv);
  
  // Always auto-scroll to bottom for received messages with multiple attempts
  scrollToBottom();
  requestAnimationFrame(() => {
    scrollToBottom();
  });
  setTimeout(() => {
    scrollToBottom();
  }, 50);
  setTimeout(() => {
    scrollToBottom();
  }, 100);
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
