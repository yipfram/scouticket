# Installer Scouticket

Scouticket permet à un groupe scout de transmettre des justificatifs de dépenses à sa trésorerie par e-mail. Les fichiers sont envoyés en pièces jointes et ne sont pas stockés par l’application.

> [!NOTE]
> Ce guide couvre une installation locale et les prérequis d'un déploiement. La documentation complète est disponible dans [`la documentation`](https://scouticket.fr/).

## Prérequis

| Élément                 | Version ou accès attendu                 |
| ----------------------- | ---------------------------------------- |
| Node.js                 | 20 ou supérieur                          |
| Gestionnaire de paquets | [pnpm](https://pnpm.io/) 12 ou supérieur |
| Base de données         | PostgreSQL accessible par l’application  |
| E-mail                  | Un compte ou service SMTP                |

## Démarrage rapide

Exécutez les commandes suivantes à la racine du projet :

```shell
pnpm install
Copy-Item .env.example .env.local
```

Complétez ensuite les variables requises dans `.env.local`, appliquez les migrations, puis lancez l’application :

```shell
pnpm auth:migrate
pnpm db:migrate
pnpm dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

> [!WARNING]
> N'ajoutez jamais `.env.local` dans un commit et ne partagez jamais ses secrets dans un ticket, une discussion ou une capture d’écran.

## Variables d’environnement

Copiez le modèle fourni puis remplacez les valeurs d’exemple :

```shell
Copy-Item .env.example .env.local
```

### Requises

| Variable             | Rôle                                                    | Exemple local                                          |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`       | URL de connexion PostgreSQL                             | `postgresql://user:password@localhost:5432/scouticket` |
| `BETTER_AUTH_SECRET` | Secret long et aléatoire pour les sessions              | `une-valeur-secrete-longue`                            |
| `AUDIT_LOG_SECRET`   | Secret distinct pour pseudonymiser les journaux d’audit | `un-autre-secret-long`                                 |
| `BETTER_AUTH_URL`    | URL utilisée par Better Auth                            | `http://localhost:3000`                                |
| `APP_URL`            | URL publique utilisée dans les e-mails et redirections  | `http://localhost:3000`                                |
| `SMTP_HOST`          | Serveur SMTP                                            | `smtp.gmail.com`                                       |
| `SMTP_PORT`          | Port SMTP                                               | `587`                                                  |
| `SMTP_SECURE`        | Active SSL/TLS direct                                   | `false`                                                |
| `SMTP_USER`          | Identifiant SMTP                                        | `scouticket@exemple.fr`                                |
| `SMTP_PASSWORD`      | Mot de passe ou jeton SMTP                              | `mot-de-passe-application`                             |

### Optionnelles

| Variable                               | Rôle                                            | Valeur par défaut |
| -------------------------------------- | ----------------------------------------------- | ----------------- |
| `SMTP_FROM`                            | Expéditeur complet ou adresse d’expédition      | `SMTP_USER`       |
| `SMTP_FROM_NAME`                       | Nom affiché de l’expéditeur                     | `Scouticket`      |
| `SMTP_FROM_EMAIL`                      | Adresse de repli si `SMTP_FROM` est absent      | `SMTP_USER`       |
| `GOOGLE_CLIENT_ID`                     | Active la connexion avec Google                 | —                 |
| `GOOGLE_CLIENT_SECRET`                 | Secret OAuth Google                             | —                 |
| `MAINTENANCE_MODE`                     | Active la page de maintenance et bloque les API | `false`           |
| `NEXT_PUBLIC_OPENOBSERVE_SITE`         | URL OpenObserve pour le RUM                     | désactivé         |
| `NEXT_PUBLIC_OPENOBSERVE_CLIENT_TOKEN` | Jeton navigateur OpenObserve                    | désactivé         |
| `NEXT_PUBLIC_OPENOBSERVE_ORGANISATION` | Organisation OpenObserve                        | `default`         |

> [!IMPORTANT]
> L’adresse de la trésorerie n’est pas une variable d’environnement. Un responsable la définit dans chaque groupe, puis la confirme depuis l’e-mail reçu.

### Configuration SMTP courante

| Fournisseur       | `SMTP_HOST`             | `SMTP_PORT` | `SMTP_SECURE` |
| ----------------- | ----------------------- | ----------- | ------------- |
| Gmail             | `smtp.gmail.com`        | `587`       | `false`       |
| Outlook / Hotmail | `smtp-mail.outlook.com` | `587`       | `false`       |
| Microsoft 365     | `smtp.office365.com`    | `587`       | `false`       |
| SMTP avec SSL     | Selon le fournisseur    | `465`       | `true`        |

Pour Gmail, activez la validation en deux étapes et créez un mot de passe d’application. Pour les autres services, utilisez les paramètres communiqués par leur administrateur.

## Base de données et authentification

Les migrations doivent être exécutées pour chaque environnement (local, préproduction et production) :

```shell
pnpm auth:migrate
pnpm db:migrate
```

| Commande            | Effet                                                                         |
| ------------------- | ----------------------------------------------------------------------------- |
| `pnpm auth:migrate` | Crée ou met à jour les tables de Better Auth.                                 |
| `pnpm db:migrate`   | Applique une fois les migrations de `sql/` et les enregistre dans PostgreSQL. |

Si Google est activé, ajoutez les URI de redirection suivants dans Google Cloud Console :

| Environnement | URI de redirection                               |
| ------------- | ------------------------------------------------ |
| Local         | `http://localhost:3000/api/auth/callback/google` |
| Production    | `https://votre-domaine/api/auth/callback/google` |

## Vérifier l’installation

1. Créez un compte sur l’application et validez son adresse e-mail.
2. Créez un groupe, renseignez l’adresse de trésorerie et validez l’e-mail reçu.
3. Envoyez une note de frais de test avec un justificatif.
4. Vérifiez la réception de l’e-mail et de sa pièce jointe.
5. Consultez `http://localhost:3000/api/health` : l’endpoint doit indiquer que la configuration est valide.

## Avant un déploiement

| À faire                  | Détail                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Configurer les variables | Reproduire les variables requises dans l’environnement d’hébergement, avec les URL publiques. |
| Appliquer les migrations | Exécuter `pnpm auth:migrate`, puis `pnpm db:migrate` sur la base de production.               |
| Activer HTTPS            | Nécessaire en production pour l’appareil photo et le service worker.                          |
| Vérifier SMTP            | Envoyer une note de frais de test après le déploiement.                                       |

Pour interrompre temporairement le service, passez `MAINTENANCE_MODE` à `true` puis redéployez. Les API renverront alors `503`. Remettez cette variable à `false` pour le rétablir.

## Qualité et commandes utiles

| Commande        | Usage                                 |
| --------------- | ------------------------------------- |
| `pnpm dev`      | Démarrer le serveur de développement. |
| `pnpm lint`     | Vérifier le code avec ESLint.         |
| `pnpm type`     | Vérifier les types TypeScript.        |
| `pnpm test`     | Exécuter les tests.                   |
| `pnpm build`    | Produire le build de production.      |
| `pnpm validate` | Exécuter lint, types, tests et build. |
| `pnpm format`   | Formater les fichiers du projet.      |

## Dépannage

| Symptôme                                              | Vérifications à effectuer                                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Les e-mails ne partent pas                            | Vérifiez `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, le port et `SMTP_SECURE`. Avec Gmail, utilisez un mot de passe d’application. |
| Erreur liée à `rateLimit` après une connexion sociale | Exécutez `pnpm db:migrate` avec la `DATABASE_URL` de cet environnement.                                                           |
| Les liens d’e-mail sont incorrects                    | Vérifiez que `APP_URL` et `BETTER_AUTH_URL` correspondent exactement à l’URL de l’environnement, sans chemin supplémentaire.      |
| L’appareil photo ne fonctionne pas                    | Utilisez HTTPS en production et autorisez l’accès à la caméra dans le navigateur.                                                 |
| Le service répond `503`                               | Vérifiez que `MAINTENANCE_MODE` est défini sur `false`.                                                                           |

## Documentation associée

- [Installation locale détaillée](docs/technical/local-installation.md)
- [Variables d’environnement](docs/technical/environment-variables.md)
- [Configuration de l’application](docs/technical/configuration.md)
- [Résolution de problèmes](docs/technical/troubleshooting.md)
