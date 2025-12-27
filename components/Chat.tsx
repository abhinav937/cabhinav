import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from './Layout';

// Import chat scripts
import '../assets/js/grok-script.js';

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
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response with variable timing
    setTimeout(() => {
      generateAIResponse(inputValue);
    }, 800 + Math.random() * 2500);
  };

  const generateAIResponse = (userInput: string) => {
    const responses = [
      "That's an interesting point! I love diving into complex topics. Can you tell me more about that?",
      "I understand what you're saying. Let me think about this from a few different angles to give you the most helpful response.",
      "Great question! Here's what I know about that topic...",
      "I appreciate you sharing that with me. Based on what you've told me, I suggest...",
      "That's a complex topic. Let me break this down step by step for you.",
      "I'm here to help! My goal is to provide useful information about pretty much anything.",
      "Thanks for asking! This is exactly the kind of question I can tackle.",
      "Interesting perspective! I always enjoy exploring different viewpoints on subjects.",
      "I see what you mean. Let me offer a different way to look at this.",
      "That's a great observation! Here's how you might approach this..."
    ];

    const input = userInput.toLowerCase();

    // Special responses for specific commands/keywords
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      const greeting = getTimeOfDayGreeting();
      const responseText = `Good ${greeting}! I'm an AI assistant ready to help. What can I help you with today?`;
      addAIResponse(responseText);
    } else if (input.includes('how are you') || input.includes('how do you do')) {
      addAIResponse("I'm doing great, thanks for asking! I'm always ready to help with whatever you need. How about you?");
    } else if (input.includes('thank you') || input.includes('thanks')) {
      addAIResponse("You're very welcome! That's what I'm here for. Is there anything else you'd like to know or discuss?");
    } else if (input.includes('bye') || input.includes('goodbye') || input.includes('see you')) {
      addAIResponse("Goodbye! It was great chatting with you. Come back anytime - I'm always here to help!");
    } else if (input.includes('help') || input.includes('what can you do')) {
      addAIResponse("I'm an AI assistant designed to be helpful. I can help with questions, explanations, creative tasks, coding, research, and pretty much anything else you can think of. What would you like to explore?");
    } else if (input.includes('name') && input.includes('your')) {
      addAIResponse("I'm an AI assistant designed to be helpful and provide useful information!");
    } else if (input.includes('weather')) {
      addAIResponse("I'd love to help with weather info! While I don't have real-time access to weather data right now, I can suggest checking a reliable weather service. What location are you interested in?");
    } else if (input.includes('time') || input.includes('date')) {
      const now = new Date();
      const timeString = now.toLocaleString();
      addAIResponse(`Right now it's ${timeString}. As an AI, I don't experience time the same way humans do, but I'm always here whenever you need me!`);
    } else if (input.includes('joke') || input.includes('funny')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
        "What do you call fake spaghetti? An impasta!",
        "Why don't eggs tell jokes? They'd crack each other up! 🥚",
        "What do you call a belt made of watches? A waist of time! ⌚"
      ];
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      addAIResponse(randomJoke);
    } else if (input.includes('abhinav') || input.includes('portfolio') || input.includes('website')) {
      addAIResponse("Ah, you're on Abhinav Chinnusamy's portfolio! He's an impressive electrical engineer specializing in power electronics. His work on modular SSCBs and research publications are quite fascinating. Feel free to explore - he's got some really cool projects here!");
    } else {
      // Random response from the general responses array
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addAIResponse(randomResponse);
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

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      text: "Hello! I'm an AI assistant. How can I help you today?",
      sender: 'assistant',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }]);
  };

  return (
    <Layout>
      <Helmet>
        <title>AI Chat - Abhinav Chinnusamy</title>
        <meta name="description" content="Interactive AI chat interface for conversations and assistance." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="stylesheet" href="/assets/css/grok-style.css" />
      </Helmet>

      {/* AI Chat Interface */}
      <div className="min-h-screen" style={{ backgroundColor: '#000000', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '1rem', flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em'
              }}>
                AI Chat
              </h1>
              <p style={{
                fontSize: '1.125rem',
                color: '#a8a8a8',
                marginBottom: '0'
              }}>
                Interactive AI Assistant
              </p>
            </div>
            <button
              onClick={clearChat}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              title="Clear conversation"
            >
              New Chat
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="container" style={{ maxWidth: '1200px', flex: '1', display: 'flex', flexDirection: 'column', paddingBottom: '120px' }}>
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '1rem',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            flex: '1',
            display: 'flex',
            flexDirection: 'column'
          }}>

            {/* Messages Area */}
            <div
              style={{
                flex: '1',
                overflowY: 'auto',
                padding: '2rem',
                backgroundColor: 'transparent',
                minHeight: '200px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '1rem 1.5rem',
                        borderRadius: '1rem',
                        backgroundColor: message.sender === 'user'
                          ? '#ffffff'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: message.sender === 'user'
                          ? '#000000'
                          : '#ffffff',
                        border: message.sender === 'user'
                          ? 'none'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '1rem',
                        lineHeight: '1.5',
                        wordBreak: 'break-word',
                        position: 'relative'
                      }}
                    >
                      {message.sender === 'assistant' && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#a8a8a8',
                          marginBottom: '0.5rem',
                          fontWeight: '500'
                        }}>
                          AI Assistant
                        </div>
                      )}
                      <p style={{
                        margin: '0',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {message.text}
                      </p>
                      <div style={{
                        fontSize: '0.75rem',
                        color: message.sender === 'user' ? '#666666' : '#666666',
                        marginTop: '0.5rem',
                        opacity: '0.7'
                      }}>
                        {message.time}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '1rem 1.5rem',
                        borderRadius: '1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#a8a8a8',
                        fontWeight: '500'
                      }}>
                        AI Assistant
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem' }}>Thinking</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <div style={{
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#ffffff',
                            borderRadius: '50%',
                            animation: 'bounce 1.4s infinite ease-in-out both'
                          }}></div>
                          <div style={{
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#ffffff',
                            borderRadius: '50%',
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '0.16s'
                          }}></div>
                          <div style={{
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#ffffff',
                            borderRadius: '50%',
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '0.32s'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Fixed Input Area */}
        <div style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          zIndex: '10',
          backgroundColor: '#000000',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem 2rem',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}>
          <div className="container" style={{ maxWidth: '1200px' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: '1', position: 'relative' }}>
                <textarea
                  ref={inputRef as any}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  style={{
                    width: '100%',
                    minHeight: '3rem',
                    maxHeight: '6rem',
                    padding: '1rem 1.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '1rem',
                    color: '#ffffff',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  disabled={isTyping}
                  rows={1}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                style={{
                  padding: '1rem',
                  backgroundColor: inputValue.trim() && !isTyping ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                  color: inputValue.trim() && !isTyping ? '#000000' : '#666666',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '3rem',
                  minHeight: '3rem',
                  fontSize: '1.125rem'
                }}
                onMouseEnter={(e) => {
                  if (inputValue.trim() && !isTyping) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (inputValue.trim() && !isTyping) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isTyping ? '⏳' : '➤'}
              </button>
            </div>
            <div style={{
              marginTop: '0.75rem',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#666666',
                margin: '0'
              }}>
                Press Enter to send • Interactive AI Assistant
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }

          /* Smooth scrolling for chat messages */
          .chat-messages {
            scroll-behavior: smooth;
          }

          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 6px;
          }

          ::-webkit-scrollbar-track {
            background: transparent;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        `
      }} />
    </Layout>
  );
};

export default Chat;
