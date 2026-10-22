const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const auditBtn = document.getElementById("auditBtn");
const electiveSelect = document.getElementById("electiveSelect");


function appendMessage(sender, text, cssClass, category) {
    const div = document.createElement("div");
    div.className = "message " + cssClass;

    const strong = document.createElement("strong");
    strong.textContent = sender + ": ";
    div.appendChild(strong);

    const textContainer = document.createElement("div");
    textContainer.style.whiteSpace = "pre-wrap";
    textContainer.style.marginTop = "4px";
    textContainer.innerHTML = text;
    div.appendChild(textContainer);

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const typing = document.createElement("div");
    typing.id = "typingIndicator";
    typing.className = "typing";
    typing.textContent = "Advisor is reviewing your degree file...";
    chatBox.appendChild(typing);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
}

// 🛠️ FIX: This function now targets 'chatBox' to append the graduation audit report nicely
async function runGraduationAudit() {
    const checkedMajorBoxes = document.querySelectorAll(".course-check[data-category='major']:checked");
    const completedMajorList = Array.from(checkedMajorBoxes).map(cb => cb.value);

    const genEdCreditsObj = {};
    document.querySelectorAll(".gened-select").forEach(select => {
        const categoryName = select.getAttribute("data-category");
        genEdCreditsObj[categoryName] = select.value;
    });

    const electiveCredits = electiveSelect.value;

    appendMessage("You", "*selections sent to advisor*", "user");
    showTyping();

    try {
        const response = await fetch("/grad-tracker", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                completedCourses: completedMajorList,
                genEdCredits: genEdCreditsObj,
                electiveCredits: electiveCredits
            })
        });

        const data = await response.json();
        removeTyping();

        let reportText = `Based on your selections: \n\n`;

        // Format Outstanding Major Requirements
        reportText += `Courses you still have to take for your major...\n`;
        if (data.remainingCourses.length === 0) {
            reportText += `All major requirements completed!\n\n`;
        } else {
            reportText += data.remainingCourses.map(c => `• ${c}`).join("\n") + `\n\n`;
        }

        reportText += `Credits you still need in general education...\n`;
        if (data.remainingGenEd.length === 0) {
            reportText += `All General Education criteria satisfied!\n\n`;
        } else {
            reportText += data.remainingGenEd.map(line => `• ${line}`).join("\n") + `\n\n`;
        }


        const percentElective = Math.round((data.completedElectiveCredits / 15) * 100);
        reportText += `Credits you still need from electives...\n`;
        reportText += `Logged: ${data.completedElectiveCredits} / 9 Credits\n`;
        if (data.remainingElectiveCredits === 0) {
            reportText += `Elective tracks satisfied.\n`;
        } else {
            reportText += `${data.remainingElectiveCredits} more credits required.\n`;
        }

        appendMessage("Advisor", reportText, "bot", "transcript_audit");

    } catch (error) {
        removeTyping();
        appendMessage("Advisor", "I encountered an error trying to process your evaluation parameters.", "bot", "network_error");
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    appendMessage("You", message, "user");
    messageInput.value = "";
    showTyping();
    sendBtn.disabled = true;

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        removeTyping();
        appendMessage("Advisor", data.bot, "bot", data.category);
    } catch (error) {
        removeTyping();
        appendMessage("Advisor", "I could not contact the server routing table.", "bot", "error");
    } finally {
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

function clearChat() {
    chatBox.innerHTML = "";
    document.querySelectorAll(".course-check").forEach(cb => cb.checked = false);
    document.querySelectorAll(".gened-select, #electiveSelect").forEach(sel => sel.value = "0");
    appendMessage("Advisor", "Selections and transcripts cleared! Fill out your panels on the left to review your paths again.", "bot");
}


if (auditBtn) auditBtn.addEventListener("click", runGraduationAudit);
sendBtn.addEventListener("click", sendMessage);
clearBtn.addEventListener("click", clearChat);
messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendMessage();
});