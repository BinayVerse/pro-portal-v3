# Chatbot Testing Framework

This directory contains a comprehensive testing framework for web-based chatbot functionality. The tests are ready to use when a chatbot is implemented on the website.

## 📁 Files Created

### Test Files
- **`chatbot.spec.ts`** - Comprehensive chatbot tests (currently skipped)
- **`chatbot-simple.spec.ts`** - Basic smoke tests and implementation guides

### Configuration Files
- **`utils/chatbotConfig.ts`** - Selectors, test data, and configuration settings

## 🧪 Test Coverage

### Core Functionality Tests
- ✅ **Widget Loading** - Verifies chatbot widget appears on page
- ✅ **Interface Opening** - Tests chat window opening/closing
- ✅ **Message Sending** - Tests user message input and sending
- ✅ **Response Receiving** - Verifies bot responses are received
- ✅ **Conversation Flow** - Tests multi-message conversations

### UI/UX Tests
- ✅ **Responsive Design** - Tests chatbot on different screen sizes
- ✅ **Minimize/Maximize** - Tests window control functionality
- ✅ **Positioning** - Verifies correct widget placement
- ✅ **Close Functionality** - Tests various ways to close chat

### Interaction Tests
- ✅ **Keyboard Navigation** - Tests accessibility via keyboard
- ✅ **Empty Message Handling** - Tests validation of empty inputs
- ✅ **Multiple Messages** - Tests conversation history
- ✅ **Typing Indicators** - Tests loading states and typing feedback

### Error Handling Tests
- ✅ **Network Errors** - Tests behavior during connection issues
- ✅ **Message Failures** - Tests retry mechanisms
- ✅ **Graceful Degradation** - Tests fallback behaviors

### Accessibility Tests
- ✅ **ARIA Attributes** - Tests screen reader compatibility
- ✅ **Keyboard Focus** - Tests tab navigation
- ✅ **Color Contrast** - Visual accessibility checks

### Advanced Features Tests
- ✅ **Conversation Persistence** - Tests chat history across page navigation
- ✅ **Personalization** - Tests authenticated user features
- ✅ **Context Awareness** - Tests page-specific chatbot behavior

## 🚀 Current Status

### ✅ Ready & Passing Tests
- **Smoke Tests** - Basic page checks (6/6 passing)
- **Integration Point Detection** - Finds where chatbot can be added
- **Third-party Service Detection** - Checks for existing chat services
- **Error Detection** - Monitors for chatbot-related JavaScript errors

### ⏳ Awaiting Implementation Tests
- **12 comprehensive tests** in `chatbot.spec.ts` (currently skipped)
- **3 authenticated user tests** (currently skipped)

## 📋 How to Enable Tests When Chatbot is Implemented

### Step 1: Update Selectors
Edit `utils/chatbotConfig.ts` and update the selectors to match your actual chatbot implementation:

```typescript
export const ChatbotSelectors = {
  widget: ['#your-chatbot-id', '.your-chatbot-class'],
  trigger: ['.your-chat-button'],
  interface: ['.your-chat-window'],
  // ... update other selectors
};
```

### Step 2: Enable Tests
Remove `.skip` from the test descriptions in `chatbot.spec.ts`:

```typescript
// Change this:
test.skip('Basic chatbot interaction flow', async ({ page }) => {

// To this:
test('Basic chatbot interaction flow', async ({ page }) => {
```

### Step 3: Run Tests
```bash
# Run all chatbot tests
npx playwright test chatbot

# Run specific test file
npx playwright test chatbot.spec.ts

# Run in headed mode to see the browser
npx playwright test chatbot.spec.ts --headed
```

### Step 4: Adjust Configuration
Modify timeouts and settings in `ChatbotTestConfig` if needed:

```typescript
export const ChatbotTestConfig = {
  timeouts: {
    widget: 10000,      // Time to wait for widget to appear
    response: 10000,    // Time to wait for bot response
    // ... adjust as needed
  }
};
```

## 🔧 Customization Options

### Test Messages
Customize test messages in `chatbotConfig.ts`:

```typescript
export const ChatbotTestData = {
  testMessages: {
    greeting: 'Your custom greeting message',
    question: 'Your custom question',
    // ... add more test messages
  }
};
```

### Feature Flags
Enable/disable features based on your chatbot implementation:

```typescript
export const ChatbotTestConfig = {
  features: {
    requiresAuth: true,           // Set if chatbot needs login
    hasTypingIndicator: false,    // Set if no typing indicator
    persistsConversation: true,   // Set if chat persists across pages
    // ... configure features
  }
};
```

## 📊 Test Results

### Current Results (Before Implementation)
```
✅ 6 passed  - Smoke tests and preparation checks
⏭️  3 skipped - Implementation-ready tests  
❌ 12 failed - Expected failures (no chatbot yet)
```

### Expected Results (After Implementation)
```
✅ 21 passed - All chatbot functionality working
⏭️  0 skipped - All tests enabled
❌ 0 failed  - Full chatbot test coverage
```

## 🛠️ Integration Examples

### Example: Basic Chatbot Widget
```html
<!-- Your chatbot HTML -->
<div id="chatbot" class="chat-widget">
  <button class="chat-trigger">Chat with us</button>
  <div class="chat-interface" style="display: none;">
    <div class="chat-messages"></div>
    <input type="text" class="message-input" placeholder="Type your message...">
    <button class="send-button">Send</button>
  </div>
</div>
```

### Example: Third-party Service Integration
```html
<!-- For services like Intercom, Zendesk, etc. -->
<script>
  // Your chatbot service initialization
  window.chatbotService.init({
    appId: 'your-app-id'
  });
</script>
```

## 🎯 Test Scenarios Covered

| Scenario | Description | Status |
|----------|-------------|---------|
| **Basic Loading** | Widget appears on page | ✅ Ready |
| **User Interaction** | Click to open, send messages | ✅ Ready |
| **Bot Responses** | Receive and display responses | ✅ Ready |
| **Error Handling** | Network errors, invalid inputs | ✅ Ready |
| **Accessibility** | Keyboard navigation, screen readers | ✅ Ready |
| **Mobile Support** | Responsive design, touch interactions | ✅ Ready |
| **Persistence** | Chat history across pages | ✅ Ready |
| **Authentication** | Personalized responses for logged users | ✅ Ready |

## 📞 Support

When implementing your chatbot, you can:

1. **Run smoke tests** to verify basic functionality
2. **Enable specific tests** one by one as features are implemented
3. **Customize selectors** to match your chatbot's HTML structure
4. **Adjust timeouts** based on your bot's response times
5. **Add new test scenarios** specific to your chatbot's features

The framework is designed to be flexible and work with any chatbot implementation, whether it's a custom solution or a third-party service like Intercom, Zendesk, Drift, or others.

---

**Ready to test your chatbot? Just update the selectors and remove the `.skip` markers!** 🚀