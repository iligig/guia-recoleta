// Guida del Cimitero della Recoleta: una mappa con le tombe e le loro storie.

// Il centro della mappa quando si apre l'app (attenzione: qui prima la longitudine, poi la latitudine)
const CENTRO_CIMITERO = [-58.3935, -34.5876];

// Tutte le scritte dell'app, nelle due lingue
const TESTI = {
  es: {
    titolo: "Cementerio de la Recoleta",
    elenco: "Tumbas",
    posizione: "Mi ubicación",
    portami: "Cómo llegar",
    fonti: "Fuentes",
    leggenda: "Leyenda",
    chiudi: "Cerrar",
    errore_dati: "No se pudieron cargar las tumbas.",
    errore_posizione: "No se pudo obtener tu ubicación.",
    cerco_posizione: "Buscando tu ubicación…",
  },
  it: {
    titolo: "Cimitero della Recoleta",
    elenco: "Tombe",
    posizione: "La mia posizione",
    portami: "Portami qui",
    fonti: "Fonti",
    leggenda: "Leggenda",
    chiudi: "Chiudi",
    errore_dati: "Non è stato possibile caricare le tombe.",
    errore_posizione: "Non è stato possibile trovare la tua posizione.",
    cerco_posizione: "Cerco la tua posizione…",
  },
};

// Lo "stato" dell'app: cosa sta mostrando in questo momento
let lingua = localStorage.getItem("lingua") || (navigator.language.startsWith("it") ? "it" : "es");
let tombe = [];             // le tombe lette da tombe.json
let segnaposti = {};        // id della tomba -> segnaposto sulla mappa
let inScheda = null;        // "elenco", l'id di una tomba, oppure null se la scheda è chiusa

// ---------- La mappa ----------
// Mappa vettoriale gratuita di OpenFreeMap (dati di OpenStreetMap):
// il telefono la disegna al momento, quindi resta nitida a qualsiasi zoom.
const mappa = new maplibregl.Map({
  container: "mappa",
  style: "https://tiles.openfreemap.org/styles/liberty",
  center: CENTRO_CIMITERO,
  zoom: 17,
  maxZoom: 20,
  dragRotate: false,          // niente rotazione: il nord resta sempre in alto
  pitchWithRotate: false,
  attributionControl: { compact: true },
});
mappa.touchZoomRotate.disableRotation();
mappa.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

// Il puntino blu della posizione. Il pulsante originale è nascosto (vedi style.css):
// usiamo il nostro "La mia posizione" in basso.
const posizione = new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  fitBoundsOptions: { maxZoom: 19 },
});
mappa.addControl(posizione, "bottom-right");

// ---------- Piccoli aiutanti ----------

// Crea un elemento HTML con un testo dentro (il testo non viene mai interpretato come codice)
function crea(tag, testo, classe) {
  const elemento = document.createElement(tag);
  if (testo) elemento.textContent = testo;
  if (classe) elemento.className = classe;
  return elemento;
}

let timerAvviso = null;
function mostraAvviso(messaggio, durata = 3500) {
  const avviso = document.getElementById("avviso");
  avviso.textContent = messaggio;
  avviso.hidden = false;
  clearTimeout(timerAvviso);
  if (durata) timerAvviso = setTimeout(() => (avviso.hidden = true), durata);
}

function nascondiAvviso() {
  document.getElementById("avviso").hidden = true;
}

// Dal link di una fonte ricava un nome leggibile, es. "es.wikipedia.org · Eva Perón"
function nomeFonte(indirizzo) {
  try {
    const url = new URL(indirizzo);
    const ultimaParte = decodeURIComponent(url.pathname.split("/").pop()).replaceAll("_", " ");
    return ultimaParte ? `${url.hostname} · ${ultimaParte}` : url.hostname;
  } catch {
    return indirizzo;
  }
}

// ---------- I segnaposto delle tombe ----------
function aggiungiSegnaposto(tomba, numero) {
  const elemento = crea("div", "", "segnaposto");
  elemento.append(crea("span", String(numero)));
  elemento.title = tomba.nome;
  elemento.setAttribute("role", "button");
  elemento.setAttribute("aria-label", tomba.nome);
  elemento.tabIndex = 0;
  elemento.addEventListener("click", (evento) => {
    evento.stopPropagation();
    apriTomba(tomba.id);
  });
  elemento.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") apriTomba(tomba.id);
  });

  segnaposti[tomba.id] = new maplibregl.Marker({ element: elemento })
    .setLngLat([tomba.lon, tomba.lat])
    .addTo(mappa);
}

function evidenziaSegnaposto(idTomba) {
  for (const [id, segnaposto] of Object.entries(segnaposti)) {
    segnaposto.getElement().classList.toggle("attivo", id === idTomba);
  }
}

// ---------- La scheda in basso ----------
function apriScheda(cosa) {
  inScheda = cosa;
  disegnaScheda();
  document.getElementById("scheda").hidden = false;
  document.body.classList.add("scheda-aperta");
}

function chiudiScheda() {
  inScheda = null;
  document.getElementById("scheda").hidden = true;
  document.body.classList.remove("scheda-aperta");
  evidenziaSegnaposto(null);
}

function apriTomba(idTomba) {
  const tomba = tombe.find((t) => t.id === idTomba);
  if (!tomba) return;
  apriScheda(idTomba);
  evidenziaSegnaposto(idTomba);
  centraFuoriDallaScheda(tomba.lat, tomba.lon);
}

// Sposta la mappa in modo che la tomba resti visibile e non finisca sotto la scheda
function centraFuoriDallaScheda(lat, lon) {
  const scheda = document.getElementById("scheda");
  const telefono = window.innerWidth < 720;
  // Sul telefono la scheda copre il basso; sul computer copre la sinistra
  const spostamento = telefono ? [0, -scheda.offsetHeight / 2] : [(scheda.offsetWidth + 16) / 2, 0];
  mappa.flyTo({
    center: [lon, lat],
    zoom: Math.max(mappa.getZoom(), 18),
    offset: spostamento,
    duration: 600,
  });
}

function disegnaScheda() {
  const testi = TESTI[lingua];
  const contenuto = document.getElementById("contenuto-scheda");
  contenuto.replaceChildren();
  document.getElementById("chiudi-scheda").setAttribute("aria-label", testi.chiudi);

  if (inScheda === "elenco") {
    contenuto.append(crea("h2", testi.elenco));
    const lista = crea("ul", "", "elenco");
    tombe.forEach((tomba, indice) => {
      const voce = crea("li");
      const bottone = crea("button");
      bottone.type = "button";
      bottone.append(crea("span", String(indice + 1), "numero"), crea("span", tomba.nome));
      bottone.addEventListener("click", () => apriTomba(tomba.id));
      voce.append(bottone);
      lista.append(voce);
    });
    contenuto.append(lista);
    return;
  }

  const tomba = tombe.find((t) => t.id === inScheda);
  if (!tomba) return;

  contenuto.append(crea("h2", tomba.nome));
  if (tomba.leggenda) contenuto.append(crea("span", testi.leggenda, "etichetta-leggenda"));

  const portami = crea("a", testi.portami, "bottone-principale");
  portami.href = `https://www.google.com/maps/dir/?api=1&destination=${tomba.lat},${tomba.lon}&travelmode=walking`;
  portami.target = "_blank";
  portami.rel = "noopener";
  contenuto.append(portami);

  const storia = tomba.storia[lingua] || tomba.storia.es;
  contenuto.append(crea("p", storia));

  if (tomba.fonti.length > 0) {
    const blocco = crea("div", "", "fonti");
    blocco.append(crea("strong", testi.fonti));
    const lista = crea("ul");
    for (const indirizzo of tomba.fonti) {
      const voce = crea("li");
      const link = crea("a", nomeFonte(indirizzo));
      link.href = indirizzo;
      link.target = "_blank";
      link.rel = "noopener";
      voce.append(link);
      lista.append(voce);
    }
    blocco.append(lista);
    contenuto.append(blocco);
  }
}

// ---------- La lingua ----------
function impostaLingua(nuovaLingua) {
  lingua = nuovaLingua;
  localStorage.setItem("lingua", lingua);
  const testi = TESTI[lingua];
  document.documentElement.lang = lingua;
  document.getElementById("titolo").textContent = testi.titolo;
  document.getElementById("bottone-elenco").textContent = testi.elenco;
  document.getElementById("bottone-posizione").textContent = testi.posizione;
  document.querySelectorAll(".lingue button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.lingua === lingua));
  });
  if (inScheda) disegnaScheda();
}

// ---------- La posizione del visitatore ----------
let posizioneTrovata = false;

posizione.on("geolocate", () => {
  if (!posizioneTrovata) {
    posizioneTrovata = true;
    nascondiAvviso();
  }
});
posizione.on("error", () => mostraAvviso(TESTI[lingua].errore_posizione));

function mostraPosizione() {
  if (!("geolocation" in navigator)) {
    mostraAvviso(TESTI[lingua].errore_posizione);
    return;
  }
  if (!posizioneTrovata) mostraAvviso(TESTI[lingua].cerco_posizione, 0);
  // Primo tocco: trova e segue la posizione. Tocchi successivi: ricentra o smette di seguirla.
  posizione.trigger();
}

// ---------- Avvio ----------
document.querySelectorAll(".lingue button").forEach((b) => {
  b.addEventListener("click", () => impostaLingua(b.dataset.lingua));
});
document.getElementById("bottone-elenco").addEventListener("click", () => apriScheda("elenco"));
document.getElementById("bottone-posizione").addEventListener("click", mostraPosizione);
document.getElementById("chiudi-scheda").addEventListener("click", chiudiScheda);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && inScheda) chiudiScheda();
});

impostaLingua(lingua);

fetch("tombe.json")
  .then((risposta) => {
    if (!risposta.ok) throw new Error(risposta.status);
    return risposta.json();
  })
  .then((dati) => {
    tombe = dati;
    tombe.forEach((tomba, indice) => aggiungiSegnaposto(tomba, indice + 1));
    // Inquadra tutte le tombe, lasciando un po' di margine intorno
    if (tombe.length > 0) {
      const tutte = new maplibregl.LngLatBounds();
      tombe.forEach((t) => tutte.extend([t.lon, t.lat]));
      mappa.fitBounds(tutte, { padding: 50, maxZoom: 19, duration: 0 });
    }
  })
  .catch(() => mostraAvviso(TESTI[lingua].errore_dati, 0));
