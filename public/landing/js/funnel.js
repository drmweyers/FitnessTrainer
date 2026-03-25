/* EvoFit Trainer — Funnel State Manager */

(function () {
  'use strict';

  var TIER_KEY = 'evofit_trainer_funnel_tier';
  var SAAS_KEY = 'evofit_trainer_funnel_saas';

  var TIERS = {
    starter:      { name: 'Starter',      price: 149, period: 'one-time' },
    professional: { name: 'Professional', price: 249, period: 'one-time' },
    enterprise:   { name: 'Enterprise',   price: 349, period: 'one-time' }
  };

  var SAAS = { name: 'AI Workout Engine', price: 29, period: '/mo' };

  /* ── Public API ── */

  /** Select a base tier and persist it. */
  function selectTier(tier) {
    if (!TIERS[tier]) {
      console.error('[funnel] Unknown tier:', tier);
      return;
    }
    sessionStorage.setItem(TIER_KEY, tier);
  }

  /** Add (or confirm) the SaaS add-on. */
  function addSaas(enabled) {
    sessionStorage.setItem(SAAS_KEY, enabled ? '1' : '0');
  }

  /** Return the full selection object. */
  function getSelection() {
    var tier = sessionStorage.getItem(TIER_KEY) || 'starter';
    var saas = sessionStorage.getItem(SAAS_KEY) === '1';
    var tierData = TIERS[tier] || TIERS.starter;

    return {
      tier: tier,
      tierName: tierData.name,
      tierPrice: tierData.price,
      saas: saas,
      saasPrice: saas ? SAAS.price : 0,
      totalOneTime: tierData.price,
      totalMonthly: saas ? SAAS.price : 0
    };
  }

  /** Redirect to checkout with query params. */
  function goToCheckout() {
    var sel = getSelection();
    var url = '/checkout?tier=' + encodeURIComponent(sel.tier) +
              '&saas=' + (sel.saas ? '1' : '0');
    window.location.href = url;
  }

  /** Navigate to next funnel page. */
  function goTo(page) {
    window.location.href = '/landing/' + page;
  }

  /* ── Expose globally ── */
  window.EvoFitFunnel = {
    selectTier: selectTier,
    addSaas: addSaas,
    getSelection: getSelection,
    goToCheckout: goToCheckout,
    goTo: goTo,
    TIERS: TIERS,
    SAAS: SAAS
  };
})();
