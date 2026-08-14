"use client";
import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { User, Lock, LogIn, UserPlus, Camera, RefreshCw } from "lucide-react";

export default function AuthForm({ onLogin }) {
  // Restore 'recovery' to the allowed modes
  const [mode, setMode] = useState("login"); // 'login', 'register', 'recovery'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Face Recognition State
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // 1. Load Models on Mount
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face models", err);
        setError("Error loading AI models. Check public/models folder.");
      }
    };
    loadModels();
  }, []);

  // 2. Capture & Detect Face
  const handleCapture = async () => {
    if (!webcamRef.current) return;
    setIsCapturing(true);
    setError("");

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
          setSuccess("Face captured successfully!");
        } else {
          setError("No face detected. Please center your face.");
        }
      } catch (err) {
        setError("Face detection error: " + err.message);
      }
      setIsCapturing(false);
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // --- PASSWORD VALIDATION (Register & Recovery) ---
    if (mode === "register" || mode === "recovery") {
      if (password.length <= 8) {
        setError("Password must be > 8 characters.");
        return;
      }
      // Check for symbols
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        setError("Password must contain at least one symbol (!@#$).");
        return;
      }
    }

    let endpoint = "";
    let body = { username, password };

    if (mode === "register") {
      endpoint = "/register";
      if (!faceDescriptor) {
        setError("Please capture your face to register.");
        return;
      }
      body.faceDescriptor = faceDescriptor;
    } else if (mode === "login") {
      endpoint = "/login";
    } else if (mode === "recovery") {
      endpoint = "/reset-face";
      if (!faceDescriptor) {
        setError("Please capture your face to verify identity.");
        return;
      }
      // For recovery, 'password' input is the NEW password
      body = {
        username,
        newPassword: password,
        faceDescriptor,
      };
    }

    const url = `http://localhost:8081/api/auth${endpoint}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (mode === "register") {
        setSuccess("Account created! Please log in.");
        setMode("login");
        setFaceDescriptor(null);
        setPassword("");
      } else if (mode === "recovery") {
        setSuccess("Identity verified! Password reset. Please log in.");
        setMode("login");
        setFaceDescriptor(null);
        setPassword("");
      } else {
        // Login Successful
        onLogin(data.username);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-6 flex justify-center items-center gap-2">
          Encrypted Chat
        </h2>

        {/* TABS: LOGIN | REGISTER | RECOVER */}
        <div className="flex justify-center mb-6 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "login" ? "bg-blue-600 text-white" : "text-gray-400"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "register" ? "bg-green-600 text-white" : "text-gray-400"
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setMode("recovery")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "recovery" ? "bg-purple-600 text-white" : "text-gray-400"
            }`}
          >
            Recover
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              {mode === "recovery" ? "New Password" : "Password"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={
                  mode === "recovery" ? "Set new password" : "Enter password"
                }
                required
              />
            </div>
            {/* Helper for Password Rules */}
            {(mode === "register" || mode === "recovery") && (
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Must be &gt;8 chars and contain a symbol (!@#$)
              </p>
            )}
          </div>

          {/* Face Capture (Register OR Recovery) */}
          {(mode === "register" || mode === "recovery") && (
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <label className="block text-sm font-bold mb-2 text-center text-blue-400 uppercase tracking-wide">
                {mode === "register"
                  ? "Biometric Setup"
                  : "Identity Verification"}
              </label>

              {modelsLoaded ? (
                <>
                  <div className="rounded-lg overflow-hidden border-2 border-blue-500 mb-2 relative">
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full"
                      mirrored={true}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={isCapturing}
                    className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center justify-center gap-2"
                  >
                    <Camera size={16} />
                    {faceDescriptor ? "Retake Photo" : "Capture Face"}
                  </button>
                  {faceDescriptor && (
                    <p className="text-green-500 text-xs text-center mt-1">
                      Face Data Ready ✓
                    </p>
                  )}
                </>
              ) : (
                <p className="text-yellow-500 text-center text-sm">
                  Loading AI Models...
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-400 text-sm text-center bg-green-900/20 py-2 rounded">
              {success}
            </p>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors flex justify-center items-center gap-2 ${
              mode === "register"
                ? "bg-green-600 hover:bg-green-700"
                : mode === "recovery"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {mode === "register" ? (
              <>
                <UserPlus size={18} /> Create Account
              </>
            ) : mode === "recovery" ? (
              <>
                <RefreshCw size={18} /> Reset Password
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
