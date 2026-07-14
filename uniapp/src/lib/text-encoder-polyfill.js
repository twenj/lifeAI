// App-Plus 没有浏览器原生 TextEncoder，二维码库需要这个 API。
const root = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {})
if (typeof root.TextEncoder !== 'function') {
  root.TextEncoder = class TextEncoderPolyfill {
    encode(value) {
      const binary = unescape(encodeURIComponent(String(value)))
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
      return bytes
    }
  }
}
