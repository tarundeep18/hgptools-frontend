import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const getSocketUrl = () => {
  // Use environment variable or fallback to localhost:5000
  const configuredUrl = import.meta.env.VITE_REACT_APP_SOCKET_BASEURL || "http://localhost:5000";
  
  const cleanUrl = configuredUrl
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
  
  console.log('🔌 Connecting to Socket.IO at:', cleanUrl);
  return cleanUrl;
};

const normalizeId = (value) => String(value ?? "").trim();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const companySubscriptionsRef = useRef(new Map());
  const streamSubscriptionsRef = useRef(new Map());
  const lastEventIdRef = useRef("");
  const reconnectAttemptsRef = useRef(0);

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [transport, setTransport] = useState("");
  const [lastSPCEvent, setLastSPCEvent] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const emitSubscription = useCallback((eventName, payload) => {
    const activeSocket = socketRef.current;
    if (!activeSocket?.connected) {
      console.warn(`Socket not connected, cannot emit ${eventName}`);
      return;
    }

    activeSocket.emit(eventName, payload, (response) => {
      if (response?.success === false) {
        console.error(`${eventName} failed:`, response.message);
      } else {
        console.log(`${eventName} successful:`, response);
      }
    });
  }, []);

  const restoreSubscriptions = useCallback(() => {
    console.log('🔄 Restoring subscriptions...');
    console.log(`📋 Company subscriptions: ${companySubscriptionsRef.current.size}`);
    console.log(`📋 Stream subscriptions: ${streamSubscriptionsRef.current.size}`);

    companySubscriptionsRef.current.forEach((count, companyId) => {
      if (count > 0) {
        console.log(`🔄 Restoring company: ${companyId}`);
        emitSubscription("spc:subscribe-company", { companyId });
      }
    });

    streamSubscriptionsRef.current.forEach((count, spcStreamKey) => {
      if (count > 0) {
        console.log(`🔄 Restoring stream: ${spcStreamKey}`);
        emitSubscription("spc:subscribe-stream", { spcStreamKey });
      }
    });
  }, [emitSubscription]);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    console.log(`🔌 Initializing Socket.IO connection to: ${socketUrl}`);

    const activeSocket = io(socketUrl, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      upgrade: true,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = activeSocket;
    setSocket(activeSocket);
    setConnectionError(null);

    const handleConnect = () => {
      const currentTransport =
        activeSocket.io.engine?.transport?.name || "unknown";

      console.log(`✅ Socket.IO connected! ID: ${activeSocket.id}`);
      console.log(`📡 Transport: ${currentTransport}`);
      
      setIsConnected(true);
      setSocketId(activeSocket.id);
      setTransport(currentTransport);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
      
      // Restore subscriptions after successful connection
      setTimeout(() => {
        restoreSubscriptions();
      }, 100);

      activeSocket.io.engine?.once("upgrade", (upgradedTransport) => {
        console.log(`⬆️ Transport upgraded to: ${upgradedTransport.name}`);
        setTransport(upgradedTransport.name);
      });
    };

    const handleDisconnect = (reason) => {
      console.log(`❌ Socket.IO disconnected: ${reason}`);
      setIsConnected(false);
      setSocketId(null);
      setTransport("");
    };

    const handleConnectError = (error) => {
      console.error("❌ Socket.IO connection error:", error);
      setConnectionError(error.message || "Connection failed");
      setIsConnected(false);
      
      reconnectAttemptsRef.current += 1;
      console.log(`🔄 Reconnection attempt ${reconnectAttemptsRef.current}`);
    };

    const handleReconnect = (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
    };

    const handleReconnectFailed = () => {
      console.error("❌ Reconnection failed after all attempts");
      setConnectionError("Failed to reconnect after multiple attempts");
    };

    const publishSPCEvent = (eventName, payload = {}) => {
      const eventId = normalizeId(payload.eventId);

      // The backend may publish the same change to both the company room and
      // the specific SPC stream room. Keep only one UI invalidation event.
      if (eventId && lastEventIdRef.current === eventId) {
        console.log(`⏭️ Skipping duplicate event: ${eventId}`);
        return;
      }
      if (eventId) lastEventIdRef.current = eventId;

      console.log(`📨 Received ${eventName}:`, payload);
      setLastSPCEvent({
        ...payload,
        eventName,
        receivedAt: new Date().toISOString(),
      });
    };

    const handleSPCDataChanged = (payload) =>
      publishSPCEvent("spc:data-changed", payload);
    const handleSPCStreamChanged = (payload) =>
      publishSPCEvent("spc:stream-changed", payload);

    activeSocket.on("connect", handleConnect);
    activeSocket.on("disconnect", handleDisconnect);
    activeSocket.on("connect_error", handleConnectError);
    activeSocket.on("reconnect", handleReconnect);
    activeSocket.on("reconnect_failed", handleReconnectFailed);
    activeSocket.on("spc:data-changed", handleSPCDataChanged);
    activeSocket.on("spc:stream-changed", handleSPCStreamChanged);

    // Log socket events for debugging
    activeSocket.onAny((event, ...args) => {
      console.log(`🔔 Socket event: ${event}`, args);
    });

    return () => {
      console.log("🧹 Cleaning up Socket.IO connection...");
      activeSocket.off("connect", handleConnect);
      activeSocket.off("disconnect", handleDisconnect);
      activeSocket.off("connect_error", handleConnectError);
      activeSocket.off("reconnect", handleReconnect);
      activeSocket.off("reconnect_failed", handleReconnectFailed);
      activeSocket.off("spc:data-changed", handleSPCDataChanged);
      activeSocket.off("spc:stream-changed", handleSPCStreamChanged);
      activeSocket.offAny();
      activeSocket.disconnect();

      socketRef.current = null;
      setSocket(null);
    };
  }, [restoreSubscriptions]);

  const emit = useCallback((eventName, payload, acknowledgement) => {
    const activeSocket = socketRef.current;

    if (!activeSocket?.connected) {
      console.warn(`Socket not connected. Event not emitted: ${eventName}`);
      return false;
    }

    activeSocket.emit(eventName, payload, acknowledgement);
    return true;
  }, []);

  const unsubscribeCompany = useCallback((companyId) => {
    const normalizedCompanyId = normalizeId(companyId);
    if (!normalizedCompanyId) return;

    const currentCount =
      companySubscriptionsRef.current.get(normalizedCompanyId) || 0;

    if (currentCount > 1) {
      companySubscriptionsRef.current.set(
        normalizedCompanyId,
        currentCount - 1,
      );
      return;
    }

    companySubscriptionsRef.current.delete(normalizedCompanyId);

    const activeSocket = socketRef.current;
    if (activeSocket?.connected) {
      activeSocket.emit("spc:unsubscribe-company", {
        companyId: normalizedCompanyId,
      });
    }
  }, []);

  const subscribeCompany = useCallback(
    (companyId) => {
      const normalizedCompanyId = normalizeId(companyId);
      if (!normalizedCompanyId) return () => {};

      const currentCount =
        companySubscriptionsRef.current.get(normalizedCompanyId) || 0;
      companySubscriptionsRef.current.set(
        normalizedCompanyId,
        currentCount + 1,
      );

      if (currentCount === 0) {
        emitSubscription("spc:subscribe-company", {
          companyId: normalizedCompanyId,
        });
      }

      return () => unsubscribeCompany(normalizedCompanyId);
    },
    [emitSubscription, unsubscribeCompany],
  );

  const unsubscribeStream = useCallback((spcStreamKey) => {
    const normalizedStreamKey = normalizeId(spcStreamKey);
    if (!normalizedStreamKey) return;

    const currentCount =
      streamSubscriptionsRef.current.get(normalizedStreamKey) || 0;

    if (currentCount > 1) {
      streamSubscriptionsRef.current.set(
        normalizedStreamKey,
        currentCount - 1,
      );
      return;
    }

    streamSubscriptionsRef.current.delete(normalizedStreamKey);

    const activeSocket = socketRef.current;
    if (activeSocket?.connected) {
      activeSocket.emit("spc:unsubscribe-stream", {
        spcStreamKey: normalizedStreamKey,
      });
    }
  }, []);

  const subscribeStream = useCallback(
    (spcStreamKey) => {
      const normalizedStreamKey = normalizeId(spcStreamKey);
      if (!normalizedStreamKey) return () => {};

      const currentCount =
        streamSubscriptionsRef.current.get(normalizedStreamKey) || 0;
      streamSubscriptionsRef.current.set(
        normalizedStreamKey,
        currentCount + 1,
      );

      if (currentCount === 0) {
        emitSubscription("spc:subscribe-stream", {
          spcStreamKey: normalizedStreamKey,
        });
      }

      return () => unsubscribeStream(normalizedStreamKey);
    },
    [emitSubscription, unsubscribeStream],
  );

  const clearLastSPCEvent = useCallback(() => {
    lastEventIdRef.current = "";
    setLastSPCEvent(null);
  }, []);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      socketId,
      transport,
      lastSPCEvent,
      connectionError,
      emit,
      subscribeCompany,
      unsubscribeCompany,
      subscribeStream,
      unsubscribeStream,
      clearLastSPCEvent,
    }),
    [
      socket,
      isConnected,
      socketId,
      transport,
      lastSPCEvent,
      connectionError,
      emit,
      subscribeCompany,
      unsubscribeCompany,
      subscribeStream,
      unsubscribeStream,
      clearLastSPCEvent,
    ],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }

  return context;
};