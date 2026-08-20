const fs = require('fs');

function fixTeam() {
    let code = fs.readFileSync('components/TeamVsTeamCombatCompare.tsx', 'utf-8');
    // It currently has `          </div>\n        )}\n      </div>`
    // We want `          </div>\n        </div>\n        )}\n      </div>`
    code = code.replace(/          <\/div>\n        \)\}\n      <\/div>/g, '          </div>\n        </div>\n        )}\n      </div>');
    fs.writeFileSync('components/TeamVsTeamCombatCompare.tsx', code);
}
fixTeam();

function fixPlayer() {
    let code = fs.readFileSync('components/PlayerVsPlayerCompare.tsx', 'utf-8');
    code = code.replace(/          <\/div>\n        \)\}\n      <\/div>/g, '          </div>\n        </div>\n        )}\n      </div>');
    
    // Some sections in Player might be different. 
    // SEÇÃO 5: `<div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">`
    
    fs.writeFileSync('components/PlayerVsPlayerCompare.tsx', code);
}
fixPlayer();
