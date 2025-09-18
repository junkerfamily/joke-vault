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
    orderBy 
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
    
    // Close action menus when clicking outside
    document.addEventListener('click', closeAllActionMenus);
}

// Create joke card HTML
function createJokeCard(joke) {
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
            <div class="edit-form hidden" data-joke-id="${joke.id}">
                <select class="edit-type" data-joke-id="${joke.id}">
                    <option value="knock-knock" ${joke.type === 'knock-knock' ? 'selected' : ''}>Knock Knock</option>
                    <option value="dad" ${joke.type === 'dad' ? 'selected' : ''}>Dad Joke</option>
                    <option value="one-liner" ${joke.type === 'one-liner' ? 'selected' : ''}>One-Liner</option>
                    <option value="pun" ${joke.type === 'pun' ? 'selected' : ''}>Pun</option>
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
            timestamp: new Date()
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
