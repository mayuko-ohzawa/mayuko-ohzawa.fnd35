'use strict'
// 1行目に記載している 'use strict' は削除しないでください

const googleAPI = "https://language.googleapis.com/v1/documents:analyzeSentiment";
const googleAPIKey = "AIzaSyBQ8yVEOZST1oEoP1yV1yHvM6eJDE1dGDQ";
const chatGPTAPI = "https://api.openai.com/v1/chat/completions";
const openAIKey = "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";

let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "ja-JP";
recognition.interimResults = false;

const recordButton = document.getElementById("recordButton");
const stopButton = document.getElementById("stopButton");
const userSpeech = document.getElementById("userSpeech");
const chatBox = document.getElementById("chat");
const logContainer = document.getElementById("log");

let chatLog = [];
let mediaRecorder;
let audioChunks = [];

const emotionMusicMap = {
  joy: ["https://youtu.be/xFrGuyw1V8s?feature=shared", "https://youtu.be/Thppn60u1E0?feature=shared"],
  sadness: ["https://youtu.be/G7KNmW9a75Y?feature=shared"],
  anger: ["https://youtu.be/up0t2ZDfX7E?feature=shared"],
  neutral: ["https://youtu.be/dQw4w9WgXcQ?feature=shared"]
};

const fallbackMessages = {
  joy: "It sounds like you're having a great time! Keep enjoying😊",
  sadness: "I'm here for you. Things will get better💙",
  anger: "Take a deep breath. Let's find a way to calm down😌",
  neutral: "Thanks for sharing! Let me know if you need anything."
};

recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

async function startRecording() {
  recognition.start();
  audioChunks = [];
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
  mediaRecorder.onstop = processAudio;
  mediaRecorder.start();
  recordButton.disabled = true;
  stopButton.disabled = false;
}

function stopRecording() {
  mediaRecorder.stop();
  recognition.stop();
  recordButton.disabled = false;
  stopButton.disabled = true;
}

function processAudio() {
  const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
  const latestLog = chatLog.length > 0 ? chatLog[chatLog.length - 1] : { emotion: "neutral" };
  saveAudioFile(audioBlob, latestLog.emotion);
}

function saveAudioFile(audioBlob, emotion) {
  const now = new Date();
  now.setHours(now.getHours() + 9); // JSTに変換
  const timestamp = now.toISOString().replace(/[:.]/g, "-").split("T").join("_").slice(0, -1);
  const fileName = `${emotion}_${timestamp}.wav`;
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function logChat(text, emotion) {
  const timestamp = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  chatLog.push({ text, emotion, timestamp });
  updateLogDisplay();
}

function updateLogDisplay() {
  logContainer.innerHTML = "";
  chatLog.forEach((entry, index) => {
    const logEntry = document.createElement("div");
    logEntry.innerHTML = `<input type='text' value='${entry.text}' onchange='editLog(${index}, this.value)'> [${entry.timestamp}] (${entry.emotion})`;
    logContainer.appendChild(logEntry);
  });
}

function editLog(index, newText) {
  chatLog[index].text = newText;
}

function playEmotionMusic(emotion) {
  if (emotionMusicMap[emotion]) {
    const urls = emotionMusicMap[emotion];
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];

    console.log("Opening YouTube:", randomUrl);
    setTimeout(() => {window.open(randomUrl, "_blank");}, 500)
  } else {
    console.log("No matching emotion video found.");
  }
}

async function sendToGoogleCloud(text) {
  const requestBody = {
    document: {
      type: "PLAIN_TEXT",
      content: text
    },
    encodingType: "UTF8"
  };
  try {
    const response = await fetch(`${googleAPI}?key=${googleAPIKey}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error, status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Analysis result:", data);
    handleEmotionResponse(text, data);
  } catch (error) {
    console.error("Error:", error);
    chatBox.innerText = `ChatBot: Error occurred (${error.message})`;
  }
}

recognition.onresult = function(event) {
  const transcript = event.results[0][0].transcript;
  console.log("ASR result:", transcript);
  userSpeech.innerText = `You: ${transcript}`;
  sendToGoogleCloud(transcript);
};

async function sendToChatGPT(text, emotion) {
  const requestBody = {
    model: "gpt-4",
    messages: [
      { role: "system", content: "あなたはユーザーの感情に共感し、適切に返答するAIです。" },
      { role: "user", content: `ユーザーの発話: "${text}"\n認識した感情: ${emotion}` }
    ]
  };
  try {
    const response = await fetch(chatGPTAPI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error, status: ${response.status}`);
    }
    
    const data = await response.json();
    chatBox.innerText = `ChatBot: ${data.choices[0].message.content}`;
  } catch (error) {
    console.error("ChatGPT Error:", error);
    chatBox.innerText = `ChatBot: ${fallbackMessages[emotion]}`;
  }
}

recognition.onresult = function(event) {
  const transcript = event.results[0][0].transcript;
  console.log("ASR result:", transcript);
  userSpeech.innerText = `You: ${transcript}`;
  sendToGoogleCloud(transcript);
};

function handleEmotionResponse(text, data) {
  if (!data || !data.documentSentiment) {
    console.error("Could not obtain emotion data.");
    chatBox.innerText = "ChatBot: Could not recognize emotion.";
    return;
  }
  
  const score = data.documentSentiment.score;
  let emotion = "neutral";
  
  if (score > 0.25) {
    emotion = "joy";
  } else if (score < -0.5) {
    emotion = "anger";
  } else if (score < -0.25) {
    emotion = "sadness";
  }

  logChat(text, emotion);
  sendToChatGPT(text, emotion);
  // playEmotionMusic(emotion);
}
