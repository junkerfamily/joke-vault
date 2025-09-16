// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy 
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    // You'll need to replace these with your actual Firebase config
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
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
    initializeWithKnockKnockJokes();
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
    
    // Add delete event listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const jokeId = e.target.dataset.jokeId;
            deleteJoke(jokeId);
        });
    });
}

// Create joke card HTML
function createJokeCard(joke) {
    return `
        <div class="joke-card">
            <div class="joke-actions">
                <button class="delete-btn" data-joke-id="${joke.id}">Delete</button>
            </div>
            <div class="joke-type">${joke.type.replace('-', ' ')}</div>
            <div class="joke-content">${joke.content}</div>
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

// Initialize with 50 knock-knock jokes
async function initializeWithKnockKnockJokes() {
    // Check if jokes already exist
    const jokesRef = collection(db, 'jokes');
    const querySnapshot = await getDocs(jokesRef);
    
    if (querySnapshot.size > 0) {
        return; // Jokes already exist, don't add duplicates
    }
    
    const knockKnockJokes = [
        "Knock knock!\nWho's there?\nBoo.\nBoo who?\nDon't cry, it's just a joke!",
        "Knock knock!\nWho's there?\nLettuce.\nLettuce who?\nLettuce in, it's cold out here!",
        "Knock knock!\nWho's there?\nOrange.\nOrange who?\nOrange you glad I didn't say banana?",
        "Knock knock!\nWho's there?\nInterrupting cow.\nInterrupting cow w—\nMOO!",
        "Knock knock!\nWho's there?\nAlpaca.\nAlpaca who?\nAlpaca the suitcase, you load up the car!",
        "Knock knock!\nWho's there?\nWho.\nWho who?\nWhat are you, an owl?",
        "Knock knock!\nWho's there?\nCow says.\nCow says who?\nNo, cow says moo!",
        "Knock knock!\nWho's there?\nTank.\nTank who?\nYou're welcome!",
        "Knock knock!\nWho's there?\nDonut.\nDonut who?\nDonut ask, it's a secret!",
        "Knock knock!\nWho's there?\nBroken pencil.\nBroken pencil who?\nNever mind, it's pointless!",
        "Knock knock!\nWho's there?\nCanoe.\nCanoe who?\nCanoe help me with my homework?",
        "Knock knock!\nWho's there?\nWater.\nWater who?\nWater you doing today?",
        "Knock knock!\nWho's there?\nIce cream.\nIce cream who?\nIce cream if you don't let me in!",
        "Knock knock!\nWho's there?\nHoney bee.\nHoney bee who?\nHoney bee a dear and get me some water!",
        "Knock knock!\nWho's there?\nDoughnut.\nDoughnut who?\nDoughnut forget to do your homework!",
        "Knock knock!\nWho's there?\nBanana.\nBanana who?\nBanana split so ice creamed!",
        "Knock knock!\nWho's there?\nAnnie.\nAnnie who?\nAnnie thing you can do, I can do better!",
        "Knock knock!\nWho's there?\nLeaf.\nLeaf who?\nLeaf me alone!",
        "Knock knock!\nWho's there?\nButter.\nButter who?\nButter let me in or I'll freeze!",
        "Knock knock!\nWho's there?\nWe're here.\nWe're here who?\nWe're here to party!",
        "Knock knock!\nWho's there?\nLemon.\nLemon who?\nLemon tell you another joke!",
        "Knock knock!\nWho's there?\nCash.\nCash who?\nNo thanks, I prefer peanuts!",
        "Knock knock!\nWho's there?\nSome bunny.\nSome bunny who?\nSome bunny loves you!",
        "Knock knock!\nWho's there?\nDish.\nDish who?\nDish is a very bad joke!",
        "Knock knock!\nWho's there?\nWanda.\nWanda who?\nWanda hang out with me?",
        "Knock knock!\nWho's there?\nNobel.\nNobel who?\nNobel, so I knocked!",
        "Knock knock!\nWho's there?\nCola.\nCola who?\nCola me back when you get this!",
        "Knock knock!\nWho's there?\nWeird.\nWeird who?\nWeird you go? I've been looking for you!",
        "Knock knock!\nWho's there?\nWood.\nWood who?\nWood you like to hear another joke?",
        "Knock knock!\nWho's there?\nOwl.\nOwl who?\nOwl tell you if you open the door!",
        "Knock knock!\nWho's there?\nArthur.\nArthur who?\nArthur any cookies left?",
        "Knock knock!\nWho's there?\nBeets.\nBeets who?\nBeets me, I forgot my own joke!",
        "Knock knock!\nWho's there?\nCandy.\nCandy who?\nCandy cow jump over the moon?",
        "Knock knock!\nWho's there?\nDewey.\nDewey who?\nDewey have to use this old joke format?",
        "Knock knock!\nWho's there?\nEtch.\nEtch who?\nBless you!",
        "Knock knock!\nWho's there?\nFigs.\nFigs who?\nFigs the doorbell, it's broken!",
        "Knock knock!\nWho's there?\nGladys.\nGladys who?\nGladys the weekend, aren't you?",
        "Knock knock!\nWho's there?\nHatch.\nHatch who?\nBless you again!",
        "Knock knock!\nWho's there?\nIvan.\nIvan who?\nIvan to suck your blood!",
        "Knock knock!\nWho's there?\nJustin.\nJustin who?\nJustin time for dinner!",
        "Knock knock!\nWho's there?\nKetchup.\nKetchup who?\nKetchup with me and I'll tell you!",
        "Knock knock!\nWho's there?\nLarry.\nLarry who?\nLarry up and answer the door!",
        "Knock knock!\nWho's there?\nMustache.\nMustache who?\nMustache you a question, but I'll shave it for later!",
        "Knock knock!\nWho's there?\nNana.\nNana who?\nNana your business!",
        "Knock knock!\nWho's there?\nOlive.\nOlive who?\nOlive you too!",
        "Knock knock!\nWho's there?\nPepper.\nPepper who?\nPepper your questions, I'm in a hurry!",
        "Knock knock!\nWho's there?\nQueen.\nQueen who?\nQueen up this mess!",
        "Knock knock!\nWho's there?\nRussia.\nRussia who?\nRussia over here and give me a hug!",
        "Knock knock!\nWho's there?\nSadie.\nSadie who?\nSadie magic word and I'll disappear!",
        "Knock knock!\nWho's there?\nTuna.\nTuna who?\nTuna in next week for more jokes!"
    ];
    
    try {
        for (const joke of knockKnockJokes) {
            await addDoc(collection(db, 'jokes'), {
                type: 'knock-knock',
                content: joke,
                timestamp: new Date()
            });
        }
        console.log('Successfully added 50 knock-knock jokes!');
    } catch (error) {
        console.error('Error adding initial jokes:', error);
    }
}
