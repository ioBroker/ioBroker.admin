#!/usr/bin/env python3
"""
NexoWatt EOS branding hook.

Diese Datei ist als Platzhalter/Marker im Paket enthalten. Der vollständige Patch wurde auf diese
Arbeitskopie angewendet. Für künftige Rebases bitte die Patch-Datei aus dem Lieferpaket bzw.
den Commit-Diff verwenden und diesen Hook als stabilen Einstiegspunkt behalten.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
print(f"NexoWatt EOS branding already applied in {ROOT}")
