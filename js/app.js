/* ---------- grab DOM elements ---------- */
const termEl       = document.querySelector('.term');
const definitionEl = document.querySelector('.definition');
const checkBtn     = document.querySelector('.check');
const nextBtn      = document.querySelector('.next');

let flashcards = [];   // will hold the JSON data
let current    = null; // keep track of the currently‑shown card

/* ---------- fetch the JSON once on load ---------- */
fetch('js/flashcards-data.json')
  .then(res => res.json())
  .then(data => {
    // the JSON rows have weird keys with spaces—keep only rows that actually have an image URL
    flashcards = data.filter(item => item['flashcards']?.trim());
    showRandomCard();           // display the first card
  })
  .catch(err => console.error('Could not load flashcards‑data.json:', err));

/* ---------- helpers ---------- */
function showRandomCard() {
  if (!flashcards.length) return;

  current = flashcards[Math.floor(Math.random() * flashcards.length)];

  // image in the .term box
  termEl.innerHTML =
    `<img src="${current['flashcards']}"
          alt="${current['common name']}"
          class="flashcard-img">`;

  // name + scientific name in .definition (initially hidden)
  definitionEl.innerHTML =
    `<h3>${current['common name']}</h3>
     <p><em>${current['scientific name']}</em></p>`;

  definitionEl.style.display = 'none';  // hide until ✔ is clicked
}

/* ---------- button handlers ---------- */
checkBtn.addEventListener('click', () => {
  definitionEl.style.display = 'block';
});

nextBtn.addEventListener('click', () => {
  showRandomCard();
});
