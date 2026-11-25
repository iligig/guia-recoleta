# Il mio primo programma: legge il foglio delle tombe e lo mostra
import pandas as pd
tombe = pd.read_excel("dati/tombe.xlsx")
print("Nel foglio ci sono", len(tombe), "tombe:")
print(tombe["nome"])