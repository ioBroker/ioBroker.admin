# NexoWatt EOS Admin Branding

Diese Variante hält die Adapter-Basis bewusst nahe am upstream `admin`-Adapter, damit Updates sauber übernommen werden können.

## Update-Strategie

1. Fork/Branch auf den aktuellen upstream-Stand bringen.
2. Branding-Patch erneut anwenden.
3. Frontend/Backend bauen und testen.
4. Als internen PR oder Fork-PR mergen.

Empfohlener Ablauf:

```bash
git remote add upstream https://github.com/ioBroker/ioBroker.admin.git
git fetch upstream
git checkout -b nexowatt/eos-admin-branding upstream/master
python scripts/apply-eos-branding.py
npm install
cd src-admin && npm install && cd ..
npm run build
npm test
git add .
git commit -m "feat: add NexoWatt EOS branded admin skin"
```

## Bewusste Entscheidung

Der technische Paketname `iobroker.admin` bleibt erhalten. Das minimiert Update- und Rebase-Konflikte. Sichtbare UI-Bezeichnungen werden zur Laufzeit und in den relevanten Metadaten auf `NexoWatt EOS` gebrandet.
