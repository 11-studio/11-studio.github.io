# Ferragatti — sito (demo 2)

Quattro pagine statiche, senza dipendenze e senza build. Si apre e
funziona.

> **Cosa cambia rispetto a `FRONTEND/1`.** Solo il marchio. Qui è la
> firma calligrafica ovunque: nella barra, in apertura, nel piede, sul
> cartello mobile e in cima alle pagine di ritorno. In `1` l'insegna
> grande è ancora `FERRAGATTI` scritto in maiuscoletto a tutta
> larghezza. Tutto il resto — sezioni, colori, script, contenuti — è
> identico nelle due cartelle.

```
ferragatti/
├── index.html              home — l'apertura e le quattro sezioni
├── collezione/index.html   la vetrina — solo fotografie, nessuna scritta
├── blog/index.html         il giornale — sommario dei pezzi
├── shop/index.html         lo store — capi, prezzi, stato del drop
├── privacy/index.html      l'informativa
├── iscrizione/             i sei esiti dell'iscrizione (vedi in fondo)
├── 404.html                indirizzo sbagliato
├── assets/
│   ├── css/style.css       stili, token dei due toni, componenti
│   ├── js/site.js          intestazione, segnaposto, rivelazioni, newsletter
│   ├── js/snap.js          aggancio delle sezioni (solo home)
│   ├── js/clip.js          clip di apertura + stand-in WebGL (solo home)
│   ├── fonts/              non più in uso — vedi LEGGIMI.txt lì dentro
│   ├── media/              ← qui va il video (vedi sotto)
│   └── img/                ← qui vanno le fotografie
└── README.md
```

## Le quattro pagine

Ogni pagina interna è una cartella con dentro un `index.html`, e non
un file `shop.html`: è il modo in cui si ottengono indirizzi puliti
senza nessun server e senza nessuna regola di riscrittura.

| Cartella | Indirizzo | Cosa c'è |
| --- | --- | --- |
| `/` | `dominio.it/` | l'apertura, chi siamo, il cartamodello, la campagna, la lettera |
| `collezione/` | `dominio.it/collezione/` | tre fotografie a piena schermata, e nient'altro |
| `blog/` | `dominio.it/blog/` | il sommario del giornale |
| `shop/` | `dominio.it/shop/` | i capi, i prezzi, lo stato del drop |

**Due pagine su tre non hanno una testata**, e non è una svista.
La vetrina apre sulla fotografia, lo store apre sulla merce: chi ci
arriva sa già dov'è — glielo dicono la barra, la scheda del browser
e l'indirizzo — e una schermata di presentazione prima della cosa
per cui si è venuti è solo una schermata da scorrere. Il giornale la
tiene perché lì la testata *è* il contenuto: un sommario ha bisogno
di dire di che testata è il sommario.

**Il titolo però c'è lo stesso, solo che non si vede.** Su vetrina e
store è un `<h1 class="vh">` fuori vista. Chi naviga per titoli con
un lettore di schermo altrimenti non troverebbe niente, e una pagina
senza `h1` è una pagina senza nome per chi l'insegna non la vede.
Non è la classe `.skip`: quella riappare quando prende il fuoco,
perché è un collegamento da usare — un titolo il fuoco non lo prende
mai, quindi non deve riapparire nulla.

**La collezione non ha una testata, ed è la sua definizione.**
Niente titolo di pagina, niente occhiello, niente scheda prodotto: è
la vetrina, non il negozio. Prezzi e taglie stanno nello store, che è
il posto in cui uno li cerca.

Ogni pezzo è una fotografia a piena schermata e, subito sotto, due
voci che non si somigliano:

| | |
|---|---|
| **la riga** (`.piece-say`) | una frase sola, a corpo di sottotitolo, sul dettaglio che quel capo *è*. Non descrive la fotografia — quella si vede — dice perché il pezzo esiste. Porta il filetto d'oro dell'attacco, lo stesso della sezione «cura del dettaglio» in home, perché è la stessa figura: un'affermazione |
| **le note** (`.piece-tech`) | come è fatto, nella lingua del cartiglio del cartamodello: dicitura in maiuscolo spaziato, valore in tondo, nessun aggettivo. Sono la prova che regge la riga sopra |

Due registri opposti a fianco a fianco. È l'impianto di tutto il
sito — l'affermazione, e sotto le prove che la tengono in piedi —
applicato al singolo capo, e va rispettato scrivendone di nuovi: se
la riga diventa una descrizione o le note prendono un aggettivo, si
sono confuse le due voci e la pagina torna a essere un catalogo.

Restano `<title>` e `og:` nel `<head>`: non sono scritte della
pagina, sono come la pagina si presenta altrove — nella scheda del
browser, nei risultati di ricerca, in un link condiviso. Toglierli
non renderebbe la vetrina più muta, la renderebbe introvabile.

**L'`alt` non è la riga, e non la ripete.** La riga dice perché il
pezzo esiste, l'`alt` dice cosa si vede. Chi la fotografia non la
vede li riceve tutti e due: se dicono la stessa cosa, ne ha ricevuto
uno solo.

**Non è una SPA, ed è una scelta.** Una single-page application
avrebbe voluto un router in JavaScript e un `404.html` che rimbalza
ogni indirizzo alla radice per far funzionare i collegamenti
diretti. Le pagine statiche fanno la stessa cosa senza niente di
tutto questo: ogni indirizzo è un file vero, si apre senza
aspettare JavaScript e si indicizza da solo.

**Tutti i percorsi sono relativi, con una sola eccezione.** Nel menu
di una pagina interna lo store è `../shop/`, non `/shop/`. È quello
che tiene le pagine spostabili in blocco: funzionano sulla radice di
un dominio e aperte con un doppio clic da disco.

L'eccezione è **`/api/`**, il modulo di iscrizione, e ha cambiato una
cosa: `/api/` non è un file del sito ma una rotta che nginx monta
sulla radice del dominio, quindi non si sposta insieme alle pagine.
**Il sito vuole ora la radice di un dominio suo.** In una
sottocartella — che era il caso di GitHub Pages — le pagine si
vedrebbero e l'iscrizione no, ed è il motivo per cui la destinazione
è diventata una VPS e non è più Pages.

### Le due andature

Il sito si muove in due modi, e vanno tenuti separati.

**La home è un sipario**: sezioni alte una schermata, un gesto una
sezione. La governa `snap.js`.

**Le pagine interne si scorrono e basta**, dall'alto in basso, e
**non caricano `snap.js`**. Non è una dimenticanza: `snap.js`
intercetta la rotella e la traduce in salti fra fermate ricavate da
`.hero`, `.band` e `footer`. Su una pagina che di fermate ne
produrrebbe due — o nessuna, come la vetrina, che è fatta di
`.look` — significherebbe una pagina che non scorre.

Fra le tre, la vetrina è quella che al sipario somiglierebbe di più:
una fotografia per schermata è esattamente un gesto una schermata.
Se un domani la si volesse agganciata, la strada è aggiungere
`snap.js` **e** far entrare `.look` nel selettore delle fermate —
non una cosa sola delle due.

Per la stessa ragione le sezioni interne si chiamano `.sheet` e non
`.band`: `.band` è il selettore del sipario, e due cose che si
comportano in modo opposto non devono portare lo stesso nome.

Tutto il resto è in comune e non è duplicato: i token dei due toni,
l'intestazione, il piede, il marchio, i caratteri, i riquadri
segnaposto e il cartello del cantiere.

### Come ci si arriva

**La barra dice le sezioni della home, non l'indice del sito.** Tre
ancore — Chi siamo, Progetto, Collezione — più l'invito allo store.
È identica su tutte e quattro le pagine; nelle pagine interne le
ancore hanno `../` davanti e riportano a casa, atterrando sulla
sezione giusta.

«Collezione» porta a `#terza`, la sezione della campagna, **e non
direttamente a `collezione/`**: chi clicca arriva sulla sezione che
la mostra e da lì decide. Una barra che porta fuori dalla pagina al
primo clic si porta via anche l'apertura.

Alle pagine interne si arriva quindi da tre strade, e nessuna è la
barra:

| Pagina | Da dove |
| --- | --- |
| `collezione/` | l'invito nella sezione della campagna (`#terza`) |
| `blog/` | l'invito «Leggi il blog» nella sezione di Cristiano |
| `shop/` | il pulsante store della barra, l'invito dell'apertura, gli inviti in fondo alle pagine interne |

E da tutte, sempre, la colonna «Pagine» del piede: è lì che sta la
navigazione di servizio, che è il suo posto.

### Aggiungere una pagina

1. Una cartella con dentro `index.html`, copiando l'ossatura di
   `blog/index.html`: `.hold` del cantiere, `<header class="nav">`,
   `<main>`, il piede, e in fondo il solo `site.js`.
2. La barra **non si tocca**: continua a dire le sezioni della home.
   La pagina nuova si raggiunge da un invito nel punto in cui ha
   senso invitarci, e dalla colonna «Pagine» del piede.
3. Quella voce del piede va aggiunta **in tutte le pagine**. Sono
   quattro posti: è il prezzo di un sito senza compilazione, e si
   paga volentieri finché le pagine sono quattro. Oltre, conviene il
   porting descritto in fondo.
4. `aria-current="page"` va solo su una voce del menu che sia
   davvero quella pagina — oggi capita al solo pulsante store, nello
   store.
5. **Un `h1` per pagina, sempre.** Se la pagina ha una testata
   scritta è quello il suo `h1`; se non ce l'ha, va messo un
   `<h1 class="vh">` fuori vista. Una pagina senza `h1` non è una
   pagina più pulita, è una pagina senza nome.
6. **La barra è fissa**, quindi la prima sezione deve scostarsene.
   Se è una `.sheet` lo fa da sola (la regola sta in cima alla
   sezione PAGINE INTERNE); se invece apre con un'immagine a piena
   schermata, sotto la barra ci deve passare apposta e non va
   scostata.

## Provvisorio: il cantiere su schermo stretto

**Sotto i 900 px il sito non si mostra.** Al suo posto va un cartello
— marchio, «Mobile in costruzione», la data del drop — e tutto il
resto della pagina esce con `display: none`, quindi anche dal giro del
tab e dai lettori di schermo.

Non è un limite tecnico: l'impilamento a sipario e gli agganci
funzionano già su telefono, e restano nel codice. È una scelta di
opportunità — meglio dire che la versione stretta non è pronta che
mostrarla mezza impaginata.

La soglia è scritta in tre posti, e sono tre perché due sono guardie
che spengono lavoro inutile dietro al cartello:

| Dove | Cosa fa |
| --- | --- |
| `style.css`, sezione **CANTIERE** | nasconde il sito e disegna il cartello |
| `snap.js`, `wideMQ` | non accende sipario e agganci: non c'è niente da misurare |
| `clip.js` | non apre WebGL né il video: batteria e dati per niente |

Il cartello sta su **tutte e quattro le pagine**, con lo stesso
blocco `.hold`. Deve restare così: un sito che su telefono mostra il
cartello in home e la pagina vera sullo store sarebbe peggio di
entrambe le scelte.

**Per smontarlo** quando la versione stretta sarà pronta: via la
sezione `CANTIERE` dal foglio di stile, via il blocco `.hold` dalle
quattro pagine, via le due guardie nei due moduli. Nient'altro da
riaccendere.

## Il carattere

Uno solo: **Helvetica Neue**, presa dal sistema operativo — più un
corsivo, in un punto solo, per la firma (sotto). Niente `@font-face`,
niente file da scaricare, niente CDN: il sito non porta caratteri
con sé.

```
--font: "Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif;
```

Helvetica Neue è installata su ogni Mac e ogni iPhone. Dove non c'è,
**Arial ne condivide le metriche** — stesse larghezze di avanzamento,
maiuscole a 0,716 em contro 0,714 — e ne prende il posto senza
spostare una riga. Su Linux la coda dello stack chiama Liberation
Sans, a sua volta metricamente compatibile con Arial. È la ragione
per cui qui la sostituzione di sistema, che di solito è una
scorciatoia da evitare, non lo è.

**Non è una scelta originale, ed è il punto.** Il grottesco neutro è
il carattere delle case che non hanno bisogno di farsi riconoscere
dalle lettere: la forma non dice niente, così a parlare restano le
fotografie, le misure e il bianco. Un carattere «caratteristico» è un
carattere a cui si sta chiedendo di fare il lavoro della collezione.

**Due pesi in tutto**, e non uno di più:

| Peso | Dove |
|---|---|
| **400** | testo corrente e titoli |
| **500** | diciture in maiuscolo |

Il 600 in Helvetica Neue non esiste: chiederlo vuol dire farsi dare
il Bold o un finto grassetto disegnato dal browser. Dove c'era, è
sceso a 500.

**Niente corsivo, con un'eccezione.** L'obliquo di Helvetica non è un
disegno a sé ma il tondo inclinato a macchina, e a corpo di titolo si
vede che è una scorciatoia. Gli accenti dentro i titoli restano
quindi in tondo e si distinguono con l'oro. Niente monospaziato, per
lo stesso motivo di prima: serve a incolonnare codice, e qui non c'è
codice.

L'eccezione è **la firma** sotto il ritratto, che non è tipografia di
sistema ma un segno — sta al posto di una mano in fondo a una
lettera, e quel lavoro lo fa il corsivo. Con l'obliquo di Helvetica
non si può fare: proprio lì, dove tutto il senso è che sembri scritto
a mano, si vedrebbe che è meccanico. Prende quindi un corsivo vero,
con le grazie, da un token che compare in **un punto solo** del
foglio — se ne trovate un secondo, è un errore:

```
--font-sign: "Iowan Old Style", "Palatino Linotype", Palatino,
             "Book Antiqua", Georgia, "Times New Roman", serif;
```

Anche qui niente da scaricare: Iowan Old Style e Palatino stanno sui
Mac, Palatino Linotype e Book Antiqua su Windows, Georgia dappertutto.
Hanno tutti un corsivo disegnato e non sintetizzato, e sono tutti
garaldi o di derivazione — la stessa voce che la firma aveva prima.
Un secondo carattere usato una volta sola non è un accostamento da
governare: è un logotipo.

**Una sola spaziatura del maiuscolo**, in `:root`, e vale per ogni
dicitura. Tararle una per una a occhio, da .08 a .19 secondo il posto,
è il gesto che fa sembrare un sito un esercizio di tipografia invece
che un sito.

| Token | Valore | Dove |
|---|---|---|
| `--track-caps` | `.08em` | ogni dicitura in maiuscolo |

In questa demo il marchio non è mai scritto, quindi la spaziatura
larga che gli serviva — `--track-mark`, `.19em` — non esiste più. Sta
in `FRONTEND/1`, dove l'insegna è ancora la parola.

L'unica eccezione sono le diciture dentro il cartamodello: lì non
sono elementi di interfaccia ma segni di un disegno tecnico, a 9 px
sul fondo, e tengono una spaziatura loro.

**I titoli stringono.** Helvetica è disegnata e spaziata per il corpo
del testo: sopra i 40 px circa gli intervalli si aprono e la parola
si sfilaccia, quindi più il corpo è grande più la crenatura è
negativa — da −.010 em sui titoli minori a −.024 em sull'h1 di
pagina. Si tara sul corpo massimo del `clamp()`, non sul minimo.

**Il maiuscolo si usa con parsimonia.** Solo dove una dicitura fa da
insegna: navigazione, pulsanti, testate di colonna, cartiglio del
cartamodello. Note, didascalie, ruoli e legali stanno in tondo
minuscolo. La scala è documentata in cima al foglio di stile.

**Il marchio non è tipografia: è un disegno.** Non c'è nessun corpo da
calcolare, nessuna spalla laterale da compensare, nessun `textLength`
da rifare cambiando carattere — il segno è la firma, e si scala. Le
uniche due misure che lo riguardano sono il rapporto del riquadro
(`451.8 / 184.08`, cioè il `viewBox` del ritaglio) e il tetto
all'altezza dell'insegna in apertura (`172vh`), tutte e due in
`style.css`.

Il conto tipografico della parola — avanzamento delle dieci lettere,
spalle di F e I, altezza delle maiuscole — vale per `FRONTEND/1`, ed è
documentato lì.

## Aprirlo

Doppio clic su `index.html`. Funziona anche così, ma per lavorarci
conviene un server locale (il `file://` si comporta in modo strano
con alcune cose):

```bash
cd ~/Desktop/gd/ferragatti
python3 -m http.server 8080
# poi: http://localhost:8080
```

## I video — regole generali

> ⚠ **Questa sezione è più recente del resto del capitolo sui media.**
> Il piano è cambiato: i video saranno **almeno due**, non uno. Quante
> pagine ne portino e quali resta da decidere, e finché non lo è, il
> resto del capitolo va letto come riferito al solo hero.

**Un solo video con `preload="auto"`, e deve essere l'hero.** È a
tutto schermo e parte subito, quindi va scaricato subito. Ogni altro
video vuole `preload="none"` e va caricato quando entra in campo — il
sito ha già un `IntersectionObserver` per le rivelazioni in
`site.js`, ed è lo stesso schema.

**Due video sulla stessa pagina è il caso da evitare.** Se il clip di
campagna finisse nella sezione `#terza` della home, chi apre il sito
scaricherebbe 8 MB prima di aver letto una riga. Hero in home,
laboratorio nella vetrina.

**All'hero non va aggiunto un `poster`.** Sembra la cosa giusta e non
lo è: `clip.js` tiene acceso lo stand-in WebGL finché il video non è
pronto e commuta su `loadeddata`. Un poster comparirebbe in mezzo ai
due. Il buco è già coperto.

**I video non vanno in git.** Git non dimentica: quattro megabyte che
cambiano una volta a drop gonfiano il repository per sempre. Vanno
tenuti fuori dal controllo di versione e mandati sulla VPS con un
rsync a parte.

**Non si comprime sulla VPS.** Ha una CPU sola: un `ffmpeg` la occupa
per ore e nel frattempo il sito rallenta. Si comprime qui con i
comandi più sotto e si carica il risultato.

Sulla banda invece si può stare tranquilli: il piano della VPS include
5 TB, che a ~12 MB per visita completa sono fra 400.000 e un milione
di visite. Il vincolo vero non è il traffico, è **il peso del primo
caricamento** — che è una questione di come appare la marca, non di
quanto costa il server.

## Mettere il video di apertura

Copia il montato in `assets/media/` con questo nome:

```
assets/media/hero.mp4      (obbligatorio)
assets/media/hero.webm     (facoltativo, più leggero: se c'è, viene preferito)
```

Non serve toccare il codice. Il `<video>` è già collegato: appena
trova il file parte, compare in dissolvenza e spegne lo stand-in
WebGL — che smette anche di consumare GPU.

**Come dovrebbe essere il file**

| | |
|---|---|
| Durata | 8–15 secondi, in loop invisibile (primo e ultimo fotogramma uguali) |
| Formato | H.264 in `.mp4`, più VP9 in `.webm` se possibile |
| Risoluzione | 1920×1080 basta: il video è coperto da un velo scuro |
| Peso | **sotto i 4 MB.** È la prima cosa che si scarica: oltre, il sito sembra lento e la marca sembra sciatta |
| Audio | nessuno. La traccia va rimossa, non silenziata: pesa e basta |

Compressione decente con ffmpeg:

```bash
ffmpeg -i sorgente.mov -an -c:v libx264 -crf 26 -preset slow \
       -vf "scale=1920:-2" -movflags +faststart assets/media/hero.mp4

ffmpeg -i sorgente.mov -an -c:v libvpx-vp9 -crf 34 -b:v 0 \
       -vf "scale=1920:-2" assets/media/hero.webm
```

## Mettere la fotografia di Cristiano

Copia il ritratto in `assets/img/cristiano.jpg`, poi in `index.html`
sostituisci lo `<span>` dentro `.portrait` con:

```html
<img src="assets/img/cristiano.jpg" alt="Cristiano Ferragatti in laboratorio">
```

Il riquadro si adatta da solo: taglia in 4:5 e la cornice segnaposto
sparisce.

## Mettere la fotografia di campagna

È il fondo della terza sezione, quella con il solo invito «Guarda la
campagna» al centro. Copia lo scatto in `assets/img/campagna.jpg`:
entra da solo, il codice è già collegato.

| | |
|---|---|
| Taglio | orizzontale, 16:9 o più largo: la sezione è alta una schermata e ritaglia in `cover` |
| Risoluzione | 2400 px di lato lungo, sufficiente sui display fitti |
| Peso | sotto i 400 KB in JPEG di qualità 78–82 |
| Tono | freddo e drammatico — è la premessa su cui è tarato tutto il resto: il velo sopra la foto è nero-blu e lo stand-in dipinto in CSS ne ripete i toni. Con uno scatto caldo il velo la vira e va rifatto (`.campaign::before` in `style.css`) |
| Composizione | il centro deve restare leggibile: ci sta sopra l'invito. Il soggetto va tenuto laterale, non in mezzo |

Finché il file non c'è si vede lo stand-in dipinto in CSS e una nota
di servizio in alto a sinistra: quella nota (`.campaign-note` in
`index.html`) va tolta a mano quando la foto è al suo posto.

## Mettere le fotografie della collezione

Sono l'unico contenuto di `collezione/index.html`: finché non ci
sono, la pagina è tre riquadri vuoti con dentro la dicitura di cosa
manca. Copia gli scatti in `assets/img/` con questi nomi:

```
assets/img/collezione-01.jpg      camicia «Bottoni Grandi»
assets/img/collezione-02.jpg      camicia «Pineta»
assets/img/collezione-03.jpg      foulard «Adriatico»
```

Poi, per ciascuno, in `collezione/index.html` si scommenta l'`<img>`
e si toglie lo `<span>` che teneva il posto. La dicitura sparisce da
sola — è lo stesso meccanismo del ritratto in home — quindi non
resta niente da ricordarsi di ripulire.

| | |
|---|---|
| Taglio | **verticale**, o al più quadrato. Il riquadro è alto una schermata e ritaglia in `cover`: un 16:9 qui perde due terzi dell'altezza e resta un capo tagliato a metà |
| Risoluzione | 2000 px sul lato corto: la fotografia è a piena larghezza e si vede su schermi fitti |
| Peso | sotto i 500 KB per scatto in JPEG di qualità 78–82. Sono tre di fila e si scaricano tutte |
| Composizione | il capo deve reggere l'inquadratura da solo, senza didascalia che lo spieghi: è l'unica cosa in pagina |
| `alt` | obbligatorio e descrittivo. La pagina non ha parole: l'`alt` è tutto ciò che riceve chi la fotografia non la vede |

Se un giorno i pezzi diventano più di tre, si aggiunge una `<figure
class="look">` per ciascuno: entra da sola nella sequenza, non c'è
nessuna griglia da aggiornare.

## Cosa è ancora finto

Da sostituire prima di mostrarlo a chiunque non sia interno:

- **Il testo di Cristiano.** Voce e biografia sono scritte da me come
  segnaposto plausibile. Vanno riscritte con le sue parole.
- **I numeri della sezione progetto** (3 pezzi, 2 laboratori, 9 punti
  per cm, 1 drop all'anno). Se non sono veri, vanno cambiati: sono
  esattamente il tipo di dettaglio su cui la marca dice di puntare.
- **I contatti.** `atelier@ferragatti.it` e l'indirizzo del
  laboratorio sono inventati.
- **I link dei riferimenti** nel piede puntano tutti a `#`. Non
  fanno niente ed è voluto: `site.js` neutralizza ogni `href="#"`,
  perché altrimenti il browser li tratterebbe come «torna in cima» e
  sparerebbe il lettore in cima alla pagina — il modo più veloce di
  far sembrare rotto un collegamento che semplicemente non c'è
  ancora.
- **I nomi dei tre pezzi** — «Bottoni Grandi», «Pineta», «Adriatico» — sono
  segnaposto plausibili, non capi decisi.
- **Le righe e le note di produzione della vetrina.** Le righe sono
  scritte da me: vanno riscritte con la voce di Cristiano, o tolte,
  ma non lasciate come sono. **Le note tecniche sono peggio**: 9
  punti al centimetro, filo seta 50, bagno di quaranta minuti, collo
  in tela cucita, 120 pezzi non riassortiti, quattro ore di lavoro
  per capo. Sono verosimili e sono inventate, e sono esattamente il
  tipo di dettaglio su cui la marca dice di puntare — dichiararlo
  falso è peggio che non dichiararlo. **O sono veri, o si tolgono.**
- **Le fotografie della collezione.** Finché non ci sono, la vetrina
  è tre riquadri vuoti con le parole sotto.
- **I prezzi dello store** (340 €, 340 €, 160 €) e le taglie. Idem.
- **I cinque pezzi del giornale**: ci sono i titoli e gli occhielli,
  non gli articoli. I collegamenti puntano a `#`. Quando un pezzo si
  scrive prende una sottocartella sua — `blog/nome-del-pezzo/` — e in
  `blog/index.html` si cambia solo l'indirizzo: la struttura è già
  quella giusta, il collegamento avvolge tutto il pezzo.
- **Le note di servizio** in colonna (`.sheet-note`) sul giornale e
  sullo store: sono il promemoria di cosa è ancora finto e vanno
  tolte con le cose finte che segnalano. La vetrina non ne ha una,
  perché lì la nota è la dicitura dentro il riquadro vuoto — e
  quella si toglie da sola.
- **Le condizioni dello store**: spedizioni, resi e cura della seta
  sono scritti in modo plausibile ma non sono impegni verificati.
  O li mantiene la logistica vera, o vanno riscritti.
- **La fotografia di campagna.** Al suo posto c'è uno stand-in
  dipinto in CSS (vedi sopra).
- ~~**La newsletter non invia niente.**~~ **Ora invia.** È collegata a
  un servizio nostro, in Python, che vive in `../VPS/` — lista,
  doppio opt-in, campagne e disiscrizione, senza provider esterni. Il
  gestore in `assets/js/site.js` è rimasto uno solo per ogni
  `form.news-form`, ed è servito a collegarli tutti e due in un punto:
  la previsione ha retto. Vedi «La lettera, collegata» più sotto.
- **Lo store non vende.** Gli inviti «Apre il 18 settembre» sono
  `<button disabled>`, disattivati per davvero — quindi anche per chi
  naviga da tastiera o con un lettore di schermo, non solo per chi li
  guarda. Non c'è carrello e non se ne finge uno. Ogni bottone dice
  da sé quando apre, ed è per questo che la fascia `.drop-strip` con
  lo stato del drop sta **dopo** la merce e non prima: non informa,
  conclude, e porta al campo che è l'unica cosa che funziona.
  All'apertura si sostituisce ogni bottone con il collegamento vero
  al checkout e la fascia si toglie.
- **La riga sotto il campo** («una email all'anno, ci si cancella con
  un clic»). La seconda metà ora è mantenuta dal codice: la
  disiscrizione è un clic solo, senza pagina di conferma, ed è anche
  nelle intestazioni `List-Unsubscribe` che fanno comparire il
  pulsante in cima al messaggio in Gmail. **La prima metà dipende da
  voi**: è un impegno sul numero di email, e non c'è codice che possa
  mantenerlo al posto vostro.
- **La P. IVA** e le note legali nel piede.
- **`og:image`** è commentato in `index.html`: senza, i link condivisi
  su WhatsApp e Instagram escono spogli.

## Come è fatto

**Il marchio è la firma, l'insegna è la parola.** Sono due segni
diversi con due mestieri diversi. In alto a sinistra — nella barra di
ogni pagina e in cima alle pagine di ritorno — c'è la firma
calligrafica: il disegno di `assets/img/marchio.svg`, che è
`FERRAGATTI.svg` ritagliato al vivo, dato che l'export d'origine è un
foglio A4 con il segno al centro.

Non è né un `<img>` né un SVG incollato nel markup, ma una **maschera**
incorporata nel foglio di stile (`--marchio`, dodici pagine, un solo
posto da toccare). Le due scelte hanno due ragioni:

- **maschera** perché il segno si colora con `currentColor` e quindi
  cambia insieme alla barra, che scendendo passa da chiaro a scuro. Un
  file con il suo blu dentro resterebbe fermo, sbagliato su uno dei due
  fondi. È anche quello che tiene l'oro sul marchio dei ritorni;
- **incorporata** perché il marchio è la prima cosa che si vede, e un
  `mask-image` che arriva dalla rete arriva dopo il primo fotogramma:
  la barra si aprirebbe con il posto vuoto.

Nel markup il collegamento è vuoto e porta `aria-label="Ferragatti"` —
il nome per chi legge con le orecchie sta lì, non in una parola
nascosta. L'altezza è più generosa del corpo che aveva la parola: la
firma è a tratto sottile e sotto i ~30 px le aste si spengono
nell'antialiasing. Al massimo del `clamp()` la barra misura ~69 px e
resta dentro `--nav-h`. Per rifare il segno dopo un ritocco al disegno,
le istruzioni per rigenerare il data-URI stanno alla voce IL SEGNO di
`style.css`.

**L'insegna grande è lo stesso segno della barra, alla scala
dell'apertura.** Apre il sito in hero, lo chiude nel piede e sta in
cima al cartello mobile: sempre `.bigmark`, sempre la maschera
`--marchio`, sempre colorata da `currentColor` — sul video prende il
bianco caldo dell'hero, nel piede il tono della sezione.

**Va da margine a margine**, come ci andava la parola prima di lei. Il
ritaglio del file è fatto sull'inchiostro e non su un riquadro di
comodo, quindi a larghezza piena il primo e l'ultimo tratto toccano
davvero i due margini, senza l'aria morta che un export lascia attorno
al segno.

**Quel che cambia è il conto dell'altezza.** `FERRAGATTI` in
maiuscoletto è alto un decimo di quanto è largo: a tutta pagina
restava una riga. La firma sta in un riquadro 2,45:1, quindi a 1340 px
di finestra è alta 546 — due terzi di una schermata 16:9. In apertura
è il gesto, e va bene così; ma su una finestra bassa quei 546 px non
si accorciano da soli, e l'apertura — occhiello, segno, invito a
scendere — andrebbe in pressione.

Per questo l'insegna ha un tetto **in un punto solo**, l'hero:
`min(100%, 172vh)`, cioè 70 vh di altezza. Sopra quella proporzione
non morde nemmeno — su 1440×810 varrebbe 1393 px, più della pagina, e
il segno resta pieno; sotto, smette di crescere invece di sfondare. Il
limite è scritto sull'altezza perché è l'altezza a mancare: legarlo
alla larghezza vorrebbe dire rimpicciolire l'insegna anche dove lo
spazio c'era tutto.

Nel piede e sul cartello mobile nessun tetto: lì sotto la pagina
scorre e non c'è una schermata da rispettare. Per cambiare la scala si
tocca `.bigmark`, e per il solo hero `.hero-mark .bigmark`.

**L'intestazione segue l'alternanza chiaro/scuro.** Non c'è nessuna
lista di sezioni cablata nel JavaScript: a ogni frame legge quale
sezione sta passando sotto la barra e ne eredita i token. Per
aggiungere una sezione basta dichiarare `data-tone="light"` o
`data-tone="dark"` — l'intestazione si adegua da sola.

**Sull'apertura la barra c'è ma la lastra no.** Sopra il clip
l'intestazione porta la classe `bare`: niente velo, niente sfocatura,
niente filo di taglio. Restano i tre collegamenti di sezione,
appoggiati al video e tenuti leggibili dall'alone (`--glass-halo`)
anziché dal fondo. Tacciono invece il marchio e il pulsante
store: sulla stessa schermata ci sono già l'insegna a tutta larghezza
e la CTA del clip, e dirli due volte divide l'invito invece di
rafforzarlo. Rientrano insieme al vetro, passata la prima schermata —
62% dell'altezza della finestra — perché da lì in poi sotto scorre la
pagina e serve qualcosa che separi.

Marchio e pulsante spariscono con l'opacità, non con `display`: il
posto resta occupato e i collegamenti non slittano al rientro. La
`visibility` stacca a dissolvenza finita, ed è quella a toglierli dal
giro del tab e ai lettori di schermo. La classe `bare` è scritta anche
nel markup, non solo da `site.js`: gli script stanno in fondo alla
pagina e senza quella la lastra lampeggerebbe per un fotogramma al
caricamento.

**Sulle pagine interne `bare` non esiste.** Lì sotto la barra non c'è
un clip a tutto schermo ma del testo, quindi il vetro serve dal primo
pixel, e firma e pulsante restano — sono l'unico modo di tornare a
casa e di andare allo store. Il segnale è la presenza di una `.hero`
nella pagina, non il nome del file: una pagina nuova non deve
dichiarare niente.

**Un'ancora che arriva da un'altra pagina atterra sulla fermata
giusta.** `../#progetto` dal menu di una pagina interna porta il
browser a un'altezza calcolata sul documento disteso, che con le
sezioni agganciate non coincide con nessuna fermata: si atterrerebbe
in mezzo a due strati. `snap.js` ci si mette sopra di colpo, senza il
viaggio — lo scatto morbido è la risposta a un gesto, e lì un gesto
non c'è stato. Lo rifà a ogni misura (al `load`, a caratteri pronti),
ma solo se nel frattempo nessuno ha scorso: se la pagina non è più
dove l'aveva lasciata, il lettore ha preso il comando e non si tocca
più niente.

**Il cartamodello è disegnato, non decorativo.** Davanti, manica e
collo con linea di taglio, margine di cucitura tratteggiato,
drittofilo in oro, tacche, pinces e quote. È inline in `index.html`,
quindi eredita i colori del tono e si può correggere a mano.

**Le sezioni si impilano a sipario.** Ogni sezione si aggancia in
cima allo schermo e ci resta; la successiva, che ha fondo pieno, le
sale sopra e la copre. L'impilamento è tutto `position: sticky`,
senza librerie, e vale a ogni larghezza — telefono compreso.

Le sezioni più alte di una schermata si agganciano **col fondo, non
con la cima**: salgono finché non mostrano la propria fine e lì si
fermano ad aspettare la successiva. Senza questo, una sezione lunga
agganciata in cima si taglierebbe la coda, ed è il motivo per cui il
sipario prima si accendeva solo su schermo largo. Il loro `top`
negativo lo scrive `snap.js` quando misura: in CSS le percentuali di
`top` guardano il blocco contenitore, non l'elemento, quindi un
`calc()` non saprebbe di che altezza sta parlando.

Per lo stesso motivo il sipario sta dietro alla classe `.curtain`,
che mette `snap.js`: impilamento e agganci sono la stessa cosa vista
da due lati, e senza qualcuno che misuri le altezze non si regge.
Senza JavaScript le sezioni scorrono in fila — una pagina onesta
invece di una pagina rotta.

**Un gesto porta a una schermata intera.** Lo scorrimento progressivo
è sostituito da uno scatto: una rotellata, una passata di trackpad,
una strisciata del dito o una freccia spostano di una schermata piena.
Sta in `assets/js/snap.js`.

Lo scatto dura fra 520 e 900 ms su una curva a **uscita in quarta**:
parte decisa ma senza strappo, e atterra lunga. La scelta della curva
conta più della durata — una simmetrica, che parte piano, si sente
come ritardo; un'esponenziale, che parte a razzo, si sente come uno
strattone. La quarta sta in mezzo.

L'animazione è **interrompibile**: se il gesto precedente è finito e
ne arriva un altro a metà strada, quello nuovo prende il comando e
riparte dalla posizione corrente invece di accodarsi. Senza questo, lo
scorrimento veloce si sente sempre in ritardo di un gesto.

Le fermate nascono dalle sezioni del sipario — `.hero`, `.band`,
`footer` — quindi aggiungendo una sezione con `class="band"` entra da
sola sia nell'impilamento sia negli agganci: non c'è nessuna lista da
aggiornare in due posti.

**Una sezione però può valere più di una fermata.** Su schermo largo
ogni sezione sta in una schermata e le due cose coincidono; su
telefono no, perché il testo incolonnato è quasi sempre più lungo
dello schermo. Allora la sezione si divide in tante fermate quante
sono le schermate che le mancano, spaziate uguali — e l'ultima cade
esattamente dove la sezione si aggancia col fondo, così lo scatto e
l'impilamento si fermano nello stesso punto. La divisione è in parti
uguali e non a schermate piene perché l'ultimo passo sarebbe un
avanzo di pochi pixel, e uno scatto lungo un dito si sente come un
inciampo.

Resta un caso scomodo, ed è di impaginazione più che di codice: una
sezione alta *poco più* di una schermata produce comunque un secondo
passo corto, perché entrambe le fermate sono obbligate — la prima per
mostrare la testa della sezione, l'ultima per non tagliarne il piede.
Si cura accorciando la sezione o allungandola, non toccando il modulo.

Un modulo che intercetta la rotella è invasivo per definizione, e per
non diventare ostile ha quattro valvole di sfogo:

- **La tastiera resta completa.** Frecce, PagSu/PagGiù, spazio, Home
  e Fine muovono di una fermata. Dentro un campo di testo i tasti
  tornano a scrivere.
- **Il fuoco tira la pagina.** Chi naviga col tab e finisce dentro una
  sezione coperta se la vede portare in vista: senza, si scriverebbe
  dentro qualcosa di invisibile. Ma solo se non si vede già — sul
  telefono il fuoco su un campo arriva col dito che l'ha appena
  toccato, e tirare la pagina lì porterebbe via il campo da sotto le
  dita.
- **`Ctrl` + rotella non viene toccato**, così l'ingrandimento del
  browser continua a funzionare. Sul telefono lo stesso vale per le
  due dita: un pizzico è un ingrandimento, non uno scorrimento, e
  resta del browser.
- **Con `prefers-reduced-motion` non c'è viaggio**: si arriva alla
  fermata di colpo, senza l'animazione di un secondo.

Sul telefono si aggiunge un tranello che sul desktop non esiste:
**quasi nessun ridimensionamento è un ridimensionamento**. La tastiera
di sistema che si apre e la barra degli indirizzi che si ritira
cambiano l'altezza della finestra mentre la pagina è la stessa, e
rimisurare lì dentro significa spostare la pagina mentre si scrive. Il
segnale onesto è la larghezza: una rotazione la cambia, una tastiera
no. Finché il fuoco è dentro un campo e la larghezza tiene, `snap.js`
non rimisura niente.

### I tre tranelli di un modulo così

**La coda inerziale del trackpad.** È il tranello peggiore, e si può
sbagliare in due direzioni opposte.

Il dito si alza e gli eventi continuano ad arrivare: su macOS, dopo un
`preventDefault()`, per **due o tre secondi**, con delta che decadono
da 50 fino a frazioni di unità. Se li si conta tutti, una spinta sola
vale tre sezioni.

La correzione ingenua — "riarmarsi solo dopo un momento di silenzio da
qualunque evento" — produce però un guasto peggiore: **il modulo si
blocca**. La coda non tace mai abbastanza a lungo, il riarmo viene
rimandato all'infinito, e lo scorrimento sembra morto finché non si
staccano le mani dal trackpad per qualche secondo. Chi lo prova se ne
accorge così: scorro, funziona, riscorro, non succede niente; clicco
una voce di menu — cioè smetto di toccare il trackpad — e da lì
riprende.

La soluzione sta in due pezzi che vanno tenuti insieme:

1. **Solo gli eventi sopra `STRONG` (10) rimandano il riarmo.** Sotto
   quella soglia è coda, non intenzione: non fa scorrere e non sposta
   il timer.
2. **Un tetto assoluto** (`guardTimer`, durata dell'animazione più
   300 ms) che riarma comunque e che *nessun evento può rimandare*.
   È la rete di sicurezza: anche se un browser si comportasse in modo
   imprevisto, al massimo si aspetta quel tempo, non per sempre.

Regola per chi ci mette mano: ogni percorso che scrive `armed = false`
deve avere un percorso che lo riporta a `true`. Oggi sono due e due.

**L'indice che si scolla dalla posizione.** Il modulo tiene il numero
della fermata corrente, ma la pagina può muoversi alle sue spalle:
barra di scorrimento trascinata, ricerca nella pagina, un'ancora, il
ripristino della posizione al ricaricamento. Se l'indice non viene
risincronizzato prima di ogni gesto, il primo scatto dopo **torna
indietro invece di proseguire** — e si nota soprattutto risalendo,
perché è lì che di solito si è arrivati per altre strade. Ora `go()`
rilegge la posizione vera ogni volta che non sta animando.

**Le fermate misurate troppo presto.** L'altezza della pagina non è
quella definitiva quando il DOM è pronto: le immagini la cambiano
dopo. Misurare una volta sola
lascia fermate sbagliate di qualche decina di pixel, e l'errore si
accumula verso il fondo — quindi si sente salendo, non scendendo. Si
rimisura al `load` e di nuovo su `document.fonts.ready`.

Tre vincoli che vanno rispettati se si aggiungono sezioni:

1. **Una sezione che non sta in una schermata si aggancia col
   fondo.** Agganciandosi in cima si taglierebbe la coda da sola. Non
   c'è niente da fare a mano: `snap.js` la misura, le scrive il `top`
   negativo e le assegna le fermate intermedie che le servono. Vale la
   pena però tenere d'occhio le sezioni alte *poco più* di una
   schermata: producono un ultimo scatto corto, e la cura è di
   impaginazione.
2. **Il fondo deve essere pieno.** Una sezione trasparente lascerebbe
   vedere quella sotto. I token `--bg` dei due toni lo garantiscono.
3. **Il piede ha `z-index: 1`.** Gli elementi agganciati sono
   "posizionati" e senza quella riga salirebbero sopra il piede,
   nascondendolo. Non è un dettaglio estetico: è ciò che tiene in
   piedi l'ultima transizione.

L'alternanza chiaro/scuro non è più solo ritmo: è ciò che rende
leggibile lo stacco fra uno strato e il successivo.

**L'apertura risponde al puntatore, in due modi diversi.** Sullo
stand-in WebGL il mouse muove la luce dentro lo shader: il tessuto si
raccoglie leggermente verso il cursore, la vignettatura si sposta e
resta un soffio di blu attorno al punto. È interattività vera, calcolata
per pixel.

Un filmato però non si può illuminare a posteriori. Quando arriva il
video vero, quindi, l'interazione cambia natura invece di sparire:
si accende un alone blu che segue il cursore (`.hero-light`) e
l'inquadratura si sposta di una ventina di pixel in senso opposto al
mouse. Meno spettacolare dello shader, ma è la stessa idea — la luce
segue chi guarda — e sopravvive al montato.

Chi tocca senza mouse non perde niente: su touch resta il moto lento
automatico, e la deformazione da puntatore si spegne da sola.

**Un solo accento, un solo valore.** `#004b23` — il verde scuro della
casa — su tutti e due i toni. Su carta chiara tiene **10,3:1**, quindi
sul chiaro si legge come testo a tutti gli effetti.

Sul fondo scuro invece l'accento sparisce, e va saputo: `#004b23` su
`#0b0b0d` non arriva a **1,5:1**. Sul tono scuro l'accento non si
legge come testo e vive solo là dove è luce — la seta dell'apertura,
dove la tinta arriva dai riflessi e non dal colore pieno. Occhielli,
testate di colonna del piede, numeri di tavola e parole in accento,
sullo scuro, di fatto spariscono. È una scelta di tinta, non di
leggibilità, e chi tocca la palette deve saperlo: per recuperarli
basta schiarire il solo `--gold` del tono scuro, lasciando `#004b23`
ovunque altrove.

È la ragione per cui **le pagine di servizio sono in tono chiaro**:
portano un accento che deve leggersi, e sullo scuro non si leggerebbe.
L'unica in tono scuro è il `404.html`, che di accento non ne ha.

I token sono ancora `--gold` e `--gold-lux` in `style.css` e `TINTA`
nello shader di `clip.js`.

**Tema unico e voluto.** Il sito non segue il chiaro/scuro del sistema
operativo: è una marca, non un documento. Tutti i colori sono
dichiarati esplicitamente.

## La lettera, collegata

Il modulo di iscrizione parla con un servizio Python che sta in
`../VPS/` e gira sulla stessa macchina del sito: la lista degli
iscritti non esce di casa e non passa da nessun provider. Il perché e
il come stanno nel README lì dentro; qui c'è solo ciò che riguarda le
pagine.

**Un gestore solo, per tutti i moduli.** Come prima: vale ogni
`form.news-form`, e campo, conferma ed errore si cercano a partire dal
modulo. Aggiungerne un terzo non richiede toccare `site.js`.

**Il modulo funziona anche a JavaScript spento.** Ha `action` e
`method` veri: senza JavaScript il browser lo invia da sé e l'API
risponde con un redirect a una pagina di esito. Con JavaScript la
pagina non si ricarica e compaiono i tre stati che un ricaricamento
non può mostrare — invio in corso, errore sul posto, conferma. **La
differenza la fa l'intestazione `Accept`**, che il browser manda da
sé: stessa rotta sul server, due dialetti, nessun ramo doppio da
mantenere.

Per questo l'indirizzo dell'API si legge da `form.action` e non è
scritto nel JavaScript: un valore solo nel markup, usato da tutte e
due le strade.

**`/api/subscribe` è l'unico percorso assoluto del sito**, ed è
l'eccezione consapevole alla regola dei percorsi relativi. `/api/` non
è un file del sito: è una rotta che nginx monta sulla radice del
dominio, quindi non si sposta insieme alle pagine. Il rovescio è che
l'iscrizione non si può provare aprendo le pagine da disco — per
quello c'è `../VPS/deploy/dev.py`, che serve il sito e inoltra `/api/`
come farà nginx.

**Il campo trappola.** Un input fuori vista che una persona non vede e
un bot compila. Non è `display:none`, che i bot riconoscono: è
spostato fuori schermo, con `aria-hidden` e `tabindex="-1"`. Se arriva
pieno, il server risponde `200` come a tutti e non scrive niente — al
bot si mente, perché un errore gli direbbe che la trappola c'è.

**La spunta del consenso non si rimpicciolisce.** È la cosa che rende
lecito scrivere a quella persona, e chi la spunta deve poterla
leggere.

### Le pagine di servizio

Sei esiti dell'iscrizione, l'informativa e il 404. Sono un **tipo di
pagina a sé**, non una quinta pagina del sito: niente barra, niente
piede alto, la firma in cima, la frase, un invito a tornare. Ci si
arriva da un link dentro un'email, non dal menu, e chi atterra ha già
una domanda sola in testa.

| Indirizzo | Quando |
|---|---|
| `iscrizione/inviata/` | iscrizione ricevuta, senza JavaScript |
| `iscrizione/confermata/` | il doppio opt-in è completo |
| `iscrizione/annullata/` | disiscritto, con la via di ritorno |
| `iscrizione/tornato/` | rientrato dopo un ripensamento |
| `iscrizione/scaduta/` | link già usato, scaduto o inventato |
| `iscrizione/errore/` | iscrizione rifiutata, senza JavaScript |
| `privacy/` | l'informativa |
| `404.html` | indirizzo sbagliato |

**Queste pagine si vedono sul telefono, ed è la ragione per cui sono
un tipo a sé.** Il cartello del cantiere nasconde `main` e `footer`
sotto i 900 px su tutte le pagine; qui no, e l'esenzione sta in fondo
al foglio di stile, sezione PAGINE DI SERVIZIO. Un link di conferma si
preme quasi sempre dal telefono, perché è lì che si legge la posta:
mostrare «Mobile in costruzione» a chi ha appena confermato
l'iscrizione interromperebbe il solo percorso per cui tutto questo
esiste. Quando il cantiere si smonta, quella sezione resta.

## Pubblicarlo

**La destinazione è cambiata: non più GitHub Pages ma una VPS Aruba**,
perché il sito adesso ha bisogno di un backend — la newsletter — e
Pages serve solo file statici. Il sito resta comunque statico: è nginx
a servirlo, e ad affiancargli `/api/`.

La procedura completa starà in `../VPS/deploy/`. Quel che riguarda le
pagine:

- **Le cartelle con dentro `index.html` continuano a funzionare come
  prima**: nginx serve `shop/index.html` all'indirizzo `/shop/` con un
  `try_files`, e non serve nessuna regola di riscrittura.
- **Il `404.html` adesso c'è**, e va collegato con `error_page 404` in
  nginx: è l'unica pagina con il percorso del foglio di stile
  assoluto, perché viene servita a qualunque indirizzo sbagliato e uno
  relativo si risolverebbe a partire da lì.
- **I percorsi relativi restano relativi.** L'unica eccezione è
  `/api/`, spiegata sopra.

## Dopo

Quando servono carrello e checkout, il passo successivo è il porting
su Next.js + Shopify headless descritto nel dossier di progetto. Il
CSS e il markup si trasferiscono quasi invariati: cambia
l'impacchettamento, non il disegno.
