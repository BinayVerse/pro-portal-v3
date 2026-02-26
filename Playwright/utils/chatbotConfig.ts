// Chatbot Test Configuration
// This file contains selectors and settings for chatbot testing

export const ChatbotSelectors = {
  // Primary chatbot widget selectors
  widget: [
    '#chatbot',
    '.chatbot',
    '.chatbot-widget',
    '[data-testid="chatbot"]',
    'iframe[src*="chat"]',
    '.chat-widget',
    '.support-chat'
  ],

  // Chatbot trigger/button selectors - UPDATED with actual working selector
  trigger: [
    'button[aria-label="Open chat"]',
    'button[title*="chat"]',
    'button[aria-label*="chat"]',
    '.w-14.h-14.rounded-full.shadow-lg.flex.items-center.justify-center.bg-primary-600.text-white',
    '#chatbot',
    '.chatbot-trigger',
    '.chat-button',
    '.chat-trigger',
    '[data-testid="chatbot-trigger"]',
    '.support-button'
  ],

  // Chat interface/window selectors
  interface: [
    '.chat-interface',
    '.chat-window',
    '.chatbot-window',
    '.chat-container',
    '[data-testid="chat-interface"]',
    '.conversation-window'
  ],

  // Message input selectors - UPDATED with actual working selector
  messageInput: [
    'input[placeholder="Ask me anything..."]',
    'input[placeholder*="Ask me anything"]',
    'input[type="text"][placeholder*="ask"]',
    'input[type="text"][placeholder*="message"]',
    'input[type="text"][placeholder*="type"]',
    'textarea[placeholder*="message"]',
    '.message-input',
    '[data-testid="message-input"]'
  ],

  // Send button selectors
  sendButton: [
    'button:has-text("Send")',
    'button[type="submit"]',
    '.send-button',
    '[data-testid="send-button"]',
    'button[aria-label*="send"]'
  ],

  // Messages area selectors
  messagesArea: [
    '.messages',
    '.chat-messages',
    '.conversation',
    '.message-list',
    '[data-testid="chat-messages"]'
  ],

  // Individual message selectors
  message: [
    '.message',
    '.chat-message',
    '.msg',
    '[data-testid="message"]'
  ],

  // Bot message selectors
  botMessage: [
    '.bot-message',
    '.response',
    '.ai-message',
    '.assistant-message',
    '[data-testid="bot-message"]'
  ],

  // User message selectors
  userMessage: [
    '.user-message',
    '.human-message',
    '.my-message',
    '[data-testid="user-message"]'
  ],

  // Control buttons
  minimize: [
    'button:has-text("−")',
    'button:has-text("_")',
    '.minimize-button',
    '[data-testid="minimize"]',
    '[aria-label*="minimize"]'
  ],

  close: [
    'button:has-text("×")',
    'button:has-text("Close")',
    '.close-button',
    '[data-testid="close"]',
    '[aria-label*="close"]'
  ],

  // Loading/typing indicators
  loadingIndicator: [
    '.typing',
    '.is-typing',
    '.loading',
    '.spinner',
    '.dots',
    '[data-testid="typing"]',
    ':has-text("typing")',
    ':has-text("...")',
    ':has-text("thinking")'
  ],

  // Error message selectors
  error: [
    '.error',
    '.network-error',
    '.chat-error',
    '[data-testid="error"]',
    '.error-message'
  ]
};

export const ChatbotTestData = {
  // Test messages for different scenarios
  testMessages: {
    greeting: 'Hello, can you help me?',
    question: 'What services do you offer?',
    gratitude: 'Thank you for the information',
    long: 'This is a longer message to test how the chatbot handles extended text input and whether it can process and respond to more detailed queries appropriately.',
    empty: '',
    special: 'Test message with special characters: @#$%^&*()_+-={}[]|\\:";\'<>?,./',
    numbers: '12345 67890 test numbers in message',
    multiline: 'Line 1\nLine 2\nLine 3'
  },

  // Personalized messages for authenticated users
  personalizedMessages: [
    'What can you tell me about my account?',
    'Show me my recent activity',
    'Help me with my dashboard',
    'What are my current settings?'
  ],

  // Context-specific messages for different pages
  contextMessages: {
    users: 'How do I manage users?',
    analytics: 'Explain these analytics',
    artefacts: 'Help me upload documents',
    dashboard: 'What does this dashboard show?'
  }
};

export const ChatbotTestConfig = {
  // Timeout configurations
  timeouts: {
    widget: 10000,
    interface: 5000,
    response: 10000,
    typing: 3000,
    navigation: 5000
  },

  // Wait times
  waits: {
    betweenMessages: 1000,
    afterSend: 2000,
    forResponse: 3000,
    forLoad: 1000
  },

  // Test viewport sizes
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },

  // Feature flags
  features: {
    requiresAuth: true, // Set to true if chatbot requires authentication - UPDATED: chatbot only found in admin area
    hasTypingIndicator: true,
    hasMinimize: true,
    hasClose: true,
    persistsConversation: false,
    supportsKeyboard: true,
    hasPersonalization: false
  }
};

// Helper function to get selector string
export function getSelectorString(selectorArray: string[]): string {
  return selectorArray.join(', ');
}

// Helper function to create locator with multiple selectors
export function createMultiSelector(page: any, selectorArray: string[]) {
  return page.locator(getSelectorString(selectorArray)).first();
}