(() => {
  "use strict";

  const WHATSAPP_NUMBER = "5527992822534";
  const CART_STORAGE_KEY = "suafruti-sacolinha-v2";
  const MAX_QTY = 20;

  const DEFAULT_MESSAGE =
    "Olá, Suafruti! 😊\n" +
    "Vi o cardápio (potes de 250 ml e 300 ml, fruta cortada e caixa de morango) e quero fazer um pedido. Podem me ajudar?";

  const FRUITS = "uva verde, uva preta, morango, kiwi, manga, banana, maçã e mamão";
  const ADDONS_SALADA = "leite condensado, leite em pó, mel, granola, mousse de maracujá e mousse de morango";
  const ADDONS_OVERNIGHT = "iogurte natural, chia, granola, mel e aveia";

  /* Catálogo: cada combinação de produto + tamanho/fruta/tipo vira uma variação comprável. */
  const CATALOG = {
    salada: {
      name: "Salada de Frutas Tradicional",
      image: "assets/produto-salada-tradicional.webp",
      fruits: FRUITS,
      addons: ADDONS_SALADA,
      note: "Pote montado com as 8 frutas fresquinhas.",
      options: {
        "250": { price: 1200, detail: "pote de 250 ml", label: "250 ml", sticker: "250 ml" },
        "300": { price: 1500, detail: "pote de 300 ml", label: "300 ml", sticker: "300 ml" }
      }
    },
    overnight: {
      name: "Salada Overnight",
      image: "assets/produto-overnight.webp",
      fruits: FRUITS,
      addons: ADDONS_OVERNIGHT,
      note: "Camadas de frutas, iogurte e granola.",
      options: {
        "250": { price: 1800, detail: "pote de 250 ml", label: "250 ml", sticker: "250 ml" },
        "300": { price: 2000, detail: "pote de 300 ml", label: "300 ml", sticker: "300 ml" }
      }
    },
    fruta: {
      name: "Fruta Cortada",
      image: "assets/produto-uma-fruta.webp",
      flavors: { morango: "Morango", manga: "Manga", mamao: "Mamão" },
      note: "Somente uma opção de fruta por pote: morango, manga ou mamão.",
      options: {
        "250": { price: 800, detail: "pote de 250 ml", label: "250 ml", sticker: "250 ml" },
        "300": { price: 1000, detail: "pote de 300 ml", label: "300 ml", sticker: "300 ml" }
      }
    },
    caixa: {
      name: "Caixa de Morango",
      image: "assets/produto-caixa-morango.webp",
      note: "Caixa com 4 bandejas de morangos fresquinhos.",
      options: {
        medio: { price: 4000, detail: "4 bandejas • morango médio", label: "Morango médio", sticker: "a caixa" },
        grauda: { price: 4500, detail: "4 bandejas • morango graúdo", label: "Morango graúdo", sticker: "a caixa" }
      }
    }
  };

  const VARIANTS = {};
  Object.entries(CATALOG).forEach(([productId, product]) => {
    const flavors = product.flavors ? Object.keys(product.flavors) : [null];
    flavors.forEach((flavor) => {
      Object.entries(product.options).forEach(([optionKey, option]) => {
        const id = [productId, flavor, optionKey].filter(Boolean).join("-");
        const flavorLabel = flavor ? product.flavors[flavor] : null;
        VARIANTS[id] = {
          id,
          productId,
          name: product.name,
          image: product.image,
          price: option.price,
          detail: flavorLabel ? `${flavorLabel} • ${option.detail}` : option.detail,
          optionLabel: option.label,
          stickerLabel: option.sticker,
          flavor
        };
      });
    });
  });

  const selections = {
    salada: { size: "300" },
    overnight: { size: "300" },
    fruta: { flavor: "morango", size: "300" },
    caixa: { type: "medio" }
  };

  const DELIVERY_ZONES = {
    jesus: { label: "Jesus de Nazareth (Vitória)", fee: 0, confirmed: true, note: "Entrega grátis no bairro" },
    vitoria: { label: "Vitória — demais bairros", fee: 300, confirmed: true, note: "Taxa de Vitória" },
    metropolitana: { label: "Vila Velha / Serra / Cariacica", fee: 500, confirmed: true, note: "Região metropolitana" },
    outra: { label: "Outra localidade", fee: 0, confirmed: false, note: "A combinar no WhatsApp" }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const money = (cents) => {
    const [whole, decimal] = (cents / 100).toFixed(2).split(".");
    return `R$ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`;
  };

  const waUrl = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  const openWhatsApp = (message) => {
    const link = document.createElement("a");
    link.href = waUrl(message);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getCurrentVariant = (productId) => {
    const chosen = selections[productId];
    if (!chosen) return null;
    let id;
    if (productId === "fruta") id = `fruta-${chosen.flavor}-${chosen.size}`;
    else if (productId === "caixa") id = `caixa-${chosen.type}`;
    else id = `${productId}-${chosen.size}`;
    return VARIANTS[id] || null;
  };

  const directMessage = (variant) => {
    const product = CATALOG[variant.productId];
    const lines = [
      "Olá, Suafruti! 😊",
      `Quero pedir 1x ${variant.name} (${variant.detail}) — ${money(variant.price)}.`
    ];
    if (product.fruits) lines.push(`Frutas: ${product.fruits}.`);
    if (product.addons) lines.push(`Adicionais disponíveis: ${product.addons}.`);
    if (product.note) lines.push(product.note);
    lines.push("Podem confirmar disponibilidade, adicionais, taxa de entrega e prazo?");
    return lines.join("\n");
  };

  const refreshCard = (card) => {
    const productId = card.dataset.productId;
    const variant = getCurrentVariant(productId);
    if (!variant) return;

    const priceEl = $("[data-product-price]", card);
    const unitEl = $("[data-product-unit]", card);
    if (priceEl) priceEl.textContent = money(variant.price).replace("R$ ", "");
    if (unitEl) unitEl.textContent = variant.stickerLabel;

    const addButton = $("[data-add]", card);
    if (addButton) addButton.dataset.add = variant.id;

    const waLink = $("[data-product-wa]", card);
    if (waLink) {
      waLink.href = waUrl(directMessage(variant));
      waLink.setAttribute("aria-label", `Pedir ${variant.name} (${variant.detail}) pelo WhatsApp`);
    }

    $$("[data-option-group]", card).forEach((group) => {
      const groupKey = group.dataset.optionGroup;
      const selected = selections[productId] ? selections[productId][groupKey] : null;
      $$("[data-option]", group).forEach((button) => {
        const active = button.dataset.option === selected;
        button.classList.toggle("is-selected", active);
        button.setAttribute("aria-pressed", String(active));
      });
    });
  };

  const readCart = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      const clean = {};
      Object.entries(parsed).forEach(([id, qty]) => {
        if (!VARIANTS[id] || !Number.isFinite(Number(qty))) return;
        const safeQty = Math.max(1, Math.min(MAX_QTY, Math.round(Number(qty))));
        if (safeQty > 0) clean[id] = safeQty;
      });
      return clean;
    } catch {
      return {};
    }
  };

  let cart = readCart();

  const saveCart = () => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* O pedido continua funcionando mesmo sem armazenamento local. */
    }
  };

  const getCount = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const getTotal = () => Object.entries(cart).reduce((sum, [id, qty]) => sum + VARIANTS[id].price * qty, 0);

  const cartItems = $("#cart-items");
  const cartSubmit = $(".cart-submit");
  const cartClear = $("[data-clear-cart]");
  const mobileCartBar = $("#mobile-cart-bar");
  const toast = $("#toast");
  const cartForm = $("#cart-form");
  const addressField = $("#address-field");
  const addressInput = $("#customer-address");
  const deliveryDetails = $("#delivery-details");
  const zoneSelect = $("#delivery-zone");
  let toastTimer;

  const getDeliveryInfo = () => {
    const mode = $('input[name="delivery"]:checked')?.value || "A combinar";

    if (mode === "Retirada") {
      return { mode, zone: null, fee: 0, confirmed: true, label: "Retirada", note: "Sem taxa de entrega", feeLabel: "Não se aplica" };
    }
    if (mode === "A combinar") {
      return { mode, zone: null, fee: 0, confirmed: false, label: "A combinar", note: "A combinar no WhatsApp", feeLabel: "A combinar" };
    }

    const zoneKey = zoneSelect ? zoneSelect.value : "";
    const zone = DELIVERY_ZONES[zoneKey];
    if (!zone) {
      return { mode, zone: null, fee: 0, confirmed: false, label: "Região não informada", note: "Escolha a região da entrega", feeLabel: "A combinar" };
    }
    return {
      mode,
      zone: zoneKey,
      fee: zone.fee,
      confirmed: zone.confirmed,
      label: zone.label,
      note: zone.note,
      feeLabel: !zone.confirmed ? "A combinar" : zone.fee === 0 ? "Grátis" : money(zone.fee)
    };
  };

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
  };

  const renderCartItems = () => {
    const entries = Object.entries(cart).filter(([id, qty]) => VARIANTS[id] && qty > 0);

    if (!entries.length) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <svg aria-hidden="true"><use href="#icon-bag"></use></svg>
          <strong>Sua sacolinha está vazia</strong>
          <p>Que tal escolher um pote de 250 ml, de 300 ml ou uma caixa de morangos?</p>
          <button type="button" data-browse-products>Ver o cardápio</button>
        </div>`;
      return;
    }

    cartItems.innerHTML = entries.map(([id, qty]) => {
      const variant = VARIANTS[id];
      return `
        <article class="cart-item">
          <img src="${variant.image}" alt="" width="64" height="64">
          <div class="cart-item-info">
            <strong>${variant.name}</strong>
            <span>${variant.detail}</span>
            <b>${money(variant.price * qty)}</b>
          </div>
          <div class="cart-item-controls">
            <div class="qty-control" aria-label="Quantidade de ${variant.name} (${variant.detail})">
              <button type="button" data-qty="${id}" data-delta="-1" aria-label="Diminuir quantidade de ${variant.name}">
                <svg aria-hidden="true"><use href="#icon-minus"></use></svg>
              </button>
              <span>${qty}</span>
              <button type="button" data-qty="${id}" data-delta="1" aria-label="Aumentar quantidade de ${variant.name}">
                <svg aria-hidden="true"><use href="#icon-plus"></use></svg>
              </button>
            </div>
            <button class="cart-item-remove" type="button" data-remove="${id}">remover</button>
          </div>
        </article>`;
    }).join("");
  };

  const updateCartUI = () => {
    const count = getCount();
    const subtotal = getTotal();
    const delivery = getDeliveryInfo();
    const grandTotal = subtotal + delivery.fee;
    const hasItems = count > 0;
    const itemLabel = `${count} ${count === 1 ? "item" : "itens"}`;

    $$("[data-cart-count]").forEach((el) => {
      el.textContent = String(count);
      el.classList.toggle("is-empty", !hasItems);
    });
    $$("[data-cart-count-mobile]").forEach((el) => { el.textContent = String(count); });
    $$("[data-cart-total]").forEach((el) => { el.textContent = money(subtotal); });
    $$("[data-cart-fee]").forEach((el) => { el.textContent = delivery.feeLabel; });
    $$("[data-fee-note]").forEach((el) => { el.textContent = delivery.note; });
    $$("[data-cart-grand-total]").forEach((el) => { el.textContent = money(grandTotal); });
    $$("[data-cart-total-mobile]").forEach((el) => { el.textContent = money(grandTotal); });
    $$("[data-cart-count-text]").forEach((el) => { el.textContent = itemLabel; });

    if (mobileCartBar) {
      mobileCartBar.classList.toggle("has-items", hasItems);
      mobileCartBar.setAttribute("aria-hidden", String(!hasItems));
      mobileCartBar.inert = !hasItems;
    }
    if (cartSubmit) cartSubmit.disabled = !hasItems;
    if (cartClear) cartClear.disabled = !hasItems;

    renderCartItems();
  };

  const addToCart = (id) => {
    const variant = VARIANTS[id];
    if (!variant) return;
    const next = Math.min((cart[id] || 0) + 1, MAX_QTY);
    if (next === cart[id]) {
      showToast(`Limite de ${MAX_QTY} unidades por opção.`);
      return;
    }
    cart[id] = next;
    saveCart();
    updateCartUI();
    showToast(`${variant.name} (${variant.optionLabel}) entrou na sacolinha!`);

    const bagButton = $(".bag-button");
    if (bagButton) {
      bagButton.classList.remove("bag-pop");
      void bagButton.offsetWidth;
      bagButton.classList.add("bag-pop");
    }
  };

  const changeQty = (id, delta) => {
    if (!VARIANTS[id]) return;
    const next = Math.min((cart[id] || 0) + delta, MAX_QTY);
    if (next <= 0) delete cart[id];
    else cart[id] = next;
    saveCart();
    updateCartUI();
  };

  const removeItem = (id) => {
    if (!cart[id]) return;
    delete cart[id];
    saveCart();
    updateCartUI();
    showToast("Item removido da sacolinha.");
  };

  const clearCart = () => {
    if (!getCount()) return;
    cart = {};
    saveCart();
    updateCartUI();
    showToast("Sacolinha esvaziada.");
  };

  /* Links de WhatsApp com mensagens prontas e específicas. */
  $$('[data-default-wa]').forEach((link) => { link.href = waUrl(DEFAULT_MESSAGE); });
  $$('.product-card').forEach(refreshCard);

  /* Filtros do cardápio. */
  const filterButtons = $$(".filter");
  const productCards = $$(".product-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      productCards.forEach((card) => {
        const visible = filter === "todos" || card.dataset.category === filter;
        card.hidden = !visible;
        if (visible) card.classList.add("is-visible");
      });
    });
  });

  /* Menu mobile. */
  const nav = $("#primary-nav");
  const menuToggle = $(".menu-toggle");

  const setMenu = (open) => {
    if (!nav || !menuToggle) return;
    nav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  };

  if (menuToggle) {
    menuToggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  }
  if (nav) {
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });
  }
  document.addEventListener("click", (event) => {
    if (!nav || !nav.classList.contains("is-open")) return;
    if (!event.target.closest(".nav") && !event.target.closest(".menu-toggle")) setMenu(false);
  });

  /* Sombra do cabeçalho ao rolar. */
  const header = $(".site-header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Animações de entrada. */
  const revealElements = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -35px 0px" });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  /* Sacolinha lateral. */
  const drawer = $("#cart-drawer");
  const backdrop = $("#cart-backdrop");
  const closeButton = $("[data-close-cart]");
  let cartOpen = false;
  let lastFocusedElement = null;

  if (drawer) drawer.inert = true;

  const openCart = () => {
    if (cartOpen || !drawer || !backdrop) return;
    lastFocusedElement = document.activeElement;
    cartOpen = true;
    backdrop.hidden = false;
    drawer.inert = false;
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => {
      backdrop.classList.add("is-open");
      drawer.classList.add("is-open");
    });
    setTimeout(() => closeButton && closeButton.focus(), 90);
  };

  const closeCart = () => {
    if (!cartOpen || !drawer || !backdrop) return;
    cartOpen = false;
    backdrop.classList.remove("is-open");
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    document.body.classList.remove("no-scroll");
    setTimeout(() => {
      if (!cartOpen) backdrop.hidden = true;
    }, 380);
    if (lastFocusedElement && document.contains(lastFocusedElement)) lastFocusedElement.focus();
  };

  if (backdrop) backdrop.addEventListener("click", closeCart);

  /* Campos de entrega e cálculo da taxa conforme a região. */
  const toggleAddress = () => {
    const selected = $('input[name="delivery"]:checked');
    const isDelivery = Boolean(selected && selected.value === "Entrega");

    if (deliveryDetails) deliveryDetails.hidden = !isDelivery;
    if (addressField) addressField.hidden = !isDelivery;
    if (zoneSelect) zoneSelect.required = isDelivery;
    if (addressInput) addressInput.required = isDelivery;
  };

  $$('input[name="delivery"]').forEach((input) => {
    input.addEventListener("change", () => {
      toggleAddress();
      updateCartUI();
    });
  });
  if (zoneSelect) zoneSelect.addEventListener("change", updateCartUI);
  toggleAddress();

  /* Envio do pedido completo para o WhatsApp. */
  if (cartForm) {
    cartForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!getCount()) {
        showToast("Adicione pelo menos um produto à sacolinha.");
        return;
      }

      const data = new FormData(cartForm);
      const name = String(data.get("customerName") || "").trim();
      const mode = String(data.get("delivery") || "A combinar");
      const address = String(data.get("customerAddress") || "").trim();
      const notes = String(data.get("customerNotes") || "").trim();
      const delivery = getDeliveryInfo();
      const grandTotal = getTotal() + delivery.fee;

      const lines = [
        "Olá, Suafruti! 😊",
        `Meu nome é ${name}.`,
        "Quero fazer o seguinte pedido pelo cardápio:"
      ];

      Object.entries(cart).forEach(([id, qty]) => {
        const variant = VARIANTS[id];
        if (variant && qty > 0) {
          lines.push(`• ${qty}x ${variant.name} — ${variant.detail} — ${money(variant.price * qty)}`);
        }
      });

      lines.push("");
      lines.push(`Subtotal dos produtos: ${money(getTotal())}`);
      lines.push(`Taxa de entrega: ${delivery.feeLabel}`);
      lines.push(`Total estimado: ${money(grandTotal)}`);
      lines.push(`Como receber: ${mode}`);
      if (mode === "Entrega") lines.push(`Região: ${delivery.label}`);
      if (mode === "Entrega" && address) lines.push(`Endereço: ${address}`);
      if (notes) lines.push(`Observações e adicionais: ${notes}`);
      lines.push("");
      lines.push("Podem confirmar disponibilidade, adicionais, valor da entrega e prazo? Obrigado(a)!");

      openWhatsApp(lines.join("\n"));
      showToast("Pedido pronto! Confirme os detalhes no WhatsApp.");
    });
  }

  /* Ações delegadas: opções, adicionar, quantidade, remover, abrir/fechar sacolinha. */
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const optionButton = target.closest("[data-option]");
    if (optionButton) {
      const group = optionButton.closest("[data-option-group]");
      const card = optionButton.closest(".product-card");
      if (group && card) {
        const productId = card.dataset.productId;
        const groupKey = group.dataset.optionGroup;
        if (selections[productId] && groupKey in selections[productId]) {
          selections[productId][groupKey] = optionButton.dataset.option;
          refreshCard(card);
        }
      }
      return;
    }

    const addButton = target.closest("[data-add]");
    if (addButton) {
      addToCart(addButton.dataset.add);
      return;
    }

    const qtyButton = target.closest("[data-qty]");
    if (qtyButton) {
      changeQty(qtyButton.dataset.qty, Number(qtyButton.dataset.delta));
      return;
    }

    const removeButton = target.closest("[data-remove]");
    if (removeButton) {
      removeItem(removeButton.dataset.remove);
      return;
    }

    if (target.closest("[data-clear-cart]")) {
      clearCart();
      return;
    }

    if (target.closest("[data-open-cart]")) {
      openCart();
      return;
    }

    if (target.closest("[data-close-cart]")) {
      closeCart();
      return;
    }

    if (target.closest("[data-browse-products]")) {
      closeCart();
      const menu = $("#cardapio");
      if (menu) menu.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  /* Teclado: fechar menus/sacolinha e manter o foco dentro do diálogo. */
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (cartOpen) closeCart();
      else if (nav && nav.classList.contains("is-open")) setMenu(false);
      return;
    }

    if (event.key !== "Tab" || !cartOpen || !drawer) return;
    const focusable = $$(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      drawer
    ).filter((element) => !element.closest("[hidden]"));

    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!drawer.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  });

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  updateCartUI();
})();
