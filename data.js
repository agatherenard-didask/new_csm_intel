// MOCK — à remplacer par fetch direct de la propriété HubSpot "csm_workload" (déjà calculée côté HubSpot, ne pas recalculer côté dashboard)
export const csmWorkload = {
  "Agathe Renard":   123,
  "Antoine Michon":   94,
  "Florian Guillot":  95,
  "Adeline X":        87,
  "Alexandre Y":     110,
};

// Source : Typeform → HubSpot (champ HubSpot custom property "nps_score")
// MOCK — sources à confirmer (Intercom et/ou Slack) ; à brancher via HubSpot si possible pour limiter les sources d'ingestion
export const DB = [
  {id:"1", name:"Uptoo", tier:"Premium", csm:"Agathe", kam:"Marion",
   pulse:5, start:"01/01/2026", end:"31/12/2026", uLog:2, lLog:1, meet:10, next:"15/06/2026",
   aiAct:true, aiMsg:18, coachAct:false, coachMsg:0, trend:5,
   seatsUsed:120, seatsContract:100, creditsUsed:450, creditsContract:500, mrr:4200, nps:72,
   // MOCK — à brancher sur HubSpot custom property "lifecyclestage" ou équivalent
   clientStage:"Conception/diffusion",
   // MOCK — à brancher sur Didask App API ou export quotidien (count + last date).
   contentCreationCount: 22, lastContentCreatedDate: "2026-04-28",
   // MOCK — sources : HubSpot Engagements (emails, calls, meetings) + Intercom (tickets) + Slack API.
   lastEmailDate: "2026-04-22", lastInteractionDate: "2026-04-22",
   // MOCK — appUrl à brancher sur Didask App, slackChannelUrl via Slack API ou table de mapping.
   appName: "Uptoo", appUrl: "https://app.didask.com/admin/organizations/1001", slackChannelUrl: "https://didask.slack.com/channels/client-uptoo",
   onboarding:{
     track:"mentoring",
     currentStep:"Atelier 3",
     startDate:"2026-01-08",
     plannedEndDate:"2026-03-28",
     mentor:"Nathalie",
     mentorSentiment:5,
     mentorNote:"Équipe très réactive, champions internes très actifs.",
   },
   // MOCK — historique de 30 jours, à remplacer par snapshots HubSpot ou table dédiée d'historique.
   healthScoreHistory: [75,77,75,78,80,79,82,81,83,85,84,86,87,85,88,89,87,90,91,89,92,93,95,94,96,97,96,98,99,100],
   riskChurnHistory:   [28,26,27,25,23,24,22,21,20,18,19,17,16,15,13,14,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 2, 1, 0],
   supportConversations:[
     {date:"2026-04-15", topic:"Onboarding nouvelles équipes commerciales"},
     {date:"2026-03-02", topic:"Question droits administrateurs"},
     {date:"2026-01-20", topic:"Demande d'export des statistiques"},
     {date:"2025-11-08", topic:"Configuration parcours IA"},
     {date:"2025-08-14", topic:"Intégration SSO entreprise"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-04-18", topic:"Erreur affichage module vidéo",        status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/44001"},
     {date:"2026-02-11", topic:"Bug export CSV rapports",               status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/44002"},
     {date:"2025-10-05", topic:"Accès refusé certains apprenants",      status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/44003"},
   ]},

  {id:"2", name:"Clariane", tier:"Premium", csm:"Adeline", kam:"Valérie",
   pulse:2, start:"15/05/2025", end:"15/05/2026", uLog:45, lLog:60, meet:65, next:null,
   aiAct:true, aiMsg:3, coachAct:false, coachMsg:0, trend:-12,
   seatsUsed:45, seatsContract:50, creditsUsed:100, creditsContract:200, mrr:6500, nps:34,
   // MOCK — à brancher sur HubSpot custom property "lifecyclestage" ou équivalent
   clientStage:"Running",
   contentCreationCount: 2, lastContentCreatedDate: "2026-02-10",
   // MOCK — sources : HubSpot Engagements (emails, calls, meetings) + Intercom (tickets) + Slack API.
   lastEmailDate: "2026-04-10", lastInteractionDate: "2026-04-22",
   // MOCK — appUrl à brancher sur Didask App, slackChannelUrl via Slack API ou table de mapping.
   appName: "Clariane", appUrl: "https://app.didask.com/admin/organizations/1002", slackChannelUrl: "https://didask.slack.com/channels/client-clariane",
   onboarding:{
     track:"formation initiale",
     currentStep:"Terminé",
     startDate:"2025-05-22",
     plannedEndDate:"2025-10-31",
     mentor:"Charles",
     mentorSentiment:2,
     mentorNote:"Adoption difficile malgré l'accompagnement renforcé.",
   },
   // MOCK — sondage post-formation Typeform → HubSpot → Dashboard. Custom properties HubSpot à créer : post_training_avg_score, post_training_response_count, post_training_invited_count, post_training_dimensions_*, post_training_verbatim_positive, post_training_verbatim_critical, post_training_typeform_url.
   postTrainingSurvey: {
     averageScore: 6.2,
     responseCount: 12,
     invitedCount: 20,
     completedAt: "2025-11-15",
     dimensions: { pedagogie: 6.4, mentor: 6.8, plateforme: 5.5, roi: 6.0 },
     verbatims: {
       positive: "Certains modules étaient bien construits, le rythme des ateliers nous convenait.",
       critical: "L'adoption a été difficile : les équipes n'ont pas adhéré et l'accompagnement n'a pas suffi à lever les résistances internes.",
     },
     typeformResultsUrl: "https://didask.typeform.com/results/cla2025",
   },
   // MOCK — historique de 30 jours, à remplacer par snapshots HubSpot ou table dédiée d'historique.
   healthScoreHistory: [60,58,57,55,54,52,51,50,48,47,46,44,43,42,40,38,37,35,33,31,30,28,27,25,22,20,15,12, 8, 5],
   riskChurnHistory:   [30,32,33,35,37,38,40,42,44,45,47,49,51,52,54,56,58,60,62,63,65,67,70,72,75,78,82,85,88,92],
   supportConversations:[
     {date:"2026-04-20", topic:"Relance suite baisse d'engagement"},
     {date:"2026-04-01", topic:"Point sur les objectifs Q1"},
     {date:"2026-03-10", topic:"Problème adoption plateforme RH"},
     {date:"2026-02-14", topic:"Demande de support onboarding"},
     {date:"2026-01-05", topic:"Discussion renouvellement contrat"},
     {date:"2025-10-22", topic:"Bilan déploiement initial"},
     {date:"2025-07-30", topic:"Kick-off projet"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-04-22", topic:"Utilisateurs bloqués après MAJ",        status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/55001"},
     {date:"2026-04-15", topic:"Permissions rôles incorrectes",          status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/55002"},
     {date:"2026-04-05", topic:"Synchronisation SIRH défaillante",       status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/55003"},
     {date:"2026-03-28", topic:"Rapport hebdo vide pour 3 managers",     status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/55004"},
     {date:"2026-03-15", topic:"Erreur 403 connexion SSO",               status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/55005"},
     {date:"2026-02-28", topic:"Contenu non accessible mobile",          status:"abandonné",url:"https://app.intercom.com/a/apps/didask01/conversations/55006"},
     {date:"2026-01-12", topic:"Bug notation quiz",                      status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/55007"},
     {date:"2025-11-18", topic:"Import CSV échoué",                      status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/55008"},
   ]},

  {id:"3", name:"Marvesting", tier:"Standard", csm:"Antoine", kam:"Marion",
   pulse:4, start:"20/01/2026", end:"20/01/2027", uLog:5, lLog:2, meet:45, next:"10/05/2026",
   aiAct:true, aiMsg:12, coachAct:true, coachMsg:8, trend:2,
   seatsUsed:80, seatsContract:80, creditsUsed:550, creditsContract:500, mrr:2100, nps:61,
   // MOCK — à brancher sur HubSpot custom property "lifecyclestage" ou équivalent
   clientStage:"Onboarding",
   contentCreationCount: 11, lastContentCreatedDate: "2026-04-20",
   // MOCK — sources : HubSpot Engagements (emails, calls, meetings) + Intercom (tickets) + Slack API.
   lastEmailDate: "2026-04-18", lastInteractionDate: "2026-04-18",
   // MOCK — appUrl à brancher sur Didask App, slackChannelUrl via Slack API ou table de mapping.
   appName: "Marvesting", appUrl: "https://app.didask.com/admin/organizations/1003", slackChannelUrl: null,
   onboarding:{
     track:"formation initiale",
     currentStep:"Atelier 2",
     startDate:"2026-01-27",
     plannedEndDate:"2026-06-15",
     mentor:"Nathalie",
     mentorSentiment:4,
     mentorNote:"Bonne dynamique, responsables de formation très impliqués.",
   },
   // MOCK — historique de 30 jours, à remplacer par snapshots HubSpot ou table dédiée d'historique.
   healthScoreHistory: [70,72,71,73,75,74,76,77,78,80,79,81,82,83,85,84,86,87,86,88,89,90,91,92,91,92,93,94,94,95],
   riskChurnHistory:   [25,24,22,23,21,20,19,18,17,15,16,14,13,12,11,10, 9,10, 8, 7, 6, 5, 6, 5, 4, 5, 4, 3, 4, 3],
   supportConversations:[
     {date:"2026-03-25", topic:"Présentation nouvelles fonctionnalités IA"},
     {date:"2026-01-14", topic:"Bilan formation managers"},
     {date:"2025-10-30", topic:"Question sur les rapports personnalisés"},
     {date:"2025-07-12", topic:"Déploiement module compliance"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-02-08", topic:"Erreur chargement parcours",            status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/66001"},
     {date:"2025-12-19", topic:"Problème certificats PDF",              status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/66002"},
     {date:"2025-09-04", topic:"Accès mobile KO après update",          status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/66003"},
   ]},

  {id:"4", name:"Tasq-OM", tier:"Light", csm:"Florian", kam:"Valérie",
   pulse:3, start:"01/04/2025", end:"20/05/2026", uLog:25, lLog:10, meet:120, next:null,
   aiAct:false, aiMsg:0, coachAct:false, coachMsg:0, trend:-5,
   seatsUsed:15, seatsContract:20, creditsUsed:50, creditsContract:100, mrr:800, nps:null,
   // MOCK — à brancher sur HubSpot custom property "lifecyclestage" ou équivalent
   clientStage:"Running",
   contentCreationCount: 1, lastContentCreatedDate: "2025-12-03",
   // MOCK — sources : HubSpot Engagements (emails, calls, meetings) + Intercom (tickets) + Slack API.
   lastEmailDate: "2026-03-15", lastInteractionDate: "2026-04-10",
   // MOCK — appUrl à brancher sur Didask App, slackChannelUrl via Slack API ou table de mapping.
   appName: "Tasq-OM", appUrl: "https://app.didask.com/admin/organizations/1004", slackChannelUrl: null,
   onboarding:{
     track:"mentoring",
     currentStep:"Terminé",
     startDate:"2025-04-07",
     plannedEndDate:"2025-07-04",
     mentor:"Fadma",
     mentorSentiment:3,
     mentorNote:"Onboarding correct, engagement post-lancement à consolider.",
   },
   postTrainingSurvey: {
     averageScore: 7.1,
     responseCount: 11,
     invitedCount: 15,
     completedAt: "2025-07-18",
     dimensions: { pedagogie: 7.2, mentor: 7.5, plateforme: 6.8, roi: 6.9 },
     verbatims: {
       positive: "La progression des ateliers était bien calibrée, Fadma a su s'adapter à notre rythme.",
       critical: "L'engagement post-formation a été compliqué à maintenir sans ressource dédiée en interne.",
     },
     typeformResultsUrl: "https://didask.typeform.com/results/tasq2025",
   },
   // MOCK — historique de 30 jours, à remplacer par snapshots HubSpot ou table dédiée d'historique.
   healthScoreHistory: [58,60,62,60,61,59,62,61,59,60,62,61,59,61,62,60,61,60,62,61,59,60,61,62,60,61,59,60,61,60],
   riskChurnHistory:   [50,52,51,53,52,54,53,52,54,55,53,54,55,56,54,55,56,54,56,57,55,56,57,56,57,58,56,57,58,57],
   supportConversations:[
     {date:"2026-03-01", topic:"Point trimestriel usage"},
     {date:"2025-10-15", topic:"Configuration initiale parcours"},
     {date:"2025-06-20", topic:"Formation administrateurs"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-04-10", topic:"Bug affichage leçon interactive",       status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/77001"},
     {date:"2026-02-22", topic:"Réinitialisation mot de passe en masse",status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/77002"},
     {date:"2025-11-30", topic:"Lenteurs plateforme signalées",          status:"abandonné",url:"https://app.intercom.com/a/apps/didask01/conversations/77003"},
     {date:"2025-08-17", topic:"Import utilisateurs échoué",             status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/77004"},
   ]},

  {id:"5", name:"Cap Retraite", tier:"Standard", csm:"Alexandre", kam:"Marion",
   pulse:1, start:"12/06/2025", end:"12/06/2026", uLog:70, lLog:80, meet:90, next:null,
   aiAct:false, aiMsg:0, coachAct:false, coachMsg:0, trend:-20,
   seatsUsed:10, seatsContract:50, creditsUsed:10, creditsContract:200, mrr:1800, nps:18,
   // MOCK — à brancher sur HubSpot custom property "lifecyclestage" ou équivalent
   clientStage:"Running",
   contentCreationCount: 0, lastContentCreatedDate: "2025-09-15",
   // MOCK — sources : HubSpot Engagements (emails, calls, meetings) + Intercom (tickets) + Slack API.
   lastEmailDate: "2026-03-05", lastInteractionDate: "2026-04-26",
   // MOCK — appUrl à brancher sur Didask App, slackChannelUrl via Slack API ou table de mapping.
   appName: "Cap Retraite", appUrl: "https://app.didask.com/admin/organizations/1005", slackChannelUrl: null,
   onboarding:{
     track:"formation initiale",
     currentStep:"Terminé",
     startDate:"2025-06-19",
     plannedEndDate:"2025-12-05",
     mentor:"Charles",
     mentorSentiment:1,
     mentorNote:"Fort taux d'abandon, résistance RH importante pendant l'onboarding.",
   },
   postTrainingSurvey: {
     averageScore: 5.3,
     responseCount: 9,
     invitedCount: 28,
     completedAt: "2025-12-20",
     dimensions: { pedagogie: 5.5, mentor: 4.8, plateforme: 5.0, roi: 5.2 },
     verbatims: {
       positive: "Quelques modules de contenu étaient pertinents pour nos équipes de terrain.",
       critical: "Le taux d'abandon a été très élevé dès le début. La résistance des équipes RH et l'absence de championnat interne ont fortement compromis la formation.",
     },
     typeformResultsUrl: "https://didask.typeform.com/results/cap2025",
   },
   // MOCK — historique de 30 jours, à remplacer par snapshots HubSpot ou table dédiée d'historique.
   healthScoreHistory: [68,66,65,63,62,60,59,57,56,54,53,52,51,50,49,48,47,46,45,44,43,43,42,42,41,42,41,41,41,40],
   riskChurnHistory:   [30,32,33,35,36,38,39,41,42,44,45,46,48,49,50,51,52,53,54,55,56,57,58,59,60,60,61,61,62,62],
   supportConversations:[
     {date:"2026-04-24", topic:"Escalade insatisfaction utilisateurs"},
     {date:"2026-03-18", topic:"Point critique engagement"},
     {date:"2026-02-05", topic:"Réunion plan de remédiation"},
     {date:"2025-12-10", topic:"Bilan fin d'année décevant"},
     {date:"2025-09-22", topic:"Problèmes signalés par les RH"},
     {date:"2025-06-14", topic:"Premier bilan déploiement"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-04-26", topic:"Accès impossible pour 8 utilisateurs",  status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/88001"},
     {date:"2026-03-20", topic:"Crash module évaluation",               status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/88002"},
     {date:"2026-02-14", topic:"Données stats erronées",                status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/88003"},
     {date:"2025-12-03", topic:"Contenu non synchronisé",               status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/88004"},
     {date:"2025-09-30", topic:"Erreur import LDAP",                    status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/88005"},
   ]},

  {id:"6", name:"L'Oréal", tier:"Premium", csm:"Agathe", kam:"Valérie",
   pulse:5, start:"01/02/2026", end:"31/01/2027", uLog:1, lLog:1, meet:5, next:"10/06/2026",
   aiAct:true, aiMsg:25, coachAct:true, coachMsg:15, trend:15,
   seatsUsed:510, seatsContract:500, creditsUsed:1200, creditsContract:1000, mrr:12000, nps:81,
   // MOCK — à brancher sur HubSpot custom property "lifecyclestage" ou équivalent
   clientStage:"Kick off",
   contentCreationCount: 25, lastContentCreatedDate: "2026-04-29",
   // MOCK — sources : HubSpot Engagements (emails, calls, meetings) + Intercom (tickets) + Slack API.
   lastEmailDate: "2026-04-28", lastInteractionDate: "2026-04-28",
   // MOCK — appUrl à brancher sur Didask App, slackChannelUrl via Slack API ou table de mapping.
   appName: "L'Oréal EMEA", appUrl: "https://app.didask.com/admin/organizations/1006", slackChannelUrl: "https://didask.slack.com/channels/client-loreal",
   onboarding:{
     track:"mentoring",
     currentStep:"Session 0",
     startDate:"2026-02-12",
     plannedEndDate:"2026-05-22",
     mentor:"Thelma",
     mentorSentiment:5,
     mentorNote:"Kick off très engageant, forte mobilisation des équipes EMEA.",
   },
   // MOCK — historique de 30 jours, à remplacer par snapshots HubSpot ou table dédiée d'historique.
   healthScoreHistory: [60,62,63,65,67,66,68,70,71,73,74,73,75,77,78,80,81,82,84,85,86,87,89,90,92,93,94,96,98,100],
   riskChurnHistory:   [35,33,32,30,29,27,28,26,25,23,22,21,19,18,17,15,14,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
   supportConversations:[
     {date:"2026-04-21", topic:"Préparation déploiement international"},
     {date:"2026-04-01", topic:"Bilan T1 — résultats excellents"},
     {date:"2026-03-12", topic:"Extension équipe marketing EMEA"},
     {date:"2026-02-20", topic:"Workshop création contenu IA"},
     {date:"2026-01-08", topic:"Onboarding vague 3 apprenants"},
     {date:"2025-11-25", topic:"Configuration Coach IA avancée"},
     {date:"2025-09-14", topic:"Bilan post-lancement"},
     {date:"2025-07-03", topic:"Formation champions internes"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-03-28", topic:"Accès SSO Okta — nouvelle entité",      status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/99001"},
     {date:"2026-01-30", topic:"Lenteurs ponctuelles fin de mois",       status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/99002"},
     {date:"2025-10-18", topic:"Paramétrage langue par défaut",          status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/99003"},
     {date:"2025-08-22", topic:"Bug export reporting groupe",            status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/99004"},
   ]},
];
