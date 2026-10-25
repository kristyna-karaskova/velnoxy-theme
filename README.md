# Velnoxy theme (fork Dawn 16.0.0)

Čistý fork Shopify Dawn 16.0.0 s designem v3 (DM Sans, bílá, teal #2DD4BF) a cart drawerem podle Shrine.
Všechno, co je navíc oproti Dawn, má prefix `vx`.

## Co je uvnitř

| Soubor | Co dělá |
|---|---|
| `snippets/cart-drawer.liquid` | Cart drawer: `Cart • N items`, odpočet rezervace, progress bar s cíli (doprava / dárek), přeškrtnutá cena + „You save“ u každé položky, názvy bundlů místo „1/2/3“, štítky slev (Kaching gift), řádek Savings, trust řádek, platební ikony |
| `assets/vx-cart-drawer.css` | Styl draweru |
| `assets/vx.css` | Design tokeny + styly všech `vx-` sekcí, styl pro Kaching Bundles a sticky lištu |
| `assets/vx.js` | Odpočet, počítadlo v košíku, odhad doručení, sticky add to cart, tlačítka „Choose …“ → výběr Kaching bundlu, FAQ hledání, záložky politik |
| `snippets/vx-product-block.liquid` | Nové bloky do Product information: rating, lead + benefity, oddělovač, trust řádek, mini recenze, odhad doručení |
| `snippets/vx-sticky-atc.liquid` | Sticky lišta. Nepřidává do košíku sama, kliká na skutečné tlačítko formuláře, takže Kaching dál funguje |
| `sections/vx-*.liquid` | 22 sekcí (hero, pain, card grid, mechanism, product reveal, steps, UGC, comparison, honest fit, timeline, offer, FAQ, CTA band, reviews, trust strip, featured product, founder, FAQ page, contact, track, policies, footer) |
| `templates/*.json` | Produkt, homepage, `page.faq`, `page.contact`, `page.track`, `page.policies` už poskládané s texty z v3 |
| `config/settings_schema.json` | Nová skupina **Velnoxy · Cart drawer** |

Úpravy původních souborů Dawn (kvůli budoucím aktualizacím Dawn):
- `sections/main-product.liquid`: jeden řádek `when 'vx_…'`, render sticky lišty, nové bloky + 2 nastavení ve schématu
- `layout/theme.liquid`: načtení `vx.css` a `vx.js`
- `config/settings_data.json`: barvy, fonty, zaoblení, typ košíku = drawer

## Instalace

1. Online Store → Themes → **Add theme → Upload zip file** → `velnoxy-theme.zip`. Shrine nech zatím publikovaný.
2. U nového theme **Customize** a projdi checklist níž.
3. Až je všechno ověřené přes Preview na mobilu, publikuj. Shrine zůstane jako záloha (rollback na 1 klik).

## Checklist po nahrání

**Appky (Theme settings → App embeds)**: zapni embedy Kaching Bundles, CWILL Reviews (Trustoo), Klaviyo, Microsoft Clarity, Parcel Panel. Meta Pixel jede přes appku Facebook & Instagram, theme ho neřeší.

**Produkt**
- [ ] Do bloku *Product information* přidej app blok **Kaching Bundles** hned pod blok *VX · Divider label* (nad *Buy buttons*). Nativní *Variant picker* je v šabloně vypnutý, protože bundly vybírá Kaching.
- [ ] Do sekce **VX · Reviews (app)** (id `reviews`) přidej app blok Trustoo.
- [ ] Nahraj fotky: *VX · Pain / hook* (bez before/after a bez detailů kůže), *VX · Product reveal* (reálný kus), *VX · How to use* (3 kroky), *VX · Real routines* (3 skutečné zákaznice se souhlasem).
- [ ] Projdi texty se značkou `[confirm …]` / `[Name]` a doplň reálná data, nebo je smaž.
- [ ] Ověř na mobilu: výběr bundlu → Add to cart → drawer → Checkout. Totéž přes sticky lištu a přes tlačítka „Choose …“ v sekci Offer.

**Košík (Theme settings → Velnoxy · Cart drawer)**
- [ ] *Bundle names by variant title*: `1: Device Only`, `2: The Essential Kit`, `3: The Full Ritual` (už nastaveno).
- [ ] Cíle progress baru: $40 doprava zdarma, $140 dárek. **Dárek musí reálně existovat** (Kaching / automatická sleva), lišta jen ukazuje postup.
- [ ] Odpočet: výchozí chování po vypršení = zpráva. V Shrine se odpočet donekonečna restartuje, to jde zapnout volbou *Restart the countdown*, ale je to fake urgency.

**Stránky a menu**
- [ ] Stránka FAQ → šablona `page.faq`, Contact → `page.contact`.
- [ ] Nová stránka „Policies“ → šablona `page.policies` (texty se berou ze Settings → Policies; odkazy `#refund`, `#shipping`, `#privacy`, `#terms`).
- [ ] Track: buď nech odkaz `/apps/parcelpanel` (Parcel Panel stránka), nebo vytvoř stránku se šablonou `page.track` a do ní vlož Parcel Panel app blok. Zkontroluj názvy parametrů formuláře v Parcel Panel nastavení.
- [ ] Header: menu `main-menu` (Home, Shop Now, FAQ, Contact). Footer: menu sloupce *Support* a *Legal* vyber v sekci *VX · Footer*.

## Co nebylo možné otestovat mimo Shopify

Sekce a cart drawer jsou vyrenderované lokálně (liquidjs + mock data) a zkontrolované na 390 px a 1440 px, `shopify theme check` bez chyb.
Skutečné chování s Kachingem (sticky lišta, „Choose …“ tlačítka), Trustoo metafieldy u ratingu a Parcel Panel je potřeba ověřit v Preview na živém obchodě.
