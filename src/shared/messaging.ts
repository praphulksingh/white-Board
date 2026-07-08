export type MessageType =
  | 'TOGGLE_BOARD'
  | 'BOARD_STATE_SYNC'
  | 'GET_BOARD_STATE';

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

export const sendMessageToTab = async (tabId: number, message: ExtensionMessage) => {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.warn('Failed to send message to tab', tabId, error);
  }
};

export const sendMessageToBackground = async (message: ExtensionMessage) => {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.warn('Failed to send message to background', error);
  }
};
