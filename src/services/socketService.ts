// services/SocketService.ts
import { Manager, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PaymentSuccessData {
  success: boolean;
  userId: string;
  message: string;
  plan: string;
  amount: number;
  currency: string;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  timestamp: string;
}

interface PaymentErrorData {
  success: false;
  message: string;
  error: string;
}

class SocketService {
  public socket: Socket | null = null;
  private manager: Manager | null = null;
  private userId: string | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  /**
   * Socket server should use host origin, not REST API path (e.g. /api/v1).
   */
  private getSocketServerUrl(serverUrl: string): string {
    try {
      const parsedUrl = new URL(serverUrl);
      return parsedUrl.origin;
    } catch {
      // Fallback for malformed/relative values.
      const cleaned = serverUrl
        .replace(/\/api\/v\d+\/?$/, "")
        .replace(/\?.*$/, "")
        .replace(/#.*$/, "")
        .replace(/\/socket\.io\/?$/, "")
        .replace(/\/$/, "");

      return cleaned;
    }
  }

  /**
   * Initialize and connect socket to server
   */
  async connect(serverUrl: string, userId: string): Promise<void> {
    try {
      if (this.socket?.connected) {
        console.log("✅ Socket already connected");
        return;
      }

      if (this.isConnecting) {
        console.warn("⚠️ Socket connection already in progress");
        return;
      }

      this.isConnecting = true;
      this.userId = userId;

      const socketServerUrl = this.getSocketServerUrl(serverUrl);

      console.log(`🔌 Connecting socket to ${socketServerUrl} for user: ${userId}`);

      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      }

      if (this.manager) {
        this.manager.removeAllListeners();
      }

      this.manager = new Manager(socketServerUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: ["polling", "websocket"],
        autoConnect: false,
        path: "/socket.io",
        timeout: 20000,
        upgrade: true,
      });

      this.socket = this.manager.socket("/", {
        auth: {
          userId: userId,
        },
      });

      this.socket.connect();

      // ===== CONNECTION EVENTS =====
      this.socket.on("connect", () => {
        console.log(`✅ Socket connected: ${this.socket?.id}`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.registerUser();
      });

      this.socket.on("disconnect", (reason: string) => {
        console.log(`❌ Socket disconnected: ${reason}`);
        // Socket will auto-reconnect based on reconnection config
      });

      this.socket.on("connect_error", (error: any) => {
        console.error("❌ Socket connection error:", {
          message: error?.message,
          description: error?.description,
          context: error?.context,
          type: error?.type,
          data: error?.data,
        });
        this.isConnecting = false;
      });

      this.socket.on("reconnect_attempt", (attempt: number) => {
        this.reconnectAttempts = attempt;
        console.log(`🔄 Socket reconnect attempt ${attempt}/${this.maxReconnectAttempts}`);
      });

      this.socket.on("reconnect_failed", () => {
        console.error("❌ Socket reconnection failed after max attempts");
        this.isConnecting = false;
      });

      // ===== CUSTOM EVENTS =====
      this.socket.on("registration-success", (data: any) => {
        console.log(`✅ User registered with socket:`, data);
      });

      this.socket.on("session-replaced", (data: any) => {
        console.warn("⚠️ " + data.message);
        this.handleSessionReplaced();
      });

      this.socket.on("error", (error: any) => {
        console.error("❌ Socket error event:", error);
      });

    } catch (error) {
      console.error("❌ Failed to connect socket:", error);
      this.isConnecting = false;
    }
  }

  /**
   * Register user after socket connection
   */
  private registerUser(): void {
    if (this.socket && this.userId) {
      this.socket.emit("register-user", this.userId);
      console.log(`📱 Registering user: ${this.userId}`);
    }
  }

  /**
   * Handle session replaced (user logged in from another device)
   */
  private handleSessionReplaced(): void {
    // This should logout the current user
    console.log("🚪 Clearing auth and logging out");
    AsyncStorage.removeItem("authToken");
    AsyncStorage.removeItem("userId");
    // You should emit an event or dispatch Redux action here
    // Example: store.dispatch(logoutUser());
  }

  /**
   * Listen for payment success event
   */
  listenToPaymentSuccess(callback: (data: PaymentSuccessData) => void): void {
    if (!this.socket) {
      console.warn("⚠️ Socket not initialized");
      return;
    }

    this.socket.on("payment-success", (data: PaymentSuccessData) => {
      console.log("💰 Payment success event received:", data);
      callback(data);
    });
  }

  /**
   * Listen for payment error event
   */
  listenToPaymentError(callback: (data: PaymentErrorData) => void): void {
    if (!this.socket) {
      console.warn("⚠️ Socket not initialized");
      return;
    }

    this.socket.on("payment-error", (data: PaymentErrorData) => {
      console.error("❌ Payment error event received:", data);
      callback(data);
    });
  }

  /**
   * Remove payment success listener
   */
  removePaymentSuccessListener(): void {
    if (!this.socket) return;
    this.socket.off("payment-success");
    console.log("🧹 Removed payment-success listener");
  }

  /**
   * Remove payment error listener
   */
  removePaymentErrorListener(): void {
    if (!this.socket) return;
    this.socket.off("payment-error");
    console.log("🧹 Removed payment-error listener");
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    if (!this.socket) return;
    this.socket.off("payment-success");
    this.socket.off("payment-error");
    console.log("🧹 Removed all payment listeners");
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Manually reconnect socket
   */
  reconnect(): void {
    if (this.socket) {
      console.log("🔄 Manually reconnecting socket...");
      this.socket.connect();
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log("🔌 Socket disconnected");
    }

    if (this.manager) {
      this.manager.removeAllListeners();
      this.manager = null;
    }
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | null {
    return this.socket?.id ?? null;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.userId;
  }
}

// Export singleton instance
export default new SocketService();