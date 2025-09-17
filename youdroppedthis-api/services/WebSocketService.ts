import { Context } from "../deps.ts";

export interface WebSocketMessage {
  type:
    | "artwork_placed"
    | "artwork_collected"
    | "artwork_expired"
    | "user_update";
  data: any;
}

interface ConnectedClient {
  socket: WebSocket;
  userId?: number;
}

export class WebSocketService {
  private static clients = new Set<ConnectedClient>();

  handleConnection(socket: WebSocket, ctx: Context) {
    const client: ConnectedClient = { socket };
    WebSocketService.clients.add(client);

    console.log(
      `🔌 WebSocket client connected (${WebSocketService.clients.size} total)`
    );

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(client, message);
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    socket.onclose = () => {
      WebSocketService.clients.delete(client);
      console.log(
        `🔌 WebSocket client disconnected (${WebSocketService.clients.size} total)`
      );
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      WebSocketService.clients.delete(client);
    };
  }

  private handleMessage(client: ConnectedClient, message: any) {
    switch (message.type) {
      case "auth":
        client.userId = message.userId;
        break;
      case "ping":
        client.socket.send(JSON.stringify({ type: "pong" }));
        break;
    }
  }

  static broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(messageStr);
        } catch (error) {
          console.error("Error sending WebSocket message:", error);
          this.clients.delete(client);
        }
      }
    }
  }

  static sendToUser(userId: number, message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);

    for (const client of this.clients) {
      if (
        client.userId === userId &&
        client.socket.readyState === WebSocket.OPEN
      ) {
        try {
          client.socket.send(messageStr);
        } catch (error) {
          console.error("Error sending WebSocket message to user:", error);
          this.clients.delete(client);
        }
      }
    }
  }
}
