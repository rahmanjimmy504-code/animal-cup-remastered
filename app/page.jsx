import Landing from "./Landing";
import InstallPrompt from "./InstallPrompt";

// Pre-match landing (owner 2026-06-11): pick teams + formations, then kick
// off into /match. Replaces the old instant-play server redirect.
export const metadata = {
  title: "Animal Cup",
};

export default function Home() {
  return (
    <>
      <Landing />
      <InstallPrompt />
    </>
  );
}
