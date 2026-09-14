const fs = require('fs');
let content = fs.readFileSync('pages/Schedule.tsx', 'utf8');

// Inject the Phase label into the table header
const targetTh = `                        <span className={\`text-xs font-display font-black \${isNext ? 'text-yellow-300 scale-110' : isLoudRestRound ? 'text-red-400' : ''}\`}>
                          R{r}
                        </span>`;

const replacementTh = `                        {r >= 15 && r <= 20 && (
                          <span className="text-[7px] text-purple-400/90 font-bold uppercase tracking-tighter whitespace-nowrap bg-purple-500/10 px-1 py-0.5 rounded border border-purple-500/30">
                            R. Mundial
                          </span>
                        )}
                        {r >= 21 && r <= 22 && (
                          <span className="text-[7px] text-cyan-400/90 font-bold uppercase tracking-tighter whitespace-nowrap bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/30">
                            Finais
                          </span>
                        )}
                        <span className={\`text-xs font-display font-black \${isNext ? 'text-yellow-300 scale-110' : isLoudRestRound ? 'text-red-400' : ''}\`}>
                          R{r}
                        </span>`;

content = content.replace(targetTh, replacementTh);

fs.writeFileSync('pages/Schedule.tsx', content);
