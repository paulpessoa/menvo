const fs = require('fs');
const path = require('path');

const daPath = 'messages/da.json';
const svPath = 'messages/sv.json';

const da = JSON.parse(fs.readFileSync(daPath, 'utf8'));
const sv = JSON.parse(fs.readFileSync(svPath, 'utf8'));

// Danish (DA)
da.home = {
  "badge": { "freeMentorship": "Platform for Frivillig Mentoring" },
  "hero": {
    "title": "Forbind med Frivillige Mentorer",
    "description": "Find vejledning, del erfaringer og voks med os. Vores platform forbinder dig med frivillige mentorer til gratis mentorforløb.",
    "findMentor": "Find en Mentor",
    "becomeMentor": "Bliv Mentor"
  },
  "testimonials": {
    "title": "Historier der inspirerer",
    "description": "Liv ændret gennem mentoring"
  },
  "howItWorks": {
    "title": "Hvordan det virker",
    "description": "Vores platform gør det nemt at komme i kontakt med mentorer og booke sessioner",
    "step1": {
      "title": "Find en Mentor",
      "description": "Udforsk vores mangfoldige fællesskab af frivillige mentorer og find det ideelle match til dine behov."
    },
    "step2": {
      "title": "Book en Session",
      "description": "Planlæg et tidspunkt, der passer jer begge, ved hjælp af vores integrerede bookingsystem."
    },
    "step3": {
      "title": "Forbind og Voks",
      "description": "Mødtes virtuelt, del jeres erfaringer og udvikle dine færdigheder med personlig vejledning."
    },
    "learnMore": "Læs mere"
  },
  "cta": {
    "title": "Klar til at starte?",
    "description": "Tilmeld dig i dag og få kontakt med mennesker, der kan hjælpe dig med at nå dine mål",
    "signup": "Tilmeld dig nu",
    "learnMore": "Læs mere"
  }
};

// Swedish (SV)
sv.home = {
  "badge": { "freeMentorship": "Plattform för Frivilligt Mentorskap" },
  "hero": {
    "title": "Anslut med Frivilliga Mentorer",
    "description": "Hitta vägledning, dela erfarenheter och väx med oss. Vår plattform kopplar ihop dig med frivilliga mentorer för gratis mentorskapssessioner.",
    "findMentor": "Hitta en Mentor",
    "becomeMentor": "Bli Mentor"
  },
  "testimonials": {
    "title": "Berättelser som inspirerar",
    "description": "Liv förvandlade genom mentorskap"
  },
  "howItWorks": {
    "title": "Hur det fungerar",
    "description": "Vår plattform gör det enkelt att komma i kontakt med mentorer och boka sessioner",
    "step1": {
      "title": "Hitta en Mentor",
      "description": "Utforska vår mångfaldiga gemenskap av frivilliga mentorer och hitta den perfekta matchningen för dina behov."
    },
    "step2": {
      "title": "Boka en Session",
      "description": "Planera en tid som passar er båda med hjälp av vårt integrerade bokningssystem."
    },
    "step3": {
      "title": "Anslut och Väx",
      "description": "Träffas virtuellt, dela erfarenheter och utveckla dina färdigheter med personlig vägledning."
    },
    "learnMore": "Läs mer"
  },
  "cta": {
    "title": "Redo att börja?",
    "description": "Gå med idag och få kontakt med människor som kan hjälpa dig att nå dina mål",
    "signup": "Registrera dig nu",
    "learnMore": "Läs mer"
  }
};

// SDG Fix for DA and SV
[da, sv].forEach(content => {
  if (content.about && content.about.sdg) {
    const isDa = content === da;
    content.about.sdg = {
      "title": isDa ? "Mål for Bæredygtig Udvikling" : "Mål för Hållbar Utveckling",
      "description": isDa ? "Vores platform er på linje med FN's verdensmål (SDG), med særligt fokus på:" : "Vår plattform är i linje med FN:s globala mål (SDG), med särskilt fokus på:",
      "goalNumber": isDa ? "Verdensmål {{number}}" : "Globalt mål {{number}}",
      "goals": {
        "qualityEducation": isDa ? "Kvalitetsuddannelse" : "Kvalitetsutbildning",
        "genderEquality": isDa ? "Ligestilling mellem kønnene" : "Jämställdhet",
        "decentWork": isDa ? "Anstændige jobs og økonomisk vækst" : "Anständiga arbetsvillkor och ekonomisk tillväxt",
        "reducedInequalities": isDa ? "Mindre ulighed" : "Minskad ojämlikhet"
      }
    };
  }
});

fs.writeFileSync(daPath, JSON.stringify(da, null, 2), 'utf8');
fs.writeFileSync(svPath, JSON.stringify(sv, null, 2), 'utf8');
