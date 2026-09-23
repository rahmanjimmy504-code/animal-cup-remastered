import GameClient from "../GameClient";
import MatchChrome from "./MatchChrome";
import MatchAudio from "./MatchAudio";
import LanHostBridge from "./LanHostBridge";
import MatchPauseMenu from "./MatchPauseMenu";
import MatchTimeline from "./MatchTimeline";
import MatchAccessibility from "./MatchAccessibility";
import MatchExtras from "./MatchExtras";
import "./match-final-fix.css";
import "../ui/kit.css";
import "./match.css";
import "./match-extras.css";
import "./ai-lab.css";

export const metadata = { title: "Animal Cup" };

export default function MatchPage() {
  return <>
    <GameClient />
    <MatchChrome />
    <MatchAudio />
    <MatchPauseMenu />
    <MatchTimeline />
    <MatchAccessibility />
    <MatchExtras />
    <LanHostBridge />
  </>;
}
