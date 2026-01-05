(function() {
  'use strict';

  // Get configuration from script tag
  var script = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  console.log("i am loading widget.js")
  var token = script.getAttribute('data-token');
  var position = script.getAttribute('data-position') || 'bottom-right';
  var buttonText = script.getAttribute('data-button-text') || 'Feedback';
  var theme = script.getAttribute('data-theme') || 'auto';

  if (!token) {
    console.error('Signalstack Widget: Missing data-token attribute');
    return;
  }

  // Get base URL from script src
  var baseUrl = script.src.replace('/widget.js', '');

  // Create styles
  var styles = document.createElement('style');
  styles.textContent = `
    .signalstack-widget-button {
      position: fixed;
      ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      bottom: 20px;
      z-index: 99999;
      padding: 12px 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .signalstack-widget-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
    }
    .signalstack-widget-button svg {
      width: 16px;
      height: 16px;
    }
    .signalstack-widget-iframe-container {
      position: fixed;
      ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      bottom: 80px;
      z-index: 99999;
      width: 380px;
      height: 500px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 120px);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      display: none;
    }
    .signalstack-widget-iframe-container.open {
      display: block;
      animation: signalstack-slide-up 0.3s ease-out;
    }
    .signalstack-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    @keyframes signalstack-slide-up {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @media (max-width: 480px) {
      .signalstack-widget-iframe-container {
        width: calc(100vw - 20px);
        ${position.includes('right') ? 'right: 10px;' : 'left: 10px;'}
        bottom: 70px;
        height: 60vh;
      }
      .signalstack-widget-button {
        ${position.includes('right') ? 'right: 10px;' : 'left: 10px;'}
        bottom: 10px;
      }
    }
  `;
  document.head.appendChild(styles);

  // Create button
  var button = document.createElement('button');
  button.className = 'signalstack-widget-button';
  button.innerHTML = `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
    ${buttonText}
  `;

  // Create iframe container
  var iframeContainer = document.createElement('div');
  iframeContainer.className = 'signalstack-widget-iframe-container';

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.className = 'signalstack-widget-iframe';
  iframe.src = baseUrl + '/widget/' + token;
  iframe.title = 'Feedback Widget';
  iframe.allow = 'clipboard-write';

  iframeContainer.appendChild(iframe);

  // Toggle widget
  var isOpen = false;
  button.addEventListener('click', function() {
    isOpen = !isOpen;
    if (isOpen) {
      iframeContainer.classList.add('open');
    } else {
      iframeContainer.classList.remove('open');
    }
  });

  // Close on escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      iframeContainer.classList.remove('open');
    }
  });

  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (isOpen && !button.contains(e.target) && !iframeContainer.contains(e.target)) {
      isOpen = false;
      iframeContainer.classList.remove('open');
    }
  });

  // Add to DOM
  document.body.appendChild(button);
  document.body.appendChild(iframeContainer);
})();
