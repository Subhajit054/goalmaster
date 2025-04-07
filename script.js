const goalList = document.getElementById('goal-list');
const completedList = document.getElementById('completed-list');
const goalForm = document.getElementById('goal-form');
const flipTimer = document.getElementById('flip-timer');
const motivationDiv = document.getElementById('motivation');

// Motivational Quotes
const motivations = [
    "You’re a rockstar—keep shining!",
    "Small steps lead to big wins!",
    "Believe in yourself—you’ve got this!",
    "Today’s effort, tomorrow’s reward!"
];

// Add Goal
goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('goal-name').value;
    const deadline = document.getElementById('goal-deadline').value;
    await db.collection('goals').add({
        name,
        deadline,
        progress: 0,
        lastUpdate: new Date().toISOString(),
        completed: false
    });
    goalForm.reset();
    loadGoals();
});

// Load Goals and Update UI
async function loadGoals() {
    goalList.innerHTML = '';
    completedList.innerHTML = '';
    const snapshot = await db.collection('goals').get();
    snapshot.forEach(doc => {
        const goal = doc.data();
        if (goal.completed) {
            const li = document.createElement('li');
            li.textContent = `${goal.name} - Done!`;
            completedList.appendChild(li);
        } else {
            const goalItem = document.createElement('div');
            goalItem.className = 'goal-item';
            goalItem.innerHTML = `
                <span>${goal.name}</span>
                <div class="progress-bar"><div class="progress" style="width: ${goal.progress}%"></div></div>
                <div>
                    <button onclick="updateProgress('${doc.id}', ${goal.progress + 10})">+10%</button>
                    <button onclick="completeGoal('${doc.id}')">Complete</button>
                </div>
            `;
            goalList.appendChild(goalItem);
            updateTimer(goal.deadline);
            checkInactivity(goal.lastUpdate);
        }
    });
}

// Update Progress
async function updateProgress(id, progress) {
    await db.collection('goals').doc(id).update({
        progress: Math.min(progress, 100),
        lastUpdate: new Date().toISOString()
    });
    loadGoals();
}

// Complete Goal
async function completeGoal(id) {
    await db.collection('goals').doc(id).update({ completed: true });
    loadGoals();
    notifyUser("Goal Completed! You’re amazing!");
}

// Flip Timer
function updateTimer(deadline) {
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.max(0, end - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    flipTimer.innerHTML = `
        <div class="flip-card"><div class="front">${days}</div><div class="back">${days}</div></div><span class="flip-label">Days</span>
        <div class="flip-card"><div class="front">${hours}</div><div class="back">${hours}</div></div><span class="flip-label">Hours</span>
        <div class="flip-card"><div class="front">${minutes}</div><div class="back">${minutes}</div></div><span class="flip-label">Mins</span>
    `;
    document.querySelectorAll('.flip-card').forEach(card => {
        card.classList.add('flip');
        setTimeout(() => card.classList.remove('flip'), 800);
    });
}

// Check Inactivity and Notify
function checkInactivity(lastUpdate) {
    const last = new Date(lastUpdate);
    const now = new Date();
    const daysDiff = (now - last) / (1000 * 60 * 60 * 24);
    if (daysDiff > 5) {
        notifyUser("Hey, it’s been a while! Time to get back to your goals!");
    }
    motivateRandomly();
}

// Random Motivation
function motivateRandomly() {
    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
    motivationDiv.textContent = randomMotivation;
    setTimeout(() => notifyUser(randomMotivation), Math.random() * 86400000); // Random daily
}

// Push Notification
async function notifyUser(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("GoalMaster", { body: message, icon: 'https://via.placeholder.com/32' });
    } else if ('Notification' in window) {
        await Notification.requestPermission();
        if (Notification.permission === 'granted') new Notification("GoalMaster", { body: message });
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(() => console.log('Service Worker Registered'));
}

// Initialize
loadGoals();
setInterval(loadGoals, 60000); // Refresh every minute