"use client";

// Mobile touch controls for play mode. Left = analog joystick (movement).
// Right = action diamond (Lob/Pass/Tackle/Shoot) with a
// held Sprint button in the centre. Two-finger pinch zooms the camera. All input is
// written to the window.__touchInput contract the standalone play loop folds
// into the controller each tick. Pointer events (finger + mouse); SVG glyphs,
// no emoji, to match the HUD icon style.
import { useEffect, useRef } from "react";
import { getGameplayConfig } from "../game/gameplay.js";

function ti() {
  return (
    <div className="tc" aria-hidden>
      <div className="tc-stick" ref={baseRef} onPointerDown={stickDown} onPointerMove={stickMove} onPointerUp={stickUp} onPointerCancel={stickUp}>
        <span className="tc-thumb" ref={thumbRef} />
      </div>
      <div className="tc-left-actions">
        <button type="button" className="tc-mobile-btn tc-mobile-btn--jockey" {...hold("jockey")}>Jockey</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--switch" {...tap("switchPlayer")}>Switch</button>
      </div>
      <div className="tc-actions" aria-label="Match controls">
        <button type="button" className="tc-mobile-btn tc-mobile-btn--lob" {...tap("lob")}>Lob</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--through" {...tap("throughPass")}>Through</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--shoot" {...hold("shoot")}>Shoot</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--pass" {...tap("pass")}>Pass</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--sprint" {...hold("sprint")}>Sprint</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--finesse" {...hold("finesse")}>Finesse</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--tackle" {...tap("tackle")}>Tackle</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--chip" {...tap("chip")}>Chip</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--power" {...hold("powerShot")}>Power</button>
        <button type="button" className="tc-mobile-btn tc-mobile-btn--second" {...hold("secondDefender")}>2nd Defender</button>
      </div>
    </div>
  );}
