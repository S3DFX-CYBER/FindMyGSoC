/* eslint-env browser */
/* exported BadgeSystem */

// ══════════════════════════════════════════════
// BADGE SYSTEM MVP - Gamification for user engagement
// ══════════════════════════════════════════════
// NOTE: Badges are stored locally in your browser using localStorage.
// This means:
// - Progress is per-device/browser (not synced across devices)
// - Clearing browser data will reset all badge progress
// - No user account required - completely privacy-friendly
// ══════════════════════════════════════════════
// BADGE TYPES: Four core engagement metrics
// - Explorer (org views) - Most common user action
// - Comparator (comparisons) - Key feature engagement
// - Search Master (searches) - Discovery behavior
// - Filter Pro (filters) - Advanced filtering usage
// ══════════════════════════════════════════════

const BadgeSystem = (function() {
  const STORAGE_KEY = 'gssoc_badges';
  
  // Badge definitions with thresholds (4 types)
  const BADGE_DEFINITIONS = {
    explorer: {
      name: '🔍 Explorer',
      description: 'Viewed organizations',
      thresholds: [10, 25, 50, 100],
      levels: ['Bronze', 'Silver', 'Gold', 'Platinum']
    },
    comparator: {
      name: '⚖️ Comparator',
      description: 'Compared organizations',
      thresholds: [5, 15, 30, 50],
      levels: ['Bronze', 'Silver', 'Gold', 'Platinum']
    },
    search_master: {
      name: '🔎 Search Master',
      description: 'Performed searches',
      thresholds: [10, 30, 75, 150],
      levels: ['Bronze', 'Silver', 'Gold', 'Platinum']
    },
    filter_pro: {
      name: '🏷️ Filter Pro',
      description: 'Applied filters',
      thresholds: [15, 40, 100, 200],
      levels: ['Bronze', 'Silver', 'Gold', 'Platinum']
    }
  };

  // Get badge data from localStorage
  function getBadgeData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return {
          explorer: 0,
          comparator: 0,
          search_master: 0,
          filter_pro: 0,
          unlockedBadges: []
        };
      }
      const parsed = JSON.parse(data);

      // Schema validation with normalization
      const isValid =
        parsed !== null &&
        typeof parsed === 'object' &&
        typeof parsed.explorer === 'number' &&
        typeof parsed.comparator === 'number' &&
        Array.isArray(parsed.unlockedBadges);

      if (!isValid) {
        console.warn('Badge data schema mismatch — resetting to defaults.');
        return {
          explorer: 0,
          comparator: 0,
          search_master: 0,
          filter_pro: 0,
          unlockedBadges: []
        };
      }

      // Normalize and sanitize values
      const explorer = Math.max(0, Math.floor(parsed.explorer));
      const comparator = Math.max(0, Math.floor(parsed.comparator));
      const search_master = Math.max(0, Math.floor(parsed.search_master || 0));
      const filter_pro = Math.max(0, Math.floor(parsed.filter_pro || 0));
      
      // Sanitize unlockedBadges: only allow valid badge IDs (badgeType_level)
      const validBadgePattern = /^(explorer|comparator|search_master|filter_pro)_[0-3]$/;
      const unlockedBadges = [...new Set(
        parsed.unlockedBadges
          .filter(id => typeof id === 'string' && id.length > 0 && validBadgePattern.test(id))
      )];

      return {
        explorer,
        comparator,
        search_master,
        filter_pro,
        unlockedBadges
      };
    } catch (e) {
      console.warn('Failed to parse badge data:', e);
      return {
        explorer: 0,
        comparator: 0,
        search_master: 0,
        filter_pro: 0,
        unlockedBadges: []
      };
    }
  }

  // Save badge data to localStorage
  function saveBadgeData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save badge data:', e);
    }
  }

  // Get the current level for a badge type
  function getBadgeLevel(badgeType, count) {
    const def = BADGE_DEFINITIONS[badgeType];
    if (!def) return null;

    for (let i = def.thresholds.length - 1; i >= 0; i--) {
      if (count >= def.thresholds[i]) {
        return {
          level: i,
          levelName: def.levels[i],
          threshold: def.thresholds[i],
          nextThreshold: def.thresholds[i + 1] || null
        };
      }
    }
    return null;
  }

  // Check if a new badge level was unlocked
  function checkBadgeUnlock(badgeType, oldCount, newCount) {
    const oldLevel = getBadgeLevel(badgeType, oldCount);
    const newLevel = getBadgeLevel(badgeType, newCount);

    // Check if we crossed a threshold
    if (!oldLevel && newLevel) {
      return newLevel; // First badge unlocked
    }
    if (oldLevel && newLevel && oldLevel.level < newLevel.level) {
      return newLevel; // Level up
    }
    return null;
  }

  // Show badge unlock notification
  function showBadgeNotification(badgeType, level) {
    const def = BADGE_DEFINITIONS[badgeType];
    if (!def) return;

    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    // Add ARIA live region attributes for screen reader accessibility
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    notification.setAttribute('aria-atomic', 'true');
    
    notification.innerHTML = `
      <div class="badge-notification-content">
        <div class="badge-notification-icon">${def.name.split(' ')[0]}</div>
        <div class="badge-notification-text">
          <div class="badge-notification-title">Badge Unlocked!</div>
          <div class="badge-notification-desc">${def.name} - ${level.levelName}</div>
          <div class="badge-notification-progress">${def.description}: ${level.threshold}</div>
        </div>
      </div>
      <span class="sr-only">Badge unlocked: ${def.name} ${level.levelName}. ${def.description} ${level.threshold}.</span>
    `;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 4000);
  }

  // Track an action and check for badge unlocks
  function trackAction(actionType) {
    const data = getBadgeData();
    const oldCount = data[actionType] || 0;
    const newCount = oldCount + 1;
    data[actionType] = newCount;

    // Check for badge unlock
    const unlockedLevel = checkBadgeUnlock(actionType, oldCount, newCount);
    if (unlockedLevel) {
      const badgeKey = `${actionType}_${unlockedLevel.level}`;
      if (!data.unlockedBadges.includes(badgeKey)) {
        data.unlockedBadges.push(badgeKey);
        saveBadgeData(data);
        showBadgeNotification(actionType, unlockedLevel);
        return;
      }
    }

    saveBadgeData(data);
  }

  // Helper function to compute badge progress percentage
  function computeProgress(count, level, def) {
    if (!level) {
      // No level yet - progress toward first threshold
      return Math.round((count / def.thresholds[0]) * 100);
    }
    if (!level.nextThreshold) {
      // Max level reached
      return 100;
    }
    // Progress toward next level
    return Math.round(((count - level.threshold) / (level.nextThreshold - level.threshold)) * 100);
  }

  // Get badge statistics for display
  function getBadgeStats() {
    const data = getBadgeData();
    const stats = {};

    Object.keys(BADGE_DEFINITIONS).forEach(badgeType => {
      const count = data[badgeType] || 0;
      const level = getBadgeLevel(badgeType, count);
      const def = BADGE_DEFINITIONS[badgeType];

      stats[badgeType] = {
        name: def.name,
        description: def.description,
        count: count,
        level: level,
        nextThreshold: level ? level.nextThreshold : def.thresholds[0],
        progress: computeProgress(count, level, def)
      };
    });

    return stats;
  }

  // Get total unlocked badges count
  function getUnlockedCount() {
    const data = getBadgeData();
    return data.unlockedBadges.length;
  }

  // Get total possible badges count (4 types × 4 levels = 16)
  function getTotalBadgesCount() {
    return Object.keys(BADGE_DEFINITIONS).length * 4;
  }

  // Reset all badge progress
  function resetProgress() {
    if (confirm('Are you sure you want to reset all badge progress? This cannot be undone.\n\nNote: Badges are stored locally in your browser. Clearing browser data will also reset progress.')) {
      // Bug 3 fix: Wrap in try/catch for incognito/high-security environments
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to reset badge progress — localStorage unavailable:', e);
        return false;
      }
      // Dispatch event to update UI
      document.dispatchEvent(new CustomEvent('badgesReset'));
      return true;
    }
    return false;
  }

  // Public API
  return {
    trackOrgView: () => trackAction('explorer'),
    trackComparison: () => trackAction('comparator'),
    trackSearch: () => trackAction('search_master'),
    trackFilter: () => trackAction('filter_pro'),
    getBadgeStats: getBadgeStats,
    getUnlockedCount: getUnlockedCount,
    getTotalBadgesCount: getTotalBadgesCount,
    resetProgress: resetProgress,
    getBadgeData: getBadgeData
  };
})();

// Make it globally available
if (typeof globalThis !== 'undefined') {
  globalThis.BadgeSystem = BadgeSystem;
}
