// Guida del Cimitero della Recoleta: una mappa con le tombe e le loro storie.

// Il centro della mappa quando si apre l'app
const CENTRO_CIMITERO = [-34.5876, -58.3935];

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
const mappa = L.map("mappa").setView(CENTRO_CIMITERO, 18);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(mappa);

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
  const icona = L.divIcon({
    className: "segnaposto",
    html: `<span>${numero}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
  const segnaposto = L.marker([tomba.lat, tomba.lon], { icon: icona, title: tomba.nome, keyboard: true });
  segnaposto.on("click", () => apriTomba(tomba.id));
  segnaposto.addTo(mappa);
  segnaposti[tomba.id] = segnaposto;
}

function evidenziaSegnaposto(idTomba) {
  for (const [id, segnaposto] of Object.entries(segnaposti)) {
    const elemento = segnaposto.getElement();
    if (elemento) elemento.classList.toggle("attivo", id === idTomba);
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
  const zoom = Math.max(mappa.getZoom(), 18);
  const scheda = document.getElementById("scheda");
  const telefono = window.innerWidth < 720;
  // Sul telefono la scheda copre il basso; sul computer copre la sinistra
  const spostamento = telefono ? [0, scheda.offsetHeight / 2] : [-(scheda.offsetWidth + 16) / 2, 0];
  const punto = mappa.project([lat, lon], zoom).add(spostamento);
  mappa.flyTo(mappa.unproject(punto, zoom), zoom, { duration: 0.6 });
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
let puntoPosizione = null;
let cerchioPrecisione = null;
let idControlloPosizione = null;

function mostraPosizione() {
  const testi = TESTI[lingua];
  if (!("geolocation" in navigator)) {
    mostraAvviso(testi.errore_posizione);
    return;
  }
  // Se la stiamo già seguendo, basta ricentrare la mappa
  if (idControlloPosizione !== null) {
    if (puntoPosizione) mappa.flyTo(puntoPosizione.getLatLng(), 19, { duration: 0.6 });
    return;
  }

  mostraAvviso(testi.cerco_posizione, 0);
  let primaVolta = true;
  idControlloPosizione = navigator.geolocation.watchPosition(
    (posizione) => {
      const dove = [posizione.coords.latitude, posizione.coords.longitude];
      if (!puntoPosizione) {
        cerchioPrecisione = L.circle(dove, {
          radius: posizione.coords.accuracy,
          color: "#1a73e8", weight: 1, fillOpacity: 0.12,
        }).addTo(mappa);
        puntoPosizione = L.circleMarker(dove, {
          radius: 8, color: "#fff", weight: 3, fillColor: "#1a73e8", fillOpacity: 1,
          className: "punto-posizione",
        }).addTo(mappa);
      } else {
        puntoPosizione.setLatLng(dove);
        cerchioPrecisione.setLatLng(dove).setRadius(posizione.coords.accuracy);
      }
      if (primaVolta) {
        primaVolta = false;
        document.getElementById("avviso").hidden = true;
        mappa.flyTo(dove, 19, { duration: 0.6 });
      }
    },
    () => {
      mostraAvviso(TESTI[lingua].errore_posizione);
      navigator.geolocation.clearWatch(idControlloPosizione);
      idControlloPosizione = null;
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  );
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
      const tutte = L.latLngBounds(tombe.map((t) => [t.lat, t.lon]));
      mappa.fitBounds(tutte, { padding: [40, 40], maxZoom: 19 });
    }
  })
  .catch(() => mostraAvviso(TESTI[lingua].errore_dati, 0));
