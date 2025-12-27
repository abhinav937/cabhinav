import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant' | 'system';
  time: string;
  timestamp?: number;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm an AI assistant. How can I help you today?",
      sender: 'assistant',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Call AI response with a small delay for better UX
    setTimeout(async () => {
      await generateAIResponse(messageText);
    }, 500);
  };

  const generateAIResponse = async (userInput: string) => {
    try {
      // Prepare chat history in the API format
      const chatHistory = messages.slice(1).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await fetch('https://ai-reply-bot.vercel.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          message: userInput,
          sessionId: sessionId,
          requestType: 'chat',
          chatHistory: chatHistory
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          addAIResponse("I'm receiving too many requests right now. Please try again in a moment.");
        } else if (response.status === 403) {
          addAIResponse("Sorry, I'm having trouble connecting right now.");
        } else {
          addAIResponse("I'm having trouble responding right now. Please try again.");
        }
        return;
      }

      const data = await response.json();
      addAIResponse(data.message);

    } catch (error) {
      console.error('Chat API error:', error);
      addAIResponse("I'm having trouble connecting to the server. Please check your internet connection and try again.");
    }
  };

  const addAIResponse = (text: string) => {
    const aiMessage: Message = {
      id: Date.now(),
      text: text,
      sender: 'assistant',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Helmet>
        <title>AI Chat - Abhinav Chinnusamy</title>
        <meta name="description" content="Interactive AI chat interface for conversations and assistance." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://cabhinav.com/chat/" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/grok-style.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />
      </Helmet>

      <div className="flex flex-col h-screen bg-black">
        {/* Chat Header */}
        <header className="flex-shrink-0 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center justify-between py-3 px-4">
            <div>
              <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
              <div
                className="text-xs text-gray-400 font-mono cursor-pointer hover:text-gray-300 transition-colors"
                title={`Click to copy full session ID: ${sessionId}`}
                onClick={() => {
                  navigator.clipboard.writeText(sessionId);
                  // Could add a toast notification here if desired
                }}
              >
                Session: {sessionId.slice(-8)}
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([{
                  id: Date.now(),
                  text: "Hello! I'm an AI assistant. How can I help you today?",
                  sender: 'assistant',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  timestamp: Date.now()
                }]);
                setInputValue('');
                setIsTyping(false);
              }}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-all duration-200 flex items-center gap-2"
              title="Start a new conversation"
            >
              <span className="bi bi-plus-circle"></span>
              New Chat
            </button>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 scroll-smooth">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      message.sender === 'user' ? 'bg-gray-600' : 'bg-gray-700'
                    }`}>
                      {message.sender === 'user' ? 'U' : 'AI'}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className={`flex flex-col gap-1 max-w-[70%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-lg px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-white text-black'
                        : 'bg-gray-800 border border-gray-600 text-white'
                    }`}>
                      {message.sender === 'assistant' && (
                        <div className="text-xs text-gray-300 font-medium mb-2 opacity-75">AI Assistant</div>
                      )}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.text}
                      </div>
                    </div>
                    <div className={`text-xs text-gray-400 px-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {message.time}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-semibold">
                      AI
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 max-w-[70%]">
                    <div className="rounded-lg px-4 py-3 bg-gray-800 border border-gray-600">
                      <div className="text-xs text-gray-400 font-medium mb-2">AI Assistant</div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-stretch">
              <div className="flex-1">
                <textarea
                  ref={inputRef as any}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full h-12 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 resize-none outline-none focus:border-gray-500 transition-all duration-200"
                  disabled={isTyping}
                  rows={1}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="h-12 px-6 rounded-lg bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 font-medium whitespace-nowrap"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
