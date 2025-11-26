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
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const notSupported = document.getElementById("notSupported");
const baudRateSelect = document.getElementById("baudRate");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const settingsOverlay = document.getElementById("settingsOverlay");
const closeSettings = document.getElementById("closeSettings");
const testModeToggle = document.getElementById("testModeToggle");
const timestampToggle = document.getElementById("timestampToggle");

// Test mode variables
// Enable test mode via URL parameter: ?test=true
// Default: OFF (set to false)
const urlParams = new URLSearchParams(window.location.search);
let isTestMode = urlParams.get('test') === 'true' ? true : false;
let testInterval = null;
let connectionStartTime = null;

// Simulated device state
let deviceState = {
  uptime: 0,
  ledState: false,
  gpioPins: {}
};

// Command history for terminal-like behavior
let commandHistory = [];
let historyIndex = -1;
let currentInputBeforeHistory = '';

// Timestamp display settings
let showTimestamps = localStorage.getItem('cliShowTimestamps') === 'true' || false;

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
      // Test mode toggle
      // Can also be enabled via URL parameter: ?test=true
      if (testModeToggle) {
        // Sync toggle state with URL parameter or current state
        testModeToggle.checked = isTestMode;
        testModeToggle.addEventListener("change", toggleTestMode);
      }
      // Initialize test mode from URL parameter if present
      toggleTestMode();

      // Timestamp toggle
      if (timestampToggle) {
        timestampToggle.checked = showTimestamps;
        timestampToggle.addEventListener("change", toggleTimestamps);
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
          // Limit history to last 10 commands
          if (commandHistory.length > 10) {
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

    // Navigate through command history (last 10 commands)
    function navigateHistory(direction) {
      if (commandHistory.length === 0) return;
      
      // Save current input if we're starting to navigate history
      if (historyIndex === -1 && cmdBox.value.trim() !== '') {
        currentInputBeforeHistory = cmdBox.value;
      }
      
      if (direction === 'up') {
        // Move up in history (older commands)
        // historyIndex: -1 = current/new input, 0 = most recent, 9 = oldest
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          // Get command from history (most recent is at the end)
          cmdBox.value = commandHistory[commandHistory.length - 1 - historyIndex];
          sendBtn.disabled = !cmdBox.value.trim();
        }
      } else if (direction === 'down') {
        // Move down in history (newer commands)
        if (historyIndex > 0) {
          historyIndex--;
          cmdBox.value = commandHistory[commandHistory.length - 1 - historyIndex];
          sendBtn.disabled = !cmdBox.value.trim();
        } else if (historyIndex === 0) {
          // Reached the bottom (most recent), go back to new input
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
    await new Promise(resolve => setTimeout(resolve, 500));
    writeReceivedMessage("Connecting to virtual device...");
    
    await new Promise(resolve => setTimeout(resolve, 500));
    writeReceivedMessage(`Baud rate: ${document.getElementById("baudRate")?.value || "115200"}`);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    writeReceivedMessage("Connection established!");
    writeReceivedMessage("Device ready. Type 'help' for available commands.");

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
    return;
  }

  // Update UI
  setUIConnected();

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
    await port.close();
    port = null;
  }

  setUIDisconnected();
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

        writer.write(line + "\n");
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

function toggleTestMode() {
  // Test mode toggle
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

function toggleTimestamps() {
  if (timestampToggle) {
    showTimestamps = timestampToggle.checked;
    // Save preference to localStorage
    localStorage.setItem('cliShowTimestamps', showTimestamps);
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
  connectionStartTime = Date.now();
  deviceState.uptime = 0;
  
  // Update uptime counter
  const uptimeInterval = setInterval(() => {
    if (port === "test") {
      deviceState.uptime = Math.floor((Date.now() - connectionStartTime) / 1000);
    } else {
      clearInterval(uptimeInterval);
    }
  }, 1000);
}

function stopTestSimulation() {
  if (testInterval) {
    clearInterval(testInterval);
    testInterval = null;
  }
  connectionStartTime = null;
  deviceState.uptime = 0;
}

function handleTestCommand(command) {
  setTimeout(() => {
    const cmd = command.toLowerCase().trim();
    let response = "";

    // Parse command and arguments
    const parts = cmd.split(/\s+/);
    const commandName = parts[0];
    const args = parts.slice(1).join(' ');

    switch(commandName) {
      case "help":
        response = `Available commands:\nBasic: help, info, status, ping, time, date, version, echo, uptime, abhinav\nHardware: led, sensors, read, gpio`;
        break;
      
      case "info":
        response = `Web Serial Terminal Test Mode\nDevice: Virtual Serial Emulator v2.0\nBaud Rate: ${document.getElementById("baudRate")?.value || "115200"}\nTest Mode: Enabled`;
        break;
      
      case "status":
        const uptime = deviceState.uptime;
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        response = `Status: Connected (Test Mode)\nUptime: ${hours}h ${minutes}m ${seconds}s\nSystem: Operational`;
        break;
      
      case "ping":
        const pingTime = (Math.random() * 5 + 1).toFixed(2);
        response = `PONG! Response time: ${pingTime}ms (simulated)`;
        break;
      
      case "time":
        response = `Current time: ${new Date().toLocaleString()}\nUTC: ${new Date().toUTCString()}\nTimestamp: ${Date.now()}`;
        break;
      
      case "date":
        const now = new Date();
        response = `Date: ${now.toDateString()}\nTime: ${now.toTimeString()}\nISO: ${now.toISOString()}`;
        break;
      
      case "version":
        response = `Serial Terminal Emulator v2.0.0\nTest Mode Enabled\nBuilt for testing purposes`;
        break;
      
      case "echo":
        response = args ? args : "(no arguments provided)";
        break;
      
      case "led":
        if (args === "on" || args === "1") {
          deviceState.ledState = true;
          response = "LED: ON";
        } else if (args === "off" || args === "0") {
          deviceState.ledState = false;
          response = "LED: OFF";
        } else if (args === "toggle") {
          deviceState.ledState = !deviceState.ledState;
          response = `LED: ${deviceState.ledState ? "ON" : "OFF"}`;
        } else {
          response = `LED Status: ${deviceState.ledState ? "ON" : "OFF"}\nUsage: led [on|off|toggle]`;
        }
        break;
      
      case "sensors":
        response = `Sensor Readings:\nTemperature: ${(Math.random() * 30 + 20).toFixed(2)}°C\nHumidity: ${(Math.random() * 40 + 40).toFixed(1)}%\nPressure: ${(Math.random() * 100 + 980).toFixed(1)} hPa\nLight: ${Math.floor(Math.random() * 1000)} lux\nMotion: ${Math.random() > 0.7 ? "Detected" : "None"}`;
        break;
      
      case "read":
        if (!args) {
          response = "Usage: read <sensor_name>\nAvailable: temperature, humidity, pressure, light, motion";
        } else {
          const sensorName = args.toLowerCase();
          switch(sensorName) {
            case "temperature":
              response = `Temperature: ${(Math.random() * 30 + 20).toFixed(2)}°C`;
              break;
            case "humidity":
              response = `Humidity: ${(Math.random() * 40 + 40).toFixed(1)}%`;
              break;
            case "pressure":
              response = `Pressure: ${(Math.random() * 100 + 980).toFixed(1)} hPa`;
              break;
            case "light":
              response = `Light Level: ${Math.floor(Math.random() * 1000)} lux`;
              break;
            case "motion":
              response = `Motion: ${Math.random() > 0.7 ? "Detected" : "None"}`;
              break;
            default:
              response = `ERROR: Unknown sensor '${args}'\nAvailable: temperature, humidity, pressure, light, motion`;
          }
        }
        break;
      
      case "gpio":
        if (args) {
          const pinParts = args.split(/\s+/);
          const pin = parseInt(pinParts[0]);
          if (!isNaN(pin) && pin >= 0 && pin <= 40) {
            if (pinParts.length > 1) {
              const value = pinParts[1].toUpperCase();
              if (value === "HIGH" || value === "1") {
                deviceState.gpioPins[pin] = "HIGH";
                response = `GPIO Pin ${pin}: Set to HIGH`;
              } else if (value === "LOW" || value === "0") {
                deviceState.gpioPins[pin] = "LOW";
                response = `GPIO Pin ${pin}: Set to LOW`;
              } else {
                response = `ERROR: Invalid value. Use HIGH/LOW or 1/0`;
              }
            } else {
              const value = deviceState.gpioPins[pin] || (Math.random() > 0.5 ? "HIGH" : "LOW");
              response = `GPIO Pin ${pin}: ${value}`;
            }
          } else {
            response = `ERROR: Invalid pin number. Use 0-40.`;
          }
        } else {
          response = "Usage: gpio <pin> [value]\nExample: gpio 13 HIGH";
        }
        break;
      
      case "abhinav":
        response = `Good ${getTimeOfDayGreeting()}, sir.\n\nSystem Status: All systems operational\nTerminal Interface: Active\nConnection: Stable\n\nHow may I assist you today?`;
        break;
      
      case "reset":
        deviceState.uptime = 0;
        deviceState.ledState = false;
        deviceState.gpioPins = {};
        response = "Device reset complete. All state cleared.";
        break;
      
      default:
        response = `ERROR: Unknown command '${command}'\nType 'help' for available commands.`;
    }

    if (response && commandName !== "clear") {
      writeReceivedMessage(response);
    }
  }, 100 + Math.random() * 200); // Simulate response delay
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
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
  if (showTimestamps) {
    const timestamp = new Date();
    const hours = String(timestamp.getHours()).padStart(2, '0');
    const minutes = String(timestamp.getMinutes()).padStart(2, '0');
    const seconds = String(timestamp.getSeconds()).padStart(2, '0');
    const milliseconds = String(timestamp.getMilliseconds()).padStart(3, '0');
    const timeStr = `${hours}:${minutes}:${seconds}.${milliseconds}`;
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'message-timestamp';
    timestampSpan.textContent = `[${timeStr}] `;
    contentDiv.appendChild(timestampSpan);
  }
  
  const messageText = document.createTextNode(message);
  contentDiv.appendChild(messageText);
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
