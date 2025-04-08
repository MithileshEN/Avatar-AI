const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

// State variables
let currentUserMessage = null;
let isGeneratingResponse = false;

const GOOGLE_API_KEY = "AIzaSyD1KKL09FFxbTd0WNYZY8Y1YkpYKPvPDcw";
const API_REQUEST_URL = `http://127.0.0.1:8000/test/analyze-csv`;

// Load saved data from local storage
const loadSavedChatHistory = () => {
    const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";

    document.body.classList.toggle("light_mode", isLightTheme);
    themeToggleButton.innerHTML = isLightTheme ? '<i class="bx bx-moon"></i>' : '<i class="bx bx-sun"></i>';

    chatHistoryContainer.innerHTML = '';

    // Iterate through saved chat history and display messages
    savedConversations.forEach(conversation => {
        // Display the user's message
        const userMessageHtml = `

            <div class="message__content">
                <img class="message__avatar" src="assets/profile.png" alt="User avatar">
               <p class="message__text">${conversation.userMessage}</p>
            </div>
        
        `;

        const outgoingMessageElement = createChatMessageElement(userMessageHtml, "message--outgoing");
        chatHistoryContainer.appendChild(outgoingMessageElement);

        // Display the API response
        const responseText = conversation.apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsedApiResponse = marked.parse(responseText); // Convert to HTML
        const rawApiResponse = responseText; // Plain text version

        const responseHtml = `
        
           <div class="message__content">
                <img class="message__avatar" src="assets/gemini.svg" alt="Gemini avatar">
                <p class="message__text"></p>
                <div class="message__loading-indicator hide">
                    <div class="message__loading-bar"></div>
                    <div class="message__loading-bar"></div>
                    <div class="message__loading-bar"></div>
                </div>
            </div>
            <span onClick="copyMessageToClipboard(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
        
        `;

        const incomingMessageElement = createChatMessageElement(responseHtml, "message--incoming");
        chatHistoryContainer.appendChild(incomingMessageElement);

        const messageTextElement = incomingMessageElement.querySelector(".message__text");

        // Display saved chat without typing effect
        showTypingEffect(rawApiResponse, parsedApiResponse, messageTextElement, incomingMessageElement, true); // 'true' skips typing
    });

    document.body.classList.toggle("hide-header", savedConversations.length > 0);
};

// create a new chat message element
const createChatMessageElement = (htmlContent, ...cssClasses) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", ...cssClasses);
    messageElement.innerHTML = htmlContent;
    return messageElement;
}

// Show typing effect
const showTypingEffect = (rawText, htmlText, messageElement, incomingMessageElement, skipEffect = false) => {
    const copyIconElement = incomingMessageElement.querySelector(".message__icon");
    copyIconElement.classList.add("hide"); // Initially hide copy button

    if (skipEffect) {
        // Display content directly without typing
        messageElement.innerHTML = htmlText;
        hljs.highlightAll();
        addCopyButtonToCodeBlocks();
        copyIconElement.classList.remove("hide"); // Show copy button
        isGeneratingResponse = false;
        return;
    }

    const wordsArray = rawText.split(' ');
    let wordIndex = 0;

    const typingInterval = setInterval(() => {
        messageElement.innerText += (wordIndex === 0 ? '' : ' ') + wordsArray[wordIndex++];
        if (wordIndex === wordsArray.length) {
            clearInterval(typingInterval);
            isGeneratingResponse = false;
            messageElement.innerHTML = htmlText;
            hljs.highlightAll();
            addCopyButtonToCodeBlocks();
            copyIconElement.classList.remove("hide");
        }
    }, 75);
};

// Fetch API response based on user input
// const requestApiResponse = async (incomingMessageElement) => {
//     const messageTextElement = incomingMessageElement.querySelector(".message__text");

//     try {
//         const response = await fetch(API_REQUEST_URL, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 contents: [{ role: "user", parts: [{ text: currentUserMessage }] }]
//             }),
//         });

//         const responseData = await response.json();
//         if (!response.ok) throw new Error(responseData.error.message);

//         const responseText = responseData;
//         if (!responseText) throw new Error("Invalid API response.");

//         const parsedApiResponse = marked.parse(responseText);
//         const rawApiResponse = responseText;

//         showTypingEffect(rawApiResponse, parsedApiResponse, messageTextElement, incomingMessageElement);

//         // Save conversation in local storage
//         let savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
//         savedConversations.push({
//             userMessage: currentUserMessage,
//             apiResponse: responseData
//         });
//         localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));
//     } catch (error) {
//         isGeneratingResponse = false;
//         messageTextElement.innerText = error.message;
//         messageTextElement.closest(".message").classList.add("message--error");
//     } finally {
//         incomingMessageElement.classList.remove("message--loading");
//     }
// };
// const requestApiResponse = async (incomingMessageElement) => {
//     const messageTextElement = incomingMessageElement.querySelector(".message__text");

//     try {
//         const response = await fetch(API_REQUEST_URL, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 contents: [{ role: "user", parts: [{ text: currentUserMessage }] }]
//             }),
//         });

//         const responseData = await response.json();
//         if (!response.ok) throw new Error("API request failed.");

//         const responseText = JSON.stringify(responseData, null, 2);

//         // Simulate typing effect completion (necessary for send button to work)
//         const simulateTypingCompletion = (rawApiResponse, messageTextElement, incomingMessageElement) => {
//             messageTextElement.textContent = rawApiResponse;
//             incomingMessageElement.classList.remove("message--loading");
//             isGeneratingResponse = false; // Important for re-enabling the send button
//         };

//         simulateTypingCompletion(responseText, messageTextElement, incomingMessageElement);

//         // Save conversation in local storage
//         let savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
//         savedConversations.push({
//             userMessage: currentUserMessage,
//             apiResponse: responseData
//         });
//         localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));
//     } catch (error) {
//         isGeneratingResponse = false;
//         messageTextElement.innerText = error.message;
//         messageTextElement.closest(".message").classList.add("message--error");
//     } finally {
//         //incomingMessageElement.classList.remove("message--loading"); //Removed since it is already called in simulateTypingCompletion
//     }
// };
// const requestApiResponse = async (incomingMessageElement) => {
//     const messageTextElement = incomingMessageElement.querySelector(".message__text");

//     try {
//         const response = await fetch(API_REQUEST_URL, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 user_query: currentUserMessage // Changed to match your FastAPI endpoint
//             }),
//         });

//         const responseData = await response.json();

//         if (!response.ok) {
//             throw new Error(responseData.detail || "API request failed."); // Handle FastAPI error details
//         }
//         if (responseData.type === "plotly_json") {
//             const parsedJson = JSON.parse(responseData.response.figure_json);
        
//             // Extract values into an array
//             const yValues = Object.values(parsedJson.data[0].y);
        
//             // Force numerical conversion
//             const numericalYValues = yValues.map(value => parseFloat(value));
        
//             parsedJson.data[0].y = numericalYValues; //replace the old y values with the new numerical y values.
        
//             messageTextElement.innerHTML = '<div id="plotly-chart"></div>';
//             Plotly.newPlot("plotly-chart", parsedJson);
        
//             // ... (rest of your code)
//         }
//         else {
//             // Display text response
//             messageTextElement.textContent = responseData.response;
//         }

//         incomingMessageElement.classList.remove("message--loading");
//         isGeneratingResponse = false;

//         // Save conversation in local storage
//         let savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
//         savedConversations.push({
//             userMessage: currentUserMessage,
//             apiResponse: responseData
//         });
//         localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));

//     } catch (error) {
//         isGeneratingResponse = false;
//         messageTextElement.innerText = error.message;
//         messageTextElement.closest(".message").classList.add("message--error");
//     }
// };

// Image+text
// const requestApiResponse = async (incomingMessageElement) => {
//     const messageTextElement = incomingMessageElement.querySelector(".message__text");

//     try {
//         const response = await fetch(API_REQUEST_URL, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 contents: [{ role: "user", parts: [{ text: currentUserMessage }] }]
//             }),
//         });

//         const responseData = await response.json();
//         if (!response.ok) throw new Error("API request failed.");

//         const simulateTypingCompletion = (data, messageTextElement, incomingMessageElement) => {
//             messageTextElement.innerHTML = "";

//             if (data.image_url) {
//                 const img = document.createElement("img");
//                 img.src = data.image_url;
//                 img.style.maxWidth = "100%";
//                 img.onerror = () => {
//                    messageTextElement.textContent = "Error loading image.";
//                 }
//                 messageTextElement.appendChild(img);
//                 if (data.insights){
//                     const textDiv = document.createElement("div");
//                     textDiv.textContent = data.insights;
//                     messageTextElement.appendChild(textDiv);
//                 }
//             } else if (data.text) {
//                 messageTextElement.textContent = data.text;
//             } else {
//                 messageTextElement.textContent = JSON.stringify(data, null, 2);
//             }

//             incomingMessageElement.classList.remove("message--loading");
//             isGeneratingResponse = false;
//         };

//         simulateTypingCompletion(responseData, messageTextElement, incomingMessageElement);

//         let savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
//         savedConversations.push({
//             userMessage: currentUserMessage,
//             apiResponse: responseData
//         });
//         localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));
//     } catch (error) {
//         isGeneratingResponse = false;
//         messageTextElement.innerText = error.message;
//         messageTextElement.closest(".message").classList.add("message--error");
//     }
// };
const requestApiResponse = async (incomingMessageElement) => {
    const messageTextElement = incomingMessageElement.querySelector(".message__text");

    try {
        const response = await fetch(API_REQUEST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: currentUserMessage }] }]
            }),
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error("API request failed.");

        const simulateTypingCompletion = (data, messageTextElement, incomingMessageElement) => {
            messageTextElement.innerHTML = "";

            if (data.type === "image") {
                const img = document.createElement("img");
                img.src = data.response; // Use the base64-encoded image data
                img.style.maxWidth = "100%";
                img.onerror = () => {
                    messageTextElement.textContent = "Error loading image.";
                }
                messageTextElement.appendChild(img);
                if (data.insights){
                    const textDiv = document.createElement("div");
                    textDiv.textContent = data.insights;
                    messageTextElement.appendChild(textDiv);
                }
            } else if (data.type === "text") {
                messageTextElement.textContent = data.response;
            } else {
                messageTextElement.textContent = JSON.stringify(data, null, 2);
            }

            incomingMessageElement.classList.remove("message--loading");
            isGeneratingResponse = false;
        };

        simulateTypingCompletion(responseData, messageTextElement, incomingMessageElement);

        let savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
        savedConversations.push({
            userMessage: currentUserMessage,
            apiResponse: responseData
        });
        localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));
    } catch (error) {
        isGeneratingResponse = false;
        messageTextElement.innerText = error.message;
        messageTextElement.closest(".message").classList.add("message--error");
    }
};
// Add copy button to code blocks
const addCopyButtonToCodeBlocks = () => {
    const codeBlocks = document.querySelectorAll('pre');
    codeBlocks.forEach((block) => {
        const codeElement = block.querySelector('code');
        let language = [...codeElement.classList].find(cls => cls.startsWith('language-'))?.replace('language-', '') || 'Text';

        const languageLabel = document.createElement('div');
        languageLabel.innerText = language.charAt(0).toUpperCase() + language.slice(1);
        languageLabel.classList.add('code__language-label');
        block.appendChild(languageLabel);

        const copyButton = document.createElement('button');
        copyButton.innerHTML = `<i class='bx bx-copy'></i>`;
        copyButton.classList.add('code__copy-btn');
        block.appendChild(copyButton);

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(codeElement.innerText).then(() => {
                copyButton.innerHTML = `<i class='bx bx-check'></i>`;
                setTimeout(() => copyButton.innerHTML = `<i class='bx bx-copy'></i>`, 2000);
            }).catch(err => {
                console.error("Copy failed:", err);
                alert("Unable to copy text!");
            });
        });
    });
};

// Show loading animation during API request
const displayLoadingAnimation = () => {
    const loadingHtml = `

        <div class="message__content">
            <img class="message__avatar" src="assets/gemini.svg" alt="Gemini avatar">
            <p class="message__text"></p>
            <div class="message__loading-indicator">
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
            </div>
        </div>
        <span onClick="copyMessageToClipboard(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
    
    `;

    const loadingMessageElement = createChatMessageElement(loadingHtml, "message--incoming", "message--loading");
    chatHistoryContainer.appendChild(loadingMessageElement);

    requestApiResponse(loadingMessageElement);
};

// Copy message to clipboard
const copyMessageToClipboard = (copyButton) => {
    const messageContent = copyButton.parentElement.querySelector(".message__text").innerText;

    navigator.clipboard.writeText(messageContent);
    copyButton.innerHTML = `<i class='bx bx-check'></i>`; // Confirmation icon
    setTimeout(() => copyButton.innerHTML = `<i class='bx bx-copy-alt'></i>`, 1000); // Revert icon after 1 second
};

// Handle sending chat messages
const handleOutgoingMessage = () => {
    currentUserMessage = messageForm.querySelector(".prompt__form-input").value.trim() || currentUserMessage;
    if (!currentUserMessage || isGeneratingResponse) return; // Exit if no message or already generating response

    isGeneratingResponse = true;

    const outgoingMessageHtml = `
    
        <div class="message__content">
            <img class="message__avatar" src="assets/profile.png" alt="User avatar">
            <p class="message__text"></p>
        </div>

    `;

    const outgoingMessageElement = createChatMessageElement(outgoingMessageHtml, "message--outgoing");
    outgoingMessageElement.querySelector(".message__text").innerText = currentUserMessage;
    chatHistoryContainer.appendChild(outgoingMessageElement);

    messageForm.reset(); // Clear input field
    document.body.classList.add("hide-header");
    setTimeout(displayLoadingAnimation, 500); // Show loading animation after delay
};

// Toggle between light and dark themes
themeToggleButton.addEventListener('click', () => {
    const isLightTheme = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");

    // Update icon based on theme
    const newIconClass = isLightTheme ? "bx bx-moon" : "bx bx-sun";
    themeToggleButton.querySelector("i").className = newIconClass;
});

// Clear all chat history
clearChatButton.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all chat history?")) {
        localStorage.removeItem("saved-api-chats");

        // Reload chat history to reflect changes
        loadSavedChatHistory();

        currentUserMessage = null;
        isGeneratingResponse = false;
    }
});

// Handle click on suggestion items
suggestionItems.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
        currentUserMessage = suggestion.querySelector(".suggests__item-text").innerText;
        handleOutgoingMessage();
    });
});

// Prevent default from submission and handle outgoing message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});

// Load saved chat history on page load
loadSavedChatHistory();
