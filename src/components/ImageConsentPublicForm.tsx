"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  teams: readonly string[];
  policyText: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-csv-orange px-6 py-4 text-base font-black text-white shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-75"
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          Enregistrement en cours…
        </>
      ) : (
        "Enregistrer mon choix"
      )}
    </button>
  );
}

export default function ImageConsentPublicForm({ action, teams, policyText }: Props) {
  const [playerFirstName, setPlayerFirstName] = useState("");
  const [playerLastName, setPlayerLastName] = useState("");
  const [personType, setPersonType] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [respondentRole, setRespondentRole] = useState("");

  function playerFullName(firstName = playerFirstName, lastName = playerLastName) {
    return `${firstName.trim()} ${lastName.trim()}`.trim();
  }

  function choosePersonType(nextType: string) {
    setPersonType(nextType);
    if (nextType === "adult") {
      setRespondentName(playerFullName());
      setRespondentRole("player");
    } else {
      // Si la personne avait sélectionné "majeur" juste avant, on ne garde pas
      // automatiquement son identité comme représentant légal.
      if (respondentRole === "player") setRespondentName("");
      setRespondentRole("");
    }
  }

  return (
    <form action={action} className="mt-6 space-y-6">
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">1 · Joueur concerné</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-neutral-700">
            Prénom du joueur
            <input
              name="playerFirstName"
              required
              value={playerFirstName}
              onChange={(event) => {
                const next = event.target.value;
                setPlayerFirstName(next);
                if (personType === "adult") setRespondentName(playerFullName(next, playerLastName));
              }}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-normal outline-none focus:border-orange-300"
            />
          </label>
          <label className="text-sm font-bold text-neutral-700">
            Nom du joueur
            <input
              name="playerLastName"
              required
              value={playerLastName}
              onChange={(event) => {
                const next = event.target.value;
                setPlayerLastName(next);
                if (personType === "adult") setRespondentName(playerFullName(playerFirstName, next));
              }}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-normal outline-none focus:border-orange-300"
            />
          </label>
          <label className="text-sm font-bold text-neutral-700 sm:col-span-2">
            Équipe
            <select
              name="team"
              required
              defaultValue=""
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-normal outline-none focus:border-orange-300"
            >
              <option value="" disabled>Sélectionner l’équipe</option>
              {teams.map((teamName) => <option key={teamName} value={teamName}>{teamName}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4 text-sm font-semibold text-neutral-700">
            <input
              type="radio"
              name="personType"
              value="adult"
              required
              checked={personType === "adult"}
              onChange={() => choosePersonType("adult")}
              className="mt-1"
            />
            <span><strong className="block text-neutral-950">Joueur majeur</strong>Je réponds pour moi-même.</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4 text-sm font-semibold text-neutral-700">
            <input
              type="radio"
              name="personType"
              value="minor"
              required
              checked={personType === "minor"}
              onChange={() => choosePersonType("minor")}
              className="mt-1"
            />
            <span><strong className="block text-neutral-950">Joueur mineur</strong>Je suis son représentant légal.</span>
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">2 · Personne qui répond</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-neutral-700">
            Nom et prénom
            <input
              name="respondentName"
              required
              value={respondentName}
              onChange={(event) => setRespondentName(event.target.value)}
              readOnly={personType === "adult"}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-normal outline-none focus:border-orange-300 read-only:bg-neutral-50 read-only:text-neutral-600"
            />
          </label>
          <label className="text-sm font-bold text-neutral-700">
            Qualité
            <select
              name="respondentRole"
              required
              value={respondentRole}
              onChange={(event) => setRespondentRole(event.target.value)}
              disabled={personType === "adult"}
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-normal outline-none focus:border-orange-300 disabled:bg-neutral-50 disabled:text-neutral-600"
            >
              <option value="" disabled>Sélectionner</option>
              <option value="player">Joueur majeur</option>
              <option value="mother">Mère / représentante légale</option>
              <option value="father">Père / représentant légal</option>
              <option value="guardian">Autre représentant légal</option>
            </select>
            {personType === "adult" ? <input type="hidden" name="respondentRole" value="player" /> : null}
          </label>
          <label className="text-sm font-bold text-neutral-700 sm:col-span-2">
            E-mail <span className="font-normal text-neutral-400">(facultatif)</span>
            <input name="respondentEmail" type="email" className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-normal outline-none focus:border-orange-300" />
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">3 · Utilisation de l’image</div>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-700">{policyText}</p>
        <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-relaxed text-orange-950">
          <strong>Pour un joueur mineur :</strong> le CS Viriat conserve également son autorisation papier de début de saison. La publication n’est considérée comme validée dans le site que lorsque la confirmation numérique et le contrôle du document papier sont tous les deux positifs.
        </div>
      </section>

      <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">4 · Votre choix</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 font-black text-emerald-800">
            <input type="radio" name="choice" value="granted" required /> J’AUTORISE
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 font-black text-red-800">
            <input type="radio" name="choice" value="refused" required /> JE N’AUTORISE PAS
          </label>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-neutral-500">
          En validant, vous confirmez avoir pris connaissance des usages décrits ci-dessus. Une autorisation accordée peut être retirée ultérieurement en contactant le CS Viriat.
        </p>
      </section>

      <SubmitButton />
    </form>
  );
}
