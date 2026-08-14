"use client";
import React, { useState } from "react";
import { Send, RotateCw } from "lucide-react";

// --- Vigenère Cipher Logic ---
function vigenereCipher(text, key, decrypt = false) {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!cleanKey) return "INVALID KEY"; // Return error if key is unusable

  let result = "";
  let j = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (/[a-zA-Z]/.test(c)) {
      const base = c <= "Z" ? 65 : 97;
      const keyChar = cleanKey[j % cleanKey.length].charCodeAt(0) - 65;
      const shift = decrypt ? 26 - keyChar : keyChar;
      result += String.fromCharCode(
        ((c.charCodeAt(0) - base + shift) % 26) + base
      );
      j++;
    } else result += c;
  }
  return result;
}

export default function VigenereChat({ dark }) {
  const [key, setKey] = useState("KEY");
  const [user1Msg, setUser1Msg] = useState("");
  const [user2Msg, setUser2Msg] = useState("");
  const [chat, setChat] = useState([]);

  const sendUser1 = () => {
    if (!user1Msg.trim()) return;
    const encrypted = vigenereCipher(user1Msg, key);
    setChat((prev) => [...prev, { from: "User 1", encrypted }]);
    setUser1Msg("");
  };

  const sendUser2 = () => {
    if (!user2Msg.trim()) return;
    const encrypted = vigenereCipher(user2Msg, key);
    setChat((prev) => [...prev, { from: "User 2", encrypted }]);
    setUser2Msg("");
  };

  return (
    <div
      className={`p-5 rounded-2xl shadow-lg ${
        dark ? "bg-gray-800" : "bg-white"
      }`}
    >
      <h2 className="text-lg font-semibold mb-3 text-center">
        Vigenère Cipher Chat
      </h2>

      {/* Key Input */}
      <div className="flex justify-center mb-4 gap-2">
        <label className="text-sm opacity-80">Key:</label>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          className={`w-32 px-2 py-1 rounded-md border text-center uppercase ${
            dark
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-gray-100 border-gray-300"
          }`}
        />
      </div>

      {/* Chat Display */}
      <div
        className={`h-64 overflow-y-auto mb-4 rounded-lg p-3 space-y-3 ${
          dark ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        {chat.map((msg, i) => {
          const decrypted = vigenereCipher(msg.encrypted, key, true);
          const isUser1 = msg.from === "User 1";

          return (
            <div
              key={i}
              className={`flex ${isUser1 ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-3 rounded-2xl max-w-xs ${
                  isUser1
                    ? `${
                        dark ? "bg-blue-800" : "bg-blue-500 text-white"
                      } rounded-br-none`
                    : `${dark ? "bg-gray-700" : "bg-gray-200"} rounded-bl-none`
                }`}
              >
                <p className="text-xs font-semibold opacity-80">{msg.from}</p>
                <p className="font-mono text-sm wrap-break-words">
                  {decrypted}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Users */}
      <div className="flex flex-col gap-3">
        {/* User 1 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={user1Msg}
            onChange={(e) => setUser1Msg(e.target.value)}
            placeholder="User 1 message..."
            className={`flex-1 px-3 py-2 rounded-full border ${
              dark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
            }`}
          />
          <button
            onClick={sendUser1}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* User 2 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={user2Msg}
            onChange={(e) => setUser2Msg(e.target.value)}
            placeholder="User 2 message..."
            className={`flex-1 px-3 py-2 rounded-full border ${
              dark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
            }`}
          />
          <button
            onClick={sendUser2}
            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        onClick={() => setChat([])}
        className="mt-4 flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm mx-auto"
      >
        <RotateCw className="w-4 h-4" /> Clear Chat
      </button>
    </div>
  );
}
