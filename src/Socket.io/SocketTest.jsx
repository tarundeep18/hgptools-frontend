import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const TestSocketConnection = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [testInput, setTestInput] = useState("");
  const [transport, setTransport] = useState("");
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const configuredUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_REACT_APP_BACKEND_BASEURL ||
      "http://localhost:5000";

    // Socket.IO connects to the server origin, not /api/v1.
    const socketUrl = configuredUrl
      .replace(/\/api\/v1\/?$/, "")
      .replace(/\/$/, "");

    console.log("🔌 Connecting to Socket.IO at:", socketUrl);
    console.log("📍 Frontend URL:", window.location.href);

    const newSocket = io(socketUrl, {
      path: "/socket.io",

      transports: ["polling", "websocket"],
      upgrade: true,

      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,

      timeout: 20000,
      withCredentials: true,

      // Never add Access-Control-Allow-Origin here.
      // It is a server response header.
    });

    const handleConnect = () => {
      const currentTransport =
        newSocket.io.engine?.transport?.name || "unknown";

      console.log("✅ Socket.IO connected:", newSocket.id);
      console.log("📡 Transport:", currentTransport);

      setIsConnected(true);
      setSocketId(newSocket.id);
      setTransport(currentTransport);
      setConnectionAttempts(0);

      addMessage("success", `✅ Connected! ID: ${newSocket.id}`);

      addMessage("info", `📡 Transport: ${currentTransport}`);

      // Engine instance can change after reconnection,
      // so register this after each successful connection.
      newSocket.io.engine?.once("upgrade", (upgradedTransport) => {
        console.log("⬆️ Transport upgraded to:", upgradedTransport.name);

        setTransport(upgradedTransport.name);

        addMessage("info", `⬆️ Upgraded to ${upgradedTransport.name}`);
      });
    };

    const handleWelcome = (data) => {
      console.log("🎉 Welcome:", data);

      addMessage("welcome", `🎉 ${data.message}`);
    };

    const handleConnectError = (error) => {
      console.error("❌ Socket.IO connection error:", {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type,
      });

      setIsConnected(false);
      setSocketId(null);
      setConnectionAttempts((previous) => previous + 1);

      addMessage("error", `❌ Connection error: ${error.message}`);
    };

    const handleDisconnect = (reason, details) => {
      console.log("🔴 Socket disconnected:", reason, details);

      setIsConnected(false);
      setSocketId(null);
      setTransport("");

      addMessage("info", `🔴 Disconnected: ${reason}`);
    };

    // Must match the backend event: health-pong
    const handleHealthPong = (data) => {
      console.log("🏓 Health pong received:", data);

      addMessage(
        "pong",
        `🏓 Pong at ${new Date(data.timestamp).toLocaleTimeString()}`,
      );
    };

    const handleTestResponse = (data) => {
      console.log("🧪 Test response:", data);

      addMessage("test", `🧪 Response: ${JSON.stringify(data.received)}`);
    };

    const handleJoined = (data) => {
      console.log("📋 Joined checkpoint:", data);

      addMessage("info", `📋 Joined checkpoint: ${data.checkpointId}`);
    };

    const handleCheckpointError = (data) => {
      console.error("❌ Checkpoint error:", data);

      addMessage(
        "error",
        `❌ ${data.message || "Checkpoint operation failed"}`,
      );
    };

    const handleReconnectAttempt = (attempt) => {
      console.log("🔄 Reconnection attempt:", attempt);

      addMessage("info", `🔄 Reconnection attempt ${attempt}`);
    };

    const handleReconnect = (attempt) => {
      console.log(`✅ Reconnected after ${attempt} attempt(s)`);

      addMessage("success", `✅ Reconnected after ${attempt} attempt(s)`);
    };

    const handleReconnectError = (error) => {
      console.error("❌ Reconnection error:", error);

      addMessage("error", `❌ Reconnection error: ${error.message}`);
    };

    const handleReconnectFailed = () => {
      console.error("❌ Reconnection failed");

      addMessage("error", "❌ Reconnection failed after maximum attempts");
    };

    // Socket events
    newSocket.on("connect", handleConnect);
    newSocket.on("welcome", handleWelcome);
    newSocket.on("connect_error", handleConnectError);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("health-pong", handleHealthPong);
    newSocket.on("test-response", handleTestResponse);
    newSocket.on("joined", handleJoined);
    newSocket.on("checkpoint-error", handleCheckpointError);

    // Reconnection events are Manager events.
    newSocket.io.on("reconnect_attempt", handleReconnectAttempt);

    newSocket.io.on("reconnect", handleReconnect);
    newSocket.io.on("reconnect_error", handleReconnectError);

    newSocket.io.on("reconnect_failed", handleReconnectFailed);

    setSocket(newSocket);

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("welcome", handleWelcome);
      newSocket.off("connect_error", handleConnectError);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("health-pong", handleHealthPong);
      newSocket.off("test-response", handleTestResponse);
      newSocket.off("joined", handleJoined);
      newSocket.off("checkpoint-error", handleCheckpointError);

      newSocket.io.off("reconnect_attempt", handleReconnectAttempt);

      newSocket.io.off("reconnect", handleReconnect);

      newSocket.io.off("reconnect_error", handleReconnectError);

      newSocket.io.off("reconnect_failed", handleReconnectFailed);

      newSocket.disconnect();

      console.log("🔌 Socket disconnected during component cleanup");
    };
  }, []);

  const addMessage = (type, message) => {
    setMessages((prev) => [
      ...prev,
      {
        type,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const sendPing = () => {
    if (socket && isConnected) {
      socket.emit("ping");
      addMessage("info", "🏓 Ping sent");
    } else {
      alert("⚠️ Socket not connected!");
    }
  };

  const sendTest = () => {
    if (socket && isConnected) {
      const data = {
        message: testInput || "Hello from client!",
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };
      socket.emit("test", data);
      addMessage("info", `📤 Test sent: ${data.message}`);
      setTestInput("");
    } else {
      alert("⚠️ Socket not connected!");
    }
  };

  const joinCheckpoint = () => {
    if (socket && isConnected) {
      const checkpointId = "test-checkpoint-123";
      socket.emit("join-checkpoint", {
        checkpointId,
        inspectionId: "test-inspection-456",
      });
      addMessage("info", `📋 Joining checkpoint: ${checkpointId}`);
    } else {
      alert("⚠️ Socket not connected!");
    }
  };

  const reconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      addMessage("info", "🔄 Disconnecting...");
      setTimeout(() => {
        socket.connect();
        addMessage("info", "🔄 Reconnecting...");
      }, 1000);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🔌</span>
            Socket.IO Connection Test
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Testing WebSocket connection to backend at localhost:5000
          </p>
          <p className="text-xs text-gray-400 mt-1">
            URL: {window.location.href}
          </p>
        </div>
        {/* Connection Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
              />
              <span className="font-semibold">
                {isConnected ? "Connected ✅" : "Disconnected ❌"}
              </span>
            </div>
            {socketId && (
              <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                ID: {socketId}
              </div>
            )}
            {transport && (
              <div className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-lg">
                Transport: {transport}
              </div>
            )}
            {connectionAttempts > 0 && (
              <div className="text-sm bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg">
                Attempts: {connectionAttempts}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={sendPing}
              disabled={!isConnected}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              🏓 Ping
            </button>
            <button
              onClick={sendTest}
              disabled={!isConnected}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              🧪 Test
            </button>
            <button
              onClick={joinCheckpoint}
              disabled={!isConnected}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              📋 Join Room
            </button>
            <button
              onClick={reconnectSocket}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2"
            >
              🔄 Reconnect
            </button>
          </div>
        </div>

        {/* Test Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Send Custom Message
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              onKeyPress={(e) => e.key === "Enter" && sendTest()}
            />
            <button
              onClick={sendTest}
              disabled={!isConnected}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Send
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Message Log ({messages.length})
            </h2>
            <button
              onClick={clearMessages}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Clear All
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="text-4xl mb-2">💬</div>
                <p>No messages yet</p>
                <p className="text-sm">Try clicking Ping or Test!</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`text-sm p-3 rounded-lg ${
                      msg.type === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : msg.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : msg.type === "welcome"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : msg.type === "pong"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : msg.type === "test"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-gray-50 text-gray-700 border border-gray-200"
                    }`}
                  >
                    <span className="text-xs text-gray-400 mr-2">
                      {msg.timestamp}
                    </span>
                    {msg.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>
            Backend: http://localhost:5000 • Socket.IO:
            ws://localhost:5000/socket.io
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestSocketConnection;
