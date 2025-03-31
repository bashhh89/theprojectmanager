/**
 * MENA Launchpad Lead Generation Widget
 * 
 * This script creates a floating chat widget that can be embedded on any website
 * to collect leads using the specified agent.
 * 
 * Usage:
 * <script src="https://your-domain.com/widget.js" data-agent-id="YOUR_AGENT_ID"></script>
 */

(function() {
  // Configuration
  const config = {
    apiUrl: window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api/create-lead' 
      : 'https://' + window.location.hostname + '/api/create-lead',
    widgetPosition: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
    primaryColor: '#3b82f6', // Blue
    secondaryColor: '#1d4ed8', // Darker blue for hover states
    textColor: '#ffffff',
    widgetTitle: 'Chat with us',
    widgetSubtitle: 'Leave your contact information and we\'ll get back to you.',
    thankYouMessage: 'Thanks for reaching out! We\'ll contact you shortly.',
    agentId: null, // Will be set from script tag data attribute
  };

  // Get agent ID from script tag
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  config.agentId = currentScript.getAttribute('data-agent-id');

  if (!config.agentId) {
    console.error('MENA Launchpad Widget: No agent ID provided. Please add data-agent-id attribute to the script tag.');
    return;
  }

  // Create necessary styles
  const styles = `
    .mena-chat-widget-container * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    
    .mena-chat-widget-container {
      position: fixed;
      z-index: 999999;
    }
    
    .mena-chat-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${config.primaryColor};
      color: ${config.textColor};
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.3s ease, background-color 0.3s ease;
    }
    
    .mena-chat-widget-button:hover {
      transform: scale(1.05);
      background-color: ${config.secondaryColor};
    }
    
    .mena-chat-widget-panel {
      position: absolute;
      width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      display: none;
      flex-direction: column;
      max-height: 500px;
    }
    
    .mena-chat-widget-header {
      padding: 16px;
      background-color: ${config.primaryColor};
      color: ${config.textColor};
    }
    
    .mena-chat-widget-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .mena-chat-widget-subtitle {
      margin: 4px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .mena-chat-widget-body {
      padding: 16px;
      flex-grow: 1;
      overflow-y: auto;
    }
    
    .mena-chat-widget-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .mena-chat-widget-input {
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      width: 100%;
    }
    
    .mena-chat-widget-input:focus {
      outline: none;
      border-color: ${config.primaryColor};
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .mena-chat-widget-textarea {
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      width: 100%;
      min-height: 100px;
      resize: vertical;
    }
    
    .mena-chat-widget-textarea:focus {
      outline: none;
      border-color: ${config.primaryColor};
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .mena-chat-widget-submit {
      padding: 12px;
      background-color: ${config.primaryColor};
      color: ${config.textColor};
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    
    .mena-chat-widget-submit:hover {
      background-color: ${config.secondaryColor};
    }
    
    .mena-chat-widget-submit:disabled {
      background-color: #a0aec0;
      cursor: not-allowed;
    }
    
    .mena-chat-widget-error {
      color: #e53e3e;
      font-size: 14px;
      margin-bottom: 8px;
      display: none;
    }
    
    .mena-chat-widget-success {
      text-align: center;
      padding: 20px;
      display: none;
    }
    
    .mena-chat-widget-success-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      background-color: #48bb78;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    
    .mena-chat-widget-success-message {
      font-size: 16px;
      color: #2d3748;
      margin-bottom: 16px;
    }
    
    .mena-chat-widget-close {
      display: inline-block;
      padding: 8px 16px;
      background-color: #e2e8f0;
      color: #4a5568;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    
    .mena-chat-widget-close:hover {
      background-color: #cbd5e0;
    }
    
    .mena-chat-widget-container.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    
    .mena-chat-widget-container.bottom-right .mena-chat-widget-panel {
      bottom: 70px;
      right: 0;
    }
    
    .mena-chat-widget-container.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    
    .mena-chat-widget-container.bottom-left .mena-chat-widget-panel {
      bottom: 70px;
      left: 0;
    }
    
    .mena-chat-widget-container.top-right {
      top: 20px;
      right: 20px;
    }
    
    .mena-chat-widget-container.top-right .mena-chat-widget-panel {
      top: 70px;
      right: 0;
    }
    
    .mena-chat-widget-container.top-left {
      top: 20px;
      left: 20px;
    }
    
    .mena-chat-widget-container.top-left .mena-chat-widget-panel {
      top: 70px;
      left: 0;
    }
    
    .mena-chat-widget-loading {
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      flex-direction: column;
    }
    
    .mena-chat-widget-spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid ${config.primaryColor};
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: mena-spinner 1s linear infinite;
      margin-bottom: 8px;
    }
    
    @keyframes mena-spinner {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // Create a style element and append to head
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

  // Create widget container
  const container = document.createElement('div');
  container.className = `mena-chat-widget-container ${config.widgetPosition}`;

  // Create chat button
  const button = document.createElement('div');
  button.className = 'mena-chat-widget-button';
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" 
        stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  // Create chat panel
  const panel = document.createElement('div');
  panel.className = 'mena-chat-widget-panel';
  panel.innerHTML = `
    <div class="mena-chat-widget-header">
      <h3 class="mena-chat-widget-title">${config.widgetTitle}</h3>
      <p class="mena-chat-widget-subtitle">${config.widgetSubtitle}</p>
    </div>
    <div class="mena-chat-widget-body">
      <div class="mena-chat-widget-error"></div>
      <form class="mena-chat-widget-form">
        <input type="text" class="mena-chat-widget-input" placeholder="Your name" required>
        <input type="email" class="mena-chat-widget-input" placeholder="Your email" required>
        <textarea class="mena-chat-widget-textarea" placeholder="Your message (optional)"></textarea>
        <button type="submit" class="mena-chat-widget-submit">Send</button>
      </form>
      <div class="mena-chat-widget-loading">
        <div class="mena-chat-widget-spinner"></div>
        <p>Sending...</p>
      </div>
      <div class="mena-chat-widget-success">
        <div class="mena-chat-widget-success-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="mena-chat-widget-success-message">${config.thankYouMessage}</p>
        <div class="mena-chat-widget-close">Close</div>
      </div>
    </div>
  `;

  // Append elements to container
  container.appendChild(panel);
  container.appendChild(button);

  // Append container to body
  document.body.appendChild(container);

  // Get elements
  const form = container.querySelector('.mena-chat-widget-form');
  const nameInput = container.querySelector('.mena-chat-widget-input');
  const emailInput = container.querySelector('.mena-chat-widget-input:nth-of-type(2)');
  const messageInput = container.querySelector('.mena-chat-widget-textarea');
  const submitButton = container.querySelector('.mena-chat-widget-submit');
  const errorMessage = container.querySelector('.mena-chat-widget-error');
  const loadingState = container.querySelector('.mena-chat-widget-loading');
  const successState = container.querySelector('.mena-chat-widget-success');
  const closeButton = container.querySelector('.mena-chat-widget-close');

  // Function to toggle chat panel
  function togglePanel() {
    const isVisible = panel.style.display === 'flex';
    panel.style.display = isVisible ? 'none' : 'flex';
  }

  // Function to validate email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Function to show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  // Function to hide error message
  function hideError() {
    errorMessage.style.display = 'none';
  }

  // Function to handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    hideError();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    // Validate inputs
    if (!name) {
      showError('Please enter your name');
      return;
    }

    if (!email) {
      showError('Please enter your email');
      return;
    }

    if (!isValidEmail(email)) {
      showError('Please enter a valid email address');
      return;
    }

    // Disable button and show loading state
    submitButton.disabled = true;
    form.style.display = 'none';
    loadingState.style.display = 'flex';

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          initial_message: message,
          agent_id: config.agentId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Show success state
      loadingState.style.display = 'none';
      successState.style.display = 'block';

    } catch (err) {
      // Show error and reset form
      loadingState.style.display = 'none';
      form.style.display = 'flex';
      submitButton.disabled = false;
      showError(err.message || 'Failed to send message. Please try again later.');
    }
  }

  // Event listeners
  button.addEventListener('click', togglePanel);
  form.addEventListener('submit', handleSubmit);
  closeButton.addEventListener('click', () => {
    panel.style.display = 'none';
    
    // Reset form after a delay (when panel is closed)
    setTimeout(() => {
      form.reset();
      form.style.display = 'flex';
      successState.style.display = 'none';
      hideError();
      submitButton.disabled = false;
    }, 300);
  });

})();