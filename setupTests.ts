import '@testing-library/jest-dom';
import './harbour.test';

import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, vi } from 'vitest';

global.window.prompt = (_message, _defaultValue) => {
  return _message ?? '';
};

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

expect.extend(matchers);
