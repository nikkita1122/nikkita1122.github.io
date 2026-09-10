const termEl = document.querySelector('.term');
const definitionEl = document.querySelector('.definition');
const checkBtn = document.querySelector('.check');
const nextBtn = document.querySelector('.next');
const categoryButtons = document.querySelectorAll('.category-button');

let flashcards = [];
let filteredFlashcards = [];
let selectedCategories = new Set();
let current = null;

// Category mapping from emojis to types
const categoryMap = {
  plantfungus: ['Plant', 'Fungi'],
  mammal: ['Mammal'],
  bird: ['Bird'],
  reptileamphibian: ['Reptile', 'Amphibian'],
  insectarachnid: ['Insect', 'Arachnid'],
  aquatic: ['Fish'],
};

// 🐣 Load JSON
fetch('js/flashcards-data.json')
  .then(res => res.json())
  .then(data => {
    // an image is required, and records flagged active:false stay in the
    // dataset but out of the deck
    flashcards = data.filter(item => item['image']?.trim() && item.active !== false);
    filteredFlashcards = [...flashcards]; // Start with all flashcards
    showRandomCard();
  })
  .catch(err => console.error('Could not load flashcards-data.json:', err));

// 🌼 Show a random flashcard
function showRandomCard() {
  definitionEl.style.display = 'none';

  if (!filteredFlashcards.length) {
    termEl.innerHTML = '<p>No cards match the selected categories 😢</p>';
    definitionEl.style.display = 'none';
    return;
  }

  current = filteredFlashcards[Math.floor(Math.random() * filteredFlashcards.length)];

  termEl.innerHTML =
    `<div class="flashcard-img-wrapper">
      <img src="${current['image']}"
           alt="${current['common name']}"
           class="flashcard-img">
    </div>`;

  // fade in once decoded, so there is no flash of empty frame
  const cardImg = termEl.querySelector('.flashcard-img');
  if (cardImg) {
    if (cardImg.complete && cardImg.naturalWidth) cardImg.classList.add('loaded');
    else cardImg.addEventListener('load', () => cardImg.classList.add('loaded'), { once: true });
  }

  const sciName = current['scientific name'];
const status = current['conservation status'];
const statusText = status && status.trim() !== '' ? ` ● ${status}` : '';

const commonName = current['common name'];
const description = current['description'] || '';

// species introduced to California are kept, but labelled as such
const nonNative = current['non_native']
  ? '<p class="non-native">Introduced to California &mdash; not a native species.</p>'
  : '';

// CC licences require credit, so it travels with the photo
const credit = current['image_credit']
  ? `<p class="credit">Photo: ${current['image_credit']}</p>`
  : '';

definitionEl.innerHTML = `
  <div class="species-head">
    <h3>${commonName}</h3>
    <img src="info.png" alt="More information" class="info-icon" title="More information">
  </div>
  <p><em>${sciName}${statusText}</em></p>
  ${nonNative}
  <div class="description-box" hidden>${description}</div>
  ${credit}
`;

const infoIcon = definitionEl.querySelector('.info-icon');
  const descriptionBox = definitionEl.querySelector('.description-box');

  if (infoIcon && descriptionBox) {
    // an empty description has nothing to reveal
    if (!description.trim()) {
      infoIcon.style.display = 'none';
    } else {
      infoIcon.addEventListener('click', () => {
        descriptionBox.hidden = !descriptionBox.hidden;
      });
    }
  }

}


checkBtn.addEventListener('click', () => {
  const isVisible = definitionEl.style.display === 'block';
  definitionEl.style.display = isVisible ? 'none' : 'block';
});


// ➡️ Show next flashcard
nextBtn.addEventListener('click', () => {
  showRandomCard();
});

// 🎯 Handle category selection
categoryButtons.forEach(button => {
  button.addEventListener('click', () => {
    const categoryKey = button.dataset.category;

    if (selectedCategories.has(categoryKey)) {
      selectedCategories.delete(categoryKey);
      button.classList.remove('selected');
    } else {
      selectedCategories.add(categoryKey);
      button.classList.add('selected');
    }

    updateFilteredFlashcards();
    showRandomCard();
  });
});

// 🔍 Update filteredFlashcards based on selectedCategories
function updateFilteredFlashcards() {
  if (selectedCategories.size === 0) {
    filteredFlashcards = [...flashcards];
    return;
  }

  const allowedTypes = new Set();

  selectedCategories.forEach(key => {
    const types = categoryMap[key];
    types.forEach(type => allowedTypes.add(type));
  });

  filteredFlashcards = flashcards.filter(card => allowedTypes.has(card['type']));
}


// ⌨️ Keyboard shortcuts
//   space        -> reveal / hide the species card   (same as ✔)
//   right arrow  -> next species                     (same as ➜)
//   i            -> toggle the longer description    (same as the ℹ icon)
//                   only while the species card is showing
document.addEventListener('keydown', event => {

  // never hijack typing
  const tag = (event.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || event.target.isContentEditable) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  // the modal owns the keyboard while it is open
  if (!document.getElementById('helpModal').hidden) return;

  const definitionVisible = definitionEl.style.display === 'block';

  switch (event.key) {

    case ' ':
    case 'Spacebar':
      event.preventDefault();          // stop the page scrolling
      checkBtn.click();
      break;

    case 'ArrowRight':
      event.preventDefault();
      nextBtn.click();
      break;

    case 'i':
    case 'I':
      if (!definitionVisible) return;  // nothing to expand yet
      event.preventDefault();
      definitionEl.querySelector('.info-icon')?.click();
      break;
  }
});


// ❓ Help modal
const helpBtn    = document.querySelector('.help');
const helpModal  = document.getElementById('helpModal');
const helpClose  = document.getElementById('helpClose');
let lastFocused  = null;

function openHelp() {
  lastFocused = document.activeElement;
  helpModal.hidden = false;
  helpClose.focus();
}

function closeHelp() {
  helpModal.hidden = true;
  if (lastFocused) lastFocused.focus();
}

helpBtn.addEventListener('click', openHelp);
helpClose.addEventListener('click', closeHelp);

// clicking the dimmed area closes; clicking the panel itself does not
helpModal.addEventListener('click', event => {
  if (event.target === helpModal) closeHelp();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !helpModal.hidden) closeHelp();
});
