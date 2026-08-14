"use client";

// --- Caesar Cipher Logic ---
export function caesarCipher(text, shift, decrypt = false) {
  const numShift = Number(shift);
  if (isNaN(numShift)) return "INVALID KEY"; // Handle non-numeric keys

  const offset = decrypt ? 26 - (numShift % 26) : numShift % 26;
  if (offset === 0 && !decrypt) return text; // Handle shift of 0

  return text.replace(/[a-zA-Z]/g, (char) => {
    const start = char <= "Z" ? 65 : 97;
    return String.fromCharCode(
      ((char.charCodeAt(0) - start + offset) % 26) + start
    );
  });
}

// --- TASK 1: CAESAR CRACKER (Frequency Analysis) ---
const ENGLISH_FREQS = {
  a: 8.167,
  b: 1.492,
  c: 2.782,
  d: 4.253,
  e: 12.702,
  f: 2.228,
  g: 2.015,
  h: 6.094,
  i: 6.966,
  j: 0.153,
  k: 0.772,
  l: 4.025,
  m: 2.406,
  n: 6.749,
  o: 7.507,
  p: 1.929,
  q: 0.095,
  r: 5.987,
  s: 6.327,
  t: 9.056,
  u: 2.758,
  v: 0.978,
  w: 2.36,
  x: 0.15,
  y: 1.974,
  z: 0.074,
};

export function crackCaesar(ciphertext) {
  if (!ciphertext || ciphertext.length < 5) return "Text too short to crack";

  let bestShift = 0;
  let minChiSquared = Infinity;

  // Try all 26 shifts
  for (let shift = 0; shift < 26; shift++) {
    const decryptedAttempt = caesarCipher(ciphertext, shift, true);

    // Calculate letter counts for this attempt
    const counts = {};
    let totalLetters = 0;
    for (let char of decryptedAttempt.toLowerCase()) {
      if (/[a-z]/.test(char)) {
        counts[char] = (counts[char] || 0) + 1;
        totalLetters++;
      }
    }

    // Calculate Chi-Squared Statistic vs English Frequencies
    let chiSquared = 0;
    for (let charCode = 97; charCode <= 122; charCode++) {
      const char = String.fromCharCode(charCode);
      const observed = counts[char] || 0;
      const expected = (totalLetters * (ENGLISH_FREQS[char] || 0)) / 100;
      // Formula: sum((observed - expected)^2 / expected)
      if (expected > 0) {
        chiSquared += Math.pow(observed - expected, 2) / expected;
      }
    }

    if (chiSquared < minChiSquared) {
      minChiSquared = chiSquared;
      bestShift = shift;
    }
  }

  return {
    original: caesarCipher(ciphertext, bestShift, true),
    guessedKey: bestShift,
    confidence: Math.max(0, 100 - minChiSquared), // Rough confidence score
  };
}

// --- Vigenère Cipher Logic ---
export function vigenereCipher(text, key, decrypt = false) {
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

// --- NEW: Substitution Cipher Logic ---
export function substitutionCipher(text, key, decrypt = false) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const upperKey = key.toUpperCase().replace(/[^A-Z]/g, ""); // Validate key

  if (upperKey.length !== 26) return "INVALID KEY (must be 26 letters)";
  if (new Set(upperKey).size !== 26)
    return "INVALID KEY (no duplicate letters)";

  const encryptMap = new Map();
  const decryptMap = new Map();
  for (let i = 0; i < 26; i++) {
    encryptMap.set(alphabet[i], upperKey[i]);
    decryptMap.set(upperKey[i], alphabet[i]);
  }

  const map = decrypt ? decryptMap : encryptMap;

  return text.replace(/[a-zA-Z]/g, (char) => {
    const upper = char.toUpperCase();
    const newUpper = map.get(upper); // If char isn't in the map (e.g., key issue), just return it
    if (!newUpper) return char; // Preserve case
    return char === upper ? newUpper : newUpper.toLowerCase();
  });
}

// --- NEW: Transposition (Scytale) Cipher Logic ---
export function transpositionCipher(text, key, decrypt = false) {
  const numCols = Number(key);
  if (isNaN(numCols) || numCols <= 0 || !Number.isInteger(numCols)) {
    return "INVALID KEY (must be a positive integer)";
  }

  if (decrypt) {
    // --- Decryption ---
    const numRows = Math.ceil(text.length / numCols);
    const numFullCols = text.length % numCols;
    const shortColLen = numRows - 1; // Create grid
    const grid = Array(numRows)
      .fill(0)
      .map(() => Array(numCols).fill(""));
    let k = 0; // index into ciphertext
    for (let j = 0; j < numCols; j++) {
      // Determine if this is a "full" column or a "short" one
      const colLen =
        numFullCols === 0 || j < numFullCols ? numRows : shortColLen;
      for (let i = 0; i < colLen; i++) {
        grid[i][j] = text[k++];
      }
    } // Read row-by-row
    let result = "";
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        result += grid[i][j];
      }
    }
    return result;
  } else {
    // --- Encryption ---
    const numRows = Math.ceil(text.length / numCols); // Create grid
    const grid = Array(numRows)
      .fill(0)
      .map(() => Array(numCols).fill("")); // Fill grid row-by-row
    let k = 0;
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (k < text.length) {
          grid[i][j] = text[k++];
        }
      }
    } // Read column-by-column
    let result = "";
    for (let j = 0; j < numCols; j++) {
      for (let i = 0; i < numRows; i++) {
        result += grid[i][j];
      }
    }
    return result;
  }
}
// --- TASK 2: MANUAL RSA IMPLEMENTATION (BigInt) ---

// 1. Modular Exponentiation: (base^exp) % mod
function modPow(base, exp, mod) {
  let res = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) res = (res * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return res;
}

// 2. GCD for coprime check
function gcd(a, b) {
  return b === 0n ? a : gcd(b, a % b);
}

// 3. Extended Euclidean Algorithm for Modular Inverse (finding d)
function modInverse(e, phi) {
  let m0 = phi;
  let y = 0n;
  let x = 1n;

  if (phi === 1n) return 0n;

  while (e > 1n) {
    let q = e / phi;
    let t = phi;
    phi = e % phi;
    e = t;
    t = y;
    y = x - q * y;
    x = t;
  }
  if (x < 0n) x += m0;
  return x;
}

// 4. Primality Test (Miller-Rabin simplified for performance)
function isPrime(num) {
  if (num <= 1n) return false;
  if (num <= 3n) return true;
  if (num % 2n === 0n || num % 3n === 0n) return false;
  let i = 5n;
  while (i * i <= num) {
    if (num % i === 0n || num % (i + 2n) === 0n) return false;
    i += 6n;
  }
  return true;
}

function generatePrime(bits = 16) {
  // Generates a random prime (approx size)
  // NOTE: Small bits used here for UI performance.
  // Real RSA uses 1024+ bits.
  const min = 2n ** BigInt(bits - 1);
  const max = 2n ** BigInt(bits) - 1n;
  while (true) {
    // Random BigInt in range
    const rand = min + BigInt(Math.floor(Math.random() * Number(max - min)));
    if (isPrime(rand)) return rand;
  }
}

export function generateRSAKeys() {
  const p = generatePrime(12); // Small primes for speed
  const q = generatePrime(12);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);

  let e = 65537n;
  // Ensure e is coprime to phi
  while (gcd(e, phi) !== 1n) {
    e += 2n;
  }

  const d = modInverse(e, phi);

  return {
    publicKey: { e: e.toString(), n: n.toString() },
    privateKey: { d: d.toString(), n: n.toString() },
  };
}

export function rsaEncrypt(text, publicKeyString) {
  try {
    const { e, n } = JSON.parse(publicKeyString);
    const eBig = BigInt(e);
    const nBig = BigInt(n);

    // Convert string to char codes, then encrypt each char
    // (Simplistic approach: character by character encryption)
    const encryptedChars = text.split("").map((char) => {
      const m = BigInt(char.charCodeAt(0));
      const c = modPow(m, eBig, nBig);
      return c.toString();
    });

    return encryptedChars.join(","); // Comma separated BigInts
  } catch (err) {
    return "INVALID_KEY";
  }
}

export function rsaDecrypt(encryptedStr, privateKeyString) {
  try {
    const { d, n } = JSON.parse(privateKeyString);
    const dBig = BigInt(d);
    const nBig = BigInt(n);

    const parts = encryptedStr.split(",");
    let decrypted = "";

    for (let part of parts) {
      if (!part.trim()) continue;
      const c = BigInt(part);
      const m = modPow(c, dBig, nBig);
      decrypted += String.fromCharCode(Number(m));
    }
    return decrypted;
  } catch (err) {
    return "DECRYPTION_FAILED";
  }
}
