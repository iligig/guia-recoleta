# Cerca su OpenStreetMap le coordinate delle tombe del foglio
import time

import pandas as pd
import requests

# Lo "sportello" (API) di OpenStreetMap che trova un luogo a partire dal nome
SPORTELLO = "https://nominatim.openstreetmap.org/search"

# Un rettangolo intorno al cimitero: cerchiamo solo lì dentro
RETTANGOLO_CIMITERO = "-58.3960,-34.5855,-58.3900,-34.5910"

tombe = pd.read_excel("dati/tombe.xlsx")

for nome in tombe["cerca_come"]:
    # La domanda da fare allo sportello
    domanda = {
        "q": nome,                         # cosa cerchiamo
        "format": "json",                  # in che formato vogliamo la risposta
        "viewbox": RETTANGOLO_CIMITERO,    # dove cercare
        "bounded": 1,                      # 1 = solo dentro il rettangolo
    }

    # Facciamo la domanda e leggiamo la risposta
    risposta = requests.get(
        SPORTELLO,
        params=domanda,
        headers={"User-Agent": "guia-recoleta (progetto personale di studio)"},
        timeout=30,
    )
    risultati = risposta.json()

    # Mostriamo cosa abbiamo trovato
    print()
    print("Cerco:", nome)
    if len(risultati) == 0:
        print("   Non trovata: cercala a mano su Google Maps")
    for risultato in risultati:
        print("  ", risultato["name"], "->", risultato["lat"] + ", " + risultato["lon"])

    # Lo sportello chiede di fare al massimo una domanda al secondo
    time.sleep(1)
