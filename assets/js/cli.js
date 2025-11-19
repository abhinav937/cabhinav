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

document.addEventListener("DOMContentLoaded", () => {
  buttonCon.addEventListener("click", clickConnect);
  buttonDis.addEventListener("click", clickDisconnect);
  sendBtn.addEventListener("click", () => sendCommand());
  clearLogBtn.addEventListener("click", clearLog);
  cmdBox.addEventListener("keyup", processCommand);

  // Enable send button when there's text in the input
  cmdBox.addEventListener("input", () => {
    sendBtn.disabled = !cmdBox.value.trim();
  });

  // Feature detection
  if ("serial" in navigator) {
    notSupported.classList.add("hidden");
  }

  setUIDisconnected();
  updateStatus("Disconnected", false);
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
    writeToStream(command);
    cmdBox.value = "";
    sendBtn.disabled = true;
  }
}

function clearLog() {
  log.textContent = "";
  log.classList.add("empty");
}

async function processCommand(event) {
  if (event.key == "Enter") {
    sendCommand();
  }
}

/**
 * @name connect
 * Opens a Web Serial connection and sets up the input and output stream.
 */
async function connect() {
  // Request a port and open a connection.
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
 * Closes the Web Serial connection.
 */
async function disconnect() {
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
      // Add timestamp for received data
      const timestamp = new Date().toLocaleTimeString();
      log.textContent += `[${timestamp}] ${value}\n`;
      // Auto-scroll to bottom
      log.scrollTop = log.scrollHeight;
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
    // Display sent command in log with timestamp
    const timestamp = new Date().toLocaleTimeString();
    log.classList.remove("empty");
    log.textContent += `[${timestamp}] > ${line}\n`;
    log.scrollTop = log.scrollHeight;
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
