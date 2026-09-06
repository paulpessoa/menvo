import '@testing-library/jest-dom'

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
