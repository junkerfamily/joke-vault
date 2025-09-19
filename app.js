// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    updateDoc,
    doc, 
    query, 
    where, 
    orderBy,
    increment 
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgs4oDAW_ZSb9EE-AdUH6RK_5aJJULzgg",
  authDomain: "joke-vault-5121c.firebaseapp.com",
  projectId: "joke-vault-5121c",
  storageBucket: "joke-vault-5121c.firebasestorage.app",
  messagingSenderId: "186948204671",
  appId: "1:186948204671:web:123516922e5513a021274a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const addJokeBtn = document.getElementById('addJokeBtn');
const addJokeForm = document.getElementById('addJokeForm');
const saveJokeBtn = document.getElementById('saveJokeBtn');
const cancelJokeBtn = document.getElementById('cancelJokeBtn');
const jokeTypeSelect = document.getElementById('jokeType');
const jokeContentTextarea = document.getElementById('jokeContent');
const jokesContainer = document.getElementById('jokesContainer');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');

// State
let allJokes = [];
let currentFilter = 'all';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadJokes();
    setupEventListeners();
    initializeWithDadJokes();
    initializeWithMovieOneLiners();
    initializeWithPuns();
    initializeWithOlyLinaJokes();
    initializeWithChickenJokes();
});

// Setup event listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            setActiveFilter(e.target);
            currentFilter = e.target.dataset.type;
            filterJokes();
        });
    });
    
    addJokeBtn.addEventListener('click', showAddJokeForm);
    cancelJokeBtn.addEventListener('click', hideAddJokeForm);
    saveJokeBtn.addEventListener('click', saveNewJoke);
}

// Set active filter button
function setActiveFilter(activeBtn) {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

// Sort jokes by likes (descending), then by timestamp (descending) for ties
function sortJokesByLikes(jokes) {
    return jokes.sort((a, b) => {
        const likesA = a.likes || 0;
        const likesB = b.likes || 0;
        
        if (likesB !== likesA) {
            return likesB - likesA; // Sort by likes descending
        }
        
        // If likes are equal, sort by timestamp descending (newest first)
        const timestampA = a.timestamp?.toDate?.() || new Date(0);
        const timestampB = b.timestamp?.toDate?.() || new Date(0);
        return timestampB - timestampA;
    });
}

// Load jokes from Firestore
async function loadJokes() {
    try {
        showLoading();
        const jokesRef = collection(db, 'jokes');
        const q = query(jokesRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allJokes = [];
        querySnapshot.forEach((doc) => {
            allJokes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort jokes by likes (descending), then by timestamp (descending) for ties
        allJokes.sort((a, b) => {
            const likesA = a.likes || 0;
            const likesB = b.likes || 0;
            
            if (likesB !== likesA) {
                return likesB - likesA; // Sort by likes descending
            }
            
            // If likes are equal, sort by timestamp descending (newest first)
            const timestampA = a.timestamp?.toDate?.() || new Date(0);
            const timestampB = b.timestamp?.toDate?.() || new Date(0);
            return timestampB - timestampA;
        });
        
        displayJokes(allJokes);
        hideLoading();
    } catch (error) {
        console.error('Error loading jokes:', error);
        hideLoading();
        showNoResults();
    }
}

// Display jokes
function displayJokes(jokes) {
    if (jokes.length === 0) {
        showNoResults();
        return;
    }
    
    hideNoResults();
    jokesContainer.innerHTML = jokes.map(joke => createJokeCard(joke)).join('');
    
    // Add menu toggle event listeners
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const jokeId = e.target.dataset.jokeId;
            toggleActionMenu(jokeId);
        });
    });
    
    // Add edit event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const jokeId = e.target.dataset.jokeId;
            showEditForm(jokeId);
        });
    });
    
    // Add delete event listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const jokeId = e.target.dataset.jokeId;
            deleteJoke(jokeId);
        });
    });
    
    // Add save edit event listeners
    document.querySelectorAll('.save-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const jokeId = e.target.dataset.jokeId;
            saveEditedJoke(jokeId);
        });
    });
    
    // Add cancel edit event listeners
    document.querySelectorAll('.cancel-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const jokeId = e.target.dataset.jokeId;
            cancelEdit(jokeId);
        });
    });
    
    // Add like button event listeners
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const jokeId = e.currentTarget.dataset.jokeId;
            toggleLike(jokeId);
        });
    });
    
    // Close action menus when clicking outside
    document.addEventListener('click', closeAllActionMenus);
}

// Create joke card HTML
function createJokeCard(joke) {
    const likeCount = joke.likes || 0;
    const isLiked = isJokeLiked(joke.id);
    
    return `
        <div class="joke-card" data-joke-id="${joke.id}">
            <div class="joke-actions">
                <button class="menu-btn" data-joke-id="${joke.id}">⋮</button>
                <div class="action-menu hidden" data-joke-id="${joke.id}">
                    <button class="edit-btn" data-joke-id="${joke.id}">✏️ Edit</button>
                    <button class="delete-btn" data-joke-id="${joke.id}">🗑️ Delete</button>
                </div>
            </div>
            <div class="joke-type">${joke.type.replace('-', ' ')}</div>
            <div class="joke-content" data-joke-id="${joke.id}">${joke.content}</div>
            <div class="joke-footer">
                <button class="like-btn ${isLiked ? 'liked' : ''}" data-joke-id="${joke.id}">
                    <span class="heart-icon">${isLiked ? '❤️' : '🤍'}</span>
                    <span class="like-count">${likeCount}</span>
                </button>
            </div>
            <div class="edit-form hidden" data-joke-id="${joke.id}">
                <select class="edit-type" data-joke-id="${joke.id}">
                    <option value="knock-knock" ${joke.type === 'knock-knock' ? 'selected' : ''}>Knock Knock</option>
                    <option value="dad" ${joke.type === 'dad' ? 'selected' : ''}>Dad Joke</option>
                    <option value="one-liner" ${joke.type === 'one-liner' ? 'selected' : ''}>One-Liner</option>
                    <option value="pun" ${joke.type === 'pun' ? 'selected' : ''}>Pun</option>
                    <option value="oly-lina" ${joke.type === 'oly-lina' ? 'selected' : ''}>Oly & Lina</option>
                    <option value="chicken" ${joke.type === 'chicken' ? 'selected' : ''}>Chicken Jokes</option>
                </select>
                <textarea class="edit-content" data-joke-id="${joke.id}" rows="4">${joke.content}</textarea>
                <div class="edit-buttons">
                    <button class="save-edit-btn" data-joke-id="${joke.id}">Save</button>
                    <button class="cancel-edit-btn" data-joke-id="${joke.id}">Cancel</button>
                </div>
            </div>
        </div>
    `;
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let filteredJokes = allJokes;
    
    if (currentFilter !== 'all') {
        filteredJokes = filteredJokes.filter(joke => joke.type === currentFilter);
    }
    
    if (searchTerm) {
        filteredJokes = filteredJokes.filter(joke => 
            joke.content.toLowerCase().includes(searchTerm) ||
            joke.type.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort filtered results by likes as well
    filteredJokes = sortJokesByLikes(filteredJokes);
    
    displayJokes(filteredJokes);
}

// Filter jokes by type
function filterJokes() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let filteredJokes = allJokes;
    
    if (currentFilter !== 'all') {
        filteredJokes = filteredJokes.filter(joke => joke.type === currentFilter);
    }
    
    if (searchTerm) {
        filteredJokes = filteredJokes.filter(joke => 
            joke.content.toLowerCase().includes(searchTerm) ||
            joke.type.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort filtered results by likes as well
    filteredJokes = sortJokesByLikes(filteredJokes);
    
    displayJokes(filteredJokes);
}

// Show add joke form
function showAddJokeForm() {
    addJokeForm.classList.remove('hidden');
    jokeContentTextarea.focus();
}

// Hide add joke form
function hideAddJokeForm() {
    addJokeForm.classList.add('hidden');
    jokeTypeSelect.value = 'knock-knock';
    jokeContentTextarea.value = '';
}

// Save new joke
async function saveNewJoke() {
    const type = jokeTypeSelect.value;
    const content = jokeContentTextarea.value.trim();
    
    if (!content) {
        alert('Please enter a joke!');
        return;
    }
    
    try {
        await addDoc(collection(db, 'jokes'), {
            type: type,
            content: content,
            timestamp: new Date(),
            likes: 0
        });
        
        hideAddJokeForm();
        loadJokes(); // Reload jokes
    } catch (error) {
        console.error('Error adding joke:', error);
        alert('Error adding joke. Please try again.');
    }
}

// Toggle action menu
function toggleActionMenu(jokeId) {
    // Close all other menus first
    document.querySelectorAll('.action-menu').forEach(menu => {
        if (menu.dataset.jokeId !== jokeId) {
            menu.classList.add('hidden');
        }
    });
    
    // Toggle the current menu
    const menu = document.querySelector(`.action-menu[data-joke-id="${jokeId}"]`);
    menu.classList.toggle('hidden');
}

// Close all action menus
function closeAllActionMenus() {
    document.querySelectorAll('.action-menu').forEach(menu => {
        menu.classList.add('hidden');
    });
}

// Show edit form
function showEditForm(jokeId) {
    // Hide the joke content and show edit form
    const jokeCard = document.querySelector(`.joke-card[data-joke-id="${jokeId}"]`);
    const jokeContent = jokeCard.querySelector('.joke-content');
    const editForm = jokeCard.querySelector('.edit-form');
    const actionMenu = jokeCard.querySelector('.action-menu');
    
    jokeContent.classList.add('hidden');
    editForm.classList.remove('hidden');
    actionMenu.classList.add('hidden');
    
    // Focus on the textarea
    const textarea = editForm.querySelector('.edit-content');
    textarea.focus();
}

// Cancel edit
function cancelEdit(jokeId) {
    const jokeCard = document.querySelector(`.joke-card[data-joke-id="${jokeId}"]`);
    const jokeContent = jokeCard.querySelector('.joke-content');
    const editForm = jokeCard.querySelector('.edit-form');
    
    // Reset form values to original
    const originalJoke = allJokes.find(joke => joke.id === jokeId);
    const typeSelect = editForm.querySelector('.edit-type');
    const contentTextarea = editForm.querySelector('.edit-content');
    
    typeSelect.value = originalJoke.type;
    contentTextarea.value = originalJoke.content;
    
    // Show joke content and hide edit form
    jokeContent.classList.remove('hidden');
    editForm.classList.add('hidden');
}

// Save edited joke
async function saveEditedJoke(jokeId) {
    const jokeCard = document.querySelector(`.joke-card[data-joke-id="${jokeId}"]`);
    const editForm = jokeCard.querySelector('.edit-form');
    const typeSelect = editForm.querySelector('.edit-type');
    const contentTextarea = editForm.querySelector('.edit-content');
    
    const newType = typeSelect.value;
    const newContent = contentTextarea.value.trim();
    
    if (!newContent) {
        alert('Please enter a joke!');
        return;
    }
    
    try {
        await updateDoc(doc(db, 'jokes', jokeId), {
            type: newType,
            content: newContent,
            timestamp: new Date()
        });
        
        loadJokes(); // Reload jokes to show updated content
    } catch (error) {
        console.error('Error updating joke:', error);
        alert('Error updating joke. Please try again.');
    }
}

// Delete joke
async function deleteJoke(jokeId) {
    if (confirm('Are you sure you want to delete this joke?')) {
        try {
            await deleteDoc(doc(db, 'jokes', jokeId));
            loadJokes(); // Reload jokes
        } catch (error) {
            console.error('Error deleting joke:', error);
            alert('Error deleting joke. Please try again.');
        }
    }
}

// Check if a joke is liked by the user (stored in localStorage)
function isJokeLiked(jokeId) {
    const likedJokes = JSON.parse(localStorage.getItem('likedJokes') || '[]');
    return likedJokes.includes(jokeId);
}

// Add or remove a joke from the user's liked list
function setJokeLiked(jokeId, isLiked) {
    let likedJokes = JSON.parse(localStorage.getItem('likedJokes') || '[]');
    
    if (isLiked && !likedJokes.includes(jokeId)) {
        likedJokes.push(jokeId);
    } else if (!isLiked && likedJokes.includes(jokeId)) {
        likedJokes = likedJokes.filter(id => id !== jokeId);
    }
    
    localStorage.setItem('likedJokes', JSON.stringify(likedJokes));
}

// Toggle like status for a joke
async function toggleLike(jokeId) {
    const isCurrentlyLiked = isJokeLiked(jokeId);
    const newLikedStatus = !isCurrentlyLiked;
    
    try {
        // Update Firebase with increment/decrement
        await updateDoc(doc(db, 'jokes', jokeId), {
            likes: increment(newLikedStatus ? 1 : -1)
        });
        
        // Update local storage
        setJokeLiked(jokeId, newLikedStatus);
        
        // Update UI immediately
        const likeBtn = document.querySelector(`.like-btn[data-joke-id="${jokeId}"]`);
        const heartIcon = likeBtn.querySelector('.heart-icon');
        const likeCountSpan = likeBtn.querySelector('.like-count');
        
        if (newLikedStatus) {
            likeBtn.classList.add('liked');
            heartIcon.textContent = '❤️';
        } else {
            likeBtn.classList.remove('liked');
            heartIcon.textContent = '🤍';
        }
        
        // Update the count display
        const currentCount = parseInt(likeCountSpan.textContent) || 0;
        const newCount = Math.max(0, currentCount + (newLikedStatus ? 1 : -1));
        likeCountSpan.textContent = newCount;
        
        // Update the joke in allJokes array to reflect new like count
        const jokeIndex = allJokes.findIndex(joke => joke.id === jokeId);
        if (jokeIndex !== -1) {
            allJokes[jokeIndex].likes = newCount;
        }
        
        // Re-sort and display jokes to update the order
        setTimeout(() => {
            // Small delay to let the UI update, then re-sort
            if (currentFilter === 'all' && !searchInput.value.trim()) {
                // Only reload if we're showing all jokes with no search
                allJokes = sortJokesByLikes(allJokes);
                displayJokes(allJokes);
            } else {
                // Re-apply current filters
                filterJokes();
            }
        }, 100);
        
    } catch (error) {
        console.error('Error updating like:', error);
        alert('Error updating like. Please try again.');
    }
}

// Show loading state
function showLoading() {
    loading.classList.remove('hidden');
    jokesContainer.innerHTML = '';
    hideNoResults();
}

// Hide loading state
function hideLoading() {
    loading.classList.add('hidden');
}

// Show no results message
function showNoResults() {
    noResults.classList.remove('hidden');
    jokesContainer.innerHTML = '';
}

// Hide no results message
function hideNoResults() {
    noResults.classList.add('hidden');
}

// Initialize with 100 dad jokes
async function initializeWithDadJokes() {
    // Check if dad jokes already exist
    const jokesRef = collection(db, 'jokes');
    const dadJokesQuery = query(jokesRef, where('type', '==', 'dad'));
    const querySnapshot = await getDocs(dadJokesQuery);
    
    if (querySnapshot.size > 0) {
        console.log('Dad jokes already exist in database');
        return; // Dad jokes already exist, don't add duplicates
    }
    
    const dadJokes = [
        "I'm reading a book about anti-gravity. It's impossible to put down!",
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a fake noodle? An impasta!",
        "Why did the coffee file a police report? It got mugged!",
        "How do you organize a space party? You planet!",
        "Why don't eggs tell jokes? They'd crack each other up!",
        "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!",
        "I used to hate facial hair, but then it grew on me.",
        "Why do fathers take an extra pair of socks when they go golfing? In case they get a hole in one!",
        "What's the best thing about Switzerland? I don't know, but the flag is a big plus.",
        "I invented a new word: Plagiarism!",
        "Why don't skeletons fight each other? They don't have the guts.",
        "What do you call a bear with no teeth? A gummy bear!",
        "Why did the math book look so sad? Because it had too many problems!",
        "How does a penguin build its house? Igloos it together!",
        "What do you call a sleeping bull? A bulldozer!",
        "Why did the bicycle fall over? Because it was two tired!",
        "What do you call a fish wearing a crown? A king fish!",
        "Why don't oysters donate? Because they are shellfish!",
        "What's orange and sounds like a parrot? A carrot!",
        "Why did the scarecrow win an award? He was outstanding in his field!",
        "What do you call a cow with no legs? Ground beef!",
        "Why don't scientists trust stairs? Because they're always up to something!",
        "What did the ocean say to the beach? Nothing, it just waved!",
        "Why did the cookie go to the doctor? Because it felt crumbly!",
        "What do you call a dog magician? A labracadabrador!",
        "Why did the banana go to the doctor? It wasn't peeling well!",
        "What's the difference between a fish and a piano? You can't tuna fish!",
        "Why did the golfer bring two pairs of pants? In case he got a hole in one!",
        "What do you call a factory that makes okay products? A satisfactory!",
        "Why don't eggs tell each other jokes? Because they'd crack up!",
        "What do you call a belt made of watches? A waist of time!",
        "Why did the tomato turn red? Because it saw the salad dressing!",
        "What do you call a parade of rabbits hopping backwards? A receding hare-line!",
        "Why don't melons get married? Because they cantaloupe!",
        "What did one wall say to the other wall? I'll meet you at the corner!",
        "Why did the football coach go to the bank? To get his quarterback!",
        "What do you call a pig that does karate? A pork chop!",
        "Why don't some couples go to the gym? Because some relationships don't work out!",
        "What do you call a deer with no eyes? No-eye deer (no idea)!",
        "Why did the computer go to the doctor? Because it had a virus!",
        "What do you call a fish that needs help with his vocals? Auto-tuna!",
        "Why did the stadium get hot after the game? All of the fans left!",
        "What do you call a cow in an earthquake? A milkshake!",
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a chicken crossing the road? Poultry in motion!",
        "Why did the invisible man turn down the job offer? He couldn't see himself doing it!",
        "What do you call a group of disorganized cats? A cat-astrophe!",
        "Why don't skeletons go to scary movies? They don't have the guts!",
        "What do you call a dinosaur that loves to sleep? A dino-snore!",
        "Why did the coffee file a police report? It got mugged!",
        "What do you call a bear with no ears? B!",
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a fish wearing a bowtie? Sofishticated!",
        "Why did the math book look so sad? Because of all its problems!",
        "What do you call a sleeping bull? A bulldozer!",
        "Why don't eggs tell jokes? They'd crack each other up!",
        "What do you call a factory that makes okay products? A satisfactory!",
        "Why did the scarecrow win an award? He was outstanding in his field!",
        "What do you call a cow with two legs? Lean beef!",
        "Why don't scientists trust stairs? Because they're always up to something!",
        "What did the grape say when it got stepped on? Nothing, it just let out a little wine!",
        "Why did the cookie go to the doctor? Because it felt crumbly!",
        "What do you call a dog magician? A labracadabrador!",
        "Why did the banana go to the doctor? It wasn't peeling well!",
        "What's the difference between a fish and a piano? You can't tuna fish!",
        "Why did the golfer bring extra socks? In case he got a hole in one!",
        "What do you call a belt made of watches? A waist of time!",
        "Why did the tomato turn red? Because it saw the salad dressing!",
        "What do you call a parade of rabbits hopping backwards? A receding hare-line!",
        "Why don't melons get married? Because they cantaloupe!",
        "What did one wall say to the other wall? I'll meet you at the corner!",
        "Why did the football coach go to the bank? To get his quarterback!",
        "What do you call a pig that does karate? A pork chop!",
        "Why don't some couples go to the gym? Because some relationships don't work out!",
        "What do you call a deer with no eyes? No-eye deer (no idea)!",
        "Why did the computer go to the doctor? Because it had a virus!",
        "What do you call a fish that needs help with his vocals? Auto-tuna!",
        "Why did the stadium get hot after the game? All of the fans left!",
        "What do you call a cow in an earthquake? A milkshake!",
        "What do you call a chicken crossing the road? Poultry in motion!",
        "Why did the invisible man turn down the job offer? He couldn't see himself doing it!",
        "What do you call a group of disorganized cats? A cat-astrophe!",
        "Why don't skeletons go to scary movies? They don't have the guts!",
        "What do you call a dinosaur that loves to sleep? A dino-snore!",
        "What do you call a bear with no ears? B!",
        "What do you call a fish wearing a bowtie? Sofishticated!",
        "What do you call a cow with two legs? Lean beef!",
        "What did the grape say when it got stepped on? Nothing, it just let out a little wine!",
        "I told my wife she was drawing her eyebrows too high. She looked surprised.",
        "I used to be addicted to soap, but I'm clean now.",
        "Why don't scientists trust atoms? Because they make up everything!",
        "I'm terrified of elevators, so I'm going to start taking steps to avoid them.",
        "Why don't scientists trust atoms? Because they make up everything!",
        "What's the best thing about Switzerland? I don't know, but the flag is a big plus.",
        "I haven't slept for ten days, because that would be too long.",
        "A guy walked into a library and asked for books on paranoia. The librarian whispered, 'They're right behind you!'",
        "Why don't scientists trust atoms? Because they make up everything!",
        "I told my cat a joke about dogs, but he didn't find it a-mew-sing.",
        "Why did the coffee file a police report? It got mugged!",
        "What's the difference between a poorly dressed man on a tricycle and a well-dressed man on a bicycle? Attire!",
        "I used to be a banker, but then I lost interest.",
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a factory that sells passable products? A satisfactory!"
    ];
    
    try {
        for (const joke of dadJokes) {
            await addDoc(collection(db, 'jokes'), {
                type: 'dad',
                content: joke,
                timestamp: new Date()
            });
        }
        console.log('Successfully added 100 dad jokes!');
    } catch (error) {
        console.error('Error adding initial jokes:', error);
    }
}

// Initialize with movie one-liners
async function initializeWithMovieOneLiners() {
    // Check if movie one-liners already exist
    const jokesRef = collection(db, 'jokes');
    const movieJokesQuery = query(jokesRef, where('type', '==', 'one-liner'));
    const querySnapshot = await getDocs(movieJokesQuery);
    
    if (querySnapshot.size > 0) {
        console.log('Movie one-liners already exist in database');
        return; // Movie one-liners already exist, don't add duplicates
    }
    
    const movieOneLiners = [
        "The shitter was full! - Classic holiday plumbing problems",
        "Surprised, Eddie? If this thing had nine lives, she just spent 'em all!",
        "We're gonna have the hap-hap-happiest Christmas since Bing Crosby tap-danced with Danny Kaye!",
        "Can I refill your eggnog? Get you something to eat? Drive you out to the middle of nowhere?",
        "I don't know what to say, except it's Christmas!",
        "That's the gift that keeps on giving the whole year!",
        "Save the neck for me, Clark!",
        "Why is the carpet all wet, Todd? I don't know, Margo!",
        "Bend over and I'll show you where my foot fits!",
        "Fixed the newel post!",
        "I'm gonna park the cars and check the engine!",
        "You serious, Clark?",
        "Hallelujah! Holy sh*t! Where's the Tylenol?",
        "I pledge allegiance to the flag of the United States of America...",
        "Grace? She passed away thirty years ago!",
        "If you're not part of the solution, you're part of the problem. Quit being part of the problem!",
        "I'm having a ball!",
        "That's what Christmas memories are made of!",
        "Holy Toledo! - When things go wonderfully wrong",
        "Frankly, my dear, I don't give a damn. - When drama gets too much",
        "I'll be back. - Perfect for bathroom breaks",
        "Here's looking at you, kid. - Sweet moment appreciation",
        "You can't handle the truth! - When someone asks if you ate the last cookie",
        "Show me the money! - Negotiating with teenagers",
        "I see dead people. - Monday morning at the office",
        "Houston, we have a problem. - When the wifi goes down",
        "Keep your friends close, but your enemies closer. - Family dinner strategy",
        "Life is like a box of chocolates. - You never know what Monday will bring",
        "Nobody puts Baby in a corner. - Defending your personal space",
        "Say hello to my little friend! - Introducing your pet hamster",
        "I feel the need... the need for speed! - Coffee shop rush hour",
        "You had me at hello. - Love at first sight with pizza",
        "There's no place like home. - After a long vacation",
        "Roads? Where we're going, we don't need roads. - GPS navigation fails",
        "I'm gonna make him an offer he can't refuse. - Bedtime negotiations with kids",
        "You talking to me? - When someone cuts in line",
        "Go ahead, make my day. - Challenging Monday morning",
        "May the Force be with you. - Wishing luck on exam day",
        "E.T. phone home. - When your phone battery dies",
        "Here's Johnny! - Surprise office visits",
        "You're gonna need a bigger boat. - Seeing your grocery bill",
        "Nobody expects the Spanish Inquisition! - Surprise pop quizzes",
        "I am your father. - Revealing who ate the leftovers",
        "Help me, Obi-Wan Kenobi. You're my only hope. - Tech support calls",
        "Do or do not, there is no try. - Motivational Monday",
        "The first rule of Fight Club is: You do not talk about Fight Club.",
        "I'm not a smart man, but I know what love is. - Simple truths",
        "Inconceivable! - When plans go sideways",
        "My name is Inigo Montoya. You killed my father. Prepare to die.",
        "As you wish. - The perfect response to any request",
        "Have fun storming the castle! - Weekend adventure wishes",
        "Mostly dead is slightly alive. - Monday morning energy levels"
    ];
    
    try {
        for (const oneLiner of movieOneLiners) {
            await addDoc(collection(db, 'jokes'), {
                type: 'one-liner',
                content: oneLiner,
                timestamp: new Date()
            });
        }
        console.log('Successfully added movie one-liners!');
    } catch (error) {
        console.error('Error adding movie one-liners:', error);
    }
}

// Initialize with puns
async function initializeWithPuns() {
    // Check if puns already exist
    const jokesRef = collection(db, 'jokes');
    const punsQuery = query(jokesRef, where('type', '==', 'pun'));
    const querySnapshot = await getDocs(punsQuery);
    
    if (querySnapshot.size > 0) {
        console.log('Puns already exist in database');
        return; // Puns already exist, don't add duplicates
    }
    
    const puns = [
        "I wondered why the baseball kept getting bigger. Then it hit me.",
        "A bicycle can't stand on its own because it's two-tired.",
        "I used to be a banker, but I lost interest.",
        "I'm reading a book about anti-gravity. It's impossible to put down!",
        "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.",
        "I stayed up all night wondering where the sun went. Then it dawned on me.",
        "The graveyard is so crowded, people are dying to get in!",
        "I told my wife she was drawing her eyebrows too high. She looked surprised.",
        "What do you call a fish wearing a crown? A king fish!",
        "I used to hate facial hair, but then it grew on me.",
        "The math teacher called in sick with algebra.",
        "I lost my job at the bank. A woman asked me to check her balance, so I pushed her over.",
        "The shovel was a ground-breaking invention.",
        "I'm terrified of elevators, so I'm going to start taking steps to avoid them.",
        "What do you call a sleeping bull? A bulldozer!",
        "I used to be addicted to soap, but I'm clean now.",
        "The early bird might get the worm, but the second mouse gets the cheese.",
        "I wasn't originally going to get a brain transplant, but then I changed my mind.",
        "What do you call a bear with no teeth? A gummy bear!",
        "Time flies like an arrow. Fruit flies like a banana.",
        "I haven't slept for ten days, because that would be too long.",
        "When chemists die, they barium.",
        "Jokes about German sausages are the wurst.",
        "A soldier who survived mustard gas and pepper spray is now a seasoned veteran.",
        "How do you organize a space party? You planet!",
        "I know a guy who's addicted to brake fluid, but he says he can stop any time.",
        "How does Moses make his tea? Hebrews it!",
        "I stayed up all night to see where the sun went. Then it dawned on me.",
        "This girl said she recognized me from the vegetarian club, but I'd never met herbivore.",
        "I'm reading a book about Helium. I can't put it down!",
        "They told me I had type A blood, but it was a Type-O.",
        "Why don't scientists trust atoms? Because they make up everything!",
        "I named my horse Mayo. Sometimes Mayo neighs.",
        "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!",
        "England has no kidney bank, but it does have a Liverpool.",
        "I tried to catch some fog, but I mist.",
        "What do you call a fake noodle? An impasta!",
        "I dropped out of communism class because of lousy Marx.",
        "All the toilets in New York's police stations have been stolen. Police have nothing to go on.",
        "I got a job at a bakery because I kneaded dough.",
        "Haunted French pancakes give me the crepes.",
        "Velcro - what a rip off!",
        "Cartoonist found dead in home. Details are sketchy.",
        "Venison for dinner again? Oh deer!",
        "The earthquake in Washington obviously was the government's fault.",
        "I used to think I was indecisive, but now I'm not sure.",
        "Be kind to your dentist. He has fillings too.",
        "What do you call a sleeping bull? A bulldozer!",
        "A thief who stole a calendar got twelve months.",
        "When the smog lifts in Los Angeles, U.C.L.A.",
        "The dead batteries were given out free of charge.",
        "A dentist and a manicurist married. They fought tooth and nail.",
        "A will is a dead giveaway.",
        "With her marriage, she got a new name and a dress.",
        "Police were called to a daycare where a three-year-old was resisting a rest.",
        "Did you hear about the fellow whose whole left side was cut off? He's all right now.",
        "A backward poet writes inverse.",
        "When fish are in schools, they sometimes take debate.",
        "A thief fell and broke his leg in wet cement. He became a hardened criminal.",
        "Thieves who steal corn from a garden could be charged with stalking.",
        "We'll never run out of math teachers because they always multiply.",
        "When the electricity went off, I was delighted.",
        "A boiled egg every morning is hard to beat.",
        "The professor discovered that her theory of earthquakes was on shaky ground.",
        "The batteries were given out free of charge.",
        "A plateau is a high form of flattery.",
        "The short fortune-teller who escaped from prison was a small medium at large.",
        "Once you've seen one shopping center, you've seen a mall.",
        "Bakers trade bread recipes on a knead to know basis.",
        "Santa's helpers are subordinate clauses.",
        "Acupuncture is a jab well done.",
        "Marathon runners with bad footwear suffer the agony of defeat.",
        "The butcher backed into the meat grinder and got a little behind in his work.",
        "When she saw her first strands of gray hair, she thought she'd dye.",
        "Local Area Network in Australia: the LAN down under."
    ];
    
    try {
        for (const pun of puns) {
            await addDoc(collection(db, 'jokes'), {
                type: 'pun',
                content: pun,
                timestamp: new Date()
            });
        }
        console.log('Successfully added puns!');
    } catch (error) {
        console.error('Error adding puns:', error);
    }
}

// Initialize with Oly and Lina jokes
async function initializeWithOlyLinaJokes() {
    // Check if Oly and Lina jokes already exist
    const jokesRef = collection(db, 'jokes');
    const olyLinaJokesQuery = query(jokesRef, where('type', '==', 'oly-lina'));
    const querySnapshot = await getDocs(olyLinaJokesQuery);
    
    if (querySnapshot.size > 0) {
        console.log('Oly and Lina jokes already exist in database');
        return; // Oly and Lina jokes already exist, don't add duplicates
    }
    
    const olyLinaJokes = [
        "Oly: 'Why don't scientists trust atoms?' Lina: 'Because they make up everything!' Oly: 'Just like your excuses for being late!'",
        "Lina: 'I told Oly I was reading a book about anti-gravity.' Oly: 'And?' Lina: 'I couldn't put it down!' Oly: 'Neither can you put down your phone!'",
        "Oly: 'What do you call a fish wearing a crown?' Lina: 'I don't know, what?' Oly: 'A king fish!' Lina: 'That's almost as royal as your attitude!'",
        "Lina: 'Why did the coffee file a police report?' Oly: 'Why?' Lina: 'It got mugged!' Oly: 'Speaking of mugs, where's mine? You used it again!'",
        "Oly: 'How do you organize a space party?' Lina: 'How?' Oly: 'You planet!' Lina: 'Better planning than your last surprise party for me!'",
        "Lina: 'What do you call a sleeping bull?' Oly: 'What?' Lina: 'A bulldozer!' Oly: 'That's what you sound like when you snore!'",
        "Oly: 'Why don't eggs tell jokes?' Lina: 'I give up.' Oly: 'They'd crack each other up!' Lina: 'Unlike us - we just crack each other!'",
        "Lina: 'What's orange and sounds like a parrot?' Oly: 'What?' Lina: 'A carrot!' Oly: 'That joke is as old as the carrots in our fridge!'",
        "Oly: 'Why did the scarecrow win an award?' Lina: 'Why?' Oly: 'He was outstanding in his field!' Lina: 'Unlike you - you're outstanding in our living room!'",
        "Lina: 'What do you call a cow with no legs?' Oly: 'What?' Lina: 'Ground beef!' Oly: 'That's what I'll be if you keep stepping on my feet!'",
        "Oly: 'Why don't scientists trust stairs?' Lina: 'Why?' Oly: 'Because they're always up to something!' Lina: 'Just like you when you're suspiciously quiet!'",
        "Lina: 'What did the ocean say to the beach?' Oly: 'What?' Lina: 'Nothing, it just waved!' Oly: 'That's more attention than you give me in the morning!'",
        "Oly: 'Why did the bicycle fall over?' Lina: 'Why?' Oly: 'Because it was two tired!' Lina: 'That's me every day dealing with your jokes!'",
        "Lina: 'What do you call a bear with no teeth?' Oly: 'What?' Lina: 'A gummy bear!' Oly: 'That's what you'll be when you're old and lose your teeth!'",
        "Oly: 'Why did the math book look so sad?' Lina: 'Why?' Oly: 'Because it had too many problems!' Lina: 'Just like our relationship!' Oly: 'Hey!'",
        "Lina: 'What do you call a dinosaur that crashes his car?' Oly: 'What?' Lina: 'Tyrannosaurus Wrecks!' Oly: 'That's you trying to parallel park!'",
        "Oly: 'Why don't oysters donate?' Lina: 'Why?' Oly: 'Because they are shellfish!' Lina: 'That's you with the last slice of pizza!'",
        "Lina: 'What's the best thing about Switzerland?' Oly: 'What?' Lina: 'I don't know, but the flag is a big plus!' Oly: 'Unlike your cooking - that's a big minus!'",
        "Oly: 'Why did the cookie go to the doctor?' Lina: 'Why?' Oly: 'Because it felt crumbly!' Lina: 'That's how I feel after your dad jokes!'",
        "Lina: 'What do you call a dog magician?' Oly: 'What?' Lina: 'A labracadabrador!' Oly: 'That's more magical than you doing the dishes!'",
        "Oly: 'Why did the banana go to the doctor?' Lina: 'Why?' Oly: 'It wasn't peeling well!' Lina: 'That's me after hearing your puns all day!'",
        "Lina: 'What do you call a belt made of watches?' Oly: 'What?' Lina: 'A waist of time!' Oly: 'That's what this conversation is becoming!'",
        "Oly: 'Why did the tomato turn red?' Lina: 'Why?' Oly: 'Because it saw the salad dressing!' Lina: 'That's me when I see you not dressed for our date!'",
        "Lina: 'What do you call a parade of rabbits hopping backwards?' Oly: 'What?' Lina: 'A receding hare-line!' Oly: 'That's what's happening to my hairline listening to your jokes!'",
        "Oly: 'Why don't melons get married?' Lina: 'Why?' Oly: 'Because they cantaloupe!' Lina: 'Good thing we're not melons!'",
        "Lina: 'What did one wall say to the other wall?' Oly: 'What?' Lina: 'I'll meet you at the corner!' Oly: 'That's where I go to escape your singing!'",
        "Oly: 'Why did the computer go to the doctor?' Lina: 'Why?' Oly: 'Because it had a virus!' Lina: 'That's what you give me with your terrible jokes!'",
        "Lina: 'What do you call a fish that needs help with his vocals?' Oly: 'What?' Lina: 'Auto-tuna!' Oly: 'That's what you need for your shower concerts!'",
        "Oly: 'Why did the stadium get hot after the game?' Lina: 'Why?' Oly: 'All of the fans left!' Lina: 'Just like when you start telling jokes at parties!'",
        "Lina: 'What do you call a cow in an earthquake?' Oly: 'What?' Lina: 'A milkshake!' Oly: 'That's what I want right now instead of your jokes!'",
        "Oly: 'What do you call a chicken crossing the road?' Lina: 'What?' Oly: 'Poultry in motion!' Lina: 'That's you running away from doing chores!'",
        "Lina: 'Why did the invisible man turn down the job offer?' Oly: 'Why?' Lina: 'He couldn't see himself doing it!' Oly: 'That's me with your weekend plans!'",
        "Oly: 'What do you call a group of disorganized cats?' Lina: 'What?' Oly: 'A cat-astrophe!' Lina: 'That's our kitchen after you cook!'",
        "Lina: 'What do you call a dinosaur that loves to sleep?' Oly: 'What?' Lina: 'A dino-snore!' Oly: 'That's you every weekend morning!'",
        "Oly: 'What do you call a bear with no ears?' Lina: 'What?' Oly: 'B!' Lina: 'That's your grade in listening to me!'",
        "Lina: 'What do you call a fish wearing a bowtie?' Oly: 'What?' Lina: 'Sofishticated!' Oly: 'More sophisticated than your fashion sense!'",
        "Oly: 'Why don't scientists trust atoms?' Lina: 'You already told that one!' Oly: 'Because they make up everything!' Lina: 'Including your memory apparently!'",
        "Lina: 'I told my cat a joke about dogs.' Oly: 'And?' Lina: 'He didn't find it a-mew-sing!' Oly: 'Neither do I find your cat obsession amusing!'",
        "Oly: 'What's the difference between a poorly dressed man on a tricycle and a well-dressed man on a bicycle?' Lina: 'What?' Oly: 'Attire!' Lina: 'Speaking of attire, when will you buy new clothes?'",
        "Lina: 'I used to be a banker.' Oly: 'And?' Lina: 'But then I lost interest!' Oly: 'That's what happens when I tell you about my day!'",
        "Oly: 'Why don't some couples go to the gym?' Lina: 'Why?' Oly: 'Because some relationships don't work out!' Lina: 'Ours works out fine - we argue instead!'",
        "Lina: 'What do you call a deer with no eyes?' Oly: 'What?' Lina: 'No-eye deer!' Oly: 'That's you when I ask you to look for something!'",
        "Oly: 'I haven't slept for ten days.' Lina: 'Why?' Oly: 'Because that would be too long!' Lina: 'Your jokes make me want to sleep that long!'",
        "Lina: 'A guy walked into a library and asked for books on paranoia.' Oly: 'And?' Lina: 'The librarian whispered, They're right behind you!' Oly: 'That's how I feel about your relatives!'",
        "Oly: 'I stayed up all night wondering where the sun went.' Lina: 'And?' Oly: 'Then it dawned on me!' Lina: 'It also dawned on me that you're terrible at sleeping!'",
        "Lina: 'This girl said she recognized me from the vegetarian club.' Oly: 'And?' Lina: 'But I'd never met herbivore!' Oly: 'That's every person you claim to know!'",
        "Oly: 'I'm reading a book about Helium.' Lina: 'And?' Oly: 'I can't put it down!' Lina: 'Neither can you put down that remote!'",
        "Lina: 'They told me I had type A blood.' Oly: 'And?' Lina: 'But it was a Type-O!' Oly: 'That's every text message you send me!'",
        "Oly: 'I named my horse Mayo.' Lina: 'Why?' Oly: 'Sometimes Mayo neighs!' Lina: 'That's worse than when you try to make horse sounds!'",
        "Lina: 'England has no kidney bank.' Oly: 'So?' Lina: 'But it does have a Liverpool!' Oly: 'That's better than your geography knowledge!'",
        "Oly: 'I tried to catch some fog.' Lina: 'And?' Oly: 'But I mist!' Lina: 'You also missed doing the laundry!'",
        "Lina: 'I dropped out of communism class.' Oly: 'Why?' Lina: 'Because of lousy Marx!' Oly: 'You drop out of everything when it gets hard!'",
        "Oly: 'All the toilets in New York's police stations have been stolen.' Lina: 'And?' Oly: 'Police have nothing to go on!' Lina: 'Unlike you - you always have something to complain about!'",
        "Lina: 'I got a job at a bakery.' Oly: 'Why?' Lina: 'Because I kneaded dough!' Oly: 'The only thing you knead is a reality check!'",
        "Oly: 'Haunted French pancakes give me the crepes!' Lina: 'That's terrible!' Oly: 'Not as terrible as your attempt at French cooking!'",
        "Lina: 'Velcro - what a rip off!' Oly: 'That's not even a joke!' Lina: 'Neither is your attempt at fixing things around here!'",
        "Oly: 'Cartoonist found dead in home.' Lina: 'That's dark!' Oly: 'Details are sketchy!' Lina: 'Like your explanation for where you were last night!'",
        "Lina: 'Venison for dinner again?' Oly: 'Yeah, so?' Lina: 'Oh deer!' Oly: 'Oh dear is right - you're cooking tonight!'",
        "Oly: 'The earthquake in Washington obviously was the government's fault!' Lina: 'How so?' Oly: 'Get it? Fault?' Lina: 'Everything is your fault when you make jokes like that!'",
        "Lina: 'I used to think I was indecisive.' Oly: 'And now?' Lina: 'But now I'm not sure!' Oly: 'You're never sure about anything!'",
        "Oly: 'Be kind to your dentist.' Lina: 'Why?' Oly: 'He has fillings too!' Lina: 'Unlike you - you're emotionally empty!'",
        "Lina: 'A thief who stole a calendar got twelve months!' Oly: 'That's exactly how long I've been listening to your bad jokes!'",
        "Oly: 'When the smog lifts in Los Angeles, U.C.L.A.!' Lina: 'That's as clear as your explanations!'",
        "Lina: 'The dead batteries were given out free of charge!' Oly: 'Unlike you - you always charge me for favors!'",
        "Oly: 'A dentist and a manicurist married.' Lina: 'And?' Oly: 'They fought tooth and nail!' Lina: 'That's us every morning!'",
        "Lina: 'A will is a dead giveaway!' Oly: 'So is your poker face!'",
        "Oly: 'Police were called to a daycare where a three-year-old was resisting a rest!' Lina: 'That's you every bedtime!'",
        "Lina: 'Did you hear about the fellow whose whole left side was cut off?' Oly: 'No, what?' Lina: 'He's all right now!' Oly: 'That's what I'll be when you stop telling jokes!'",
        "Oly: 'A backward poet writes inverse!' Lina: 'Your poems are just backwards thinking!'",
        "Lina: 'When fish are in schools, they sometimes take debate!' Oly: 'That's what we're doing right now!'",
        "Oly: 'A thief fell and broke his leg in wet cement.' Lina: 'And?' Oly: 'He became a hardened criminal!' Lina: 'Your jokes are making me hard-hearted!'",
        "Lina: 'We'll never run out of math teachers because they always multiply!' Oly: 'Unlike your good qualities!'",
        "Oly: 'When the electricity went off, I was delighted!' Lina: 'You're delighted by the weirdest things!'",
        "Lina: 'A boiled egg every morning is hard to beat!' Oly: 'So is waking up to your jokes!'",
        "Oly: 'The professor discovered that her theory of earthquakes was on shaky ground!' Lina: 'Like our relationship when you tell these jokes!'",
        "Lina: 'A plateau is a high form of flattery!' Oly: 'That's the highest compliment you'll get from me!'",
        "Oly: 'The short fortune-teller who escaped from prison was a small medium at large!' Lina: 'That's a large stretch for a joke!'",
        "Lina: 'Once you've seen one shopping center, you've seen a mall!' Oly: 'Once you've heard one of your jokes, you've heard them all!'",
        "Oly: 'Bakers trade bread recipes on a knead to know basis!' Lina: 'I need to know when these jokes will end!'",
        "Lina: 'Santa's helpers are subordinate clauses!' Oly: 'You're a subordinate spouse!'",
        "Oly: 'Acupuncture is a jab well done!' Lina: 'That was a jab at my intelligence!'",
        "Lina: 'The butcher backed into the meat grinder and got a little behind in his work!' Oly: 'You're always behind in your work!'",
        "Oly: 'When she saw her first strands of gray hair, she thought she'd dye!' Lina: 'I think I'll dye from embarrassment!'",
        "Lina: 'Local Area Network in Australia: the LAN down under!' Oly: 'That's where I want to go to escape your jokes!'"
    ];
    
    try {
        for (const joke of olyLinaJokes) {
            await addDoc(collection(db, 'jokes'), {
                type: 'oly-lina',
                content: joke,
                timestamp: new Date()
            });
        }
        console.log('Successfully added Oly and Lina jokes!');
    } catch (error) {
        console.error('Error adding Oly and Lina jokes:', error);
    }
}

// Initialize with chicken crossing the road jokes
async function initializeWithChickenJokes() {
    // Check if chicken jokes already exist
    const jokesRef = collection(db, 'jokes');
    const chickenJokesQuery = query(jokesRef, where('type', '==', 'chicken'));
    const querySnapshot = await getDocs(chickenJokesQuery);
    
    if (querySnapshot.size > 0) {
        console.log('Chicken jokes already exist in database');
        return; // Chicken jokes already exist, don't add duplicates
    }
    
    const chickenJokes = [
        "Why did the chicken cross the road? To get to the other side!",
        "Why did the chicken cross the road? Because it was free range!",
        "Why did the rubber chicken cross the road? She wanted to prove it wasn't chicken!",
        "Why did the chicken cross the road? To prove to the possums that it could be done!",
        "Why did the chicken cross the road? Because the light was green!",
        "Why did the chicken cross the road? To get away from the Colonel!",
        "Why did the chicken cross the road? Because it was the chicken's day off!",
        "Why did the rooster cross the road? To cockadoodle dooo something!",
        "Why did the chicken cross the road? To get to the Shell station!",
        "Why did the chicken cross the road? It was sick of everyone asking why!",
        "Why did the chicken cross the road? To get to the clucking store!",
        "Why did the chicken cross the road? Because crossing the street was too mainstream!",
        "Why did the dead chicken cross the road? Because she was already on the other side!",
        "Why did the chicken cross the road? To get to your house. Knock knock. Who's there? The chicken!",
        "Why did the chicken cross the road? Because it wanted to find out what those jokes were about!",
        "Why did the chicken cross the road? To escape the farmer with the axe!",
        "Why did the chicken cross the road? It was following the leader!",
        "Why did the chicken cross the road? To get to the grocery store and buy some eggs... wait, that doesn't seem right!",
        "Why did the chicken cross the road? Because it saw a car coming and panicked!",
        "Why did the chicken cross the road? To show the armadillo it was possible!",
        "Why did the chicken cross the road? Because there was a KFC on this side!",
        "Why did the chicken cross the road? To boldly go where no chicken has gone before!",
        "Why did the chicken cross the road? Because the road was there!",
        "Why did the chicken cross the road? To get to the pecking order!",
        "Why did the funky chicken cross the road? To get to the other disco!",
        "Why did the chicken cross the road? Because it was egged on by its friends!",
        "Why did the chicken cross the road? To get away from all these terrible jokes!",
        "Why did the chicken cross the road? It was practicing social distancing!",
        "Why did the chicken cross the road? Because crossing the stream was too wet!",
        "Why did the chicken cross the road? To get to the joke shop and buy better material!",
        "Why did the chicken cross the road? Because it had a deadline to meet!",
        "Why did the punk rock chicken cross the road? To get to the mosh pit!",
        "Why did the chicken cross the road? To get to the library and check out some books on comedy!",
        "Why did the chicken cross the road? Because it was playing Pokemon Go!",
        "Why did the chicken cross the road? To get to the therapist and work through its crossing issues!",
        "Why did the chicken cross the road? Because it heard the grass was greener on the other side!",
        "Why did the chicken cross the road? To get away from the vegan restaurant!",
        "Why did the chicken cross the road? Because it was late for work!",
        "Why did the mathematician's chicken cross the road? The answer is trivial and is left as an exercise for the reader!",
        "Why did the chicken cross the road? To get to the other side... of the argument!",
        "Why did the chicken cross the road? Because it was cheaper than taking an Uber!",
        "Why did the chicken cross the road? To get to the doctor because it had bird flu!",
        "Why did the chicken cross the road? Because it was trying to escape from a chicken and egg debate!",
        "Why did the chicken cross the road? To get to the comedy club and heckle the comedians!",
        "Why did the chicken cross the road? Because it was following GPS directions!",
        "Why did the chicken cross the road? To prove it had guts... or at least giblets!",
        "Why did the chicken cross the road? Because it was auditioning for Frogger!",
        "Why did the chicken cross the road? To get to the yoga class and find inner peas!",
        "Why did the chicken cross the road? Because the pedestrian light said 'WALK'!",
        "Why did the chicken cross the road? To get away from all the bird brain jokes!",
        "Why did the chicken cross the road? Because it was part of a flash mob!",
        "Why did the chicken cross the road? To get to the bank and make a deposit in its nest egg!",
        "Why did the chicken cross the road? Because it was tired of being called chicken!",
        "Why did the chicken cross the road? To get to the massage therapist for its poultry in motion!",
        "Why did the chicken cross the road? Because it was following the yellow brick road!",
        "Why did the chicken cross the road? To get to the tech support center because it couldn't figure out how to cross digitally!",
        "Why did the chicken cross the road? Because it was running away from the Sunday dinner table!",
        "Why did the chicken cross the road? To get to the job interview at Chick-fil-A!",
        "Why did the chicken cross the road? Because it wanted to join the Peace Corps!",
        "Why did the chicken cross the road? To get to the dating app and find its rooster!",
        "Why did the chicken cross the road? Because it was protesting for chicken rights!",
        "Why did the gourmet chicken cross the road? To get to the organic, free-range, artisanal side!",
        "Why did the chicken cross the road? To get to the gym and work on its pecks!",
        "Why did the chicken cross the road? Because it was delivering food for DoorDash!",
        "Why did the chicken cross the road? To escape the farmer's terrible dad jokes!",
        "Why did the chicken cross the road? Because it was migrating south for the winter!",
        "Why did the chicken cross the road? To get to the support group for animals tired of crossing jokes!",
        "Why did the chicken cross the road? Because it was following its dreams!",
        "Why did the chicken cross the road? To get to the DMV and renew its license!",
        "Why did the chicken cross the road? Because it was late for its Zoom meeting!",
        "Why did the chicken cross the road? To get to the coffee shop for its morning caffeine fix!",
        "Why did the chicken cross the road? Because it was participating in a charity walk!",
        "Why did the chicken cross the road? To get to the airport and catch a flight!",
        "Why did the chicken cross the road? Because it was escaping a boring conversation!",
        "Why did the chicken cross the road? To get to the school and learn some new tricks!",
        "Why did the chicken cross the road? Because it was following social media trends!",
        "Why did the chicken cross the road? To get to the restaurant and complain about the chicken on the menu!",
        "Why did the chicken cross the road? Because it was practicing for American Ninja Warrior!",
        "Why did the chicken cross the road? To get to the therapist and work on its fear of commitment!",
        "Why did the chicken cross the road? Because it was looking for the meaning of life!",
        "Why did the chicken cross the road? To get to the other side where the wifi is stronger!",
        "Why did the chicken cross the road? Because it was chasing its dreams... and they happened to be on the other side!",
        "Why did the virtual reality chicken cross the road? To get to the other dimension!",
        "Why did the chicken cross the road? Because it was tired of being the butt of every joke!",
        "Why did the chicken cross the road? To get to the comedy writing workshop!",
        "Why did the influencer chicken cross the road? To get more followers!",
        "Why did the chicken cross the road? Because it was auditioning for a Broadway show!",
        "Why did the chicken cross the road? To get to the emergency room because it was feeling fowl!",
        "Why did the smart chicken cross the road? Because it had calculated the optimal route!",
        "Why did the chicken cross the road? To get to the spa for some much-needed R&R (roost and relaxation)!",
        "Why did the chicken cross the road? Because it was late for its yoga class!",
        "Why did the chicken cross the road? To get to the other side where parking was free!",
        "Why did the millennial chicken cross the road? To get to the avocado toast shop!",
        "Why did the chicken cross the road? Because it was tired of answering this question!",
        "Why did the chicken cross the road? To get to the witness protection program!",
        "Why did the chicken cross the road? Because it wanted to be part of the solution, not part of the problem!",
        "Why did the chicken cross the road? To get to the talent show and show off its moves!",
        "Why did the rebel chicken cross the road? Because everyone told it not to!",
        "Why did the chicken cross the road? To get to the time machine and prevent this joke from being invented!",
        "Why did the chicken cross the road? Because it was following the chicken crossing signs!",
        "Why did the philosophical chicken cross the road? To question why roads exist in the first place!",
        "Why did the chicken cross the road? To get to the self-help seminar on building confidence!",
        "Why did the chicken cross the road? Because it wanted to prove size doesn't matter!",
        "Why did the chicken cross the road? To get to the farmer's market and file a complaint!",
        "Why did the chicken cross the road? Because it was practicing for the Olympics!",
        "Why did the minimalist chicken cross the road? Because it was the most efficient path!",
        "Why did the chicken cross the road? To get to the other side where the grass is actually greener!"
    ];
    
    try {
        for (const joke of chickenJokes) {
            await addDoc(collection(db, 'jokes'), {
                type: 'chicken',
                content: joke,
                timestamp: new Date()
            });
        }
        console.log('Successfully added chicken crossing the road jokes!');
    } catch (error) {
        console.error('Error adding chicken jokes:', error);
    }
}
