import os

with open('components/PlayerVsPlayerCompare.tsx', 'r') as f:
    content = f.read()

target = """              {[
                { label: 'Abates Totais', key: 'kills' },
                { label: 'Abates por Queda (Média)', key: 'avg' },"""

replacement = """              {[
                { label: 'Abates Totais', key: 'kills' },
                { label: 'KPM (Abates p/ Minuto)', key: 'kpm' },
                { label: 'Abates por Queda (Média)', key: 'avg' },"""

content = content.replace(target, replacement)

with open('components/PlayerVsPlayerCompare.tsx', 'w') as f:
    f.write(content)
