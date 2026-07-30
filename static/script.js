/* ==========================================
   AI PDF Assistant
   script.js - Part 1
========================================== */

// ========== DOM Elements ==========

const pdfFile = document.getElementById("pdfFile");
const browseBtn = document.getElementById("browseBtn");
const uploadBtn = document.getElementById("uploadBtn");

const chatBox = document.getElementById("chatBox");
const questionInput = document.getElementById("question");
const sendBtn = document.getElementById("sendBtn");

const newChatBtn = document.getElementById("newChatBtn");

const pdfName = document.getElementById("pdfName");
const pdfSize = document.getElementById("pdfSize");

const loading = document.getElementById("loading");
const toast = document.getElementById("toast");

const themeBtn = document.getElementById("themeBtn");


// ========== Variables ==========

let uploaded = false;
let currentPDF = null;

let history = [];


// ========== Toast ==========

function showToast(message) {

    toast.innerText = message;

    toast.style.display = "block";

    setTimeout(() => {

        toast.style.display = "none";

    }, 2500);

}


// ========== Loading ==========

function showLoading() {

    loading.style.display = "flex";

}

function hideLoading() {

    loading.style.display = "none";

}


// ========== Theme ==========

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

});


// ========== Browse PDF ==========

browseBtn.addEventListener("click", () => {

    pdfFile.click();

});


// ========== File Selected ==========

pdfFile.addEventListener("change", () => {

    if (pdfFile.files.length === 0) return;

    currentPDF = pdfFile.files[0];

    pdfName.innerText = currentPDF.name;

    pdfSize.innerText =
        (currentPDF.size / (1024 * 1024)).toFixed(2) + " MB";

});


// ========== Add Message ==========

function addMessage(sender, message) {

    const div = document.createElement("div");

    div.className = `message ${sender}`;

    div.innerHTML = `
        <div class="avatar">
            ${sender === "user" ? "👤" : "🤖"}
        </div>

        <div class="bubble">
            <h4>${sender === "user" ? "You" : "AI Assistant"}</h4>
            <p>${message}</p>
        </div>
    `;

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;

}


// ========== New Chat ==========

newChatBtn.addEventListener("click", () => {

    chatBox.innerHTML = "";

    history = [];

    addMessage(
        "ai",
        "👋 Welcome! Upload a PDF and ask me anything."
    );

    showToast("New Chat Created");

});


// ========== Enter Key ==========

questionInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        sendBtn.click();

    }

});


// ========== Welcome Message ==========

window.onload = () => {

    addMessage(
        "ai",
        "👋 Welcome! Upload a PDF and ask me anything."
    );

};
/* ==========================================
   Part 2 - PDF Upload
========================================== */

// Upload PDF
uploadBtn.addEventListener("click", uploadPDF);

async function uploadPDF() {

    if (!currentPDF) {
        showToast("Please choose a PDF first.");
        return;
    }

    const formData = new FormData();
    formData.append("file", currentPDF);

    try {

        showLoading();

        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        hideLoading();

        if (response.ok) {

            uploaded = true;

            showToast("PDF uploaded successfully!");

            addMessage(
                "ai",
                "✅ Your PDF has been uploaded successfully. You can now ask questions about it."
            );

        } else {

            showToast(data.detail || "Upload failed.");

        }

    } catch (error) {

        hideLoading();

        console.error(error);

        showToast("Server connection failed.");

    }

}


// ==========================================
// Drag & Drop Support
// ==========================================

const uploadBox = document.querySelector(".upload-box");

uploadBox.addEventListener("dragover", (e) => {

    e.preventDefault();

    uploadBox.style.border = "2px dashed #2563eb";

});

uploadBox.addEventListener("dragleave", () => {

    uploadBox.style.border = "";

});

uploadBox.addEventListener("drop", (e) => {

    e.preventDefault();

    uploadBox.style.border = "";

    if (e.dataTransfer.files.length === 0) return;

    const file = e.dataTransfer.files[0];

    if (file.type !== "application/pdf") {

        showToast("Only PDF files are allowed.");

        return;

    }

    currentPDF = file;

    pdfName.innerText = file.name;

    pdfSize.innerText =
        (file.size / (1024 * 1024)).toFixed(2) + " MB";

    showToast("PDF selected.");

});
/* ==========================================
   Part 3 - Chat with AI
========================================== */

// Send Button
sendBtn.addEventListener("click", sendMessage);


// Send Question
async function sendMessage() {

    const question = questionInput.value.trim();

    if (question === "") {

        showToast("Please enter a question.");

        return;

    }

    if (!uploaded) {

        showToast("Please upload a PDF first.");

        return;

    }

    // User Message
    addMessage("user", question);

    history.push({
        role: "user",
        content: question
    });

    questionInput.value = "";

    showLoading();

    try {

        const response = await fetch("/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                question: question

            })

        });

        const data = await response.json();

        hideLoading();

        if (response.ok) {

            // Support both "answer" and "response"
            const reply = data.answer || data.response || "No response received.";

            addMessage("ai", reply);

            history.push({

                role: "assistant",

                content: reply

            });

        } else {

            showToast(data.detail || "Failed to get response.");

        }

    }

    catch (error) {

        hideLoading();

        console.error(error);

        showToast("Server connection failed.");

    }

}


// ==========================================
// Clear Chat
// ==========================================

function clearChat() {

    chatBox.innerHTML = "";

    history = [];

    addMessage(
        "ai",
        "👋 Welcome! Upload a PDF and ask me anything."
    );

}


// ==========================================
// Auto Focus
// ==========================================

questionInput.focus();


// ==========================================
// Save Chat (Optional)
// ==========================================

function saveHistory() {

    localStorage.setItem(

        "chat_history",

        JSON.stringify(history)

    );

}

function loadHistory() {

    const data = localStorage.getItem("chat_history");

    if (!data) return;

    history = JSON.parse(data);

    chatBox.innerHTML = "";

    history.forEach(msg => {

        if (msg.role === "assistant") {

            addMessage("ai", msg.content);

        } else {

            addMessage("user", msg.content);

        }

    });

}


// Save whenever history changes
const originalPush = history.push.bind(history);

history.push = function (...items) {

    const result = originalPush(...items);

    saveHistory();

    return result;

};


// Load previous chat
loadHistory();


// ==========================================
// End of Script
// ==========================================