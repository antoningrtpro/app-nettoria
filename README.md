# NETTORIA — Application de Pricing Débarras

Application web Next.js 14 pour générer des devis de débarras en ligne, avec calcul de distance, génération PDF et envoi par mail.

## Installation

```bash
npm install
```

## Configuration des clés API

### 1. OpenRouteService (calcul de distance routière) — Gratuit, sans CB

1. Rendez-vous sur openrouteservice.org
2. Cliquez sur **Sign Up** → créez un compte gratuit
3. Une fois connecté, allez dans votre **Dashboard** → **API Keys**
4. Cliquez sur **+ Create API Key** → donnez-lui un nom (ex. `nettoria`)
5. Copiez la clé générée

### 2. Resend (envoi de mail) — Gratuit 100 mails/jour

1. Rendez-vous sur resend.com
2. Cliquez sur **Sign Up** → créez un compte gratuit
3. Dans le dashboard, allez dans **API Keys** → **Create API Key**
4. Donnez-lui un nom et copiez la clé

> En plan gratuit Resend, les mails partent depuis `onboarding@resend.dev`. Pour utiliser votre propre domaine, vérifiez-le dans le dashboard Resend.

## Configuration `.env.local`

Éditez le fichier `.env.local` à la racine du projet :

```
OPENROUTESERVICE_API_KEY=votre_cle_ors_ici
RESEND_API_KEY=votre_cle_resend_ici
NEXT_PUBLIC_COMPANY_NAME=NETTORIA
NEXT_PUBLIC_COMPANY_EMAIL=project.nettoria@gmail.com
NEXT_PUBLIC_DEPART_ADDRESS="Palaiseau, 91120, France"
```

## Lancer le projet

```bash
npm run dev
```

L'application est disponible sur http://localhost:3000

## Structure du projet

```
app/
  page.tsx                      Orchestrateur multi-étapes
  api/
    calculate-distance/         Nominatim + OpenRouteService
    send-quote/                 Génération PDF + envoi Resend
components/
  steps/                        Step1 à Step4
  ui/                           ProgressBar, RadioGroup, SliderInput, QuoteDetail, Badge
lib/
  pricing.ts                    Moteur de calcul complet
  pdf-generator.ts              Génération PDF (jsPDF)
  distance.ts                   Géocodage + distance routière
types/
  quote.ts                      Interfaces TypeScript partagées
```

## Moteur de tarification

Prix basé sur un forfait horaire de 55 €/h, auquel s'ajoutent :
- Frais kilométriques (carburant + usure) depuis Palaiseau (91120)
- Forfait déchetterie : 100 € + Forfait camion : 100 €
- Majorations étage, stationnement, démontage, insalubrité
- Traitements spéciaux (amiante, électroménager, etc.)
- Coefficient de délai (urgence 48h → x1.45)

Prix final arrondi au multiple de 10 € supérieur.
