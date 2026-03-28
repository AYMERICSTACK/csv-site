import { logoutAction } from "@/app/admin/actions";

export default function AdminLogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
      >
        Déconnexion
      </button>
    </form>
  );
}
