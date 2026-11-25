# Recoleta – Guía del cementerio

Una web app gratuita per visitare il Cementerio de la Recoleta (Buenos Aires) da soli: una mappa delle tombe più interessanti, con la storia di ognuna e le indicazioni per arrivarci.

Progetto personale, fatto per imparare a programmare.

## Come funziona

```
dati/tombe.xlsx  ──►  script Python  ──►  app/tombe.json  ──►  web app (mappa + schede)
 (scrivi qui)         (controlla e         (dati pronti         (quello che vede
                       converte)            per l'app)           il visitatore)
```

1. **Dati**: ogni tomba è una riga del foglio Excel (nome, coordinate, sezione, storia in spagnolo e italiano, fonti).
2. **Python**: uno script legge il foglio, controlla gli errori e crea il file che l'app legge.
3. **App**: una pagina web (HTML, CSS, JavaScript) con la mappa e le schede delle tombe. Ogni tomba ha un pulsante "Portami qui" che apre Google Maps.

## Struttura delle cartelle

| Cartella | Contenuto |
|---|---|
| `dati/` | Il foglio Excel con le tombe |
| `script/` | Gli script Python |
| `app/` | La web app |

## Fonte dei dati

Nomi e coordinate delle tombe vengono da [OpenStreetMap](https://www.openstreetmap.org/copyright): © OpenStreetMap contributors, licenza ODbL. L'app deve mostrare questa dicitura.

Il foglio `altre_tombe_osm` dentro `dati/tombe.xlsx` contiene tutte le altre tombe segnate su OpenStreetMap, da cui scegliere le prossime da aggiungere.

## Strumenti

- [VS Code](https://code.visualstudio.com/): l'editor per scrivere il codice
- Python con [pandas](https://pandas.pydata.org/): per leggere e controllare il foglio Excel
- Git e GitHub: storia delle modifiche e pubblicazione online
