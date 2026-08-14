"use client";
import React, { useState } from "react";
import {
  Send,
  Lock,
  Unlock,
  X,
  RotateCw,
  Settings,
  Eye,
  Wand2,
} from "lucide-react";
import {
  caesarCipher,
  vigenereCipher,
  substitutionCipher,
  transpositionCipher,
  rsaEncrypt,
  rsaDecrypt,
  crackCaesar,
} from "@/app/_lib/ciphers";

// --- KEY INPUT COMPONENTS ---
const CaesarInput = ({ k, setK }) => (
  <input
    type="number"
    value={k}
    onChange={(e) => setK(e.target.value)}
    className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs h-8"
    placeholder="Shift"
  />
);
const VigenereInput = ({ k, setK }) => (
  <input
    type="text"
    value={k}
    onChange={(e) => setK(e.target.value.toUpperCase())}
    className="w-32 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs uppercase h-8"
    placeholder="Keyword"
  />
);
const SubInput = ({ k, setK }) => (
  <input
    type="text"
    value={k}
    maxLength={26}
    onChange={(e) => setK(e.target.value.toUpperCase())}
    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs font-mono uppercase h-8"
    placeholder="26-Char Key"
  />
);
const TransInput = ({ k, setK }) => (
  <input
    type="number"
    value={k}
    onChange={(e) => setK(e.target.value)}
    className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs h-8"
    placeholder="Cols"
  />
);
const RSAInput = ({ k, setK, isEncrypt }) => (
  <input
    type="text"
    value={k}
    onChange={(e) => setK(e.target.value)}
    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs h-8 truncate"
    placeholder={isEncrypt ? "Receiver Public Key..." : "Your Private Key..."}
  />
);
const CrackInput = () => (
  <div className="w-full bg-gray-900 border border-yellow-600/50 rounded px-2 py-1 text-yellow-400 text-xs h-8 flex items-center gap-2">
    <Wand2 size={12} /> <span>Auto-detecting key...</span>
  </div>
);
const CIPHER_OPTIONS = {
  caesar: {
    name: "Caesar",
    encrypt: (t, k) => caesarCipher(t, k, false),
    decrypt: (t, k) => caesarCipher(t, k, true),
    Input: CaesarInput,
    defaultK: 3,
  },
  vigenere: {
    name: "Vigenère",
    encrypt: (t, k) => vigenereCipher(t, k, false),
    decrypt: (t, k) => vigenereCipher(t, k, true),
    Input: VigenereInput,
    defaultK: "KEY",
  },
  substitution: {
    name: "Substitution",
    encrypt: (t, k) => substitutionCipher(t, k, false),
    decrypt: (t, k) => substitutionCipher(t, k, true),
    Input: SubInput,
    defaultK: "ZYXWVUTSRQPONMLKJIHGFEDCBA",
  },
  transposition: {
    name: "Transposition",
    encrypt: (t, k) => transpositionCipher(t, k, false),
    decrypt: (t, k) => transpositionCipher(t, k, true),
    Input: TransInput,
    defaultK: 5,
  },
  rsa: {
    name: "RSA",
    encrypt: (t, k) => rsaEncrypt(t, k),
    decrypt: (t, k) => rsaDecrypt(t, k),
    Input: RSAInput,
    defaultK: "",
  },
  caesar_crack: {
    name: "Caesar Crack (Auto)",
    encrypt: (t) => t, // Cannot encrypt
    decrypt: (t) => {
      const result = crackCaesar(t);
      return `[Key: ${result.guessedKey}] ${result.original}`;
    },
    Input: CrackInput,
    defaultK: "",
  },
};

export default function ChatWindow({
  userName,
  chatHistory,
  onSendMessage,
  dark,
  onClearChat,
  myPrivateKey,
  targetPublicKey,
}) {
  const [inputMessage, setInputMessage] = useState("");

  // --- FIXED: Initialize State with RSA Keys directly ---
  // We check if keys exist immediately. If yes, default to RSA.
  const [encryptMethod, setEncryptMethod] = useState(
    targetPublicKey ? "rsa" : "caesar"
  );
  const [encryptKey, setEncryptKey] = useState(
    targetPublicKey ? targetPublicKey : 3
  );

  const [decryptMethod, setDecryptMethod] = useState(
    myPrivateKey ? "rsa" : "caesar"
  );
  const [decryptKey, setDecryptKey] = useState(
    myPrivateKey ? myPrivateKey : ""
  );

  const [decryptIndex, setDecryptIndex] = useState(null);
  const [decryptedCache, setDecryptedCache] = useState({});

  // Handle Send
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const method = CIPHER_OPTIONS[encryptMethod];

    try {
      if (encryptMethod === "rsa" && !encryptKey) {
        alert("Missing Receiver Public Key!");
        return;
      }
      const encryptedText = method.encrypt(inputMessage, encryptKey);

      onSendMessage({
        from: userName,
        encrypted: encryptedText,
        plainText: inputMessage,
      });
      setInputMessage("");
    } catch (err) {
      alert("Encryption Error: " + err);
    }
  };

  // Handle Decrypt
  const handleManualDecrypt = () => {
    if (decryptIndex === null) return;
    const msg = chatHistory[decryptIndex];
    const method = CIPHER_OPTIONS[decryptMethod];
    try {
      const result = method.decrypt(msg.encrypted, decryptKey);
      setDecryptedCache((prev) => ({ ...prev, [decryptIndex]: result }));
      setDecryptIndex(null);
    } catch (error) {
      alert("Decryption failed.");
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl shadow-xl w-full flex flex-col h-full relative ${
        dark ? "bg-gray-800 border border-gray-700" : "bg-white"
      }`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
        <span className="font-bold text-lg">{userName}</span>
        <button
          onClick={onClearChat}
          className="text-red-400 text-xs hover:text-white flex gap-1 items-center"
        >
          <RotateCw size={12} /> Clear
        </button>
      </div>

      {/* HISTORY */}
      <div className="flex-1 overflow-y-auto space-y-4 p-2 mb-4 scrollbar-thin scrollbar-thumb-gray-600">
        {chatHistory.map((msg, i) => {
          const isMe = msg.from === userName;
          const isDecrypted = decryptedCache[i] !== undefined;
          const showPlain = isMe && msg.plainText;
          const displayText = showPlain
            ? msg.plainText
            : isDecrypted
            ? decryptedCache[i]
            : msg.encrypted;

          return (
            <div
              key={i}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <span className="text-[10px] text-gray-500 mb-1 px-1">
                {msg.from}
              </span>
              <div
                onClick={() => {
                  if (!showPlain) {
                    setDecryptIndex(i);
                    // If we have a private key, default the popup to RSA
                    if (myPrivateKey) {
                      setDecryptMethod("rsa");
                      setDecryptKey(myPrivateKey);
                    } else {
                      setDecryptKey("");
                    }
                  }
                }}
                className={`max-w-[80%] p-3 rounded-2xl transition-transform border ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-none border-blue-500"
                    : "bg-gray-700 text-gray-200 rounded-bl-none border-gray-600 cursor-pointer hover:scale-[1.02]"
                } ${isDecrypted ? "ring-2 ring-green-500" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1 opacity-70 border-b border-white/10 pb-1">
                  {showPlain ? (
                    <>
                      <Eye size={12} />
                      <span className="text-[10px]">YOU</span>
                    </>
                  ) : (
                    <>
                      <Lock size={12} />
                      <span className="text-[10px]">
                        {isDecrypted ? "DECRYPTED" : "ENCRYPTED"}
                      </span>
                    </>
                  )}
                </div>
                <p className="font-mono text-sm break-all whitespace-pre-wrap">
                  {displayText}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* TOOLBAR */}
      <div className="bg-gray-700/50 p-2 rounded-t-xl border border-gray-600 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Settings size={14} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            Encrypt:
          </span>
        </div>
        <select
          value={encryptMethod}
          onChange={(e) => {
            setEncryptMethod(e.target.value);
            setEncryptKey(CIPHER_OPTIONS[e.target.value].defaultK);
          }}
          className="bg-gray-900 text-white text-xs border border-gray-600 rounded px-2 h-8 outline-none"
        >
          {Object.keys(CIPHER_OPTIONS)
            .filter((k) => k !== "caesar_crack")
            .map((k) => (
              <option key={k} value={k}>
                {CIPHER_OPTIONS[k].name}
              </option>
            ))}
        </select>
        <div className="flex-1">
          {(() => {
            const InputComponent = CIPHER_OPTIONS[encryptMethod].Input;
            return (
              <InputComponent
                k={encryptKey}
                setK={setEncryptKey}
                isEncrypt={true}
              />
            );
          })()}
        </div>
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 p-2 bg-gray-700/30 rounded-b-xl border-x border-b border-gray-600"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type message..."
          className={`flex-1 px-4 py-2 rounded-full border outline-none focus:ring-2 focus:ring-blue-500 ${
            dark
              ? "bg-gray-900 border-gray-600 text-white"
              : "bg-gray-100 border-gray-300"
          }`}
        />
        <button
          type="submit"
          className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg"
        >
          <Send size={18} />
        </button>
      </form>

      {/* DECRYPTION MODAL */}
      {decryptIndex !== null && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-gray-800 p-5 rounded-xl border border-green-500/50 w-80 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-green-400 flex items-center gap-2">
                <Unlock size={18} /> Decrypt
              </h3>
              <button
                onClick={() => setDecryptIndex(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="bg-gray-900/50 p-2 rounded text-xs text-gray-300 font-mono mb-4 truncate border-l-2 border-green-500">
              {chatHistory[decryptIndex].encrypted}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Method
                </label>
                <select
                  value={decryptMethod}
                  onChange={(e) => setDecryptMethod(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm outline-none"
                >
                  {Object.keys(CIPHER_OPTIONS).map((k) => (
                    <option key={k} value={k}>
                      {CIPHER_OPTIONS[k].name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Key
                </label>
                {(() => {
                  const InputComponent = CIPHER_OPTIONS[decryptMethod].Input;
                  return (
                    <InputComponent
                      k={decryptKey}
                      setK={setDecryptKey}
                      isEncrypt={false}
                    />
                  );
                })()}
              </div>
              <button
                onClick={handleManualDecrypt}
                className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold shadow-lg"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
