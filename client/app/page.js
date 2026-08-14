"use client";
import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import ChatWindow from "@/app/_components/ChatWindow";
import AuthForm from "@/app/_components/AuthForm";
import { generateRSAKeys } from "@/app/_lib/ciphers";
import {
  Wifi,
  Users,
  Plus,
  User,
  Key,
  LogOut,
  Settings,
  Camera,
  Lock,
  X,
} from "lucide-react";

export default function Page() {
  const [currentUser, setCurrentUser] = useState(null);
  if (!currentUser) return <AuthForm onLogin={setCurrentUser} />;
  return (
    <ChatInterface
      currentUser={currentUser}
      onLogout={() => setCurrentUser(null)}
    />
  );
}

function ChatInterface({ currentUser, onLogout }) {
  const [status, setStatus] = useState("Connecting...");
  const websocket = useRef(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const activeChatRef = useRef(null);

  // --- RSA STATE ---
  const [myKeys, setMyKeys] = useState(null); // { public, private }

  // --- MODAL STATES ---
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  // --- SETTINGS / FACE ID STATE ---
  const webcamRef = useRef(null);
  const [newPassword, setNewPassword] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // 1. INITIALIZE KEYS (Load from Storage OR Generate New)
  useEffect(() => {
    const initKeys = async () => {
      // Create unique storage keys for this specific user
      const storageKeyPub = `rsa_pub_${currentUser}`;
      const storageKeyPriv = `rsa_priv_${currentUser}`;

      // 1. Try to load existing keys from LocalStorage
      let pubString = localStorage.getItem(storageKeyPub);
      let privString = localStorage.getItem(storageKeyPriv);

      if (!pubString || !privString) {
        // 2. If no keys found, GENERATE NEW ONES
        console.log("⚙️ Generating NEW RSA Keys...");
        const keys = generateRSAKeys();
        pubString = JSON.stringify(keys.publicKey);
        privString = JSON.stringify(keys.privateKey);

        // 3. Save to LocalStorage so they persist after refresh
        localStorage.setItem(storageKeyPub, pubString);
        localStorage.setItem(storageKeyPriv, privString);
      } else {
        console.log("📂 Loaded EXISTING RSA Keys from storage.");
      }

      // 4. Set State
      setMyKeys({ public: pubString, private: privString });

      // LOG KEYS (For Debugging)
      console.log(
        "%c🔑 RSA KEYS READY",
        "color: #4ade80; font-weight: bold; font-size: 14px;"
      );
      console.log("🔒 PRIVATE:", privString);
      console.log("📢 PUBLIC:", pubString);

      // 5. Upload Public Key to Server (Always do this to ensure server is synced)
      try {
        await fetch("http://localhost:8081/api/users/key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser, publicKey: pubString }),
        });
        console.log("✅ Public Key uploaded/synced to server.");
      } catch (e) {
        console.error("❌ Key upload failed", e);
      }
    };

    if (currentUser) initKeys();
  }, [currentUser]);

  // 2. LOAD FACE MODELS
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("AI Models failed to load", err);
      }
    };
    loadModels();
  }, []);

  // 3. POLL USERS & GROUPS
  useEffect(() => {
    const fetchData = () => {
      fetch("http://localhost:8081/api/users")
        .then((res) => res.json())
        .then((data) =>
          setUsers(data.filter((u) => u.username !== currentUser))
        );

      fetch(`http://localhost:8081/api/groups?username=${currentUser}`)
        .then((res) => res.json())
        .then(setGroups);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // 4. WEBSOCKET LOGIC
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    websocket.current = new WebSocket("ws://localhost:8081");
    websocket.current.onopen = () => setStatus("Connected");
    websocket.current.onclose = () => setStatus("Disconnected");
    websocket.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && data.payload) {
          const payload = data.payload;
          const currentChat = activeChatRef.current;
          if (!currentChat) return;

          const isGroup =
            currentChat.type === "group" && payload.groupId === currentChat.id;
          const isPrivate =
            currentChat.type === "private" &&
            ((payload.from === currentChat.id && payload.to === currentUser) ||
              (payload.from === currentUser && payload.to === currentChat.id));

          if (isGroup || isPrivate)
            setChatHistory((prev) => [...prev, payload]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    return () => websocket.current?.close();
  }, [currentUser]);

  // 5. LOAD CHAT HISTORY
  useEffect(() => {
    if (!activeChat) return;
    let url =
      activeChat.type === "private"
        ? `http://localhost:8081/api/messages?user1=${currentUser}&user2=${activeChat.id}`
        : `http://localhost:8081/api/messages?groupId=${activeChat.id}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setChatHistory(
          data.map((msg) => ({
            from: msg.sender,
            encrypted: msg.encryptedContent,
          }))
        );
      });
  }, [activeChat, currentUser]);

  const handleSendMessage = (msgPayload) => {
    if (!activeChat) return;
    const fullPayload = {
      ...msgPayload,
      from: currentUser,
      to: activeChat.type === "private" ? activeChat.id : null,
      groupId: activeChat.type === "group" ? activeChat.id : null,
    };
    websocket.current.send(
      JSON.stringify({ type: "message", payload: fullPayload })
    );
    setChatHistory((prev) => [...prev, fullPayload]);
  };

  // --- FACE ID & PASSWORD LOGIC ---
  const handleFaceCapture = async () => {
    if (!webcamRef.current) return;
    setIsCapturing(true);
    setProfileMsg({ type: "", text: "" });
    const imageSrc = webcamRef.current.getScreenshot();
    const img = document.createElement("img");
    img.src = imageSrc;
    img.onload = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detection) {
          setFaceDescriptor(Array.from(detection.descriptor));
          setProfileMsg({
            type: "success",
            text: "Face Verified! Enter new password.",
          });
        } else {
          setProfileMsg({
            type: "error",
            text: "No face detected. Center your face.",
          });
        }
      } catch (err) {
        setProfileMsg({ type: "error", text: "Detection error." });
      }
      setIsCapturing(false);
    };
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || !faceDescriptor) return;
    try {
      const res = await fetch("http://localhost:8081/api/auth/reset-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser,
          newPassword,
          faceDescriptor,
        }),
      });
      if (res.ok) {
        setProfileMsg({
          type: "success",
          text: "Password Updated Successfully!",
        });
        setTimeout(() => setShowProfileModal(false), 2000);
        setNewPassword("");
        setFaceDescriptor(null);
      } else {
        setProfileMsg({ type: "error", text: "Failed to update." });
      }
    } catch (err) {
      setProfileMsg({ type: "error", text: "Server error." });
    }
  };

  // --- GROUP CREATE LOGIC ---
  const handleCreateGroup = async () => {
    if (!newGroupName || selectedGroupMembers.length === 0) return;
    const res = await fetch("http://localhost:8081/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newGroupName,
        members: selectedGroupMembers,
        createdBy: currentUser,
      }),
    });
    if (res.ok) {
      setShowGroupModal(false);
      setNewGroupName("");
      setSelectedGroupMembers([]);
    }
  };

  // --- GET TARGET KEY ---
  const targetUser =
    activeChat?.type === "private"
      ? users.find((u) => u.username === activeChat.id)
      : null;
  const targetPublicKey = targetUser ? targetUser.publicKey : "";

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col shadow-2xl z-10">
        <div className="p-5 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-lg">{currentUser}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="text-gray-400 hover:text-blue-400 transition"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
              Direct Messages
            </h3>
            {users.map((u) => (
              <button
                key={u._id}
                onClick={() => {
                  setChatHistory([]);
                  setActiveChat({
                    type: "private",
                    id: u.username,
                    name: u.username,
                  });
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                  activeChat?.id === u.username
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                <User size={18} />
                <span className="flex-1">{u.username}</span>
                {u.publicKey && (
                  <Key size={12} className="text-green-400" title="RSA Ready" />
                )}
              </button>
            ))}
          </div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase">
                Groups
              </h3>
              <button
                onClick={() => setShowGroupModal(true)}
                className="text-blue-400 hover:text-white"
              >
                <Plus size={16} />
              </button>
            </div>
            {groups.map((g) => (
              <button
                key={g._id}
                onClick={() => {
                  setChatHistory([]);
                  setActiveChat({ type: "group", id: g._id, name: g.name });
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                  activeChat?.id === g._id
                    ? "bg-purple-600 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                <Users size={18} /> {g.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col bg-gray-900 relative">
        {activeChat ? (
          <>
            <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 shadow-md z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{activeChat.name}</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-green-400 text-xs flex gap-1">
                  <Wifi size={14} /> {status}
                </div>
              </div>
            </header>
            <div className="flex-1 overflow-hidden relative">
              <ChatWindow
                key={`${activeChat.id}`}
                userName={currentUser}
                chatHistory={chatHistory}
                onSendMessage={handleSendMessage}
                dark={true}
                onClearChat={() => setChatHistory([])}
                myPrivateKey={myKeys?.private}
                targetPublicKey={targetPublicKey}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            Select a chat.
          </div>
        )}
      </div>

      {/* --- MODAL 1: SECURITY SETTINGS --- */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-2xl w-96 border border-gray-600 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-white flex items-center gap-2">
                <Settings className="text-blue-400" /> Security Settings
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Verify your face to update your password.
            </p>
            <div className="bg-black rounded-lg overflow-hidden border-2 border-blue-500/50 mb-4 relative h-48">
              {modelsLoaded ? (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  mirrored={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-yellow-500">
                  Loading AI...
                </div>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={handleFaceCapture}
                disabled={isCapturing}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center justify-center gap-2"
              >
                <Camera size={16} />{" "}
                {faceDescriptor ? "Retake Photo" : "Capture Face"}
              </button>
              {faceDescriptor && (
                <div className="animate-fade-in">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    New Password
                  </label>
                  <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-3 py-2 mt-1">
                    <Lock size={16} className="text-gray-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-transparent outline-none flex-1 text-sm text-white"
                      placeholder=">8 chars & symbol"
                    />
                  </div>
                  <button
                    onClick={handlePasswordUpdate}
                    className="w-full mt-3 py-2 bg-green-600 hover:bg-green-500 rounded text-white font-bold text-sm"
                  >
                    Update Password
                  </button>
                </div>
              )}
            </div>
            {profileMsg.text && (
              <div
                className={`mt-4 p-2 rounded text-xs text-center ${
                  profileMsg.type === "error"
                    ? "bg-red-900/30 text-red-400"
                    : "bg-green-900/30 text-green-400"
                }`}
              >
                {profileMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: GROUP CREATE --- */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">New Group</h3>
              <button
                onClick={() => setShowGroupModal(false)}
                className="text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <input
              className="w-full bg-gray-900 p-2 rounded text-white mb-4 border border-gray-600"
              placeholder="Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <p className="text-xs text-gray-400 font-bold uppercase mb-2">
              Select Members:
            </p>
            <div className="max-h-40 overflow-y-auto mb-4 border border-gray-700 p-2 rounded">
              {users.map((u) => (
                <label
                  key={u._id}
                  className="flex gap-2 p-1 text-gray-300 hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedGroupMembers((p) => [...p, u.username]);
                      else
                        setSelectedGroupMembers((p) =>
                          p.filter((x) => x !== u.username)
                        );
                    }}
                  />{" "}
                  {u.username}
                </label>
              ))}
            </div>
            <button
              onClick={handleCreateGroup}
              className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded text-white font-bold"
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
