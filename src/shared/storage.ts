export const getStorageData = async <T>(key: string, defaultValue: T): Promise<T> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve((result[key] !== undefined ? result[key] : defaultValue) as T);
    });
  });
};

export const setStorageData = async <T>(key: string, value: T): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
};
