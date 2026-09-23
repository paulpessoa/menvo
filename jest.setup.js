import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'node:util'

// jsdom has no TextEncoder/TextDecoder; @langchain/core's dependency chain
// (langsmith/uuid) needs it just to be imported, even in tests that only
// exercise pure logic and never touch the network.
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder
}

// Bridge standard Web API globals from Node into Jest JSDOM context
if (typeof global.Request === 'undefined' && typeof Request !== 'undefined') {
  global.Request = Request
}
if (typeof global.Response === 'undefined' && typeof Response !== 'undefined') {
  global.Response = Response
}
if (typeof global.Headers === 'undefined' && typeof Headers !== 'undefined') {
  global.Headers = Headers
}
if (typeof global.fetch === 'undefined' && typeof fetch !== 'undefined') {
  global.fetch = fetch
}
