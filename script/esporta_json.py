# Prepara i dati per l'app: legge il foglio delle tombe e crea il file app/tombe.json
import json

import pandas as pd

tombe = pd.read_excel("dati/tombe.xlsx", dtype=str).fillna("")

risultato = []
for tomba in tombe.to_dict("records"):
    parti = tomba["coordinate"].split(",")
    if len(parti) != 2:
        print("Salto", tomba["id"], "perché le coordinate mancano o sono scritte male")
        continue

    # Una "scheda" per ogni tomba, nel formato che l'app sa leggere
    risultato.append({
        "id": tomba["id"].strip(),
        "nome": tomba["nome"].strip(),
        "lat": float(parti[0]),
        "lon": float(parti[1]),
        "storia": {
            "es": tomba["storia_es"].strip(),
            "it": tomba["storia_it"].strip(),
        },
        "fonti": tomba["fonti"].split(),
        "leggenda": tomba["leggenda"].strip() == "sì",
    })

# Scriviamo tutte le schede nel file che l'app leggerà
with open("app/tombe.json", "w", encoding="utf-8") as file:
    json.dump(risultato, file, ensure_ascii=False, indent=2)

print("Creato app/tombe.json con", len(risultato), "tombe")
