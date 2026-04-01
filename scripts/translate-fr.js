const fs = require('fs');
const path = require('path');

const frPath = 'messages/fr.json';
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

fr.home = {
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
};

// Also fix the SDG part in 'about'
if (fr.about && fr.about.sdg) {
  fr.about.sdg = {
    "title": "Objectifs de Développement Durable",
    "description": "Notre plateforme est alignée sur les Objectifs de Développement Durable (ODD) des Nations Unies, avec un accent particulier sur :",
    "goalNumber": "ODD {{number}}",
    "goals": {
      "qualityEducation": "Éducation de Qualité",
      "genderEquality": "Égalité entre les Sexes",
      "decentWork": "Travail Décent et Croissance Économique",
      "reducedInequalities": "Inégalités Réduites"
    }
  };
}

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
