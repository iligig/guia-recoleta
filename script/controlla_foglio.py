# Controlla il foglio delle tombe e segnala cosa manca o cosa è sbagliato
import pandas as pd

tombe = pd.read_excel("dati/tombe.xlsx", dtype=str).fillna("")

for tomba in tombe.to_dict("records"):
    problemi = []

    # Le caselle che non devono restare vuote
    for colonna in ["storia_es", "storia_it", "storia_en", "storia_pt", "fonti"]:
        if tomba[colonna] == "":
            problemi.append("manca " + colonna)

     # Spazi invisibili all'inizio o alla fine
    for colonna in ["id", "nome", "coordinate"]:
        if tomba[colonna] != tomba[colonna].strip():
            problemi.append("spazi in più in " + colonna)

     # Le coordinate: ci sono, sono scritte bene, cadono dentro il cimitero?
    parti = tomba["coordinate"].split(",")
    if tomba["coordinate"] == "":
        problemi.append("mancano le coordinate")
    elif len(parti) != 2:
        problemi.append("le coordinate devono essere due numeri separati da una virgola")
    else:
        latitudine = float(parti[0])
        longitudine = float(parti[1])
        if latitudine < -34.5910 or latitudine > -34.5855:
            problemi.append("latitudine fuori dal cimitero")
        if longitudine < -58.3960 or longitudine > -58.3900:
            problemi.append("longitudine fuori dal cimitero")

    # Il risultato per questa tomba
    print(tomba["id"])
    for problema in problemi:
        print("   -", problema)
    if len(problemi) == 0:
        print("   tutto a posto")