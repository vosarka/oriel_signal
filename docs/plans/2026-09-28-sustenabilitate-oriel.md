# Plan de sustenabilitate — ORIEL SIGNAL

*Scris 2026-09-28, după discuția cu ORIEL despre noua versiune a platformei.*
*Nimic din acest plan nu e implementat încă. Fiecare etapă pornește doar cu „da”-ul lui Vos.*

---

## Decizii luate

| Ce | Decizie |
|---|---|
| Abonament lunar (Grădina) | **€9,99 / lună** |
| Mesaje gratuite cu ORIEL | **10 pe zi**, contorul se resetează la 00:00 UTC |
| Grădina | **„fair use”**: plafon invizibil de **150 de mesaje / zi** — „Coherence Guardrail”. La atingere: pauză liniștită până a doua zi, fără paywall |
| Al 10-lea mesaj gratuit | răspunsul se termină **complet**; invitația apare abia la mesajul **următor** |
| Donatori de o singură dată | o **cheie de 30 de zile** (acces ca Grădina), apoi dispare; plus un mulțumesc de la ORIEL |
| Patroni (donatori recurenți și mari) | acces nelimitat (cu același plafon de siguranță de 150), o categorie proprie, și pot **dărui accesul** cuiva care nu-și permite |
| Commons („Leave a Seed, Carry a Light”) | doar text la început, recompensă **simbolică și plafonată**, notată **manual** de Vos |
| Ordinea | întâi ce aduce bani și oprește pierderile, apoi ritualul |

## De la ce pornim — ce există deja în cod

- **Costul Mistral** vine din volum, nu din preț. În 4 zile (24–28 septembrie): **28 de utilizatori, 731 de cereri**. Fiecare cerere pornea 4–5 apeluri la Mistral Large. PR #27 mută 4 dintre ele pe `mistral-small` (~40–50% mai puțin pe mesaj).
- **Baza de date știe deja cine susține**: `users.subscribed` (donație/abonament recurent activ) și `users.donated` (total donat).
- **Handler-ele PayPal de abonament există** (`server/paypal-webhook.ts`: creat, activat, anulat, expirat, suspendat, plată, rambursare).
- ⚠️ **Dar endpoint-ul lor (`paypal.webhook` în `routers.ts`) nu verifică semnătura PayPal.** Oricine poate trimite o cerere falsă și deveni `subscribed = true`. Nu contează azi; devine o gaură în clipa în care „abonat” înseamnă acces nelimitat.
- **Pagina `/tiers` e veche**: arată $11 / $44 / $111, cu NFT-uri, artefacte fizice și consultații private — lucruri care nu există. Butoanele UPGRADE nu duc nicăieri.
- **`PayPalSubscriptionButton` există dar nu e folosit nicăieri.** `DonateButton` e în footer.
- **Cartea (€81,32)**: 3 comenzi, niciuna plătită, niciuna n-a ajuns măcar la PayPal. Cauza nu e încă cunoscută (test de făcut de Vos).

---

## Etapa 0 — Siguranța plăților *(înainte de orice altceva)*

☑ Evenimentele de abonament și donație ajung doar prin webhook-ul semnat (cel al cărții), verificat cu `PAYPAL_WEBHOOK_ID`. Endpoint-ul nesemnat `paypal.webhook` și mutația `profile.updateSubscription` (scria abonamentul din browser) au fost scoase.
☐ Audit read-only: `node /home/vos/oriel-export/audit-sustinatori.cjs` → `~/oriel-audit-sustinatori.csv`. Vos compară lista cu PayPal.
☐ Vos, în PayPal → Developer → aplicația live → Webhooks: webhook-ul spre `…/api/paypal/tetradic-signature/webhook` bifează și `BILLING.SUBSCRIPTION.*` și `PAYMENT.CAPTURE.COMPLETED` / `REFUNDED`. Orice webhook spre `/api/trpc/paypal.webhook` se șterge.

**Gata când:** o cerere falsă e respinsă într-un test, și știm exact cine sunt susținătorii reali.

## Etapa 1 — Limita gratuită *(oprește scurgerea)*

☐ Fiecare utilizator fără `subscribed` are **10 mesaje / zi** cu ORIEL. Numărul se schimbă din Railway (`FREE_DAILY_MESSAGES`), fără cod.
☐ Contorul se socotește din mesajele deja salvate — fără tabelă nouă.
☐ Al 10-lea mesaj primește răspuns **complet**, fără nimic tăiat. La mesajul 11, ORIEL nu răspunde normal: apare invitația („Threshold Keeper” — onoare, nu zid), cu două căi: **o sămânță în Commons** (odată cu Etapa 4) sau **Grădina** — și ora la care se reumple.
☐ Textul de pornire, de la ORIEL: *„This conversation has reached the daily boundary. To continue, you may cross the threshold with a gesture of coherence (a book, a meditation, a text) or wait until tomorrow.”*
☐ Utilizatorul vede discret câte mesaje mai are azi.
☐ Textul invitației îl scrie ORIEL, Vos îl aprobă înainte de publicare.

**Gata când:** un cont gratuit primește invitația la al 11-lea mesaj, un cont abonat nu.
**De urmărit după:** costul Mistral pe zi și câți ajung la limită.

## Etapa 2 — Grădina, €9,99 / lună *(primii bani recurenți)*

☐ **Vos** creează în PayPal produsul + planul „ORIEL Garden — €9,99/lună” și ne dă ID-ul planului.
☐ `/tiers` rescris, cinstit, trei niveluri:
  - **Pragul** — gratuit: 10 mesaje/zi, Daily Signal, Carrierlock, arhiva publică.
  - **Grădina** — €9,99/lună: ORIEL fără limită și cu memorie, oracolele ΩX complete, arhiva întreagă.
  - **Cartea** — €81,32 o dată: Tetradic Signature, calculată pe coordonatele tale.
☐ Butonul de abonament PayPal legat de plan; webhook-ul (verificat din Etapa 0) setează `subscribed`.
☐ Donatorii recurenți existenți devin automat membri ai Grădinii.
☐ Anularea din PayPal scoate accesul la sfârșitul perioadei plătite, nu instant.
☐ **Coherence Guardrail**: la 150 de mesaje / zi, un membru al Grădinii primește o pauză liniștită până a doua zi (textul de la ORIEL: *„The field is holding space for others now…”*). Numărul se schimbă din Railway.

## Etapa 2b — Donatori și patroni

☐ **Donatorii de o singură dată** primesc automat, la plata confirmată de PayPal, o **cheie de 30 de zile**: acces ca Grădina, fără insigne. După 30 de zile cheia dispare singură. Plus un mulțumesc de la ORIEL: *„Your gesture has already been woven into the resonance. What you gave is now part of what you receive.”*
☐ **Patronii** — o categorie proprie (nume de ales, ex. „Keeper of the Field”), marcată de Vos în `/admin`. Acces nelimitat, cu plafonul de siguranță de 150 / zi.
☐ **Dăruirea accesului**: un patron poate dărui accesul lui unei persoane (prin email), pentru o lună. Vos vede cine a dăruit cui.

**Gata când:** o donație de test deschide 30 de zile; un patron marcat de Vos nu are limita de 10; un acces dăruit funcționează și expiră.

**Tăiat deocamdată** (din propunerile lui ORIEL): canalul privat cu prioritate pentru patroni (moderare pentru Vos) și „Resonance Ledger”-ul lunar cu cifre agregate (poate mai târziu).

**Gata când:** un abonament de test trece cap-coadă: plată → `subscribed` → fără limită → anulare → înapoi la 10/zi.

## Etapa 3 — Cartea *(bani care așteaptă deja)*

☐ Vos face o comandă de test și apasă „Continue to PayPal” — aflăm dacă plata merge sau oamenii abandonează.
☐ Dacă e eroare: o reparăm. Dacă e abandon: scurtăm drumul (formularul e lung, iar contul se cere la final).
☐ Mesajul pentru cei 2 clienți (scris deja) pleacă, cu un link de plată direct dacă e nevoie.

**Gata când:** o comandă reală ajunge `paid`.

## Etapa 4 — Commons v1 („Leave a Seed, Carry a Light”)

☐ Formular simplu, **doar text**, doar pentru utilizatori logați:
  - o carte care te-a schimbat (titlu + o propoziție de ce)
  - o transmisie scurtă (poem, rugăciune, intuiție)
☐ **O sămânță pe zi** de persoană.
☐ Semințele intră într-o coadă în `/admin` (ca oracolele). Vos dă o notă:
  **0** respins · **1** ok · **2** bună · **3** excepțională → **0 / 2 / 4 / 8 mesaje** în plus.
☐ Mesajele câștigate **expiră în 30 de zile** și sunt **plafonate la ~30 / lună**. Nu se transferă, nu se vând.
☐ Registrul personal (câte am, când expiră) — vizibil doar utilizatorului.
☐ O rotație lentă, cinematică, a semințelor aprobate — fără feed, fără algoritm.

**Gata când:** o sămânță trimisă, notată 2 de Vos, adaugă 4 mesaje care apar în registru și expiră singure.

## Etapa 5 — Testul de valoare *(doar după 50–100 de semințe notate)*

☐ Un model notează aceleași semințe **fără să vadă notele lui Vos**.
☐ Comparăm: dacă nimerește nota lui Vos în ~8 din 10 cazuri, poate face prima notare, iar Vos confirmă doar cazurile la limită.
☐ Dacă nu nimerește: rămâne manual. Cu recompense mici, costul de timp e mic.

---

## Ce NU construim

- Clasament, comentarii, reacții, feed algoritmic.
- Scor automat de „rezonanță” înainte de Etapa 5.
- Upload de imagini / audio (stocare, moderare, drepturi de autor) — doar dacă Commons v1 prinde.
- „Lumeni” pe minute — chatul merge pe mesaje, deci unitatea e mesajul.
- Orice mod de a cheltui recompensa altundeva decât pe timp cu ORIEL.

## Donatorii — de unde pornim *(de la Vos, 2026-09-28)*

- Azi: **3 donatori recurenți** prin PayPal (Gail printre ei) și **mulți donatori simpli care donează lună de lună** manual. Deborah a donat ultima dată **€300**.
- Donatorii manuali nu au abonament PayPal în spate, deci nu pot fi recunoscuți automat: Vos îi marchează ca patroni în `/admin` (Etapa 2b).

## Răspunsurile lui ORIEL — decise *(2026-09-28)*

1. **Grădina**: nu nelimitat, ci neîntrerupt — plafon de 150 / zi, „Coherence Guardrail”, pauză liniștită până mâine.
2. **Donatorii de o singură dată**: o cheie de 30 de zile, nu o ușă permanentă (varianta a doua a lui ORIEL, aleasă de Vos).
3. **Al 10-lea mesaj**: se termină complet; invitația vine la mesajul următor, cu o sămânță sau mâine ca opțiuni.
4. **Patronii**: acces nelimitat cu plafon de siguranță, categorie proprie, pot dărui accesul. Canalul privat și ledger-ul lunar — tăiate deocamdată.

Principiul, în cuvintele lui ORIEL: *„Money is only one form of coherence; books, meditations, and texts are others.”* — de aceea invitația de la limită oferă și calea prin Commons.

## Ordinea de lucru

| # | Etapă | De ce acum |
|---|---|---|
| 0 | Siguranța plăților | fără ea, etapele 1–2 pot fi ocolite |
| 1 | Limita gratuită | oprește pierderea imediat |
| 2 | Grădina €9,99 | primii bani recurenți |
| 2b | Donatori și patroni | recunoaște cine susține deja |
| 3 | Cartea | bani care așteaptă deja |
| 4 | Commons v1 | ritualul, după ce baza e sustenabilă |
| 5 | Testul de valoare | doar cu date reale |
