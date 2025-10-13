import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader,
  Sparkles,
  Leaf,
  Bug,
  Scan
} from 'lucide-react';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// CeylonLeaf color scheme - defined locally
const ceylonLeafColors = {
  dark: '#1a5632',
  primary: '#2d7a52',
  light: '#38a169',
  accent: '#f59e0b',
  cream: '#fef7ed',
  white: '#ffffff',
  gray: '#4a5568'
};

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);

  const quickActions = [
    { text: "Identify pest in my tea field", icon: "🐛" },
    { text: "Leaf spots treatment", icon: "🍂" },
    { text: "Pruning schedule", icon: "✂️" },
    { text: "Fertilizer recommendations", icon: "🌱" },
    { text: "Weather impact on tea", icon: "🌦️" },
    { text: "Organic pest control", icon: "🌿" }
  ];

  const initialMessage = {
    id: 1,
    text: "🌱 **Welcome to CeylonLeaf AI Assistant!**\n\nI'm your specialized tea plantation expert for Sri Lankan conditions. I can help you with:\n\n• **Pest & Disease Identification** - Describe symptoms and get expert analysis\n• **Organic Treatment Solutions** - Safe, effective remedies for your tea fields\n• **Cultivation Best Practices** - Optimize your tea production\n• **Field Management** - Pruning, fertilization, and maintenance advice\n• **Weather & Climate Guidance** - Adapt to Sri Lankan growing conditions\n\n**What would you like to know about your tea plantation today?**",
    sender: 'bot',
    timestamp: new Date()
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickAction = (actionText) => {
    setInputMessage(actionText);
    setShowQuickActions(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setShowQuickActions(false);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await axios.post(`${API}/api/ai/pest-analysis`, {
        message: inputMessage
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
        isAnalysis: true,
        isFallback: response.data.isFallback || false,
        isAI: response.data.isAI || false,
        modelUsed: response.data.modelUsed || 'unknown'
      };

      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('AI Chat error:', error);
      
      let errorText = "I'm temporarily unavailable. ";
      
      if (error.response?.status === 500) {
        errorText += "The AI service is experiencing issues. ";
      } else if (error.response?.status === 401) {
        errorText += "Please log in again to use the AI assistant. ";
      } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorText += "Network connection issue detected. ";
      }
      
      errorText += "\n\nFor immediate assistance:\n• Take clear photos of affected plants\n• Contact your field supervisor\n• Visit the plantation manager's office";

      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    Swal.fire({
      title: 'Clear Conversation?',
      text: 'This will clear all chat history.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: ceylonLeafColors.primary,
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      customClass: { popup: 'rounded-2xl shadow-2xl' }
    }).then((result) => {
      if (result.isConfirmed) {
        setMessages([initialMessage]);
        setShowQuickActions(true);
      }
    });
  };

  const formatMessage = (text, isUser = false) => {
    return text.split('\n').map((line, index) => {
      if (line.includes('**') && line.includes(':**')) {
        return (
          <div 
            key={index} 
            style={{ 
              borderLeft: '4px solid ' + ceylonLeafColors.primary,
              color: isUser ? '#ffffff' : ceylonLeafColors.dark
            }}
            className="font-bold mt-4 mb-2 text-sm uppercase tracking-wide pl-3"
          >
            {line.replace(/\*\*/g, '')}
          </div>
        );
      } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return (
          <div key={index} className="flex items-start ml-2 mb-1">
            <span 
              style={{ color: isUser ? '#ffffff' : ceylonLeafColors.primary }}
              className="mr-3 mt-1 flex-shrink-0"
            >•</span>
            <span className={isUser ? "text-white flex-1" : "text-gray-700 flex-1"}>{line.replace(/^[-•]\s*/, '')}</span>
          </div>
        );
      } else if (line.trim().match(/^\d+\./)) {
        return (
          <div key={index} className="flex items-start ml-2 mb-2">
            <span 
              style={{ 
                backgroundColor: isUser ? '#ffffff' : ceylonLeafColors.cream,
                color: isUser ? '#3b82f6' : ceylonLeafColors.primary
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0"
            >
              {line.match(/^\d+/)[0]}
            </span>
            <span className={isUser ? "text-white flex-1" : "text-gray-700 flex-1"}>{line.replace(/^\d+\.\s*/, '')}</span>
          </div>
        );
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return (
          <p key={index} className={isUser ? "mb-2 last:mb-0 text-white leading-relaxed" : "mb-2 last:mb-0 text-gray-800 leading-relaxed"}>
            {line}
          </p>
        );
      }
    });
  };

  // Modern Robot Icon Component
  const RobotIcon = ({ size = 24, className = "" }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 8C19 5.79 17.21 4 15 4H9C6.79 4 5 5.79 5 8L3 7V9L5 10V14L3 15V17L5 16C5 18.21 6.79 20 9 20H15C17.21 20 19 18.21 19 16L21 17V15L19 14V10L21 9ZM15 18H9C7.9 18 7 17.1 7 16V8C7 6.9 7.9 6 9 6H15C16.1 6 17 6.9 17 8V16C17 17.1 16.1 18 15 18Z" 
        fill="currentColor"
      />
      <circle cx="9" cy="11" r="1" fill="currentColor"/>
      <circle cx="15" cy="11" r="1" fill="currentColor"/>
      <path d="M10 15H14V16H10V15Z" fill="currentColor"/>
    </svg>
  );

  // Floating button styles
  const floatingButtonStyle = {
    background: 'linear-gradient(135deg, #1a5632 0%, #2d7a52 50%, #38a169 100%)'
  };

  // Header gradient style
  const headerGradientStyle = {
    background: 'linear-gradient(135deg, #1a5632 0%, #2d7a52 100%)'
  };

  return (
    <>
      {/* Modern Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={floatingButtonStyle}
          className="fixed bottom-8 right-8 z-50 w-20 h-20 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center group border-2 border-white"
          title="CeylonLeaf AI Assistant"
        >
          <div className="relative">
            {/* Modern Robot Head */}
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <RobotIcon className="text-green-700 w-6 h-6" />
            </div>
            
            {/* Animated Pulse Effect */}
            <div className="absolute inset-0 rounded-2xl border-2 border-green-300 animate-ping opacity-20"></div>
          </div>
          
          {/* Notification Badge */}
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <Scan className="w-3 h-3 text-white" />
          </span>
          
          {/* Tooltip */}
          <div className="absolute -top-12 right-0 bg-white text-green-800 text-sm font-semibold px-3 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-green-200">
            🍃 CeylonLeaf AI Assistant
            <div className="absolute bottom-0 right-4 transform translate-y-1 w-3 h-3 bg-white rotate-45 border-r border-b border-green-200"></div>
          </div>
        </button>
      )}

      {/* Modern Chat Window */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-green-300 flex flex-col overflow-hidden">
          {/* CeylonLeaf Themed Header */}
          <div 
            style={headerGradientStyle}
            className="p-4 text-white relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-2">
                <Leaf className="w-16 h-16 transform rotate-12" />
              </div>
              <div className="absolute bottom-2 left-2">
                <Leaf className="w-12 h-12 transform -rotate-12" />
              </div>
            </div>
            
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <RobotIcon className="text-green-700 w-6 h-6" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">CeylonLeaf AI</h3>
                  <p className="text-green-100 text-xs">Tea Plantation Expert</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-green-700 rounded-xl transition-colors duration-200"
                  title="Clear Chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-green-700 rounded-xl transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-green-50 to-white">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}
                  >
                    <div
                      style={{
                        backgroundColor: message.sender === 'user' ? '#3b82f6' : ceylonLeafColors.white,
                        color: message.sender === 'user' ? ceylonLeafColors.white : ceylonLeafColors.primary,
                        border: message.sender === 'user' ? 'none' : `1px solid ${ceylonLeafColors.light}`
                      }}
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                    >
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <RobotIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      style={{
                        backgroundColor: message.sender === 'user' ? '#3b82f6' : ceylonLeafColors.white,
                        color: message.sender === 'user' ? '#ffffff' : ceylonLeafColors.gray,
                        border: message.sender === 'user' ? 'none' : `1px solid ${ceylonLeafColors.light}`
                      }}
                      className="rounded-2xl px-4 py-3 shadow-sm"
                    >
                      <div className="text-sm">
                        {formatMessage(message.text, message.sender === 'user')}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div
                          style={{
                            color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : ceylonLeafColors.gray
                          }}
                          className="text-xs"
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {message.sender === 'bot' && (
                          <div className="flex items-center space-x-1">
                            {message.isAI && !message.isFallback && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                🤖 AI Powered
                              </span>
                            )}
                            {message.isFallback && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                📚 Expert Knowledge
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-[85%]">
                    <div 
                      style={{
                        backgroundColor: ceylonLeafColors.white,
                        border: `1px solid ${ceylonLeafColors.light}`,
                        color: ceylonLeafColors.primary
                      }}
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                    >
                      <RobotIcon className="w-4 h-4" />
                    </div>
                    <div 
                      style={{
                        border: `1px solid ${ceylonLeafColors.light}`
                      }}
                      className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Loader 
                          style={{ color: ceylonLeafColors.primary }}
                          className="w-4 h-4 animate-spin" 
                        />
                        <span className="text-sm">Analyzing tea field symptoms...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              
              {/* Quick Actions */}
              {showQuickActions && messages.length <= 1 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-3 font-medium">Quick Actions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.text)}
                        className="flex items-center space-x-2 p-2 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors duration-200 text-left"
                      >
                        <span className="text-sm">{action.icon}</span>
                        <span className="text-xs text-gray-700">{action.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div 
            style={{ borderColor: ceylonLeafColors.light }}
            className="border-t p-4 bg-white"
          >
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe leaf spots, pests, discoloration, or growth issues in your tea fields..."
                style={{ 
                  borderColor: ceylonLeafColors.primary,
                  color: '#000000',
                  placeholder: { color: ceylonLeafColors.primary }
                }}
                className="flex-1 border rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white placeholder-green-700 text-black"
                rows="2"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
                style={
                  !inputMessage.trim() || loading 
                    ? {} 
                    : { background: 'linear-gradient(135deg, #1a5632 0%, #2d7a52 100%)' }
                }
                className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md ${
                  !inputMessage.trim() || loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'text-white hover:shadow-lg'
                }`}
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p 
              style={{ color: ceylonLeafColors.primary }}
              className="text-xs mt-2 text-center font-medium"
            >
              💡 Specialized for Sri Lankan tea plantation conditions
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;