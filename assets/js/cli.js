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

// Test mode variables
let isTestMode = false;
let testInterval = null;
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
      testModeToggle.addEventListener("change", toggleTestMode);

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
      log.textContent = "";
      log.classList.add("empty");
    }

    // Scroll to bottom with multiple attempts for reliability
    function scrollToBottom() {
      if (!log) return;
      log.scrollTop = log.scrollHeight;
    }

    function handleKeyDown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
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
    updateStatus("Disconnected", false);
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
    updateStatus("Failed to connect", false);
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
          log.textContent += `${value}\n`;

          // Scroll to bottom with multiple attempts for reliability
          scrollToBottom();
          requestAnimationFrame(() => {
            scrollToBottom();
          });
          setTimeout(() => {
            scrollToBottom();
          }, 50);
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
  isTestMode = testModeToggle.checked;
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

  if (terminalHeader) {
    terminalHeader.style.top = '0px';
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

    writeToLog(response);
  }, 100 + Math.random() * 300); // Simulate response delay
}

function writeToLog(text) {
  if (log.classList.contains("empty")) {
    log.textContent = "";
    log.classList.remove("empty");
  }
  log.textContent += text + "\n";
  scrollToBottom();
}
