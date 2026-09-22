"use client";

import { useState, type SubmitEvent } from "react";
import { EditeurUnites } from "@/components/EditeurUnites";
import { UNITES_PAR_DEFAUT, type UniteGroupe } from "@/lib/group";

type EtapeConfiguration = 1 | 2;

/** Affiche la progression stable des trois étapes de configuration d’un groupe. */
function EtapesConfiguration({
  etapeActive,
}: {
  readonly etapeActive: 1 | 2 | 3;
}) {
  const etapes = ["E-mail", "Unités", "Validation"];
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Étapes de configuration">
      {etapes.map((etape, index) => {
        const numero = index + 1;
        const active = numero === etapeActive;
        const terminee = numero < etapeActive;
        return (
          <li key={etape} className="min-w-0 text-center text-xs font-medium">
            <span
              className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full ${
                active || terminee
                  ? "bg-[#1E3A8A] text-white"
                  : "bg-zinc-200 text-zinc-600"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {numero}
            </span>
            <span className={active ? "text-[#1E3A8A]" : "text-zinc-600"}>
              {etape}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Collecte l’e-mail de trésorerie et les unités avant d’envoyer la demande de validation. */
export function ConfigurationGroupe({
  onSaved,
  emailInitial = "",
  unitesInitiales = UNITES_PAR_DEFAUT,
}: {
  readonly onSaved: () => void;
  readonly emailInitial?: string | null;
  readonly unitesInitiales?: UniteGroupe[];
}) {
  const [etape, setEtape] = useState<EtapeConfiguration>(1);
  const [email, setEmail] = useState(emailInitial ?? "");
  const [unites, setUnites] = useState<UniteGroupe[]>(unitesInitiales);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");

  const passerAuxUnites = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreur("");
    setEtape(2);
  };

  const enregistrer = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEnregistrement(true);
    setErreur("");
    try {
      const reponse = await fetch("/api/group/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treasuryEmail: email, units: unites }),
      });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as {
          error?: string;
        } | null;
        setErreur(
          corps?.error ??
            "Impossible d’enregistrer le groupe. Vérifiez les informations puis réessayez.",
        );
        return;
      }
      onSaved();
    } catch {
      setErreur("Impossible d’enregistrer le groupe. Réessayez plus tard.");
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <section
      className="min-h-[31rem] space-y-6"
      aria-labelledby="configuration-groupe"
    >
      <div>
        <h2
          id="configuration-groupe"
          className="text-xl font-semibold text-zinc-900"
        >
          Configurer votre groupe
        </h2>
        <p className="mt-1 min-h-5 text-sm text-zinc-600">
          {etape === 1
            ? "Étape 1 sur 3 : indiquez l’adresse de la trésorerie."
            : "Étape 2 sur 3 : choisissez les unités de votre groupe."}
        </p>
      </div>
      <EtapesConfiguration etapeActive={etape} />

      {etape === 1 ? (
        <form onSubmit={passerAuxUnites} className="space-y-5">
          <div>
            <label
              htmlFor="treasury-email"
              className="block text-sm font-medium text-zinc-700"
            >
              E-mail de la trésorerie (qui recevra les justificatifs)
            </label>
            <input
              id="treasury-email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tresorerie@exemple.fr"
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20"
            />
          </div>
          <button className="w-full rounded-xl bg-[#1E3A8A] p-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#162d69] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:ring-offset-2">
            Continuer
          </button>
        </form>
      ) : (
        <form onSubmit={enregistrer} className="space-y-5">
          <EditeurUnites unites={unites} onChange={setUnites} />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtape(1)}
              className="w-full rounded-xl border border-zinc-300 p-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Retour
            </button>
            <button
              disabled={enregistrement || unites.length === 0}
              className="w-full rounded-xl bg-[#1E3A8A] p-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#162d69] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enregistrement ? "Envoi…" : "Envoyer la validation"}
            </button>
          </div>
        </form>
      )}
      <p className="min-h-5 text-sm text-rose-700" role="alert">
        {erreur}
      </p>
    </section>
  );
}

/** Bloque l’accès aux dépenses jusqu’à la confirmation de l’adresse de trésorerie. */
export function AttenteValidationTresorerie({
  estAdmin,
  onModifier,
}: {
  readonly estAdmin: boolean;
  readonly onModifier: () => void;
}) {
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [message, setMessage] = useState("");

  const renvoyer = async () => {
    setRenvoiEnCours(true);
    setMessage("");
    try {
      const reponse = await fetch("/api/group/resend-verification", {
        method: "POST",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        error?: string;
      } | null;
      setMessage(
        reponse.ok
          ? "Un nouvel e-mail de validation a été envoyé."
          : (corps?.error ?? "Impossible de renvoyer l’e-mail pour le moment."),
      );
    } catch {
      setMessage("Impossible de renvoyer l’e-mail pour le moment.");
    } finally {
      setRenvoiEnCours(false);
    }
  };

  return (
    <section
      className="min-h-[31rem] space-y-6"
      aria-labelledby="validation-tresorerie"
    >
      <div>
        <h2
          id="validation-tresorerie"
          className="text-xl font-semibold text-zinc-900"
        >
          Valider l’e-mail de la trésorerie
        </h2>
        <p className="mt-1 min-h-5 text-sm text-zinc-600">
          Étape 3 sur 3 : la trésorerie doit confirmer son adresse e-mail.
        </p>
      </div>
      <EtapesConfiguration etapeActive={3} />
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <p className="font-medium">Validation en attente</p>
        <p className="mt-2 text-sm">
          Les notes de frais seront disponibles dès que le lien reçu par e-mail
          aura été confirmé. Cette page se met à jour automatiquement.
        </p>
      </div>
      {estAdmin && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void renvoyer()}
            disabled={renvoiEnCours}
            className="w-full rounded-xl bg-[#1E3A8A] p-3 font-semibold text-white transition-colors hover:bg-[#162d69] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {renvoiEnCours ? "Envoi…" : "Renvoyer l’e-mail de validation"}
          </button>
          <button
            type="button"
            onClick={onModifier}
            className="w-full rounded-xl border border-zinc-300 p-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Modifier la configuration
          </button>
        </div>
      )}
      <p className="min-h-10 text-sm text-zinc-600" role="status">
        {message}
      </p>
    </section>
  );
}
