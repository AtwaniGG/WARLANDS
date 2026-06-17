import { redirect } from "next/navigation";

// The hex-world prototype was superseded by the Clash-of-Clans base-builder at /world.
export default function PlayRedirect() {
  redirect("/world");
}
