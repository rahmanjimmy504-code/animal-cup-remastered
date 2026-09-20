// FC 26/27-inspired control layer for Animal Cup Remastered.
// We use original controls and names where possible; this is not EA source code.
// Every action has a PC and mobile representation.
export const FC_CONTROLS = {
  pcWASD: {
    move:["W","A","S","D"], sprint:"Shift", jockey:"Ctrl", pass:"J", throughPass:"K",
    lobCross:"W+L", shoot:"L", finesse:"L+F", chip:"L+C", powerShot:"L+P",
    lowDriven:"L+L", trivela:"L+T", tackle:"I", slide:"O", secondDefender:"E",
    switchPlayer:"Q", teammateRun:"R", teammateCall:"C", shield:"Space", trap:"T",
    pause:"Esc",
    tactics:["1","2","3","4","5"], quickTactics:["F1","F2","F3","F4"],
    tacticalSuggestions:["F5","F6","F7","F8"], tacticalFocus:"F9"
  },
  pcArrows: {
    move:["ArrowUp","ArrowLeft","ArrowDown","ArrowRight"], sprint:"Shift", jockey:"Ctrl",
    pass:"A", throughPass:"S", lobCross:"W", shoot:"D", finesse:"F", chip:"C",
    powerShot:"P", lowDriven:"D+D", trivela:"D+T", tackle:"S", slide:"X",
    secondDefender:"E", switchPlayer:"Q", teammateRun:"R", teammateCall:"C",
    shield:"Space", trap:"T", pause:"Esc"
  },
  mobile: {
    move:"Left joystick", sprint:"Sprint (hold)", jockey:"Jockey (hold)",
    pass:"Pass", throughPass:"Through", lobCross:"Lob/Cross", shoot:"Shoot (hold)",
    finesse:"Finesse modifier", chip:"Chip modifier", powerShot:"Power modifier",
    lowDriven:"Tap Shoot again", trivela:"Trivela modifier", tackle:"Tackle",
    slide:"Slide", secondDefender:"2nd Defender", switchPlayer:"Switch",
    teammateRun:"Run", teammateCall:"Call", shield:"Shield",
    setPieces:"Contextual set-piece buttons", tactics:"Tactics panel",
    camera:"Pinch / drag camera"
  }
};

export const WORLD_CUP_2026_RULES = [
  "Official Laws of the Game govern the competition.",
  "Goalkeeper possession limit: 8 seconds; exceeding it awards a corner.",
  "Restarts use visible five-second countdowns where the game's referee protocol applies.",
  "Substitutions and stoppage time are referee-controlled.",
  "Offside, fouls, handball, penalties, yellow/red cards and advantage are match events.",
  "Penalty kicks support regular, chip and controlled placement styles.",
  "Set pieces support corners, free kicks, throw-ins and goal kicks.",
  "VAR-style review is treated as an optional game presentation layer, not an official automatic ruling.",
  "Tournament matches support extra time and penalties when the competition format requires them."
];
