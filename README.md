# EduConnect - ICT2505C Team Project

Welcome to the EduConnect repository. This is a full-stack e-learning platform featuring a React frontend, a Node.js/Express backend, and an integrated AI assistant powered by the Gemini API.

## 📂 Folder Structure

This project uses a standard decoupled full-stack architecture:
* `/client`: Contains the React frontend UI.
* `/server`: Contains the Node.js Express backend and API routes.

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
1. **Node.js** (v18 or higher recommended)
2. **Git**

You will also need the shared team **Gemini API Key** to run the chatbot feature. Reach out to the team lead if you do not have it.

---

## 🚀 Installation & Setup

Because the frontend and backend manage their own dependencies, you must install the node modules for **both** folders separately.

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/2300438/2505C-EduConnect.git
   cd 2505C-EduConnect
   \`\`\`

2. Install Client Dependencies:
   \`\`\`bash
   cd client
   npm install
   \`\`\`

3. Install Server Dependencies:
   \`\`\`bash
   cd ../server
   npm install
   \`\`\`

4. **Environment Variables (CRITICAL):**
   Create a file exactly named `.env` inside the `/server` folder. Add the following line to it, replacing the placeholder with our actual key:
   \`\`\`env
   GEMINI_API_KEY=your_actual_api_key_here
   \`\`\`
   *(Note: The `.env` file is git-ignored for security and will not be uploaded to GitHub. Never commit this key!)*

---

## 💻 Running the Application Locally

To run the full stack, you need to have **two separate terminal windows** open simultaneously.

**Terminal 1: Start the Backend Server**
\`\`\`bash
cd server
npm start
\`\`\`
*The server will run on http://localhost:3001*

**Terminal 2: Start the Frontend React App**
\`\`\`bash
cd client
npm start 
# (Note: If we migrate to Vite, this command will be npm run dev)
\`\`\`
*The client will run on http://localhost:3000 (or 5173 for Vite)*

---

## 🛠️ Tech Stack
* **Frontend:** React, React Router, CSS3
* **Backend:** Node.js, Express.js
* **AI Integration:** Google Gemini 2.5 Flash API