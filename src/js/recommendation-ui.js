// src/js/recommendation-ui.js

/* global analyzeGitHubUser, extractSkills, getRecommendations, escapeHtml, openModal, toggleCompare, toggleBookmark */

let currentAbortController = null;
let currentRequestId = 0;
let lastRecommendations = [];

/**
 * Encapsulates the heavy analytical logic into a single async pipe.
 * Moved to outer scope to maximize reuse and minimize closure memory footprint.
 * Defaults count to Infinity so the full ranked list is fetched once and cached client side allowing ui to render orgs without re running the scoring pipeline.
 */
async function analyzeProfile(username, resume, options = {}) {
  const { signal, count = Infinity } = options;
  let githubProfile = null;
  let skills = [];

  if (username) {
    try {
      githubProfile = await analyzeGitHubUser(username, { signal });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn("GitHub Analysis Failed:", err);
      if (!resume) throw err; // Only bubble up error if we possess no alternate datasource
    }
  }

  if (resume) {
    skills = extractSkills(resume);
  }

  return getRecommendations(skills, githubProfile, count);
}

/**
 * Global image error handler for recommendation cards.
 * Replaces broken images with a styled initial-based placeholder.
 */
globalThis.handleRecImgError = function(img, name) {
  img.style.display = 'none';
  const container = img.parentElement;
  if (container) {
    const placeholder = container.querySelector('.logo-placeholder');
    if (placeholder) {
      placeholder.classList.remove('hidden');
      placeholder.classList.add('flex');
      placeholder.textContent = (name || '?')[0].toUpperCase();
    }
  }
};

// Internal safety helper in case globalThis.escapeHtml is not yet initialized
const safeEscapeHtml = (str) => {
  if (typeof escapeHtml === 'function') return escapeHtml(str);
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};


function handleBookmarkAction(e, btn) {
  e.stopPropagation();
  const name = btn.dataset.bookmarkOrg;
  if (typeof toggleBookmark === 'function') {
    toggleBookmark(e, name);
    // Dynamically verify authoritative memory to correctly manage layout class topology
    const isNowBookmarked = (globalThis.bookmarkedSet || new Set()).has(name);
    btn.classList.toggle('active', isNowBookmarked);
    btn.classList.toggle('text-orange-500', isNowBookmarked);
    btn.classList.toggle('text-zinc-300', !isNowBookmarked);
    
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.toggle('icon-fill', isNowBookmarked);
  }
}

function updateCompareVisualState(btn, card, isNowComparing) {
  btn.classList.toggle('text-primary', isNowComparing);
  btn.classList.toggle('text-zinc-400', !isNowComparing);
  btn.innerHTML = isNowComparing
    ? '<span class="material-symbols-outlined text-sm">check_circle</span> Comparing'
    : '<span class="material-symbols-outlined text-sm">compare_arrows</span> Compare';
  card?.classList.toggle('ring-2', isNowComparing);
  card?.classList.toggle('ring-primary/30', isNowComparing);
}

function handleCompareAction(e, btn) {
  e.stopPropagation();
  const name = btn.dataset.compareOrg;
  if (typeof toggleCompare !== 'function') return;

  // Core engine handles constraints and updates globalThis.compareList synchronously
  toggleCompare(e, name);
  
  // Explicitly dispatch so compareListChanged listener syncs all card visual states
  document.dispatchEvent(new CustomEvent('compareListChanged'));
}

function handleCardActivation(card) {
  const name = card.dataset.orgName;
  if (typeof openModal === 'function' && name) {
    openModal(name);
  }
}

function buildCardHtml(rec, currentCompareList, currentBookmarkedSet) {
    const o = rec.org;
    const githubOwner = o.github ? o.github.split('/')[0] : '';
    const logoUrl = githubOwner ? `https://github.com/${githubOwner}.png?size=80` : '';

    const inCompare = currentCompareList.includes(o.name);
    const isBookmarked = typeof currentBookmarkedSet.has === 'function'
      ? currentBookmarkedSet.has(o.name)
      : false;

    const reasonsHtml = rec.reasons.map(r =>
      `<li class="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2"><span class="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span> <span class="leading-tight">${safeEscapeHtml(r)}</span></li>`
    ).join('');

    let matchedSkillsHtml = '';
    if (rec.matchedSkills.length > 0) {
      const skillsList = rec.matchedSkills.slice(0, 4).map(s =>
        `<span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-[9px] font-bold uppercase tracking-wider">${safeEscapeHtml(s)}</span>`
      ).join('');
      matchedSkillsHtml = `<div class="mt-2 flex flex-wrap gap-1">${skillsList}</div>`;
    }

    const logoHtml = logoUrl
      ? `<img src="${safeEscapeHtml(logoUrl)}" data-org-name="${safeEscapeHtml(o.name)}" alt="${safeEscapeHtml(o.name)} logo" class="w-full h-full object-contain rounded-lg" onerror="handleRecImgError(this, this.dataset.orgName)">
         <div class="logo-placeholder hidden w-full h-full items-center justify-center text-primary font-bold text-xl font-headline bg-primary/5"></div>`
      : `<div class="text-primary font-bold text-xl font-headline">${safeEscapeHtml(o.name[0] || '?')}</div>`;

    return `
    <article class="group relative bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 transition-all hover:shadow-xl hover:border-primary/20 animate-fade-up cursor-pointer flex flex-col ${inCompare ? 'ring-2 ring-primary/30' : ''}"
             data-org-name="${safeEscapeHtml(o.name)}"
             tabindex="-1">
      <div class="absolute top-0 right-0 bg-gradient-to-bl from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-bl-2xl rounded-tr-2xl font-bold text-xs shadow-sm flex items-center gap-1 z-10">
        <span class="material-symbols-outlined text-sm">target</span> ${rec.score}% Match
      </div>
      <div class="flex justify-between items-start mb-4 pt-2">
        <div class="w-14 h-14 rounded-xl bg-surface-container-low dark:bg-zinc-800 flex items-center justify-center p-2 overflow-hidden">
          ${logoHtml}
        </div>
        <div class="flex items-center gap-2 mt-2">
           <button class="bookmark-btn ${isBookmarked ? 'active text-orange-500' : 'text-zinc-300'}"
                   data-bookmark-org="${safeEscapeHtml(o.name)}"
                   title="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}">
              <span class="material-symbols-outlined text-xl ${isBookmarked ? 'icon-fill' : ''}">star</span>
           </button>
        </div>
      </div>
      <div class="flex-1">
        <h3 class="font-headline text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-primary transition-colors">${safeEscapeHtml(o.name)}</h3>
        <span class="category-tag inline-block mb-3">${safeEscapeHtml((o.cat || 'Other').toUpperCase())}</span>
        <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3 line-clamp-2">${safeEscapeHtml(o.desc || '')}</p>
        <div class="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <ul class="space-y-1.5 mb-3">${reasonsHtml}</ul>
          ${matchedSkillsHtml}
        </div>
      </div>
      <div class="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button data-compare-org="${safeEscapeHtml(o.name)}" class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${inCompare ? 'text-primary' : 'text-zinc-400'} hover:text-primary transition-colors">
          <span class="material-symbols-outlined text-sm">${inCompare ? 'check_circle' : 'compare_arrows'}</span> ${inCompare ? 'Comparing' : 'Compare'}
        </button>
        <button class="flex items-center gap-1 text-primary font-bold text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
          View <span class="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </article>`;
}


document.addEventListener('DOMContentLoaded', () => {
  const getRecsBtn = document.getElementById('btnGetRecommendations');
  if (!getRecsBtn) return; // Ensure the element exists

  const ghInput = document.getElementById('aiGhUsername');
  const resumeText = document.getElementById('aiResumeText');
  const fileUpload = document.getElementById('aiResumeFile');
  
  const loadingState = document.getElementById('aiLoadingState');
  const errorState = document.getElementById('aiErrorState');
  const resultsContainer = document.getElementById('aiResultsContainer');
  const errorMsg = document.getElementById('aiErrorMsg');
  let visibleCount = 6;


  if (resultsContainer) {
    document.addEventListener('compareListChanged', () => {
      const currentCompareList = globalThis.compareList || [];
      resultsContainer.querySelectorAll('[data-compare-org]').forEach(btn => {
        const card = btn.closest('[data-org-name]');
        const name = btn.dataset.compareOrg;
        const isNowComparing = currentCompareList.includes(name);
        updateCompareVisualState(btn, card, isNowComparing);
      });
    });
  }

  // Handle file upload
  if (fileUpload) {
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const MAX_RESUME_SIZE = 5 * 1024 * 1024; //5MB
      if (file.size > MAX_RESUME_SIZE) {
        showError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please upload a file under 5MB.`);
        fileUpload.value = '';
        return;
      }

      file.text().then(text => {
        resumeText.value = text;
      }).catch(err => {
        console.error("File Read Error:", err);
        showError("Failed to read file. Please make sure it's a valid text format.");
      });
    });
  }



  function setAnalysisStateUI(isActive) {
    if (isActive) {
      errorState.classList.add('hidden');
      resultsContainer.innerHTML = '';
      loadingState.classList.remove('hidden');
      getRecsBtn.disabled = true;
      getRecsBtn.innerHTML = '<span class="material-symbols-outlined pulse-dot">hourglass_empty</span> Analyzing...';
    } else {
      loadingState.classList.add('hidden');
      getRecsBtn.disabled = false;
      getRecsBtn.innerHTML = '<span class="material-symbols-outlined text-sm">auto_awesome</span> Get Recommendations';
    }
  }

  getRecsBtn.addEventListener('click', async () => {
    const username = ghInput.value.trim();
    const resume = resumeText.value.trim();

    if (!username && !resume) {
      showError("Please provide either a GitHub username or resume text to get recommendations.");
      return;
    }

    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    const requestId = ++currentRequestId;

    setAnalysisStateUI(true);
    try {
      const recommendations = await analyzeProfile(username, resume, { signal });
      
      if (requestId !== currentRequestId) return;
      
      lastRecommendations = recommendations;
      visibleCount = 6;
      renderRecommendations(recommendations.slice(0, visibleCount));
    } catch (err) {
      if (requestId !== currentRequestId || err.name === 'AbortError') return;
      showError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      if (requestId === currentRequestId) {
        setAnalysisStateUI(false);
      }
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorState.classList.remove('hidden');
    resultsContainer.innerHTML = '';
  }





  // Register one central delegate for all user actions triggered inside recommendation container
  if (resultsContainer) {
    resultsContainer.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('[data-org-name]');
      if (card && e.target === card) {
        e.preventDefault();
        handleCardActivation(card);
      }
    });

    resultsContainer.addEventListener('click', (e) => {
      const target = e.target;
      
      const bookmarkBtn = target.closest('[data-bookmark-org]');
      if (bookmarkBtn) {
        return handleBookmarkAction(e, bookmarkBtn);
      }

      const compareBtn = target.closest('[data-compare-org]');
      const card = target.closest('[data-org-name]');
      if (compareBtn && card) {
        return handleCompareAction(e, compareBtn);
      }
      
      if (card) {
        return handleCardActivation(card);
      }

      const showMoreBtn = target.closest('#btnShowMoreRecs');
      if (showMoreBtn) {
        const prevCount = visibleCount;
        visibleCount = Math.min(visibleCount + 6, lastRecommendations.length);

        const currentCompareList = globalThis.compareList || [];
        const currentBookmarkedSet = globalThis.bookmarkedSet || new Set();
        const newCardsHtml = lastRecommendations
          .slice(prevCount, visibleCount)
          .map(rec => buildCardHtml(rec, currentCompareList, currentBookmarkedSet))
          .join('');

        const grid = resultsContainer.querySelector('.grid');
        if (grid) grid.insertAdjacentHTML('beforeend', newCardsHtml);

        const oldShowMore = document.getElementById('btnShowMoreRecs')?.parentElement;
        oldShowMore?.remove();
        if (visibleCount < lastRecommendations.length) {
          resultsContainer.insertAdjacentHTML('beforeend',
            `<div class="flex justify-center mt-6">
               <button id="btnShowMoreRecs" aria-label="Show more recommendations" class="px-5 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:border-primary hover:text-primary transition-colors">
                 Show More
               </button>
             </div>`);
        }

        const newBtn = document.getElementById('btnShowMoreRecs');
        if (newBtn) {
          newBtn.focus();
        } else {
          const cards = resultsContainer.querySelectorAll('article[data-org-name]');
          const firstNewCard = cards[prevCount];
          const focusTarget = firstNewCard?.querySelector('button') ?? firstNewCard;
          focusTarget?.focus();
        }
      }
    });
  }
  
  
  function renderRecommendations(recs) {
    if (!recs || recs.length === 0) {
      showError("Could not find any matching organizations based on your profile.");
      return;
    }

    const currentCompareList = globalThis.compareList || [];
    const currentBookmarkedSet = globalThis.bookmarkedSet || new Set();

    const html = recs.map(rec => buildCardHtml(rec, currentCompareList, currentBookmarkedSet)).join('');

    const showMoreHtml = (lastRecommendations.length > recs.length)
      ? `<div class="flex justify-center mt-6">
           <button id="btnShowMoreRecs" aria-label="Show more recommendations" class="px-5 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:border-primary hover:text-primary transition-colors">
              Show More
           </button>
         </div>`
      : '';

    resultsContainer.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${html}</div>${showMoreHtml}`;
  }
});
