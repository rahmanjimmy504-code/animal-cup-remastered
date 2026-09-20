import GameClient from "../GameClient";
import MatchChrome from "./MatchChrome";
import MatchAudio from "./MatchAudio";
import LanHostBridge from "./LanHostBridge";
import MatchPauseMenu from "./MatchPauseMenu";
import MatchTimeline from "./MatchTimeline";
import MatchAccessibility from "./MatchAccessibility";
import "../ui/kit.css";
import "./match.css";

export const metadata = { title: "Animal Cup" };

export default function MatchPage() {
  return <>
    <GameClient />
    <MatchChrome />
    <MatchAudio />
    <MatchPauseMenu />
    <MatchTimeline />
    <MatchAccessibility />
    <LanHostBridge />
  </>;
}
