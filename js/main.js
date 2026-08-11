(function () {
  async function loadComponent(selector, url) {
    const target = document.querySelector(selector);

    if (!target) {
      return;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Не удалось загрузить ${url}`);
    }

    target.innerHTML = await response.text();
  }

  function markActiveNavigation() {
    const currentPath = window.location.pathname.replace(/\/index\.html$/, "/");
    const currentHash = window.location.hash;
    const links = document.querySelectorAll(".site-nav a, .footer-links a");

    links.forEach((link) => {
      const linkUrl = new URL(link.getAttribute("href"), window.location.origin);
      const linkPath = linkUrl.pathname.replace(/\/index\.html$/, "/");
      const isCurrent = linkPath === currentPath && (
        (linkUrl.hash && linkUrl.hash === currentHash) ||
        (!linkUrl.hash && !currentHash)
      );

      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function initDemoWidgets() {
    const widgets = document.querySelectorAll("[data-demo-widget]");

    widgets.forEach((widget) => {
      const status = widget.querySelector("[data-demo-status]");
      const price = widget.querySelector("[data-demo-price]");

      window.setTimeout(() => {
        widget.classList.add("is-complete");

        if (price && price.dataset.targetPrice) {
          price.textContent = price.dataset.targetPrice;
        }

        if (status) {
          status.textContent = "Уведомление отправлено в Telegram";
        }
      }, 2600);
    });
  }

  function initConditionPanels() {
    const presets = {
      price: {
        pair: "BTC / USD",
        market: "Binance",
        rate: "119 842 USD",
        rule: "Выше 120 000 USD",
        status: "Ожидание уровня",
      },
      percent: {
        pair: "EUR / RUB",
        market: "Фиат",
        rate: "95,72 RUB",
        rule: "Изменение на 5%",
        status: "Ожидание движения",
      },
    };

    document.querySelectorAll("[data-condition-panel]").forEach((panel) => {
      const buttons = panel.querySelectorAll("[data-condition-mode]");

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const preset = presets[button.dataset.conditionMode];

          if (!preset) {
            return;
          }

          buttons.forEach((item) => {
            const active = item === button;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-pressed", String(active));
          });

          panel.querySelector("[data-condition-pair]").textContent = preset.pair;
          panel.querySelector("[data-condition-market]").textContent = preset.market;
          panel.querySelector("[data-condition-rate]").textContent = preset.rate;
          panel.querySelector("[data-condition-rule]").textContent = preset.rule;
          panel.querySelector("[data-condition-status]").textContent = preset.status;
        });
      });
    });
  }

  function initCompactHeader() {
    const header = document.querySelector(".site-header");

    if (!header) {
      return;
    }

    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  function cleanTelegramPayloadPart(value) {
    return String(value || "").replace(/[^A-Za-z0-9_-]/g, "");
  }

  function getPostHogDistinctId() {
    if (!window.posthog?.__loaded || typeof window.posthog.get_distinct_id !== "function") {
      return "";
    }

    return cleanTelegramPayloadPart(window.posthog.get_distinct_id());
  }

  function getCurrentPageData() {
    const pageData = {
      "/assets/btc.html": "btc",
      "/assets/eth.html": "eth",
      "/assets/eur.html": "eur",
      "/assets/gram.html": "gram",
      "/assets/usd.html": "usd",
    };

    return pageData[window.location.pathname] || "";
  }

  function updateTelegramLink(link) {
    const configuredData = link.dataset.telegramStart === "current"
      ? getCurrentPageData()
      : link.dataset.telegramStart;
    const data = cleanTelegramPayloadPart(configuredData).slice(0, 20);
    const distinctId = getPostHogDistinctId();

    if (!distinctId) {
      return false;
    }

    // Telegram accepts deep-link payloads up to 64 characters.
    const prefixLength = data ? `site__${data}`.length : "site_".length;
    const maxIdLength = 64 - prefixLength;
    const startPayload = data
      ? `site_${distinctId.slice(0, maxIdLength)}_${data}`
      : `site_${distinctId.slice(0, maxIdLength)}`;

    link.href = `https://t.me/ValutAlertBot?start=${startPayload}`;
    return true;
  }

  function initTelegramLinks() {
    const links = document.querySelectorAll("[data-telegram-start]");

    if (!links.length) {
      return;
    }

    links.forEach((link) => {
      link.addEventListener("click", () => updateTelegramLink(link));
    });

    const updateAll = () => {
      let updated = false;

      links.forEach((link) => {
        updated = updateTelegramLink(link) || updated;
      });

      return updated;
    };

    if (updateAll()) {
      return;
    }

    const retryTimer = window.setInterval(() => {
      if (updateAll()) {
        window.clearInterval(retryTimer);
      }
    }, 100);

    window.setTimeout(() => window.clearInterval(retryTimer), 5000);
  }

  async function init() {
    try {
      await Promise.all([
        loadComponent("[data-header]", "/components/header.html"),
        loadComponent("[data-footer]", "/components/footer.html"),
      ]);
    } catch (error) {
      console.error(error);
    }

    markActiveNavigation();
    window.addEventListener("hashchange", markActiveNavigation);

    if (window.ValutBotTheme) {
      window.ValutBotTheme.init();
    }

    initDemoWidgets();
    initConditionPanels();
    initCompactHeader();
    initTelegramLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
