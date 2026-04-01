const fs = require('fs');

const fr = {
  "common": {
    "welcome": "Bienvenue",
    "home": "Accueil",
    "findMentors": "Trouver des mentors",
    "events": "Événements",
    "howItWorks": "Comment ça marche",
    "aboutUs": "À propos de nous",
    "title": "Menvo",
    "login": "Connexion",
    "register": "S'inscrire",
    "logout": "Déconnexion",
    "language": "Langue",
    "english": "Anglais",
    "portuguese": "Portugais",
    "spanish": "Espagnol",
    "cancel": "Annuler",
    "continue": "Continuer",
    "submit": "Envoyer",
    "back": "Retour",
    "next": "Suivant",
    "save": "Enregistrer",
    "email": "E-mail",
    "password": "Mot de passe",
    "name": "Nom",
    "firstName": "Prénom",
    "lastName": "Nom de famille",
    "loading": "Chargement...",
    "saving": "Enregistrement...",
    "close": "Fermer",
    "submitting": "Envoi en cours..."
  },
  "header": {
    "title": "MENVO - Mentors Bénévoles",
    "subtitle": "Connecter mentors et mentorés"
  },
  "home": {
    "badge": {
      "freeMentorship": "Plateforme de Mentorat Bénévole"
    },
    "hero": {
      "title": "Connectez-vous avec des Mentors Bénévoles",
      "description": "Trouvez des conseils, partagez des expériences et grandissez avec nous. Notre plateforme vous connecte avec des mentors bénévoles pour des sessions de mentorat gratuites.",
      "findMentor": "Trouver un Mentor",
      "becomeMentor": "Devenir Mentor"
    },
    "testimonials": {
      "title": "Des histoires qui inspirent",
      "description": "Des vies transformées grâce au mentorat"
    },
    "howItWorks": {
      "title": "Comment ça marche",
      "description": "Notre plateforme facilite la connexion avec les mentors et la prise de rendez-vous",
      "step1": {
        "title": "Trouver un Mentor",
        "description": "Explorez notre communauté diversifiée de mentors bénévoles et trouvez le match idéal pour vos besoins."
      },
      "step2": {
        "title": "Réserver une Session",
        "description": "Planifiez un créneau qui vous convient à tous les deux en utilisant notre système de réservation intégré."
      },
      "step3": {
        "title": "Se Connecter et Progresser",
        "description": "Rencontrez-vous virtuellement, partagez vos expériences et développez vos compétences avec des conseils personnalisés."
      },
      "learnMore": "En savoir plus"
    },
    "featuredMentors": {
      "title": "Mentors à la une",
      "description": "Découvrez certains de nos mentors bénévoles dévoués",
      "viewAll": "Voir tous les mentors"
    },
    "mentor": {
      "sampleName": "Sarah Johnson",
      "field": "Génie Logiciel",
      "tags": ["Carrière", "Technologie", "Leadership"],
      "description": "Développeuse Senior avec plus de 10 ans d'expérience aidant les nouveaux programmeurs à naviguer dans l'industrie technologique.",
      "languages": "Anglais, Espagnol",
      "viewProfile": "Voir le profil"
    },
    "events": {
      "title": "Événements à venir",
      "description": "Participez à nos événements communautaires et à nos sessions de mentorat de groupe",
      "card": {
        "title": "Panel Carrière Tech : Comment débuter dans le secteur",
        "date": "15 juin 2025",
        "time": "18h00 - 20h00",
        "description": "Rejoignez notre panel d'experts du secteur et découvrez comment lancer et développer votre carrière technologique.",
        "attendees": "{{count}} participants",
        "register": "S'inscrire"
      },
      "viewAll": "Voir tous les événements"
    },
    "cta": {
      "title": "Prêt à commencer ?",
      "description": "Rejoignez-nous aujourd'hui et connectez-vous avec des personnes qui peuvent vous aider à atteindre vos objectifs",
      "signup": "S'inscrire maintenant",
      "learnMore": "En savoir plus"
    },
    "event": {
      "type": "En ligne"
    }
  },
  "about": {
    "badge": "À propos de nous",
    "ourMission": {
      "title": "Notre Mission",
      "description": "Simplifier le mentorat par des conversations ouvertes. N'importe qui peut partager son expérience avec ceux qui en cherchent — toujours gratuitement."
    },
    "whyWeStarted": {
      "title": "Pourquoi nous avons commencé",
      "paragraph1": "Menvo est né d'une idée simple : tout le monde mérite d'avoir accès au mentorat, quels que soient son origine ou sa situation financière. Nous pensons que le partage de connaissances et d'expériences peut transformer des vies et des communautés.",
      "paragraph2": "Notre fondateur a vécu directement l'impact qu'un bon mentorat peut avoir sur la croissance personnelle et professionnelle. Cependant, il a également remarqué que les opportunités de mentorat étaient souvent limitées à ceux qui avaient déjà des relations ou des ressources financières.",
      "paragraph3": "C'est pourquoi nous avons créé une plateforme qui rend le mentorat accessible à tous, en connectant ceux qui cherchent des conseils avec ceux qui sont prêts à partager leur expérience — totalement gratuitement."
    },
    "ourStoryImageAlt": "Illustration de notre histoire",
    "values": {
      "community": {
        "title": "Communauté",
        "description": "Construire une communauté accueillante, où les connaissances sont partagées librement et les liens se créent au-delà des origines et des frontières."
      },
      "accessibility": {
        "title": "Accessibilité",
        "description": "Rendre le mentorat accessible à tous, indépendamment de la situation financière, de la localisation ou du parcours."
      },
      "impact": {
        "title": "Impact",
        "description": "Générer des changements positifs grâce au partage de connaissances et à des connexions significatives qui autonomisent les gens."
      }
    },
    "sdg": {
      "title": "Objectifs de Développement Durable",
      "description": "Notre plateforme est alignée sur les Objectifs de Développement Durable (ODD) des Nations Unies, avec un accent particulier sur :",
      "goalNumber": "ODD {{number}}",
      "goals": {
        "qualityEducation": "Éducation de Qualité",
        "genderEquality": "Égalité entre les Sexes",
        "decentWork": "Travail Décent et Croissance Économique",
        "reducedInequalities": "Inégalités Réduites"
      }
    },
    "ourTeam": {
      "title": "Notre Équipe",
      "paragraph1": "Nous sommes une équipe diversifiée de professionnels passionnés par l'idée de rendre le mentorat accessible à tous. Nos membres viennent de différents horizons et secteurs, apportant une richesse d'expériences et de perspectives.",
      "paragraph2": "Ce qui nous unit, c'est la croyance dans le pouvoir du mentorat pour transformer des vies et l'engagement à créer une plateforme qui facilite les connexions significatives.",
      "paragraph3": "Nous sommes toujours à la recherche de personnes passionnées pour rejoindre notre mission. Si vous souhaitez contribuer à Menvo, nous serions ravis de vous entendre !",
      "joinTeam": "Rejoindre notre équipe"
    },
    "ourTeamImageAlt": "Illustration de notre équipe",
    "ourImpact": {
      "title": "Notre Impact",
      "volunteerMentors": {
        "count": "1 000+",
        "label": "Mentors Bénévoles"
      },
      "mentorshipSessions": {
        "count": "5 000+",
        "label": "Sessions de Mentorat"
      },
      "countriesReached": {
        "count": "50+",
        "label": "Pays Atteints"
      },
      "description": "Ces chiffres représentent des personnes réelles dont la vie a été positivement impactée par les connexions de mentorat sur notre plateforme."
    },
    "ourPartners": {
      "title": "Nos Partenaires",
      "description": "Nous sommes fiers de collaborer avec des organisations qui partagent notre vision de rendre le mentorat accessible à tous.",
      "partnerLogoAlt": "Logo du partenaire {{number}}"
    },
    "joinOurMission": {
      "title": "Rejoignez notre Mission",
      "description": "Que ce soit pour partager votre expérience en tant que mentor ou pour chercher des conseils en tant que mentoré, vous pouvez faire partie de notre mission visant à rendre le mentorat accessible à tous.",
      "signUpNow": "Inscrivez-vous maintenant",
      "contactUs": "Contactez-nous"
    }
  },
  "howItWorks": {
    "title": "Comment Menvo fonctionne",
    "description": "Notre plateforme facilite la connexion avec les mentors et la prise de rendez-vous pour des sessions de mentorat gratuites.",
    "forMentees": "Pour les Mentorés",
    "forMentors": "Pour les Mentors",
    "forNGOs": "Pour les ONG",
    "forCompanies": "Pour les Entreprises",
    "mentees": {
      "step1": {
        "title": "Créez votre profil",
        "description": "Inscrivez-vous et créez votre profil avec des informations sur votre parcours, vos objectifs et vos intérêts. Cela nous aide à vous connecter avec les mentors idéaux.",
        "feature1": "Envoyez votre CV",
        "feature2": "Ajoutez une photo de profil",
        "feature3": "Connectez votre profil LinkedIn"
      },
      "step2": {
        "title": "Trouvez le mentor idéal",
        "description": "Explorez notre communauté diversifiée de mentors bénévoles. Utilisez les filtres para chercher des mentors par domaine d'activité, secteur, localisation et plus encore.",
        "feature1": "Filtrez par thèmes et spécialités",
        "feature2": "Cherchez par localisation ou langue",
        "feature3": "Lisez les avis des autres mentorés"
      },
      "step3": {
        "title": "Prenez rendez-vous",
        "description": "Lorsque vous trouvez um mentor avec lequel vous aimeriez vous connecter, consultez sa disponibilité et planifiez une session gratuite de 45 minutes.",
        "feature1": "Consultez le calendrier du mentor",
        "feature2": "Choisissez l'horaire le plus pratique",
        "feature3": "Ajoutez les sujets que vous souhaitez aborder"
      },
      "step4": {
        "title": "Connectez-vous et évoluez",
        "description": "Rencontrez votre mentor par appel vidéo. Partagez vos défis, posez vos questions et recevez des conseils personnalisés pour atteindre vos objectifs.",
        "feature1": "Participez via le lien d'appel vidéo",
        "feature2": "Discutez de vos objectifs et de vos défis",
        "feature3": "Recevez des conseils personnalisés"
      },
      "getStarted": "Commencer en tant que mentoré"
    },
    "mentors": {
      "step1": {
        "title": "Créez votre profil de mentor",
        "description": "Inscrivez-vous et créez votre profil de mentor avec des informations sur votre expérience, vos domaines de compétence et les thèmes sur lesquels vous pouvez aider.",
        "feature1": "Mettez en avant votre expérience et spécialité",
        "feature2": "Précisez les thèmes que vous pouvez mentorer",
        "feature3": "Connectez vos profis professionnels"
      },
      "step2": {
        "title": "Complétez la vérification",
        "description": "Pour garantir la sécurité de notre communauté, tous les mentors passent par un processus de vérification, comprenant un bref appel vidéo avec notre équipe.",
        "feature1": "Planifiez un appel de vérification",
        "feature2": "Vérifiez votre identité et vos connaissances",
        "feature3": "Soyez approuvé pour commencer à mentorer"
      },
      "step3": {
        "title": "Définissez votre disponibilité",
        "description": "Définissez les horaires auxquels vous serez disponible pour le mentorat. Vous avez un contrôle total sur votre emploi du temps et pouvez le mettre à jour à tout moment.",
        "feature1": "Configurez votre disponibilité hebdomadaire",
        "feature2": "Définissez la durée des sessions",
        "feature3": "Mettez à jour votre calendrier si nécessaire"
      },
      "step4": {
        "title": "Réalisez des sessions de mentorat",
        "description": "Connectez-vous avec les mentorés par appel vidéo. Partagez vos connaissances, offrez des conseils et aidez-les à surmonter leurs défis.",
        "feature1": "Recevez des demandes de session",
        "feature2": "Réalisez des sessions de mentorat en vidéo",
        "feature3": "Suivez votre impact et vos sessions"
      },
      "becomeMentor": "Devenir mentor"
    },
    "ngos": {
      "step1": {
        "title": "Inscrivez votre ONG gratuitement",
        "description": "Les ONG et les organisations sociales peuvent s'inscrire gratuitement sur la plateforme pour connecter les jeunes qu'elles accompagnent avec des mentors bénévoles.",
        "feature1": "Inscription 100% gratuite pour les ONG",
        "feature2": "Accès illimité à la plateforme",
        "feature3": "Support dédié aux organisations"
      },
      "step2": {
        "title": "Connectez les jeunes avec des mentors",
        "description": "Inscrivez les jeunes accompagnés par votre organisation et aidez-les à trouver des mentors qui pourront les guider dans leurs parcours professionnels et personnels.",
        "feature1": "Inscrivez plusieurs jeunes de votre organisation",
        "feature2": "Suivez les progrès des mentorats",
        "feature3": "Recevez des rapports d'impact social"
      },
      "getStarted": "Inscrire mon ONG"
    },
    "companies": {
      "step1": {
        "title": "Bénévolat d'entreprise via le mentorat",
        "description": "Développez des programmes de bénévolat d'entreprise en permettant à vos collaborateurs de devenir mentors bénévoles, renforçant ainsi la mission de l'entreprise.",
        "feature1": "Engagez les collaborateurs dans des actions sociales",
        "feature2": "Développez le leadership grâce au mentorat",
        "feature3": "Renforcez la culture organisationnelle"
      },
      "step2": {
        "title": "Rapports RSE et Impact Social",
        "description": "Recevez des rapports détaillés sur l'impact social des mentorats réalisés par vos collaborateurs, renforçant vos indicateurs RSE.",
        "feature1": "Rapports mensuels d'impact social",
        "feature2": "Métriques pour les rapports RSE",
        "feature3": "Certificats de bénévolat d'entreprise"
      },
      "step3": {
        "title": "Politiques d'incitation et avantages",
        "description": "Créez des politiques d'incitation pour les collaborateurs mentors, comme des congés payés, une reconnaissance interne et un développement de carrière.",
        "feature1": "Banque d'heures pour le mentorat bénévole",
        "feature2": "Reconnaissance et gamification interne",
        "feature3": "Développement des soft skills"
      },
      "getStarted": "Devenir partenaire entreprise"
    }
  },
  "faq": {
    "title": "Foire Aux Questions",
    "description": "Trouvez des réponses aux questions les plus fréquentes sur la plateforme Menvo.",
    "viewAll": "Voir toutes les questions",
    "q1": {
      "question": "Le mentorat est-il vraiment gratuit ?",
      "answer": "Oui, toutes les sessions de mentorat sur notre plateforme sont totalement gratuites. Nos mentors consacrent leur temps bénévolement pour aider les autres à grandir."
    },
    "q2": {
      "question": "Quelle est la durée des sessions de mentorat ?",
      "answer": "Les sessions de mentorat standard durent 45 minutes. Ce temps est suffisant pour une conversation significative, tout en respectant l'emploi du temps de chacun."
    },
    "q3": {
      "question": "À quelle fréquence puis-je rencontrer un mentor ?",
      "answer": "Cela dépend de la disponibilité et des préférences du mentor. Certains sont ouverts à des rencontres régulières, tandis que d'autres préfèrent des rencontres ponctuelles."
    },
    "q4": {
      "question": "Que se passe-t-il si je dois annuler ?",
      "answer": "Nous vous demandons d'annuler au moins 24 heures à l'avance, par respect pour le temps du mentor. Vous pouvez facilement reprogrammer via votre tableau de bord."
    },
    "q5": {
      "question": "Comment devenir un mentor vérifié ?",
      "answer": "Après avoir créé votre profil de mentor, vous devrez planifier un bref appel de vérification avec notre équipe. Cela garantit la qualité et la sécurité de la communauté."
    },
    "q6": {
      "question": "Mes informations sont-elles en sécurité ?",
      "answer": "Oui, nous prenons la confidentialité et la sécurité très au sérieux. Vos informations personnelles sont protégées et partagées uniquement avec les personnes avec lesquelles vous décidez de vous connecter."
    },
    "q7": {
      "question": "Comment cela fonctionne-t-il pour les ONG ?",
      "answer": "Les ONG peuvent s'inscrire gratuitement et connecter les jeunes qu'elles accompagnent avec des mentors bénévoles. C'est un moyen d'élargir l'impact social de l'organisation sans frais."
    },
    "q8": {
      "question": "Les entreprises peuvent-elles participer ?",
      "answer": "Oui ! Les entreprises peuvent développer des programmes de bénévolat via le mentorat, recevoir des rapports RSE et créer des politiques d'incitation pour leurs collaborateurs mentors."
    },
    "q9": {
      "question": "Comment fonctionne l'accès pour les recruteurs ?",
      "answer": "Cette fonctionnalité est en cours de développement. Bientôt, les recruteurs auront accès à des talents qualifiés participant à la plateforme, toujours dans le respect de la vie privée des utilisateurs."
    },
    "q10": {
      "question": "Puis-je être mentor et mentoré en même temps ?",
      "answer": "Oui ! Vous pouvez avoir les deux profils sur la plateforme. De nombreux professionnels cherchent un mentorat dans des domaines spécifiques tout en mentorant dans leurs domaines d'expertise."
    },
    "stillHaveQuestions": "Vous avez encore des questions ?",
    "supportDescription": "Notre équipe de support est là pour répondre à toutes vos questions.",
    "contactSupport": "Contacter le support"
  },
  "login": {
    "title": "Bon retour parmi nous",
    "description": "Connectez-vous à votre compte pour accéder à la plateforme",
    "email": "E-mail",
    "emailPlaceholder": "nom@exemple.com",
    "password": "Mot de passe",
    "passwordPlaceholder": "Entrez votre mot de passe",
    "forgotPassword": "Mot de passe oublié ?",
    "loginButton": "Se connecter",
    "loggingIn": "Connexion en cours...",
    "noAccount": "Vous n'avez pas de compte ?",
    "signUp": "S'inscrire",
    "continueWith": "Continuer avec",
    "orContinueWith": "Ou continuer avec l'e-mail",
    "google": "Google",
    "linkedin": "LinkedIn",
    "connecting": "Connexion...",
    "success": "Connexion réussie !",
    "emailNotConfirmedInfo": "Veuillez vérifier votre boîte de réception pour confirmer votre e-mail.",
    "dontHaveAccount": "Vous n'avez pas de compte ?",
    "error": {
      "invalidCredentials": "E-mail ou mot de passe incorrect. Veuillez vérifier vos identifiants et réessayer.",
      "emailNotConfirmed": "E-mail non confirmé. Vérifiez votre boîte de réception et cliquez sur le lien de confirmation.",
      "tooManyAttempts": "Trop de tentatives de connexion. Veuillez patienter quelques minutes avant de réessayer.",
      "networkError": "Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer."
    }
  },
  "register": {
    "title": "Rejoignez Menvo",
    "subtitle": "Connectez-vous avec des mentors bénévoles et développez votre carrière gratuitement",
    "signupTitle": "Créer un compte",
    "description": "Remplissez vos informations pour commencer votre voyage",
    "firstName": "Prénom",
    "firstNamePlaceholder": "Entrez votre prénom",
    "lastName": "Nom",
    "lastNamePlaceholder": "Entrez votre nom de famille",
    "email": "E-mail",
    "emailPlaceholder": "Entrez votre e-mail",
    "emailInvalid": "E-mail invalide",
    "password": "Mot de passe",
    "passwordPlaceholder": "Créez un mot de passe",
    "confirmPassword": "Confirmer le mot de passe",
    "confirmPasswordPlaceholder": "Entrez à nouveau le mot de passe",
    "mentor": "Mentor",
    "mentee": "Mentoré",
    "registerButton": "S'inscrire",
    "creatingAccount": "Création du compte...",
    "alreadyHaveAccount": "Vous avez déjà un compte ?",
    "signIn": "Se connecter",
    "orContinueWith": "Ou continuer avec l'e-mail",
    "success": "Compte créé avec succès !",
    "confirmEmail": "Confirmez votre e-mail",
    "confirmEmailDescription": "Un e-mail de confirmation a été envoyé à {{email}}. Veuillez consulter votre boîte de réception et cliquer sur le lien pour activer votre compte.",
    "nextSteps": "Prochaines étapes :",
    "nextStepsList": [
      "Vérifiez votre boîte de réception (et vos spams)",
      "Cliquez sur le lien de confirmation dans l'e-mail",
      "Choisissez votre type d'utilisateur (mentor ou mentoré)",
      "Complétez votre profil avec vos informations",
      "Attendez la validation de notre équipe (pour les mentors uniquement)"
    ],
    "afterConfirmation": "Après avoir confirmé votre e-mail, vous pourrez choisir si vous voulez être mentor ou mentoré et compléter votre profil. Les mentors passeront par une validation de notre équipe avant d'être publiés.",
    "didntReceiveEmail": "Vous n'avez pas reçu l'e-mail ?",
    "checkSpam": "Vérifiez votre dossier de spams ou courriers indésirables. Le lien de confirmation expire après 24 heures.",
    "emailExpired": "Le lien de confirmation a expiré ?",
    "emailExpiredDescription": "Si le lien de confirmation a expiré (24 heures), vous pouvez utiliser l'option 'Mot de passe oublié' pour réinitialiser et confirmer votre compte.",
    "resendEmail": "Renvoyer l'e-mail",
    "emailExpiredAction": "Lien expiré ? Réinitialiser le mot de passe",
    "tryAgain": "Réessayer",
    "emailConfirmed": "E-mail confirmé !",
    "emailConfirmedDescription": "Votre e-mail a été confirmé avec succès. Maintenant, choisissez comment vous souhaitez utiliser la plateforme.",
    "selectRoleDescription": "Choisissez comment vous souhaitez utiliser la plateforme :",
    "menteeDescription": "Je cherche des conseils et un développement professionnel",
    "mentorDescription": "Je veux partager mes connaissances et guider d'autres professionnels",
    "continue": "Continuer",
    "welcome": {
      "title": "Bienvenue sur Menvo !",
      "description": "Votre compte a été confirmé avec succès. Maintenant, choisissez comment vous souhaitez utiliser la plateforme.",
      "selectRoleDescription": "Choisissez comment vous souhaitez utiliser la plateforme :",
      "continue": "Continuer"
    },
    "goToLogin": "Aller à la connexion",
    "goToHome": "Retour à l'accueil",
    "goToVerification": "Aller à la page de vérification",
    "passwordValidation": {
      "passwordsDontMatch": "Les mots de passe ne correspondent pas",
      "passwordTooShort": "Le mot de passe doit contenir au moins 6 caractères",
      "passwordStrength": "Force du mot de passe :",
      "passwordTooWeak": "Mot de passe trop faible",
      "passwordMedium": "Moyen",
      "passwordStrong": "Fort",
      "passwordsMatch": "✓ Les mots de passe correspondent",
      "passwordsDontMatchError": "Les mots de passe ne correspondent pas"
    },
    "userType": {
      "title": "Comment souhaitez-vous participer ?",
      "mentee": {
        "title": "Mentoré",
        "description": "Je cherche des conseils pour développer ma carrière"
      },
      "mentor": {
        "title": "Mentor",
        "description": "Je veux partager mon expérience et aider les autres"
      },
      "company": {
        "title": "Entreprise",
        "description": "Je veux inscrire des professionnels de notre entreprise"
      },
      "recruiter": {
        "title": "Recruteur",
        "description": "Je cherche des talents qualifiés pour des opportunités"
      }
    }
  },
  "mentors": {
    "title": "Trouver un mentor",
    "description": "Explorez notre communauté de mentors bénévoles et trouvez le partenaire idéal pour vos besoins",
    "searchPlaceholder": "Rechercher par nom, spécialité ou mots-clés...",
    "filtersTitle": "Filtres",
    "applyFilters": "Appliquer les filtres",
    "clearFilters": "Effacer",
    "showingResults": "{{count}} mentors trouvés",
    "sortBy": "Trier par",
    "sortOptions": {
      "relevance": "Pertinence",
      "name": "Nom",
      "experience": "Expérience",
      "rating": "Évaluation"
    },
    "noMentorsFound": "Aucun mentor trouvé",
    "noMentorsDescription": "Essayez d'ajuster les filtres ou les termes de recherche",
    "clearFiltersButton": "Effacer les filtres",
    "loadMore": "Charger plus",
    "filterOptions": {
      "topics": "Sujets",
      "languages": "Langues",
      "experience": "Expérience",
      "inclusionTags": "Tags d'inclusion",
      "education": "Niveau d'études",
      "location": "Localisation",
      "city": "Ville",
      "country": "Pays",
      "availability": "Disponibilité",
      "rating": "Évaluation",
      "all": "Toutes",
      "available": "Disponible",
      "busy": "Occupé",
      "aboveRating": "{{rating}}+ étoiles"
    },
    "mentorCard": {
      "available": "Disponible",
      "busy": "Occupé",
      "specialties": "Spécialités :",
      "viewProfile": "Voir le profil",
      "scheduleSession": "Prendre RDV"
    },
    "loginRequired": {
      "title": "Connexion requise",
      "description": "Vous devez être connecté pour voir les profils des mentors et prendre rendez-vous.",
      "descriptionWithName": "Vous devez être connecté pour voir le profil de {{mentorName}} et prendre rendez-vous.",
      "benefits": {
        "title": "Ce que vous pouvez faire après vous être connecté :",
        "item1": "Consulter les profils détaillés des mentors",
        "item2": "Planifier des sessions de mentorat gratuites",
        "item3": "Envoyer des messages directs aux mentors",
        "item4": "Accéder à votre historique de mentorat"
      },
      "signUp": "S'inscrire",
      "login": "Connexion"
    },
    "pagination": {
      "previous": "Précédent",
      "next": "Suivant",
      "page": "Page {{current}} sur {{total}}"
    }
  },
  "footer": {
    "description": "Simplifier le mentorat par des conversations ouvertes. N'importe qui peut partager son expérience avec ceux qui en cherchent, toujours gratuitement.",
    "platform": "Plateforme",
    "findMentors": "Trouver des mentors",
    "events": "Événements & Cours",
    "howItWorks": "Comment ça marche",
    "store": "Boutique",
    "company": "Entreprise",
    "aboutUs": "À propos de nous",
    "mission": "Notre Mission",
    "team": "Notre Équipe",
    "partners": "Partenaires",
    "contact": "Contact",
    "subscribe": "S'abonner",
    "newsletter": "Restez informé grâce à notre newsletter",
    "privacyPolicy": "Politique de confidentialité",
    "termsOfService": "Conditions d'utilisation",
    "cookiePolicy": "Politique relative aux cookies",
    "allRightsReserved": "Tous droits réservés."
  },
  "privacy": {
    "badge": "Confidentialité",
    "title": "Politique de Confidentialité",
    "intro": "Votre vie privée est importante pour nous. Cette politique explique comment nous collectons, utilisons et protégeons vos données sur Menvo.",
    "dataCollection": {
      "title": "Collecte de Données",
      "text": "Nous collectons les informations que vous fournissez lors de la création d'un compte, telles que votre nom, e-mail, photo de profil et détails professionnels. Nous collectons également des données de connexion sociale (Google, LinkedIn) si vous choisissez de vous authentifier via ces plateformes."
    },
    "email": {
      "title": "E-mails et Communication",
      "text": "Nous utilisons votre e-mail pour les communications essentielles, les notifications de mentorat et les mises à jour. Les e-mails sont envoyés via Brevo, dans le respect de votre vie privée et de vos préférences de désabonnement."
    },
    "photos": {
      "title": "Photos et Contenu Visuel",
      "text": "Les photos de profil et les images téléchargées sont stockées de manière sécurisée dans Supabase et utilisées uniquement pour l'identification et la personnalisation du profil."
    },
    "storage": {
      "title": "Stockage des Données",
      "text": "Toutes les données sont stockées de manière sécurisée dans Supabase, avec un accès restreint à l'équipe Menvo et en suivant les meilleures pratiques de sécurité."
    },
    "googleCalendar": {
      "title": "API Google Calendar",
      "text": "Nous utilisons l'API Google Calendar exclusivement pour créer des événements de mentorat lorsqu'une session est confirmée par le mentor. Nous créons l'événement dans notre propre calendrier et envoyons des invitations par e-mail au mentor et au mentoré. Nous n'accédons, ne lisons ni ne modifions votre calendrier personnel Google. Vous recevez simplement une invitation par e-mail que vous pouvez accepter ou refuser librement. Les données utilisées sont uniquement : date, heure, durée de la session et e-mails des participants."
    },
    "dataSharing": {
      "title": "Partage des Données",
      "text": "Nous ne partageons pas vos données personnelles avec des tiers à des fins commerciales ou marketing. Les données sont partagées uniquement avec les services essentiels au fonctionnement de la plateforme : Supabase (stockage sécurisé), Brevo (envoi d'e-mails transactionnels), Google (authentification OAuth et création d'événements de calendrier), et LinkedIn (authentification OAuth). Chaque service traite les données uniquement pour les finalités spécifiques décrites dans cette politique."
    },
    "dataUsage": {
      "title": "Utilisation des Données",
      "text": "Vos données sont utilisées exclusivement pour : (1) L'authentification et la gestion du compte ; (2) Faciliter les connexions entre mentors et mentorés ; (3) Créer des événements de mentorat dans Google Calendar ; (4) Envoyer des notifications et communications liées à vos mentorats ; (5) Améliorer l'expérience et la sécurité de la plateforme. Nous n'utilisons jamais vos données pour l'entraînement de modèles d'IA/ML ou à des fins non liées au mentorat."
    },
    "mentorship": {
      "title": "Mentorat et Interactions",
      "text": "Les informations sur les sessions de mentorat, les évaluations et les messages sont utilisées pour améliorer l'expérience et garantir la sécurité de la communauté."
    },
    "thirdParty": {
      "title": "Services Tiers",
      "text": "Nous utilisons des services tiers tels que Google (connexion OAuth et API Calendar), LinkedIn (connexion OAuth), Supabase (stockage) et Brevo (e-mails). Chaque service a sa propre politique de confidentialité et traite les données uniquement pour les finalités spécifiques décrites dans cette politique."
    },
    "rights": {
      "title": "Vos Droits",
      "text": "Vous pouvez demander l'accès, la rectification ou la suppression de vos données à tout moment. Pour exercer vos droits ou révoquer les autorisations d'accès à Google Calendar, contactez-nous à contato@menvo.com.br."
    },
    "contact": {
      "title": "Contact",
      "text": "Des questions sur la confidentialité ? Contactez-nous à contato@menvo.com.br."
    },
    "links": {
      "cookies": "Politique relative aux cookies",
      "terms": "Conditions d'utilisation"
    }
  },
  "cookies": {
    "badge": "Cookies",
    "title": "Politique relative aux cookies",
    "intro": "Nous utilisons des cookies pour améliorer votre expérience, garantir des fonctionnalités essentielles et analyser l'utilisation de la plateforme.",
    "essential": {
      "title": "Cookies Essentiels",
      "text": "Nécessaires au fonctionnement du site, à l'authentification et à la sécurité. Ils ne peuvent pas être désactivés."
    },
    "social": {
      "title": "Connexion Sociale",
      "text": "Des cookies peuvent être utilisés pour l'authentification via Google et LinkedIn, permettant une connexion sécurisée."
    },
    "preferences": {
      "title": "Préférences",
      "text": "Nous stockons vos préférences linguistiques et vos paramètres pour personnaliser votre expérience."
    },
    "analytics": {
      "title": "Analyse et Performance",
      "text": "Nous utilisons des cookies et des outils d'analyse tels que Microsoft Clarity pour comprendre comment la plateforme est utilisée et améliorer nos services. Clarity nous aide à visualiser comment les utilisateurs interagissent avec le site grâce à des enregistrements de session et des cartes de chaleur. Pour les utilisateurs de l'Union Européenne (EEE), du Royaume-Uni et de la Suisse, nous demandons votre consentement explicite avant d'activer ces outils d'analyse."
    },
    "clarity": {
      "title": "Microsoft Clarity",
      "text": "Nous utilisons Microsoft Clarity pour comprendre comment vous utilisez notre site grâce à des métriques comportementales, des cartes de chaleur et des enregistrements de session. Les données collectées par Clarity sont traitées conformément à la politique de confidentialité de Microsoft. Pour les utilisateurs de l'EEE, du Royaume-Uni et de la Suisse, Clarity ne sera activé qu'après votre consentement explicite via la bannière de cookies."
    },
    "links": {
      "privacy": "Politique de confidentialité",
      "terms": "Conditions d'utilisation"
    }
  },
  "cookieConsent": {
    "title": "Nous utilisons des cookies",
    "description": "Nous utilisons des cookies essentiels pour le fonctionnement do site et des cookies d'analyse pour améliorer votre expérience. Vous pouvez choisir les cookies que vous acceptez.",
    "learnMore": "En savoir plus",
    "acceptAll": "Tout Accepter",
    "acceptNecessary": "Nécessaires uniquement",
    "customize": "Personnaliser",
    "savePreferences": "Enregistrer les préférences",
    "settings": {
      "title": "Paramètres des cookies",
      "description": "Choisissez les types de cookies que vous souhaitez accepter. Les cookies nécessaires ne peuvent pas être désactivés.",
      "alwaysActive": "Toujours Actif",
      "necessary": {
        "title": "Cookies Nécessaires",
        "description": "Essentiels au fonctionnement de base du site, y compris l'authentification, la sécurité et la navigation."
      },
      "analytics": {
        "title": "Cookies d'Analyse",
        "description": "Nous aident à comprendre comment vous utilisez le site pour améliorer votre expérience.",
        "tools": "Outils : Microsoft Clarity (enregistrements de session, cartes de chaleur)"
      },
      "functional": {
        "title": "Cookies Fonctionnels",
        "description": "Permettent des fonctionnalités avancées comme les préférences linguistiques et la personnalisation."
      }
    }
  },
  "terms": {
    "badge": "Conditions",
    "title": "Conditions d'Utilisation",
    "intro": "En utilisant Menvo, vous acceptez ces conditions. Veuillez les lire attentivement pour comprendre vos droits et responsabilités.",
    "usage": {
      "title": "Utilisation de la Plateforme",
      "text": "Menvo connecte mentors et mentorés pour des sessions gratuites. L'utilisation doit être respectueuse et conforme aux lois applicables."
    },
    "account": {
      "title": "Compte et Connexion Sociale",
      "text": "Vous pouvez créer un compte par e-mail ou connexion sociale (Google, LinkedIn). Gardez vos identifiants en sécurité et ne partagez pas votre compte."
    },
    "security": {
      "title": "Sécurité",
      "text": "Nous prenons des mesures pour protéger vos données, mais vous êtes également responsable du maintien de la sécurité de votre mot de passe."
    },
    "content": {
      "title": "Contenu et Photos",
      "text": "Vous êtes responsable du contenu que vous téléchargez (photos, texte). Ne téléchargez pas de contenu offensant ou protégé par le droit d'auteur sans autorisation."
    },
    "communication": {
      "title": "Communication et E-mails",
      "text": "Nous vous enverrons des communications importantes concernant les mentorats et les mises à jour. Vous pouvez choisir de ne pas recevoir d'e-mails promotionnels."
    },
    "storage": {
      "title": "Stockage et Tiers",
      "text": "Les données sont stockées dans Supabase et les e-mails sont envoyés via Brevo. Nous utilisons la connexion sociale de tiers."
    },
    "rights": {
      "title": "Droits et Responsabilités",
      "text": "Vous pouvez accéder à vos données, les rectifier ou les supprimer. Une utilisation abusive de la plateforme peut entraîner la suspension du compte."
    },
    "contact": {
      "title": "Contact",
      "text": "Des questions ? Contactez-nous à contato@menvo.com."
    },
    "links": {
      "privacy": "Politique de confidentialité",
      "cookies": "Politique relative aux cookies"
    }
  },
  "waitingList": {
    "title": "Rejoindre la liste d'attente",
    "description": "Merci de votre intérêt ! Veuillez remplir le formulaire ci-dessous.",
    "nameLabel": "Nom",
    "namePlaceholder": "Entrez votre nom complet",
    "emailPlaceholder": "votre@email.com",
    "whatsappLabel": "WhatsApp (optionnel)",
    "whatsappPlaceholder": "Votre numéro WhatsApp",
    "reasonLabel": "Pourquoi voulez-vous nous rejoindre ?",
    "reasonPlaceholder": "Dites-nous pourquoi vous voulez participer",
    "successMessage": "Merci pour votre intérêt !",
    "errorMessage": "Erreur lors de l'envoi du formulaire"
  },
  "feedback": {
    "title": "Commentaires",
    "description": "Votre avis est très important pour nous. Comment pouvons-nous nous améliorer ?",
    "helpUsImprove": "Aidez-nous à nous améliorer",
    "ratingRequired": "Veuillez sélectionner une évaluation",
    "commentPlaceholder": "Parlez-nous de votre expérience... (optionnel)",
    "emailPlaceholder": "Votre e-mail (pour des commentaires anonymes)",
    "submit": "Envoyer les commentaires",
    "thankYou": "Merci pour vos commentaires !",
    "error": "Erreur lors de l'envoi des commentaires. Veuillez réessayer.",
    "rateStars": "Évaluer avec {{count}} étoiles"
  },
  "mentorSuggestion": {
    "loginRequiredTitle": "Connexion requise",
    "loginRequiredDescription": "Vous devez être connecté pour suggérer un thème ou un domaine de mentorat.",
    "title": "Suggérer un thème ou un domaine",
    "description": "Vous n'avez pas trouvé ce que vous cherchiez ? Suggérez de nouveaux thèmes ou domaines de connaissances que vous aimeriez trouver sur la plateforme.",
    "observationLabel": "Que cherchez-vous ?",
    "observationPlaceholder": "Ex : J'aimerais trouver des mentors spécialisés en Design de Produit, particulièrement avec une expérience en UX Research et accessibilité numérique. Il serait également intéressant d'avoir des mentors qui travaillent avec des Design Systems...",
    "freeTopicsLabel": "Thèmes ou Domaines (Optionnel)",
    "freeTopicsDescription": "Ajoutez des mots-clés liés à votre suggestion",
    "freeTopicsPlaceholder": "Ex : Design Thinking, Prototypage Rapide...",
    "addTopic": "Ajouter",
    "inclusionTagsLabel": "Tags d'inclusion (Optionnel)",
    "inclusionTagsDescription": "Sélectionnez les tags de diversité et d'inclusion pertinents"
  },
  "toast": {
    "suggestion": {
      "success": {
        "title": "Suggestion envoyée !",
        "description": "Merci pour votre suggestion. Notre équipe va l'examiner et nous vous tiendrons au courant des nouveautés."
      },
      "error": {
        "title": "Erreur lors de l'envoi de la suggestion",
        "description": "Impossible d'envoyer votre suggestion. Veuillez réessayer plus tard."
      }
    }
  },
  "metadata": {
    "title": "MENVO - Mentorat Bénévole",
    "description": "Connecter mentors et mentorés pour des sessions de mentorat gratuites",
    "keywords": ["mentorat", "bénévolat", "carrière"],
    "og": {
      "title": "MENVO - Mentorat Bénévole",
      "description": "Connecter mentors et mentorés pour des sessions de mentorat gratuites",
      "siteName": "MENVO"
    },
    "twitter": {
      "title": "MENVO - Mentorat Bénévole",
      "description": "Connecter mentors et mentorés pour des sessions de mentorat gratuites"
    }
  },
  "quiz": {
    "page": {
      "title": "Découvrez votre potentiel de croissance",
      "subtitle": "Répondez à notre questionnaire rapide et recevez une analyse personnalisée avec des suggestions de mentors idéaux pour votre parcours.",
      "personalized_analysis": "Analyse Personnalisée",
      "personalized_analysis_description": "Recevez des insights sur votre moment de carrière et les domaines à développer",
      "ideal_mentors": "Mentors Idéaux",
      "ideal_mentors_description": "Découvrez quels types de mentors peuvent vous aider à atteindre vos objectifs",
      "get_a_gift": "Gagnez un cadeau !",
      "get_a_gift_description": "Score supérieur à 700 ? Choisissez entre un stylo ou un badge exclusif !",
      "start_quiz": "Commencer le questionnaire",
      "responses_confidential": "Vos réponses nous aideront à mieux comprendre les besoins des participants et à recruter des mentors bénévoles dans les domaines les plus demandés. En plus de contribuer à construire une communauté de mentorat plus forte et plus accessible."
    },
    "form": {
      "back": "Retour",
      "question": "Question",
      "of": "sur",
      "progress_header": "Question {{currentStep}} sur {{totalSteps}}",
      "career_moment_title": "Quel est votre moment de carrière actuel ?",
      "career_moment_description": "Sélectionnez l'option qui décrit le mieux votre situation actuelle",
      "professional_challenge_title": "Quel est votre plus grand défi professionnel en ce moment ?",
      "professional_challenge_description": "Dites-nous ce qui vous inquiète ou vous défie le plus dans votre carrière",
      "mentorship_experience_title": "Avez-vous déjà eu une expérience de mentorat ?",
      "mentorship_experience_description": "Nous voulons comprendre votre expérience précédente en mentorat",
      "future_vision_title": "Où vous voyez-vous dans 2 ans ?",
      "future_vision_description": "Partagez votre vision de votre avenir professionnel",
      "development_areas_title": "Quels domaines aimeriez-vous le plus développer ?",
      "development_areas_description": "Vous pouvez sélectionner plusieurs options",
      "personal_life_challenges_title": "Dans quels défis de la vie personnelle une conversation pourrait-elle vous aider ?",
      "personal_life_challenges_description": "Comme de nouveaux loisirs, des projets personnels ou d'autres aspects de la vie",
      "share_knowledge_title": "Avez-vous déjà pensé à partager vos connaissances ou votre expérience avec d'autres ?",
      "share_knowledge_description": "Nous voulons savoir si vous êtes également intéressé par l'aide aux autres",
      "contact_information_title": "Informations de contact",
      "contact_information_description": "Pour que nous puissions vous envoyer votre analyse personnalisée",
      "next": "Suivant",
      "submit": "Terminer et voir les résultats",
      "processing": "Traitement en cours...",
      "confidential_responses": "Vos réponses sont confidentielles et ne seront utilisées que pour générer votre analyse personnalisée",
      "high_school_student": "Lycéen",
      "university_student": "Étudiant universitaire",
      "recent_graduate": "Jeune diplômé (moins d'un an)",
      "junior_professional": "Jeune professionnel (1 à 3 ans d'expérience)",
      "career_transition": "En reconversion professionnelle",
      "other": "Autre",
      "challenge_placeholder": "Parlez-nous de ce qui vous inquiète ou vous défie le plus...",
      "min_chars": "Minimum 10 caractères",
      "chars": "caractères",
      "mentorship_yes_useful": "Oui, j'ai été mentoré et cela a été très utile",
      "mentorship_yes_not_good": "Oui, mais ce n'était pas une bonne expérience",
      "mentorship_no_interest": "Non, mais je suis très intéressé",
      "mentorship_no_dont_know": "Non, et je ne sais pas encore si j'en ai besoin",
      "mentorship_heard_about_it": "J'en ai entendu parler, mais je n'ai jamais participé",
      "future_vision_placeholder": "Partagez votre vision de votre avenir professionnel...",
      "select_all_that_apply": "Sélectionnez tout ce qui s'applique :",
      "technical_development": "Développement technique (hard skills)",
      "communication_networking": "Communication et réseautage",
      "leadership_management": "Leadership et gestion",
      "career_planning": "Planification de carrière",
      "entrepreneurship": "Entrepreneuriat",
      "work_life_balance": "Équilibre vie pro/vie privée",
      "other_area_specify": "Autre (précisez) :",
      "other_area_placeholder": "Entrez un autre domaine d'intérêt...",
      "personal_life_placeholder": "Exemple : Trouver un nouveau loisir, développer des projets personnels, améliorer ses relations, prendre soin de sa santé mentale...",
      "share_knowledge_yes_very": "Oui, je suis très intéressé par le partage",
      "share_knowledge_yes_maybe": "Oui, peut-être à l'avenir",
      "share_knowledge_no_never_thought": "Non, je n'y ai jamais pensé",
      "share_knowledge_no_time": "J'aimerais bien, mais je n'ai pas le temps",
      "share_knowledge_already_do": "Je le fais déjà d'une certaine manière",
      "full_name": "Nom complet *",
      "full_name_placeholder": "Votre nom complet",
      "email": "E-mail *",
      "email_placeholder": "votre@email.com",
      "invalid_email": "E-mail invalide",
      "linkedin_optional": "LinkedIn (optionnel)",
      "linkedin_placeholder": "https://linkedin.com/in/votre-profil",
      "analysis_notification": "Vous recevrez votre analyse par e-mail ainsi qu'une invitation exclusive à accéder à MENVO.",
      "submit_success_title": "Questionnaire envoyé !",
      "submit_success_description": "Veuillez patienter pendant que nous traitons votre analyse...",
      "submit_error_title": "Erreur lors de l'envoi",
      "submit_error_description": "Une erreur est survenue lors de l'envoi du questionnaire. Veuillez réessayer."
    },
    "results": {
      "processing_analysis": "Traitement de votre analyse...",
      "ai_is_analyzing": "Notre IA analyse vos réponses",
      "incomplete_analysis": "Analyse incomplète",
      "lets_try_again": "On réessaie ?",
      "retake_quiz": "Refaire le questionnaire",
      "tips_for_better_analysis": "Conseils pour une analyse plus précise",
      "personalized_analysis": "Analyse Personnalisée",
      "congratulations_gift": "🎉 Félicitations ! Vous avez gagné un cadeau !",
      "choose_gift": "Choisissez votre cadeau et retirez-le au stand MENVO au RecnPlay.",
      "pen": "Stylo",
      "button": "Badge",
      "important_gift_choice": "⚠️ Important : Vous devez choisir UN ou L'AUTRE cadeau",
      "you_chose": "✅ Vous avez choisi :",
      "show_result_at_stand": "Montrez ce résultat au stand MENVO pour recevoir votre cadeau !",
      "suggested_mentors": "Mentors suggérés pour vous",
      "based_on_interests": "Basé sur vos domaines d'intérêt et vos objectifs",
      "mentor_status_tooltip": "💡 <strong>Statut du Mentor :</strong> Nous affichons de vrais mentors de la plateforme selon votre profil. \"Disponible\" = accepte de nouveaux mentorés | \"Complet\" = temporairement occupé",
      "available": "Disponible",
      "full_schedule": "Complet",
      "mentor": "Mentor",
      "practical_advice": "Conseils pratiques",
      "next_steps": "Prochaines étapes",
      "development_areas": "Domaines de développement",
      "final_message_potential_mentor": "Vous avez le potentiel pour être mentor !",
      "final_message_potential_mentor_description": "Nous avons identifié que vous êtes intéressé par le partage de connaissances. Envisagez de vous inscrire en tant que mentor bénévole sur la plateforme MENVO.",
      "share_results": "Partager les résultats",
      "share_results_description": "Envoyez votre analyse par e-mail ou partagez-la avec des amis",
      "send_by_email": "Envoyer par e-mail",
      "sending": "Envoi en cours...",
      "whatsapp": "WhatsApp",
      "linkedin": "LinkedIn",
      "potential_analysis_title": "🎯 Mon Analyse de Potentiel - MENVO",
      "potential_analysis_whatsapp_message": "Je viens de faire une analyse personnalisée au RecnPlay et j'ai découvert mon potentiel de croissance !\n\nVoir mon résultat : {currentUrl}\n\nDécouvrez MENVO - une plateforme de mentorat gratuite : https://menvo.com.br",
      "potential_analysis_linkedin_message": "Je viens de faire une analyse de potentiel sur MENVO et j'ai découvert des insights incroyables sur ma croissance professionnelle ! \n\nVoir mon résultat : {currentUrl}\n\nDécouvrez MENVO - une plateforme de mentorat gratuite qui connecte les jeunes à des mentors bénévoles.\n\n#MENVO #Mentorat #DéveloppementProfessionnel #RecnPlay2025",
      "email_sent_toast_title": "E-mail envoyé !",
      "email_sent_toast_description": "Vérifiez votre boîte de réception.",
      "error_sending_email_toast_title": "Erreur lors de l'envoi de l'e-mail",
      "error_sending_email_toast_description": "Veuillez réessayer plus tard.",
      "error_loading_results_toast_title": "Erreur",
      "error_loading_results_toast_description": "Impossible de charger les résultats."
    },
    "flow": {
      "how_it_works": "Comment le Quiz fonctionne"
    }
  }
};

fs.writeFileSync('messages/fr.json', JSON.stringify(fr, null, 2), 'utf8');
