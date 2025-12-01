import { redirect } from "react-router";
import type { Route } from "./+types/logout";

export async function loader({ request }: Route.LoaderArgs) {
  return redirect("/login", {
    headers: {
      "Set-Cookie": "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    },
  });
}
