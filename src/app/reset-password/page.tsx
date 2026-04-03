import ResetPassword from '@/pages/ResetPassword';

type RouteSearchParams = {
  userId?: string | string[];
  secret?: string | string[];
  expire?: string | string[];
};

type ResetPasswordRouteProps = {
  searchParams?: RouteSearchParams | Promise<RouteSearchParams>;
};

function isPromiseLike(value: unknown): value is Promise<RouteSearchParams> {
  return value !== null && typeof value === 'object' && 'then' in value;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordRouteProps) {
  const resolvedSearchParams = isPromiseLike(searchParams)
    ? await searchParams
    : searchParams;

  return <ResetPassword searchParams={resolvedSearchParams} />;
}




