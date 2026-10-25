/* ==========================================================================
   Velnoxy theme scripts (loaded after Dawn's global.js / pubsub.js)
   - <vx-cart-timer>   cart reservation countdown, survives drawer re-renders
   - cart count        keeps "Cart • N items" in sync after app updates (Kaching)
   - <vx-delivery>     client-side delivery date estimate
   - <vx-sticky-atc>   sticky buy bar, clicks the real buy button
   - [data-vx-tier]    "Choose …" buttons that select a Kaching bundle bar
   - <vx-faq>          FAQ search + category tabs
   - <vx-tabs>         generic tabs (policies page)
   ========================================================================== */

(() => {
  const store = {
    get(key) {
      try {
        return window.sessionStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch (e) {
        /* storage blocked: timer just runs per page */
      }
    },
    remove(key) {
      try {
        window.sessionStorage.removeItem(key);
      } catch (e) {
        /* ignore */
      }
    },
  };

  const TIMER_KEY = 'vx-cart-timer-end';
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- cart reservation timer ---------- */
  class VxCartTimer extends HTMLElement {
    connectedCallback() {
      this.minutes = parseInt(this.dataset.minutes, 10) || 5;
      this.mode = this.dataset.expire || 'message';
      this.clock = this.querySelector('[data-vx-timer-clock]');
      this.live = this.querySelector('.vx-cart__timer-live');
      this.expired = this.querySelector('.vx-cart__timer-expired');
      if (!this.getEnd()) this.restart();
      this.tick();
      this.interval = setInterval(() => this.tick(), 1000);
    }

    disconnectedCallback() {
      clearInterval(this.interval);
    }

    getEnd() {
      return parseInt(store.get(TIMER_KEY), 10) || 0;
    }

    restart() {
      store.set(TIMER_KEY, String(Date.now() + this.minutes * 60 * 1000));
    }

    tick() {
      let left = Math.round((this.getEnd() - Date.now()) / 1000);
      if (left <= 0) {
        if (this.mode === 'restart') {
          this.restart();
          left = this.minutes * 60;
        } else {
          this.showExpired();
          return;
        }
      }
      this.removeAttribute('data-state');
      if (this.live) this.live.hidden = false;
      if (this.expired) this.expired.hidden = true;
      if (this.clock) this.clock.textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
    }

    showExpired() {
      clearInterval(this.interval);
      if (this.mode === 'hide' || !this.expired || !this.expired.textContent.trim()) {
        this.setAttribute('data-state', 'hidden');
        return;
      }
      if (this.live) this.live.hidden = true;
      this.expired.hidden = false;
    }
  }
  if (!customElements.get('vx-cart-timer')) customElements.define('vx-cart-timer', VxCartTimer);

  /* restart the reservation when something new is added, clear it when the cart empties */
  if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
    subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event && event.source === 'product-form') {
        const timer = document.querySelector('vx-cart-timer');
        const minutes = timer ? parseInt(timer.dataset.minutes, 10) || 5 : 5;
        store.set(TIMER_KEY, String(Date.now() + minutes * 60 * 1000));
      }
      const count = event && event.cartData ? event.cartData.item_count : undefined;
      if (count === 0) store.remove(TIMER_KEY);
      if (typeof count === 'number') {
        document.querySelectorAll('[data-vx-cart-count]').forEach((el) => (el.textContent = count));
      }
    });
  }

  /* apps such as Kaching change the cart with their own requests: re-sync the count */
  document.addEventListener('cart:refresh', syncCount);
  function syncCount() {
    fetch(`${window.routes ? window.routes.cart_url : '/cart'}.js`)
      .then((r) => r.json())
      .then((cart) => {
        document.querySelectorAll('[data-vx-cart-count]').forEach((el) => (el.textContent = cart.item_count));
        if (cart.item_count === 0) store.remove(TIMER_KEY);
      })
      .catch(() => {});
  }

  /* ---------- delivery estimate ---------- */
  class VxDelivery extends HTMLElement {
    connectedCallback() {
      const min = parseInt(this.dataset.min, 10) || 5;
      const max = parseInt(this.dataset.max, 10) || 10;
      const business = this.dataset.business === 'true';
      const cutoff = parseInt(this.dataset.cutoff, 10);
      const start = new Date();
      if (!Number.isNaN(cutoff) && start.getHours() >= cutoff) start.setDate(start.getDate() + 1);
      const fmt = new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      const add = (date, days) => {
        const d = new Date(date);
        let left = days;
        while (left > 0) {
          d.setDate(d.getDate() + 1);
          const day = d.getDay();
          if (!business || (day !== 0 && day !== 6)) left -= 1;
        }
        return d;
      };
      const a = this.querySelector('[data-vx-date="start"]');
      const b = this.querySelector('[data-vx-date="end"]');
      if (a) a.textContent = fmt.format(add(start, min));
      if (b) b.textContent = fmt.format(add(start, max));
    }
  }
  if (!customElements.get('vx-delivery')) customElements.define('vx-delivery', VxDelivery);

  /* ---------- sticky add to cart ---------- */
  class VxStickyAtc extends HTMLElement {
    connectedCallback() {
      this.form = document.getElementById(this.dataset.formId);
      this.buyButton = this.form ? this.form.querySelector('[type="submit"]') : null;
      if (!this.buyButton) return;
      this.hidden = false;
      this.title = this.querySelector('[data-vx-sticky-title]');
      this.price = this.querySelector('[data-vx-sticky-price]');
      this.compare = this.querySelector('[data-vx-sticky-compare]');

      this.querySelector('[data-vx-sticky-btn]').addEventListener('click', () => {
        if (this.buyButton.disabled) {
          this.buyButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        this.buyButton.click();
      });

      const update = () => {
        const rect = this.buyButton.getBoundingClientRect();
        this.classList.toggle('is-visible', rect.bottom < 0);
      };
      window.addEventListener('scroll', update, { passive: true });
      update();

      this.syncFromKaching();
      const kaching = document.querySelector('kaching-bundles-block');
      if (kaching) {
        new MutationObserver(() => this.syncFromKaching()).observe(kaching, {
          subtree: true,
          attributes: true,
          attributeFilter: ['class'],
          childList: true,
        });
      }
      if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          if (!event || !event.data || !event.data.variant) return;
          if (document.querySelector('.kaching-bundles__bar--selected')) return;
          const v = event.data.variant;
          const money = (cents) =>
            typeof Shopify !== 'undefined' && Shopify.formatMoney
              ? Shopify.formatMoney(cents)
              : `$${(cents / 100).toFixed(2)}`;
          if (this.price) this.price.textContent = money(v.price);
          if (this.compare) {
            this.compare.hidden = !(v.compare_at_price > v.price);
            if (v.compare_at_price) this.compare.textContent = money(v.compare_at_price);
          }
        });
      }
    }

    syncFromKaching() {
      const bar = document.querySelector('.kaching-bundles__bar--selected');
      if (!bar) return;
      const title = bar.querySelector('.kaching-bundles__bar-title');
      const price = bar.querySelector('.kaching-bundles__bar-price');
      const full = bar.querySelector('.kaching-bundles__bar-full-price');
      if (title && this.title) this.title.textContent = title.textContent.trim();
      if (price && this.price) this.price.textContent = price.textContent.trim();
      if (this.compare) {
        this.compare.hidden = !(full && full.textContent.trim());
        if (full) this.compare.textContent = full.textContent.trim();
      }
    }
  }
  if (!customElements.get('vx-sticky-atc')) customElements.define('vx-sticky-atc', VxStickyAtc);

  /* ---------- "Choose …" buttons → select the matching Kaching bundle bar ---------- */
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-vx-tier]');
    if (!trigger) return;
    const index = parseInt(trigger.dataset.vxTier, 10);
    const bars = document.querySelectorAll('.kaching-bundles__bar');
    const buyBox = document.querySelector('product-info, [id^="MainProduct-"]');
    if (bars.length && bars[index]) {
      event.preventDefault();
      const clickable = bars[index].querySelector('input, label') || bars[index];
      clickable.click();
      bars[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (buyBox && trigger.getAttribute('href') && trigger.getAttribute('href').startsWith('#')) {
      event.preventDefault();
      buyBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ---------- FAQ: search + categories ---------- */
  class VxFaq extends HTMLElement {
    connectedCallback() {
      this.search = this.querySelector('[data-vx-faq-search]');
      this.tabs = [...this.querySelectorAll('[data-vx-faq-tab]')];
      this.groups = [...this.querySelectorAll('[data-vx-faq-group]')];
      this.empty = this.querySelector('[data-vx-faq-empty]');
      this.tabs.forEach((tab) => tab.addEventListener('click', () => this.select(tab.dataset.vxFaqTab)));
      if (this.search) this.search.addEventListener('input', () => this.filter());
      if (this.tabs.length) this.select(this.tabs[0].dataset.vxFaqTab);
    }

    select(id) {
      this.current = id;
      if (this.search) this.search.value = '';
      this.tabs.forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.vxFaqTab === id)));
      this.groups.forEach((group) => {
        group.hidden = group.dataset.vxFaqGroup !== id;
        group.querySelectorAll('details').forEach((d) => (d.hidden = false));
      });
      if (this.empty) this.empty.hidden = true;
    }

    filter() {
      const q = this.search.value.trim().toLowerCase();
      if (!q) {
        this.select(this.current || (this.tabs[0] && this.tabs[0].dataset.vxFaqTab));
        return;
      }
      let hits = 0;
      this.tabs.forEach((tab) => tab.setAttribute('aria-pressed', 'false'));
      this.groups.forEach((group) => {
        let groupHits = 0;
        group.querySelectorAll('details').forEach((d) => {
          const match = d.textContent.toLowerCase().includes(q);
          d.hidden = !match;
          if (match) groupHits += 1;
        });
        group.hidden = groupHits === 0;
        hits += groupHits;
      });
      if (this.empty) this.empty.hidden = hits > 0;
    }
  }
  if (!customElements.get('vx-faq')) customElements.define('vx-faq', VxFaq);

  /* ---------- generic tabs ---------- */
  class VxTabs extends HTMLElement {
    connectedCallback() {
      this.tabs = [...this.querySelectorAll('[data-vx-tab]')];
      this.panels = [...this.querySelectorAll('[data-vx-panel]')];
      this.tabs.forEach((tab) => tab.addEventListener('click', () => this.select(tab.dataset.vxTab, true)));
      const fromHash = window.location.hash.replace('#', '');
      const initial = this.tabs.find((t) => t.dataset.vxTab === fromHash) || this.tabs[0];
      if (initial) this.select(initial.dataset.vxTab, false);
    }

    select(id, updateHash) {
      this.tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.vxTab === id)));
      this.panels.forEach((panel) => (panel.hidden = panel.dataset.vxPanel !== id));
      if (updateHash && window.history.replaceState) window.history.replaceState(null, '', `#${id}`);
    }
  }
  if (!customElements.get('vx-tabs')) customElements.define('vx-tabs', VxTabs);
})();
