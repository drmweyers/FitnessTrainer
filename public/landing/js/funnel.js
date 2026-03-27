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

  /* ── Stripe Price IDs ── */
  var PRICE_IDS = {
    starter:      'price_1TEwpaGo4HHYDfDVyvecwfMc',
    professional: 'price_1TEwpcGo4HHYDfDVqNAFCnDt',
    enterprise:   'price_1TEwpeGo4HHYDfDVe7M1XZTD',
    saas:         'price_1TEwpdGo4HHYDfDVmtIVLSQo'
  };

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

  /** Redirect to Stripe Checkout via the backend API. */
  function goToStripeCheckout() {
    var sel = getSelection();
    var priceId = PRICE_IDS[sel.tier];

    if (!priceId) {
      console.error('[funnel] No price ID for tier:', sel.tier);
      return;
    }

    var payload = {
      priceId: priceId,
      tier: sel.tier
    };

    if (sel.saas) {
      payload.saas = true;
      payload.saasPriceId = PRICE_IDS.saas;
    }

    // Disable buttons while loading
    var buttons = document.querySelectorAll('.btn-primary, .btn-decline');
    buttons.forEach(function (btn) { btn.disabled = true; });

    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.success && data.data && data.data.url) {
        window.location.href = data.data.url;
      } else {
        console.error('[funnel] Checkout error:', data.error);
        alert('Something went wrong creating your checkout session. Please try again.');
        buttons.forEach(function (btn) { btn.disabled = false; });
      }
    })
    .catch(function (err) {
      console.error('[funnel] Checkout fetch error:', err);
      alert('Unable to connect to checkout. Please check your connection and try again.');
      buttons.forEach(function (btn) { btn.disabled = false; });
    });
  }

  /** Legacy: Redirect to checkout with query params (deprecated — use goToStripeCheckout). */
  function goToCheckout() {
    goToStripeCheckout();
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
    goToStripeCheckout: goToStripeCheckout,
    goTo: goTo,
    TIERS: TIERS,
    SAAS: SAAS,
    PRICE_IDS: PRICE_IDS
  };
})();
