
[![Built with Bolt.new](https://bolt.new/badge-built-with.svg)](https://bolt.new)

# 🛡️ ProofVault — Secure AI-Powered Evidence Locker

ProofVault is a crisis-ready platform that enables civilians, journalists, and organizations to **securely capture, verify, and store digital evidence** during war, protests, disasters, or emergencies.

It combines **AI tools**, **blockchain immutability**, and **decentralized storage** to preserve truth under pressure.

---

## 🚀 Features

- 📸 **Capture Photos & Videos**  
  Upload or record real-time evidence directly in the browser or mobile.

- 🔊 **Voice Narration & Transcription**  
  AI-powered audio-to-text (Whisper) and text-to-speech (ElevenLabs) for accessibility and reporting on the move.

- 📦 **Decentralized File Storage (IPFS)**  
  Files are stored permanently and tamper-proof via IPFS (Pinata or Web3.Storage).

- ⛓️ **Blockchain Hash Logging (Algorand)**  
  Each upload is hashed and timestamped immutably to prevent tampering.

- 🧠 **AI Summary & Tagging**  
  GPT-4/3.5 summarizes content, extracts metadata, and classifies report urgency.

- 🌐 **Multilingual Support**  
  Submit or receive help in any language with Google Translate API.

- 🤖 **Crisis Mode AI Assistant**  
  An embedded GPT-based assistant helps users upload, ask for help, or understand next steps — even in distress.

---

## 🧱 Tech Stack

| Layer         | Tools/Services Used                         |
|---------------|---------------------------------------------|
| Frontend      | React + Vite + Tailwind CSS                 |
| Backend       | Supabase (Postgres + Auth)                  |
| Blockchain    | Algorand SDK + IPFS hash verification       |
| Storage       | Pinata or Web3.Storage (IPFS)               |
| AI/NLP        | OpenAI GPT-3.5/4, Whisper, ElevenLabs       |
| Translation   | Google Translate API                        |
| Realtime      | Pusher (for live report feeds)              |
| Deployment    | Netlify + Custom Domain (`proofvault.xyz`) |

---

## 🔐 Environment Variables

Create a `.env` file with the following keys:

```env
# 🔑 Encryption
JWT_SECRET=your-secret

# ☁️ File Hosting
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_API_KEY=...
VITE_CLOUDINARY_API_SECRET=...

# 🔊 ElevenLabs (optional)
ELEVENLABS_API_KEY=...

# 🧠 OpenAI
OPENAI_API_KEY=...

# 🌍 Translation (optional)
GOOGLE_TRANSLATE_API_KEY=...

# 🌐 IPFS
PINATA_JWT=... (or WEB3_STORAGE_TOKEN=...)

# 🔗 Algorand
ALGORAND_API_KEY=...
ALGORAND_NETWORK=testnet or mainnet
```

---

## 🧪 Running Locally

```bash
git clone https://github.com/yourusername/proofvault.git
cd proofvault
npm install
cp .env.example .env # Add your secrets
npm run dev
```

---

## 💡 Use Cases

- Civilians documenting war crimes or police brutality
- Journalists collecting field reports
- NGOs gathering disaster evidence
- Anonymous whistleblowers submitting sensitive info

---

## 📷 Screenshots

> _Coming soon: upload previews, crisis UI, and blockchain hash log view._

---

## 🤝 Contributing

Pull requests welcome! Open an issue first if you'd like to suggest a feature or bug fix.

---

## 🏆 Built for Bolt.new $1M AI Hackathon

Leveraging sponsored APIs and tools:

- ✅ **ElevenLabs** – AI voice narration
- ✅ **Netlify** – Hosting & domain
- ✅ **Algorand** – Immutable blockchain hashing

---

## A subscription model using RevenueCat is planned post-MVP, enabling premium features like blockchain logging, AI-powered verification, and expert co-signatures.

## 📬 Contact

Built with ❤️ by David Olurinde and Bolt.new 
🌐 [https://www.proofvault.xyz](https://www.proofvault.xyz)  


---
