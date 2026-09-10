// Se amplía el `Request` de Express para que `req.user` exista y esté tipado. Lo
// rellena `requireAuth`, y es opcional porque en las rutas públicas no hay nadie.
export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
