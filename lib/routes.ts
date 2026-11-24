export type Route = { href: string; label: string; index: string };

export const routes: Route[] = [
  { href: "/services/", label: "Services", index: "01" },
  { href: "/industries/", label: "Industries", index: "02" },
  { href: "/case-studies/", label: "Case Studies", index: "03" },
  { href: "/culture/", label: "Culture", index: "04" },
  { href: "/contact/", label: "Contact", index: "05" },
];

export const home: Route = { href: "/", label: "Home", index: "00" };

export const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

// A detail page (/services/discovery/) belongs to its section.
export const inRoute = (path: string, href: string) => {
  const p = norm(path);
  const h = norm(href);
  return p === h || (h !== "/" && p.startsWith(`${h}/`));
};

export const findRoute = (href: string): Route =>
  [home, ...routes].find((r) => norm(r.href) === norm(href)) ?? routes.find((r) => inRoute(href, r.href)) ?? home;
