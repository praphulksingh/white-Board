import { ExtensionMessage } from '@/shared/messaging';

chrome.runtime.onInstalled.addListener(() => {
  console.log('GestureBoard Extension Installed');
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'TOGGLE_BOARD') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_BOARD' });
      }
    });
    sendResponse({ success: true });
    return true; // Keep message channel open
  }

  // Handle other background messaging logic here...
});
