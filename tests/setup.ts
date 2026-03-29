import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';

// Polyfill Blob.text() for jsdom environments that don't support it
if (typeof Blob.prototype.text !== 'function') {
  Blob.prototype.text = function () {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}
