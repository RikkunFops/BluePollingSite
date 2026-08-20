import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/UserPages/LandingPage.tsx"),
    route("admin", "routes/AdminPages/AdminBase.tsx"),
]   satisfies RouteConfig;
