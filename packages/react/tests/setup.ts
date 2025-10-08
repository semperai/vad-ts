import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock MediaStream and related APIs
global.MediaStream = class MediaStream {
  id = 'mock-stream'
  active = true
  getTracks() {
    return []
  }
  getAudioTracks() {
    return []
  }
  getVideoTracks() {
    return []
  }
  addTrack() {}
  removeTrack() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true
  }
} as any

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(),
  },
})
