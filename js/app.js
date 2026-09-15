/* ===========================================================
   STARRED SPECIES  ("study pile")
   -----------------------------------------------------------
   Kept in localStorage, which is a browser API - it works on a
   static host like GitHub Pages because nothing leaves the
   device. Keyed on scientific name rather than array position,
   so a star survives records being added or reordered.

   It is per-browser: stars set on a phone are not on a laptop.
=========================================================== */

const STAR_KEY = 'wildca-starred';

function loadStarred() {
  try {
    const raw = JSON.parse(localStorage.getItem(STAR_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch (e) {
    return new Set();          // corrupt or unavailable -> start empty
  }
}

function saveStarred() {
  try {
    localStorage.setItem(STAR_KEY, JSON.stringify([...starred]));
  } catch (e) {
    /* private browsing can refuse writes; starring still works for
       the session, it just will not persist */
  }
}

let starred = loadStarred();
let studyMode = false;          // true when the star filter is on

const STAR_PATH = "M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z";


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
// Each emoji button maps to one or more `type` values. Types stay
// taxonomically accurate in the data; the buttons group them for the
// player. That is why Arachnid sits under the insect button and the
// fish button also covers molluscs, echinoderms and cnidarians.
const categoryMap = {
  plant:             ['Plant'],
  fungus:            ['Fungi'],
  mammal:            ['Mammal'],
  bird:              ['Bird'],
  reptileamphibian:  ['Reptile', 'Amphibian'],
  insectarachnid:    ['Insect', 'Arachnid'],
  aquatic:           ['Fish', 'Mollusk', 'Echinoderm', 'Cnidarian'],
};

// 🐣 Load JSON
fetch('js/flashcards-data.json')
  .then(res => res.json())
  .then(data => {
    // an image is required, and records flagged active:false stay in the
    // dataset but out of the deck
    flashcards = data.filter(item => photosFor(item).length && item.active !== false);
    filteredFlashcards = [...flashcards]; // Start with all flashcards
    showRandomCard();
  })
  .catch(err => console.error('Could not load flashcards-data.json:', err));

// 📷 A species may have one image or several.
//    `images` is the array form; `image` is the single-photo form kept
//    from earlier versions. Either works.
function photosFor(card) {
  if (Array.isArray(card.images) && card.images.length) return card.images;
  if ((card.image || '').trim()) {
    return [{
      url: card.image,
      credit: card.image_credit || '',
      license: card.image_license || '',
      source: card.image_source || '',
    }];
  }
  return [];
}

function pickPhoto(card) {
  const photos = photosFor(card);
  if (!photos.length) return { url: '', credit: '' };
  return photos[Math.floor(Math.random() * photos.length)];
}

let currentPhoto = { url: '', credit: '' };


// 🌼 Show a random flashcard
function showRandomCard() {
  definitionEl.style.display = 'none';

  if (!filteredFlashcards.length) {
    termEl.innerHTML = '<p>No cards match the selected categories 😢</p>';
    definitionEl.style.display = 'none';
    return;
  }

  current = filteredFlashcards[Math.floor(Math.random() * filteredFlashcards.length)];

  // A species may carry several photographs. Showing a random one each
  // time stops people memorising a single picture instead of learning
  // to recognise the species.
  currentPhoto = pickPhoto(current);

  termEl.innerHTML =
    `<div class="flashcard-img-wrapper">
      <img src="${currentPhoto.url}"
           alt="${current['common name']}"
           class="flashcard-img">
      <button class="star-btn" aria-label="Save this species" title="Save this species">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path class="star-outline" d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
          <path class="star-filled" d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
        </svg>
      </button>
    </div>`;

  // reflect whatever is already saved for this species
  const starBtn = termEl.querySelector('.star-btn');
  const key = current['scientific name'];

  if (starBtn) {
    starBtn.classList.toggle('starred', starred.has(key));
    starBtn.setAttribute('aria-pressed', starred.has(key));

    starBtn.addEventListener('click', () => {
      if (starred.has(key)) {
        starred.delete(key);
        starBtn.classList.remove('starred');
      } else {
        starred.add(key);
        starBtn.classList.add('starred');
      }
      starBtn.setAttribute('aria-pressed', starred.has(key));
      saveStarred();
      refreshStarUI();

      // in study mode an unstarred card no longer belongs here,
      // so let it go and move on
      if (studyMode && !starred.has(key)) {
        document.querySelector('.card')?.classList.add('dissolving');
        setTimeout(() => {
          document.querySelector('.card')?.classList.remove('dissolving');
          if (starred.size === 0) {
            exitStudyMode();
          } else {
            updateFilteredFlashcards();
            showRandomCard();
          }
        }, 260);
      }
    });
  }

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

// lifespan | size | weight, in that order, under the scientific name
const stats = ['lifespan', 'size', 'weight']
  .map(k => current[k])
  .filter(Boolean)
  .map(v => `<span>${v}</span>`)
  .join('');
const statLine = stats ? `<p class="stats">${stats}</p>` : '';

// species introduced to California are kept, but labelled as such
const nonNative = current['non_native']
  ? '<p class="non-native">Introduced to California &mdash; not a native species.</p>'
  : '';

// CC licences require credit, so it travels with the photo
const credit = currentPhoto.credit
  ? `<p class="credit">Photo: ${currentPhoto.credit}</p>`
  : '';

definitionEl.innerHTML = `
  <div class="species-head">
    <h3>${commonName}</h3>
    <img src="info.png" alt="More information" class="info-icon" title="More information">
  </div>
  <p><em>${sciName}${statusText}</em></p>
  ${statLine}
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
  // the star filter is exclusive - it replaces category selection
  if (studyMode) {
    filteredFlashcards = flashcards.filter(c => starred.has(c['scientific name']));
    return;
  }

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
const helpBtn    = document.querySelector('.help-btn');
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


/* ===========================================================
   STAR INDEX BUTTON
   Appears with the first star, sits last in the row, and the
   flex row recentres itself.
=========================================================== */

const categoryRow = document.querySelector('.category-buttons');

const starIndexBtn = document.createElement('button');
starIndexBtn.className = 'category-button star-index';
starIndexBtn.setAttribute('data-category', 'starred');
starIndexBtn.setAttribute('aria-label', 'Show only starred species');
starIndexBtn.title = 'Your study pile';
starIndexBtn.innerHTML =
  `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="${STAR_PATH}"/></svg>
   <span class="star-count"></span>`;
categoryRow.appendChild(starIndexBtn);


const STAR_FADE_MS  = 750;   // must match the css transition
const COUNT_FADE_MS = 400;

function showStarButton(show) {
  // one class, no display juggling and no rAF - the transition runs
  // even if the tab is in the background
  starIndexBtn.classList.toggle('visible', show);
}

let countTimer = null;

function setStarCount(n) {
  const el = starIndexBtn.querySelector('.star-count');
  const next = n > 0 ? String(n) : '';
  if (el.textContent === next) return;

  // starring several in quick succession would otherwise queue
  // overlapping timers and land on a stale number
  clearTimeout(countTimer);

  el.classList.add('fading');
  countTimer = setTimeout(() => {
    el.textContent = starred.size > 0 ? String(starred.size) : '';
    el.classList.remove('fading');
  }, COUNT_FADE_MS);
}

function refreshStarUI() {
  const n = starred.size;

  showStarButton(n > 0);
  setStarCount(n);

  // no stars left means nothing to study
  if (n === 0 && studyMode) exitStudyMode();
}


function enterStudyMode() {
  studyMode = true;
  starIndexBtn.classList.add('selected');
  categoryRow.classList.add('study-mode');

  // the star filter replaces any category selection
  selectedCategories.clear();
  categoryButtons.forEach(b => b.classList.remove('selected'));

  updateFilteredFlashcards();
  showRandomCard();
}


function exitStudyMode() {
  studyMode = false;
  starIndexBtn.classList.remove('selected');
  categoryRow.classList.remove('study-mode');
  updateFilteredFlashcards();
  showRandomCard();
}


starIndexBtn.addEventListener('click', () => {
  if (!starred.size) return;
  studyMode ? exitStudyMode() : enterStudyMode();
});


// a greyed-out category button leaves study mode and applies itself
categoryButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (studyMode) {
      studyMode = false;
      starIndexBtn.classList.remove('selected');
      categoryRow.classList.remove('study-mode');
    }
  }, true);        // capture, so this runs before the existing handler
});


// On load an existing pile should simply be there. Fading it in on
// every visit would read as a glitch rather than a response.
if (starred.size) {
  starIndexBtn.classList.add('visible');
  starIndexBtn.querySelector('.star-count').textContent = starred.size;
}
