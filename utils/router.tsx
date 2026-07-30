import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface LocationState {
  pathname: string;
  search: string;
  state?: unknown;
}

interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

interface RouterContextValue {
  location: LocationState;
  navigate: (to: string | number, options?: NavigateOptions) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);
const ParamsContext = createContext<Record<string, string>>({});

const safePath = (value: string): string => {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  return value;
};

const readLocation = (): LocationState => {
  const raw = window.location.hash.slice(1) || '/';
  const safe = safePath(raw);
  const [pathname, query = ''] = safe.split('?');
  return { pathname: pathname || '/', search: query ? `?${query}` : '' };
};

const hashFor = (to: string) => `#${safePath(to)}`;

export const HashRouter: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [location, setLocation] = useState<LocationState>(readLocation);

  useEffect(() => {
    const updateLocation = () => setLocation(readLocation());
    window.addEventListener('hashchange', updateLocation);
    return () => window.removeEventListener('hashchange', updateLocation);
  }, []);

  const navigate = useCallback((to: string | number, options: NavigateOptions = {}) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }

    const target = hashFor(to);
    if (options.replace) {
      window.history.replaceState(options.state ?? null, '', target);
      setLocation(readLocation());
      return;
    }

    if (window.location.hash === target) {
      setLocation(readLocation());
      return;
    }
    window.location.hash = target;
  }, []);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

const useRouter = (): RouterContextValue => {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error('Os componentes de navegação devem ser usados dentro de HashRouter.');
  }
  return router;
};

export const useLocation = (): LocationState => useRouter().location;
export const useNavigate = (): RouterContextValue['navigate'] => useRouter().navigate;
export const useParams = <T extends Record<string, string> = Record<string, string>>(): Partial<T> => useContext(ParamsContext) as Partial<T>;

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ to, onClick, ...props }, ref) => {
  const navigate = useNavigate();
  return (
    <a
      {...props}
      ref={ref}
      href={hashFor(to)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        event.preventDefault();
        navigate(to);
      }}
    />
  );
});
Link.displayName = 'Link';

type NavLinkProps = LinkProps & {
  end?: boolean;
  className?: string | ((context: { isActive: boolean }) => string);
};

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(({ to, end = false, className, ...props }, ref) => {
  const { pathname } = useLocation();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;
  return <Link {...props} ref={ref} to={to} className={resolvedClassName} aria-current={isActive ? 'page' : undefined} />;
});
NavLink.displayName = 'NavLink';

export const Navigate: React.FC<{ to: string; replace?: boolean; state?: unknown }> = ({ to, replace, state }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);
  return null;
};

interface RouteProps {
  path: string;
  element: React.ReactNode;
}

export const Route: React.FC<RouteProps> = () => null;

const matchPath = (pattern: string, pathname: string): Record<string, string> | null => {
  if (pattern === '*') return {};
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);
  if (patternSegments.length !== pathSegments.length) return null;

  return patternSegments.reduce<Record<string, string> | null>((params, segment, index) => {
    if (!params) return null;
    const actual = pathSegments[index];
    if (segment.startsWith(':')) {
      params[segment.slice(1)] = decodeURIComponent(actual);
      return params;
    }
    return segment === actual ? params : null;
  }, {});
};

export const Routes: React.FC<{ children: React.ReactNode; location?: LocationState }> = ({ children, location: suppliedLocation }) => {
  const currentLocation = suppliedLocation ?? useLocation();
  const routes = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<RouteProps>[];
  const match = routes.map((route) => ({ route, params: matchPath(route.props.path, currentLocation.pathname) })).find(({ params }) => params !== null);

  if (!match || match.params === null) return null;
  return <ParamsContext.Provider value={match.params}>{match.route.props.element}</ParamsContext.Provider>;
};

export const useSearchParams = (): [URLSearchParams, (next: URLSearchParams | Record<string, string> | string, options?: NavigateOptions) => void] => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const setSearchParams = useCallback((next: URLSearchParams | Record<string, string> | string, options?: NavigateOptions) => {
    const query = typeof next === 'string' ? next : new URLSearchParams(next).toString();
    navigate(`${location.pathname}${query ? `?${query.replace(/^\?/, '')}` : ''}`, options);
  }, [location.pathname, navigate]);
  return [params, setSearchParams];
};
