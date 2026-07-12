import { io, Socket } from 'socket.io-client';
import {
  ClientToServer,
  ServerToClient,
} from '../interfaces/responses/socketResponses';

// Define the socket service
class SocketService {
  private socket: Socket | null = null;

  // Initialize the socket
  init(baseURL: string) {
    if (this.socket) return this.socket;
    this.socket = io(baseURL, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      timeout: 10000,
    });
    return this.socket;
  }

  // Connect to the socket
  connect(token: string) {
    if (!this.socket) throw new Error('Call init() first');
    this.socket.auth = { token };
    this.socket.connect();
  }

  // Disconnect from the socket
  disconnect() {
    this.socket?.disconnect();
  }

  // Lifecycle wrappers
  // On connect
  onConnect(cb: () => void) {
    this.socket?.on('connect', cb);
    return () => this.socket?.off('connect', cb);
  }

  // On disconnect
  onDisconnect(cb: () => void) {
    this.socket?.on('disconnect', cb);
    return () => this.socket?.off('disconnect', cb);
  }

  // On connect error
  onConnectError(cb: (err: unknown) => void) {
    this.socket?.on('connect_error', cb);
    return () => this.socket?.off('connect_error', cb);
  }

  // Event handlers
  // On event
  on<E extends keyof ServerToClient>(
    event: E,
    handler: (data: ServerToClient[E]) => void
  ) {
    this.socket?.on(event as string, handler);
    return () => this.off(event, handler);
  }

  // Off event
  off<E extends keyof ServerToClient>(
    event: E,
    handler: (data: ServerToClient[E]) => void
  ) {
    this.socket?.off(event as string, handler);
  }

  // Emit event
  emit<E extends keyof ClientToServer>(event: E, payload: ClientToServer[E]) {
    this.socket?.emit(event as string, payload);
  }

  // Check if connected
  isConnected() {
    return !!this.socket?.connected;
  }
}

export const socketService = new SocketService();
