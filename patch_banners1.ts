import fs from 'fs';

let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

// 1. Update states
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');",
  "const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'team_perf'>('teams');\n  const [selectedTeam, setSelectedTeam] = useState<string>('');"
);

// 2. Update availableRds to allow 'all' and initial state
content = content.replace(
  "const [selectedRd, setSelectedRd] = useState<string>('');",
  "const [selectedRd, setSelectedRd] = useState<string>('all');"
);

// 3. Update 'Selecione a Rodada' logic
content = content.replace(
  "if (!selectedRd && availableRds.length > 0) {\n      setSelectedRd(availableRds[0]);\n    }",
  "if (selectedRd === '' && availableRds.length > 0) {\n      setSelectedRd('all');\n    }"
);

fs.writeFileSync('pages/Banners.tsx', content);
