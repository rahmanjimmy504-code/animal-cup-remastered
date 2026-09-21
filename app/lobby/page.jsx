import LobbyClient from "./LobbyClient";
import { redirect } from "next/navigation";
import "./lobby.css";

export const metadata = {
  title: "Animal Cup · LAN",
};

// LAN lobby route. Reached from the Landing's "局域网联机" button carrying the
// chosen teams: /lobby?red=&blue=&side=&ai= . searchParams is async in Next 15.
export default async function LobbyPage({ searchParams }) {
  const sp = (await searchParams) || {};
  if (sp.join) redirect(`/pad?room=${encodeURIComponent(String(sp.join))}`);
  const red = (sp.red || "argentina").toString();
  const blue = (sp.blue || "portugal").toString();
  const side = (sp.side || "home").toString();
  const ai = (sp.ai || "0").toString();
  const time = (sp.time || "6").toString();
  const extraTime = sp.extra === "1";
  const penalties = sp.pens === "1";
  return <LobbyClient red={red} blue={blue} side={side} ai={ai} time={time} extraTime={extraTime} penalties={penalties} />;
}
