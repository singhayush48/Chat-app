import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { FullScreenLoader } from '@/components/common/FullScreenLoader';
import { ROUTES } from '@/constants/routes';

// Code-split every page so the initial bundle only ships what's needed
// for the first paint.
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const HomeLayout = lazy(() =>
  import('@/layouts/HomeLayout').then((m) => ({ default: m.HomeLayout }))
);
const EmptyChatScreen = lazy(() =>
  import('@/pages/EmptyChatScreen').then((m) => ({ default: m.EmptyChatScreen }))
);
const ChatConversation = lazy(() => import('@/pages/ChatConversation'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export function AppRoutes() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.HOME} element={<HomeLayout />}>
            <Route index element={<EmptyChatScreen />} />
            <Route path="c/:conversationId" element={<ChatConversation />} />
          </Route>
        </Route>

        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
