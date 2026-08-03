import { redirect } from "next/navigation";

// El middleware ya garantiza que solo llega aquí un usuario autenticado
// (si no, ya fue redirigido a /login).
export default function RootPage() {
  redirect("/app");
}
