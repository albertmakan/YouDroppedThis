import { ref, onUnmounted, computed } from 'vue'
import type { WebSocketMessage } from '@/shared/types'

interface WebSocketService {
  socket: WebSocket | null
  isConnected: boolean
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectInterval: number
}

export function useWebSocket() {
  const service = ref<WebSocketService>({
    socket: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectInterval: 3000,
  })

  let messageHandler: ((message: WebSocketMessage) => void) | null = null
  let reconnectTimeout: number | null = null

  function connect(url: string, onMessage?: (message: WebSocketMessage) => void) {
    if (service.value.socket?.readyState === WebSocket.OPEN) {
      return
    }

    messageHandler = onMessage || null

    try {
      service.value.socket = new WebSocket(url)

      service.value.socket.onopen = () => {
        console.log('🔌 WebSocket connected')
        service.value.isConnected = true
        service.value.reconnectAttempts = 0

        // Authenticate if user is logged in
        const token = localStorage.getItem('auth_token')
        if (token) {
          // You'd need to decode the JWT to get user ID, or send token for server to decode
          send({ type: 'auth', data: { token } })
        }
      }

      service.value.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)

          if (message.type === 'ping') {
            send({ type: 'pong' })
            return
          }

          if (messageHandler) {
            messageHandler(message)
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      service.value.socket.onclose = (closeEvent) => {
        console.log('🔌 WebSocket disconnected:', closeEvent.code)
        service.value.isConnected = false
        service.value.socket = null

        // Attempt reconnection
        const shouldReconnect = closeEvent.code !== 1005 //?
        if (
          service.value.reconnectAttempts < service.value.maxReconnectAttempts &&
          shouldReconnect
        ) {
          service.value.reconnectAttempts++
          console.log(
            `🔄 Attempting reconnection ${service.value.reconnectAttempts}/${service.value.maxReconnectAttempts}`,
          )

          reconnectTimeout = setTimeout(() => {
            connect(url, messageHandler || undefined)
          }, service.value.reconnectInterval)
        }
      }

      service.value.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  function send(message: WebSocketMessage) {
    if (service.value.socket?.readyState === WebSocket.OPEN) {
      service.value.socket.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }

  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    if (service.value.socket) {
      service.value.socket.close()
      service.value.socket = null
    }

    service.value.isConnected = false
    service.value.reconnectAttempts = 0
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected: computed(() => service.value.isConnected),
    connect,
    send,
    disconnect,
  }
}
