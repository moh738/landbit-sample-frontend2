import { PropsWithChildren, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

/** Helper: truthy if Redux slice says user is logged in */
function useIsAuthed(): boolean {
  const { isLoggedIn, authToken } = useSelector((state: RootState) => state.user);
  return Boolean(isLoggedIn && authToken);
}

/** Guard for protected routes */
export const RequireAuth = ({ children }: any): ReactElement => {
  const isAuthed = useIsAuthed();

  if (!isAuthed) {
    return <Navigate to={'/'} />;
  }
  return <>{children}</>;
};

/** Guard for routes like login/signup that should not be visible to logged-in users */
export const NoAuth = ({ children }: PropsWithChildren): ReactElement => {
  const isAuthed = useIsAuthed();
  if (isAuthed) {
    return <Navigate to={'/user/dashboard'} />;
  }
  return <>{children}</>;
};
