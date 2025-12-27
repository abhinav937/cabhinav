import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from './Layout';

interface Message {
  id: number;
  text: string;
  type: 'sent' | 'received';
  timestamp?: string;
}

interface DeviceState {
  uptime: number;
  ledState: boolean;
  gpioPins: { [key: number]: string };
}

const CLI: React.FC = () => {
  const [port, setPort] = useState<SerialPort | "test" | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [baudRate, setBaudRate] = useState('115200');
  const [dataBits, setDataBits] = useState('8');
  const [parity, setParity] = useState('none');
  const [stopBits, setStopBits] = useState('1');
  const [availablePorts, setAvailablePorts] = useState<SerialPort[]>([]);
  const [useDeviceFiltering, setUseDeviceFiltering] = useState(false);
  const [dtrSignal, setDtrSignal] = useState(false);
  const [rtsSignal, setRtsSignal] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const welcomeShownRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const connectBtnRef = useRef<HTMLButtonElement>(null);
  const disconnectBtnRef = useRef<HTMLButtonElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);

  // Web Serial API variables
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const inputDoneRef = useRef<Promise<void> | null>(null);
  const outputDoneRef = useRef<Promise<void> | null>(null);
  const inputStreamRef = useRef<ReadableStream | null>(null);
  const outputStreamRef = useRef<WritableStream | null>(null);

  // Test mode variables
  const connectionStartTimeRef = useRef<number | null>(null);
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [deviceState, setDeviceState] = useState<DeviceState>({
    uptime: 0,
    ledState: false,
    gpioPins: {}
  });

  // Command history
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentInputBeforeHistory, setCurrentInputBeforeHistory] = useState('');

  // Initialize component
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initializeCLI();

      // Check URL parameters for test mode
      const urlParams = new URLSearchParams(window.location.search);
      const testParam = urlParams.get('test');
      if (testParam === 'true') {
        setIsTestMode(true);
      }
    }

    // Listen for connect/disconnect events
    const handleConnect = (event: any) => {
      const port = event.target || event.port;
      writeReceivedMessage(`Serial device connected: ${port.getInfo ? JSON.stringify(port.getInfo()) : 'Unknown device'}`);
      updateAvailablePorts();
    };

    const handleDisconnect = (event: any) => {
      const port = event.target || event.port;
      writeReceivedMessage(`Serial device disconnected: ${port.getInfo ? JSON.stringify(port.getInfo()) : 'Unknown device'}`);
      updateAvailablePorts();
    };

    if ('serial' in navigator) {
      navigator.serial.addEventListener('connect', handleConnect);
      navigator.serial.addEventListener('disconnect', handleDisconnect);
    }

    return () => {
      if ('serial' in navigator) {
        navigator.serial.removeEventListener('connect', handleConnect);
        navigator.serial.removeEventListener('disconnect', handleDisconnect);
      }
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Load timestamp preference from localStorage
    const savedTimestamps = localStorage.getItem('cliShowTimestamps');
    if (savedTimestamps !== null) {
      setShowTimestamps(savedTimestamps === 'true');
    }
  }, []);

  const initializeCLI = () => {
    // Check Web Serial API support with better detection
    if (!("serial" in navigator)) {
      setStatus("Web Serial API not supported");

      // Provide helpful information about browser support
      const userAgent = navigator.userAgent.toLowerCase();
      let browserInfo = "Unknown browser";

      if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        browserInfo = "Chrome (Desktop)";
      } else if (userAgent.includes('edg')) {
        browserInfo = "Edge (Desktop)";
      } else if (userAgent.includes('firefox')) {
        browserInfo = "Firefox (Not supported)";
      } else if (userAgent.includes('safari')) {
        browserInfo = "Safari (Not supported)";
      }

      const isHttps = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      writeReceivedMessage(`Browser: ${browserInfo}`);
      writeReceivedMessage(`HTTPS/Localhost: ${isHttps || isLocalhost ? 'Yes' : 'No (must be HTTPS or localhost)'}`);
      writeReceivedMessage(`Web Serial API: Not available`);
      writeReceivedMessage(`Try Chrome/Edge on desktop with HTTPS or localhost`);
    } else {
      setStatus("Ready - Click Connect to select device");
      updateAvailablePorts();

      // Show welcome message with instructions (only once)
      if (!welcomeShownRef.current) {
        welcomeShownRef.current = true;
        writeReceivedMessage("=== Web Serial Terminal v2.0 ===");
        writeReceivedMessage("Type 'help' for commands, 'browser' for compatibility check");
        writeReceivedMessage("Toggle Test Mode or add ?test=true to URL for demo");
      }
    }

    // Focus input on mount
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const updateAvailablePorts = async () => {
    if (!("serial" in navigator)) return;

    try {
      const ports = await navigator.serial.getPorts();
      setAvailablePorts(ports);
    } catch (error) {
      console.error("Error getting available ports:", error);
    }
  };

  const cleanup = async () => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }

    if (readerRef.current) {
      await readerRef.current.cancel();
    }

    if (inputDoneRef.current) {
      await inputDoneRef.current.catch(() => {});
    }

    if (outputDoneRef.current) {
      await outputDoneRef.current;
    }

    if (port && port !== "test") {
      await port.close();
    }
  };

  const connect = async () => {
    if (isTestMode) {
      await connectTestMode();
    } else {
      // Double-check Web Serial API support before attempting connection
      if (!("serial" in navigator)) {
        writeReceivedMessage("ERROR: Web Serial API not supported in this browser");
        writeReceivedMessage("Please use Chrome or Edge on desktop");
        writeReceivedMessage("Must be served over HTTPS or localhost");
        return;
      }
      await connectRealSerial();
    }
  };

  const connectTestMode = async () => {
    setStatus("Connecting (Test Mode)...");
    writeReceivedMessage("Connecting to virtual device...");

    await new Promise(resolve => setTimeout(resolve, 500));

    writeReceivedMessage(`Baud rate: ${baudRate}\nConnection established!\nDevice ready. Type 'help' for available commands.`);

    setPort("test");
    setIsConnected(true);
    connectionStartTimeRef.current = Date.now();

    // Start uptime counter
    testIntervalRef.current = setInterval(() => {
      if (port === "test") {
        setDeviceState(prev => ({
          ...prev,
          uptime: Math.floor((Date.now() - (connectionStartTimeRef.current || 0)) / 1000)
        }));
      }
    }, 1000);

    setStatus("Connected (Test Mode)");
    updateUIConnected();
  };

  const connectRealSerial = async () => {
    try {
      setStatus("Requesting device access...");

      // Prepare filters for device selection
      const filters = useDeviceFiltering ? [
        // Common Arduino devices
        { usbVendorId: 0x2341, usbProductId: 0x0043 }, // Arduino Uno
        { usbVendorId: 0x2341, usbProductId: 0x0001 }, // Arduino Uno
        // Raspberry Pi Pico
        { usbVendorId: 0x2E8A, usbProductId: 0x0005 }, // RP2040
        // ESP32
        { usbVendorId: 0x10C4, usbProductId: 0xEA60 }, // CP210x
        // FT232
        { usbVendorId: 0x0403, usbProductId: 0x6001 }, // FT232
      ] : undefined;

      writeReceivedMessage(`Requesting serial port access${filters ? ' (filtered)' : ''}...`);
      const serialPort = await navigator.serial.requestPort({ filters });
      setPort(serialPort);

      setStatus("Opening port...");

      // Get device info
      const info = serialPort.getInfo();
      if (info) {
        writeReceivedMessage(`Device selected: Vendor 0x${info.usbVendorId?.toString(16)}, Product 0x${info.usbProductId?.toString(16)}`);
      } else {
        writeReceivedMessage("Device selected (no info available)");
      }

      writeReceivedMessage(`Opening port at ${baudRate} baud...`);
      await serialPort.open({
        baudRate: parseInt(baudRate),
        dataBits: parseInt(dataBits) as any,
        parity: parity as any,
        stopBits: parseInt(stopBits) as any,
        bufferSize: 256 * 1024 // 256KB buffer for better performance
      });

      writeReceivedMessage("Port opened successfully");
      setIsConnected(true);

      // Setup streams with better error handling
      const encoder = new TextEncoderStream();
      outputDoneRef.current = encoder.readable.pipeTo(serialPort.writable);
      outputStreamRef.current = encoder.writable;

      const decoder = new TextDecoderStream();
      inputDoneRef.current = serialPort.readable.pipeTo(decoder.writable);
      inputStreamRef.current = decoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer()));

      readerRef.current = inputStreamRef.current.getReader();
      readLoop();

      setStatus("Connected");
      updateUIConnected();

      // Set initial DTR/RTS signals
      await setSignals();

    } catch (error: any) {
      console.error("Connection failed:", error);
      setStatus("Connection failed");

      // Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        writeReceivedMessage("ERROR: User cancelled device selection or permission denied");
      } else if (error.name === 'NotFoundError') {
        writeReceivedMessage("ERROR: No compatible serial devices found");
      } else if (error.name === 'InvalidStateError') {
        writeReceivedMessage("ERROR: Port is already open or invalid state");
      } else {
        writeReceivedMessage(`Connection failed: ${error.message || 'Unknown error'}`);
      }

      setPort(null);
    }
  };

  const setSignals = async () => {
    if (!port || port === "test") return;

    try {
      await port.setSignals({
        dataTerminalReady: dtrSignal,
        requestToSend: rtsSignal
      });
      writeReceivedMessage(`Signals set - DTR: ${dtrSignal}, RTS: ${rtsSignal}`);
    } catch (error) {
      console.error("Error setting signals:", error);
    }
  };

  const getSignals = async () => {
    if (!port || port === "test") return;

    try {
      const signals = await port.getSignals();
      writeReceivedMessage(`Signals - CTS: ${signals.clearToSend}, DCD: ${signals.dataCarrierDetect}, DSR: ${signals.dataSetReady}, RI: ${signals.ringIndicator}`);
      return signals;
    } catch (error) {
      console.error("Error getting signals:", error);
    }
  };

  const forgetPort = async () => {
    if (!port || port === "test") return;

    try {
      await port.forget();
      writeReceivedMessage("Port access revoked");
      updateAvailablePorts();
    } catch (error) {
      console.error("Error forgetting port:", error);
    }
  };

  const disconnect = async () => {
    if (!isConnected) {
      writeReceivedMessage("Not connected");
      return;
    }

    setStatus("Disconnecting...");

    if (isTestMode && port === "test") {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
        testIntervalRef.current = null;
      }
      setPort(null);
      setIsConnected(false);
      setDeviceState({ uptime: 0, ledState: false, gpioPins: {} });
      setStatus("Disconnected");
      writeReceivedMessage("Disconnected from test mode");
      updateUIDisconnected();
      return;
    }

    // Real serial disconnect with improved cleanup
    writeReceivedMessage("Closing serial connection...");

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
        writeReceivedMessage("Reader cancelled");
      } catch (error) {
        console.warn("Error cancelling reader:", error);
      }
      readerRef.current = null;
    }

    if (inputDoneRef.current) {
      try {
        await inputDoneRef.current;
        writeReceivedMessage("Input stream closed");
      } catch (error) {
        console.warn("Error closing input stream:", error);
      }
      inputDoneRef.current = null;
    }

    if (outputStreamRef.current) {
      try {
        await outputStreamRef.current.getWriter().close();
        writeReceivedMessage("Output stream closed");
      } catch (error) {
        console.warn("Error closing output stream:", error);
      }
      outputStreamRef.current = null;
    }

    if (outputDoneRef.current) {
      try {
        await outputDoneRef.current;
        writeReceivedMessage("Output pipe closed");
      } catch (error) {
        console.warn("Error closing output pipe:", error);
      }
      outputDoneRef.current = null;
    }

    if (port && port !== "test") {
      try {
        await port.close();
        writeReceivedMessage("Serial port closed");
      } catch (error) {
        console.warn("Error closing port:", error);
        writeReceivedMessage(`Warning: ${error.message}`);
      }
      setPort(null);
    }

    setIsConnected(false);
    setStatus("Disconnected");
    updateUIDisconnected();
  };

  const readLoop = async () => {
    if (!readerRef.current) return;

    // Try BYOB reader first for better performance
    let reader = readerRef.current;
    let useBYOB = false;

    try {
      if ('serial' in navigator && port && port !== 'test') {
        reader = port.readable.getReader({ mode: 'byob' });
        useBYOB = true;
        readerRef.current = reader;
      }
    } catch (error) {
      // BYOB not supported, use regular reader
      useBYOB = false;
      reader = readerRef.current;
    }

    while (port && port.readable) {
      try {
        let result;
        if (useBYOB) {
          // Use BYOB reader with custom buffer
          const buffer = new ArrayBuffer(1024);
          result = await reader.read(new Uint8Array(buffer));
        } else {
          result = await reader.read();
        }

        const { value, done } = result;

        if (done) {
          reader.releaseLock();
          break;
        }

        if (value) {
          writeReceivedMessage(value);
        }
      } catch (error) {
        // Handle non-fatal read errors (buffer overflow, framing errors, etc.)
        if (port && port.readable) {
          console.warn("Non-fatal read error:", error);
          writeReceivedMessage(`Read warning: ${error.message}`);
          // Continue reading - new ReadableStream is automatically created
          continue;
        } else {
          // Fatal error - port disconnected
          console.error("Fatal read error:", error);
          break;
        }
      }
    }
  };

  const writeToStream = async (...lines: string[]) => {
    if (!outputStreamRef.current) return;

    const writer = outputStreamRef.current.getWriter();
    lines.forEach((line) => {
      writer.write(line + "\n");
    });
    writer.releaseLock();
  };

  const updateUIConnected = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const updateUIDisconnected = () => {
    setInputValue('');
  };

  const writeSentMessage = (message: string) => {
    const newMessage: Message = {
      id: Date.now(),
      text: message,
      type: 'sent',
      timestamp: showTimestamps ? new Date().toLocaleTimeString() : undefined
    };
    setMessages(prev => [...prev, newMessage]);
    scrollToBottom();
  };

  const writeReceivedMessage = (message: string) => {
    // Prevent duplicate messages by checking recent messages
    setMessages(prev => {
      const now = Date.now();

      // Check last 3 messages for duplicates within 2 seconds
      for (let i = Math.max(0, prev.length - 3); i < prev.length; i++) {
        const recentMessage = prev[i];
        if (recentMessage && recentMessage.text === message && (now - recentMessage.id) < 2000) {
          return prev; // Skip duplicate message
        }
      }

      const newMessage: Message = {
        id: now,
        text: message,
        type: 'received',
        timestamp: showTimestamps ? new Date().toLocaleTimeString() : undefined
      };

      // Limit message history to prevent memory issues (keep last 200 messages for better performance)
      const updatedMessages = [...prev, newMessage];
      if (updatedMessages.length > 200) {
        updatedMessages.splice(0, updatedMessages.length - 200);
      }

      return updatedMessages;
    });
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleSend = async () => {
    const command = inputValue.trim();
    if (!command) return;

    const cmd = command.toLowerCase().trim();
    const parts = cmd.split(/\s+/);
    const commandName = parts[0];

    // Handle abhinav command
    if (commandName === "abhinav") {
      // Add to history
      setCommandHistory(prev => {
        const newHistory = prev.filter(c => c !== command);
        newHistory.push(command);
        return newHistory.slice(-10);
      });
      setHistoryIndex(-1);
      setCurrentInputBeforeHistory('');

      writeSentMessage(command);

      const greeting = getTimeOfDayGreeting();
      try {
        const location = await getUserLocation();
        const locationInfo = location ?
          `\nConnection Location: ${location.city || 'Unknown'}, ${location.region || 'Unknown'}, ${location.country_name || 'Unknown'}` :
          `\nConnection Location: Unable to determine`;
        const response = `Good ${greeting}, sir.\n\nSystem Status: All systems operational\nTerminal Interface: Active\nConnection: ${port ? 'Connected' : 'Disconnected'}${locationInfo}\n\nHow may I assist you today?`;
        writeReceivedMessage(response);
      } catch {
        const response = `Good ${greeting}, sir.\n\nSystem Status: All systems operational\nTerminal Interface: Active\nConnection: ${port ? 'Connected' : 'Disconnected'}\n\nHow may I assist you today?`;
        writeReceivedMessage(response);
      }

      setInputValue('');
      return;
    }

    // For other commands, require connection
    if (!port) return;

    // Add to history
    setCommandHistory(prev => {
      const newHistory = prev.filter(c => c !== command);
      newHistory.push(command);
      return newHistory.slice(-10);
    });
    setHistoryIndex(-1);
    setCurrentInputBeforeHistory('');

    writeSentMessage(command);

    if (isTestMode && port === "test") {
      handleTestCommand(command);
    } else {
      await writeToStream(command);
    }

    setInputValue('');
  };

  const handleTestCommand = (command: string) => {
    setTimeout(() => {
      const cmd = command.toLowerCase().trim();
      const parts = cmd.split(/\s+/);
      const commandName = parts[0];

      let response = "";

      switch(commandName) {
        case "help":
          response = `Available commands:\nBasic: help, info, status, ping, time, date, version, echo, uptime, clear\nHardware: led, sensors, read, gpio, dtr, rts, signals, forget\nSerial: device info and signal control\nSystem: browser, ports`;
          break;
        case "clear":
          setMessages([]);
          response = "Terminal cleared";
          break;
        case "browser":
          const userAgent = navigator.userAgent.toLowerCase();
          let browser = "Unknown";
          if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
            browser = "Chrome";
          } else if (userAgent.includes('edg')) {
            browser = "Edge";
          } else if (userAgent.includes('firefox')) {
            browser = "Firefox (Web Serial not supported)";
          } else if (userAgent.includes('safari')) {
            browser = "Safari (Web Serial not supported)";
          }
          const isHttps = window.location.protocol === 'https:';
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          response = `Browser: ${browser}\nHTTPS/Localhost: ${isHttps || isLocalhost ? 'Yes' : 'No'}\nWeb Serial API: ${"serial" in navigator ? 'Supported' : 'Not supported'}`;
          break;
        case "ports":
          if ("serial" in navigator) {
            updateAvailablePorts();
            response = `Checking available ports...`;
          } else {
            response = `Web Serial API not supported`;
          }
          break;
        case "info":
          response = `Web Serial Terminal Test Mode\nDevice: Virtual Serial Emulator v2.0\nBaud Rate: ${baudRate}\nTest Mode: Enabled`;
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
          const timeNow = new Date();
          response = `Local: ${timeNow.toLocaleString()}\nUTC: ${timeNow.toUTCString()}`;
          break;
        case "date":
          const dateNow = new Date();
          response = `Date: ${dateNow.toDateString()}\nTime: ${dateNow.toTimeString()}`;
          break;
        case "version":
          response = `Serial Terminal Emulator v2.0.0\nTest Mode Enabled`;
          break;
        case "echo":
          response = parts.slice(1).join(' ') || "(no arguments provided)";
          break;
        case "uptime":
          const uptimeSeconds = deviceState.uptime;
          response = `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`;
          break;
        case "led":
          const ledArg = parts[1];
          if (ledArg === "on" || ledArg === "1") {
            setDeviceState(prev => ({ ...prev, ledState: true }));
            response = "LED: ON";
          } else if (ledArg === "off" || ledArg === "0") {
            setDeviceState(prev => ({ ...prev, ledState: false }));
            response = "LED: OFF";
          } else if (ledArg === "toggle") {
            setDeviceState(prev => ({ ...prev, ledState: !prev.ledState }));
            response = `LED: ${!deviceState.ledState ? "ON" : "OFF"}`;
          } else {
            response = `LED Status: ${deviceState.ledState ? "ON" : "OFF"}\nUsage: led [on|off|toggle]`;
          }
          break;
        case "dtr":
          const dtrArg = parts[1];
          if (dtrArg === "on" || dtrArg === "1") {
            setDtrSignal(true);
            setSignals();
            response = "DTR: ON";
          } else if (dtrArg === "off" || dtrArg === "0") {
            setDtrSignal(false);
            setSignals();
            response = "DTR: OFF";
          } else {
            response = `DTR Status: ${dtrSignal ? "ON" : "OFF"}\nUsage: dtr [on|off]`;
          }
          break;
        case "rts":
          const rtsArg = parts[1];
          if (rtsArg === "on" || rtsArg === "1") {
            setRtsSignal(true);
            setSignals();
            response = "RTS: ON";
          } else if (rtsArg === "off" || rtsArg === "0") {
            setRtsSignal(false);
            setSignals();
            response = "RTS: OFF";
          } else {
            response = `RTS Status: ${rtsSignal ? "ON" : "OFF"}\nUsage: rts [on|off]`;
          }
          break;
        case "signals":
          if (isTestMode) {
            response = `Test Mode Signals:\nDTR: ${dtrSignal}\nRTS: ${rtsSignal}`;
          } else {
            getSignals();
            response = "Reading signals from device...";
          }
          break;
        case "forget":
          if (isTestMode) {
            response = "Cannot forget port in test mode";
          } else {
            forgetPort();
            response = "Revoking port access...";
          }
          break;
        default:
          response = `ERROR: Unknown command '${command}'\nType 'help' for available commands.`;
      }

      if (response) {
        writeReceivedMessage(response);
      }
    }, 100 + Math.random() * 200);
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  const getUserLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('API failed');
      return await response.json();
    } catch {
      try {
        const response = await fetch('https://ip-api.com/json/');
        if (!response.ok) throw new Error('Fallback API failed');
        const data = await response.json();
        return {
          city: data.city,
          region: data.regionName,
          country_name: data.country,
          ip: data.query,
          latitude: data.lat,
          longitude: data.lon
        };
      } catch {
        return null;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
    }
  };

  const navigateHistory = (direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return;

    if (historyIndex === -1 && direction === 'up' && inputValue.trim() !== '') {
      setCurrentInputBeforeHistory(inputValue);
    }

    if (direction === 'up') {
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (direction === 'down') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue(currentInputBeforeHistory);
        setCurrentInputBeforeHistory('');
      }
    }
  };

  const autoResizeTextarea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  };

  const toggleTestMode = (checked: boolean) => {
    setIsTestMode(checked);

    // Update URL parameter
    const url = new URL(window.location.href);
    if (checked) {
      url.searchParams.set('test', 'true');
    } else {
      url.searchParams.delete('test');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const toggleTimestamps = (checked: boolean) => {
    setShowTimestamps(checked);
    localStorage.setItem('cliShowTimestamps', checked.toString());
  };

  return (
    <>
      <Helmet>
        <title>CLI Terminal - Abhinav Chinnusamy</title>
        <meta name="description" content="Web Serial Terminal for hardware communication and debugging." />
      </Helmet>

      <div className="h-screen w-screen bg-black font-mono text-green-400 relative">
        {/* Terminal Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-400 text-sm">Web Serial Terminal</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-white px-2 py-1 text-sm"
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Terminal Body - Messages Area */}
        <div className="flex-1 bg-black" style={{ paddingBottom: '120px' }}>
          {/* Status Bar */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{status}</span>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => toggleTestMode(e.target.checked)}
                  className="rounded"
                />
                Test Mode
              </label>
              {isConnected && !isTestMode && (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={dtrSignal}
                      onChange={(e) => {
                        setDtrSignal(e.target.checked);
                        setSignals();
                      }}
                      className="rounded"
                    />
                    DTR
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={rtsSignal}
                      onChange={(e) => {
                        setRtsSignal(e.target.checked);
                        setSignals();
                      }}
                      className="rounded"
                    />
                    RTS
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Messages Container */}
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto bg-gray-900 p-4 border-b border-gray-800 scroll-smooth"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            {messages.length === 0 ? (
              <div className="text-gray-500 italic">
                Web Serial Terminal v2.0<br/>
                Connect to serial devices directly from your browser<br/>
                {!("serial" in navigator) && "Web Serial API not supported in this browser"}
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`mb-2 ${message.type === 'sent' ? 'text-blue-400' : 'text-green-400'}`}>
                  {message.timestamp && (
                    <span className="text-gray-600 text-xs">[{message.timestamp}] </span>
                  )}
                  <span className={message.type === 'sent' ? 'text-blue-300' : ''}>
                    {message.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <br />}
                        {line}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fixed Input Area - Like Chat Box */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-10">
          {/* Control Buttons Row */}
          <div className="flex gap-4 mb-3 justify-center">
            <button
              ref={connectBtnRef}
              onClick={connect}
              disabled={isConnected}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              {isConnected ? 'Connected' : 'Connect'}
            </button>
            <button
              ref={disconnectBtnRef}
              onClick={disconnect}
              disabled={!isConnected}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Disconnect
            </button>
            {availablePorts.length > 0 && !isConnected && (
              <span className="text-gray-400 text-sm self-center">
                {availablePorts.length} device{availablePorts.length !== 1 ? 's' : ''} available
              </span>
            )}
            <button
              onClick={() => setMessages([])}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Input Row */}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-green-400 placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none overflow-hidden"
              rows={1}
              style={{ minHeight: '36px' }}
              disabled={!isConnected && inputValue.toLowerCase().trim() !== 'abhinav'}
              onInput={autoResizeTextarea}
            />
            <button
              ref={sendBtnRef}
              onClick={handleSend}
              disabled={!inputValue.trim() || (!isConnected && inputValue.toLowerCase().trim() !== 'abhinav')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Send
            </button>
          </div>
        </div>

          {/* Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-white mb-4">Terminal Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Baud Rate</label>
                    <select
                      value={baudRate}
                      onChange={(e) => setBaudRate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="9600">9600</option>
                      <option value="19200">19200</option>
                      <option value="38400">38400</option>
                      <option value="57600">57600</option>
                      <option value="115200">115200</option>
                      <option value="230400">230400</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Data Bits</label>
                    <select
                      value={dataBits}
                      onChange={(e) => setDataBits(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="7">7</option>
                      <option value="8">8</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Parity</label>
                    <select
                      value={parity}
                      onChange={(e) => setParity(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="none">None</option>
                      <option value="even">Even</option>
                      <option value="odd">Odd</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Stop Bits</label>
                    <select
                      value={stopBits}
                      onChange={(e) => setStopBits(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={useDeviceFiltering}
                        onChange={(e) => setUseDeviceFiltering(e.target.checked)}
                        className="rounded"
                      />
                      Filter common devices (Arduino, ESP32, etc.)
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={showTimestamps}
                        onChange={(e) => toggleTimestamps(e.target.checked)}
                        className="rounded"
                      />
                      Show timestamps
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
};

// TransformStream for line breaks
class LineBreakTransformer {
  container: string = '';

  transform(chunk: string, controller: TransformStreamDefaultController) {
    this.container += chunk;
    const lines = this.container.split("\r\n");
    this.container = lines.pop() || '';
    lines.forEach((line) => controller.enqueue(line));
  }

  flush(controller: TransformStreamDefaultController) {
    controller.enqueue(this.container);
  }
}

export default CLI;
