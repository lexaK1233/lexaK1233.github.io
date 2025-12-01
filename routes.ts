import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),
  route("submit", "routes/submit.tsx"),
  route("my-requests", "routes/my-requests.tsx"),
  route("staff", "routes/staff.tsx"),
  route("request/:id", "routes/request.$id.tsx"),
] satisfies RouteConfig;
