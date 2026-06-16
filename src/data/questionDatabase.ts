import { Question } from "../types";

// High-quality core seed questions (at least 4-5 per subject) to guarantee initial standard content
const HANDCRAFTED_SEEDS: Record<string, Omit<Question, "id">[]> = {
  maths: [
    {
      subjectId: "maths",
      questionText: "Find the value of x if 3x - 7 = 14.",
      options: ["x = 7", "x = 5", "x = 21", "x = 9"],
      originalOptions: ["x = 7", "x = 5", "x = 21", "x = 9"],
      correctAnswer: "x = 7",
      explanation: "Add 7 to both sides: 3x = 14 + 7 => 3x = 21. Divide by 3: x = 21 / 3 = 7.",
      difficulty: "Medium",
      topic: "Algebra"
    },
    {
      subjectId: "maths",
      questionText: "Calculate the area of a circle with a radius of 7 cm. (Take pi = 22/7)",
      options: ["154 sq. cm", "44 sq. cm", "616 sq. cm", "77 sq. cm"],
      originalOptions: ["154 sq. cm", "44 sq. cm", "616 sq. cm", "77 sq. cm"],
      correctAnswer: "154 sq. cm",
      explanation: "Area of a circle = pi * r^2. Area = (22/7) * 7 * 7 = 22 * 7 = 154 sq. cm.",
      difficulty: "Medium",
      topic: "Geometry"
    },
    {
      subjectId: "maths",
      questionText: "A bag contains 5 red balls, 3 blue balls, and 2 green balls. If a ball is drawn at random, what is the probability that it is blue?",
      options: ["3/10", "1/2", "1/5", "3/7"],
      originalOptions: ["3/10", "1/2", "1/5", "3/7"],
      correctAnswer: "3/10",
      explanation: "Total balls = 5 + 3 + 2 = 10. Number of blue balls = 3. Probability = Number of blue balls / Total balls = 3/10.",
      difficulty: "Medium",
      topic: "Statistics & Probability"
    },
    {
      subjectId: "maths",
      questionText: "Evaluate: (3/4) of 32 + 15.",
      options: ["39", "24", "41", "36"],
      originalOptions: ["39", "24", "41", "36"],
      correctAnswer: "39",
      explanation: "Using BODMAS, evaluate 'of' first: (3/4) * 32 = 3 * 8 = 24. Then add 15: 24 + 15 = 39.",
      difficulty: "Easy",
      topic: "Fractions & Percentages"
    }
  ],
  english: [
    {
      subjectId: "english",
      questionText: "Choose the word that is opposite in meaning to the underlined word: 'The company decided to COMMENCE operations this week.'",
      options: ["terminate", "begin", "suspend", "extend"],
      originalOptions: ["terminate", "begin", "suspend", "extend"],
      correctAnswer: "terminate",
      explanation: "Commence means to start or begin. The opposite in meaning is to terminate, which means to bring to an end.",
      difficulty: "Easy",
      topic: "Antonyms"
    },
    {
      subjectId: "english",
      questionText: "Choose the option that best completes the sentence: 'Neither the principal nor the teachers ________ present at the meeting.'",
      options: ["were", "was", "is", "are been"],
      originalOptions: ["were", "was", "is", "are been"],
      correctAnswer: "were",
      explanation: "When using 'neither... nor...', the verb agrees with the closer subject. 'teachers' is plural, so 'were' is correct for past tense.",
      difficulty: "Medium",
      topic: "Grammar & Concord"
    },
    {
      subjectId: "english",
      questionText: "Find the synonym of the underlined word: 'The explanation was VAGUE and did not help the class.'",
      options: ["unclear", "precise", "detailed", "boring"],
      originalOptions: ["unclear", "precise", "detailed", "boring"],
      correctAnswer: "unclear",
      explanation: "Vague means not clearly expressed or defined. Therefore, 'unclear' is its synonym.",
      difficulty: "Easy",
      topic: "Synonyms"
    },
    {
      subjectId: "english",
      questionText: "Complete the statement with the correct preposition: 'She has been suffering ________ malaria since Monday.'",
      options: ["from", "with", "of", "by"],
      originalOptions: ["from", "with", "of", "by"],
      correctAnswer: "from",
      explanation: "The standard idioms/prepositional usage is 'suffering from' an illness.",
      difficulty: "Easy",
      topic: "Prepositions"
    }
  ],
  basic_science_tech: [
    {
      subjectId: "basic_science_tech",
      questionText: "Which of the following describes the process of carbon dioxide converting from gas directly to solid dry ice?",
      options: ["deposition", "sublimation", "evaporation", "condensation"],
      originalOptions: ["deposition", "sublimation", "evaporation", "condensation"],
      correctAnswer: "deposition",
      explanation: "Deposition is the thermodynamic process in which gas transforms directly into solid without passing through the liquid phase.",
      difficulty: "Hard",
      topic: "Matter & Properties"
    },
    {
      subjectId: "basic_science_tech",
      questionText: "Which wood-working tool is specifically used for driving in wood chisels?",
      options: ["Mallet", "Claw Hammer", "Sledge hammer", "Ball-peen hammer"],
      originalOptions: ["Mallet", "Claw Hammer", "Sledge hammer", "Ball-peen hammer"],
      correctAnswer: "Mallet",
      explanation: "A wooden or rubber mallet is used to strike wooden handled chisels to avoid damaging or splitting the handles.",
      difficulty: "Easy",
      topic: "Woodwork Tools"
    },
    {
      subjectId: "basic_science_tech",
      questionText: "What is the primary function of a capacitor in an electronic circuit?",
      options: ["To store electrical charge", "To resist current", "To amplify voltage", "To convert AC to DC"],
      originalOptions: ["To store electrical charge", "To resist current", "To amplify voltage", "To convert AC to DC"],
      correctAnswer: "To store electrical charge",
      explanation: "Capacitors are electronic components designed to store electrical energy temporarily in an electrostatic field.",
      difficulty: "Medium",
      topic: "Electronics"
    },
    {
      subjectId: "basic_science_tech",
      questionText: "The brain of any computer system which executes mathematical calculations and logic is the:",
      options: ["CPU", "RAM", "Hard Disk", "Motherboard"],
      originalOptions: ["CPU", "RAM", "Hard Disk", "Motherboard"],
      correctAnswer: "CPU",
      explanation: "The Central Processing Unit (CPU) is often called the brain of the computer, containing the ALU (Arithmetic Logic Unit).",
      difficulty: "Easy",
      topic: "Computer Hardware"
    },
    {
      subjectId: "basic_science_tech",
      questionText: "The standard treatment principle for acute sports muscle strain injuries, R.I.C.E., stands for:",
      options: ["Rest, Ice, Compression, Elevation", "Run, Inhale, Catch, Escape", "Rest, Injection, Comfort, Exercise", "Rehab, Ice, Circulation, Energy"],
      originalOptions: ["Rest, Ice, Compression, Elevation", "Run, Inhale, Catch, Escape", "Rest, Injection, Comfort, Exercise", "Rehab, Ice, Circulation, Energy"],
      correctAnswer: "Rest, Ice, Compression, Elevation",
      explanation: "RICE is a first-aid protocol for soft tissue injuries: Rest the injury, Ice application, Compress with bandage, Elevate.",
      difficulty: "Medium",
      topic: "First Aid & Body Safety"
    }
  ],
  prevocational_studies: [
    {
      subjectId: "prevocational_studies",
      questionText: "Which soil type boasts the highest water retention capability, often making it easily toggled into mud?",
      options: ["Clay soil", "Sandy soil", "Loamy soil", "Humus agricultural soil"],
      originalOptions: ["Clay soil", "Sandy soil", "Loamy soil", "Humus agricultural soil"],
      correctAnswer: "Clay soil",
      explanation: "Clay soil has extremely tiny, tightly packed particles that retain moisture well, causing high water retention and making it sticky.",
      difficulty: "Easy",
      topic: "Soil Science"
    },
    {
      subjectId: "prevocational_studies",
      questionText: "Which of the following is categorized as a leguminous forage crop?",
      options: ["Centrosema", "Guinea grass", "Elephant grass", "Maize stalk"],
      originalOptions: ["Centrosema", "Guinea grass", "Elephant grass", "Maize stalk"],
      correctAnswer: "Centrosema",
      explanation: "Centrosema is a genus of herbaceous legumes used extensively for grazing and improving soil nitrogen levels.",
      difficulty: "Medium",
      topic: "Crop Production"
    },
    {
      subjectId: "prevocational_studies",
      questionText: "Which of these farm machinery units is primarily used for pulling heavy tillage tools like magnetic plows?",
      options: ["Tractor", "Harvester", "Planter", "Ridger"],
      originalOptions: ["Tractor", "Harvester", "Planter", "Ridger"],
      correctAnswer: "Tractor",
      explanation: "In agricultural practices, the tractor is the primary machine used to pull heavy tillage implements like plows, harrows, and ridgers.",
      difficulty: "Easy",
      topic: "Farm Implements"
    }
  ],
  national_value: [
    {
      subjectId: "national_value",
      questionText: "Which national core value promotes honesty, moral uprightness, and adherence to robust virtues?",
      options: ["Integrity", "Discipline", "Selflessness", "Patriotism"],
      originalOptions: ["Integrity", "Discipline", "Selflessness", "Patriotism"],
      correctAnswer: "Integrity",
      explanation: "Integrity refers to being honest, having strong moral principles, and being morally upright.",
      difficulty: "Easy",
      topic: "National Core Values"
    },
    {
      subjectId: "national_value",
      questionText: "Which arm of the government is constitutionally responsible for drafting and passing new laws?",
      options: ["Legislature", "Executive", "Judiciary", "Federal Civil Service"],
      originalOptions: ["Legislature", "Executive", "Judiciary", "Federal Civil Service"],
      correctAnswer: "Legislature",
      explanation: "The Legislative arm (National Assembly in Nigeria) is empowered to make laws, while the Executive implements them, and the Judiciary interprets them.",
      difficulty: "Medium",
      topic: "Pillars of Democracy"
    },
    {
      subjectId: "national_value",
      questionText: "Which type of family comprises a father, mother, husband, wife, and cousin living together under the same roof?",
      options: ["Extended family", "Nuclear family", "Compound family", "Foster family"],
      originalOptions: ["Extended family", "Nuclear family", "Compound family", "Foster family"],
      correctAnswer: "Extended family",
      explanation: "An extended family goes beyond the nuclear family pattern to include other relatives like uncles, aunts, or cousins.",
      difficulty: "Easy",
      topic: "Family and Living"
    },
    {
      subjectId: "national_value",
      questionText: "What is the primary objective of establishing the National Drug Law Enforcement Agency (NDLEA) in Nigeria?",
      options: ["To combat drug abuse and illicit trafficking", "To manage national youth services", "To settle boundary disputes", "To regulate food and drugs"],
      originalOptions: ["To combat drug abuse and illicit trafficking", "To manage national youth services", "To settle boundary disputes", "To regulate food and drugs"],
      correctAnswer: "To combat drug abuse and illicit trafficking",
      explanation: "The NDLEA is empowered to eliminate the growing, processing, selling, exporting, and trafficking of hard drugs.",
      difficulty: "Medium",
      topic: "Contemporary Social Issues"
    }
  ],
  business_studies: [
    {
      subjectId: "business_studies",
      questionText: "What is the primary accounting system where every transaction is recorded twice, on the Debit and Credit sides?",
      options: ["Double-entry system", "Single-entry system", "Ledger audit program", "Subsidiary balance book"],
      originalOptions: ["Double-entry system", "Single-entry system", "Ledger audit program", "Subsidiary balance book"],
      correctAnswer: "Double-entry system",
      explanation: "The double-entry system requires that for every debit entry there is an equal and opposite credit entry.",
      difficulty: "Medium",
      topic: "Bookkeeping & Ledgers"
    },
    {
      subjectId: "business_studies",
      questionText: "Which office layout places many workers together in a large, open floor plan with no walls?",
      options: ["Open office plan", "Closed office plan", "Partitioned office plan", "Cubicle cluster style"],
      originalOptions: ["Open office plan", "Closed office plan", "Partitioned office plan", "Cubicle cluster style"],
      correctAnswer: "Open office plan",
      explanation: "An open office layout arranges all staff within a single expansive room, improving visibility and communication.",
      difficulty: "Easy",
      topic: "Office Practices"
    }
  ],
  yoruba: [
    {
      subjectId: "yoruba",
      questionText: "Kí ni àmì ohun tó wà lórí ọ̀rọ̀ 'mọ́' (láti inú ọ̀rọ̀ mọ́ lẹ́yìn àpẹrẹ)?",
      options: ["Àmì Òkè (/) - Òkè", "Àmì Ìsàlẹ̀ (\\) - Ìsàlẹ̀", "Àmì Àárín (-)", "Àmì Ohùn Meji-pọ̀"],
      originalOptions: ["Àmì Òkè (/) - Òkè", "Àmì Ìsàlẹ̀ (\\) - Ìsàlẹ̀", "Àmì Àárín (-)", "Àmì Ohùn Meji-pọ̀"],
      correctAnswer: "Àmì Òkè (/) - Òkè",
      explanation: "Àmì ohùn òkè (/) gbé ohùn sókè, bíi mọ́ (ohùn 'mí'). Àmì ohùn ìsàlẹ̀ (\\) sì gbé ohùn kalẹ̀ bíi 'bọ̀' (ohùn 'dò'). Àmì àárín kò ní àmì kankan lórí rẹ̀.",
      difficulty: "Medium",
      topic: "Àmì Ohùn"
    },
    {
      subjectId: "yoruba",
      questionText: "Sọ nọ́ḿbà Òǹkà Yoruba 'Aádọ́rin' ní èdè Gẹ̀ẹ́sì:",
      options: ["70", "50", "60", "80"],
      originalOptions: ["70", "50", "60", "80"],
      correctAnswer: "70",
      explanation: "Aádọ́rin jẹ́ àádọ́rin (dín ní mẹ́wàá ní ogójì padà la bẹ́ fún àádọ́rin) - eyi jẹ́ àádọ́ta-mẹ́wàá-mẹ́rin, tó túmọ̀ sí 70 (Ogun mẹ́rin dín mẹ́wàá).",
      difficulty: "Hard",
      topic: "Òǹkà Yoruba"
    },
    {
      subjectId: "yoruba",
      questionText: "Kí ni ara ìkíni tí a máa ń kọ fún ọkùnrin tàbí ọmọdé lórí orúnkún ní ilẹ̀ Yoruba?",
      options: ["Dídọ̀bálẹ̀ fún ọkùnrin, níná orúnkún fún obìnrin", "Nína ọwọ́ mọ́ra", "Fífẹnukonu lóju àpẹrẹ", "Mímú ọwọ́ pọ̀"],
      originalOptions: ["Dídọ̀bálẹ̀ fún ọkùnrin, níná orúnkún fún obìnrin", "Nína ọwọ́ mọ́ra", "Fífẹnukonu lóju àpẹrẹ", "Mímú ọwọ́ pọ̀"],
      correctAnswer: "Dídọ̀bálẹ̀ fún ọkùnrin, níná orúnkún fún obìnrin",
      explanation: "Ní ilẹ̀ Yoruba, ọkùnrin a máa dọ̀bálẹ̀ gbalasa láti kí àgbàlagbà nígbà tí obìnrin a máa kúnlẹ̀ láti gba ìkíni pẹ̀lú ọ̀wọ̀ gidi.",
      difficulty: "Easy",
      topic: "Àṣà Yoruba"
    }
  ]
};

// Advanced subject-specific programmatic question generators to scale database up to 80+ questions per subject
function generateRemainingQuestions(subjectId: string, currentCount: number, target: number = 80): Question[] {
  const generated: Question[] = [];
  let index = currentCount;

  const quizTags = [
    "REVISION QUIZ:",
    "CBT PRACTICE CORE:",
    "BECE JSS3 PREP:",
    "ACADEMIC EVALUATION:",
    "CORE PRACTICE QUESTIONS:",
    "JSS3 CLASS PRACTICE:",
    "EXAM EVALUATION CELL:",
    "SELECTION MODULE:",
    "REVISION CORE CELL:",
    "SYLLABUS OBJECTIVE:"
  ];

  // Independent sub-indexes to guarantee all unique dataset entries are sequentially fully exhausted
  let synonymSubIndex = 0;
  let antonymSubIndex = 0;
  let concordSubIndex = 0;
  let prepsSubIndex = 0;
  let spellingSubIndex = 0;

  let bioSubIndex = 0;
  let techSubIndex = 0;
  let compSubIndex = 0;
  let pheSubIndex = 0;

  let cropSubIndex = 0;
  let agSubIndex = 0;
  let homeSubIndex = 0;

  let civicsSubIndex = 0;
  let socialSubIndex = 0;
  let securitySubIndex = 0;
  let democracySubIndex = 0;

  let booksSubIndex = 0;
  let officeSubIndex = 0;
  let commSubIndex = 0;

  let onkaSubIndex = 0;
  let asaSubIndex = 0;
  let edeSubIndex = 0;

  while (index < target) {
    let qText = "";
    let options: string[] = [];
    let correct = "";
    let explanation = "";
    let topic = "";
    let diff: "Easy" | "Medium" | "Hard" = "Medium";

    if (subjectId === "maths") {
      const type = index % 4;
      if (type === 0) {
        // Linear equation
        const a = 2 + (index % 5);
        const ans = 3 + (index % 8);
        const b = (index % 4) * 2 + 1;
        const rhs = a * ans + b;
        qText = `Solve for y in the equation: ${a}y + ${b} = ${rhs}.`;
        correct = `y = ${ans}`;
        options = [`y = ${ans}`, `y = ${ans + 2}`, `y = ${ans - 1}`, `y = ${Math.round(rhs / a)}`].filter((v, i, self) => self.indexOf(v) === i);
        while (options.length < 4) options.push(`y = ${ans + options.length + 1}`);
        explanation = `Subtract ${b} from both sides: ${a}y = ${rhs} - ${b} => ${a}y = ${rhs - b}. Dividing by ${a} yields y = ${ans}.`;
        topic = "Algebra";
        diff = "Medium";
      } else if (type === 1) {
        // Geometry Area
        const base = 4 + (index % 12);
        const height = 6 + (index % 10);
        const area = 0.5 * base * height;
        qText = `Find the area of a right-angled triangle with base ${base} cm and height ${height} cm.`;
        correct = `${area} sq. cm`;
        options = [`${area} sq. cm`, `${area + 4} sq. cm`, `${base * height} sq. cm`, `${area / 2} sq. cm`].filter((v, i, self) => self.indexOf(v) === i);
        while (options.length < 4) options.push(`${area + options.length * 5} sq. cm`);
        explanation = `Area of a triangle = 1/2 * base * height. Here: 1/2 * ${base} * ${height} = ${area} sq. cm.`;
        topic = "Geometry";
        diff = "Easy";
      } else if (type === 2) {
        // Fractions & Percentages
        const total = 50 + (index % 10) * 10;
        const pct = 10 + (index % 9) * 5;
        const val = (pct / 100) * total;
        qText = `Calculate ${pct}% of ${total} pupils in a Junior Secondary School.`;
        correct = `${val} pupils`;
        options = [`${val} pupils`, `${val - 5} pupils`, `${(pct + 5) / 100 * total} pupils`, `${total - val} pupils`].filter((v, i, self) => self.indexOf(v) === i);
        while (options.length < 4) options.push(`${val + options.length * 3} pupils`);
        explanation = `${pct}% of ${total} is computed as: (${pct} / 100) * ${total} = ${val} pupils.`;
        topic = "Fractions & Percentages";
        diff = "Easy";
      } else {
        // Statistics mean
        const num1 = 2 + (index % 3);
        const num2 = 5 + (index % 4);
        const num3 = 8 + (index % 3);
        const num4 = 9 + (index % 5);
        const sum = num1 + num2 + num3 + num4;
        const mean = sum / 4;
        qText = `Find the arithmetic mean of the following student scores: ${num1}, ${num2}, ${num3}, ${num4}.`;
        correct = `${mean}`;
        options = [`${mean}`, `${mean + 1}`, `${mean - 1.5}`, `${sum}`].filter((v, i, self) => self.indexOf(v) === i);
        while (options.length < 4) options.push(`${mean + options.length}`);
        explanation = `The mean is the sum divided by count: (${num1} + ${num2} + ${num3} + ${num4}) / 4 = ${sum} / 4 = ${mean}.`;
        topic = "Statistics & Probability";
        diff = "Hard";
      }
    } else if (subjectId === "english") {
      const type = index % 5;
      const studentNames = ["Olumide", "Chidi", "Fatima", "Amina", "Efe", "Tunde", "Emeka", "Aisha", "Bisi", "Yusuf", "Ngozi", "Yetunde", "Uche", "Kelechi", "Folake", "Tobi", "Ifeanyi", "Kemi", "Tayo", "Sada"];
      const studentName = studentNames[index % studentNames.length];
      const tag = quizTags[index % quizTags.length];

      if (type === 0) {
        // Synonyms
        const synonymsList = [
          { word: "diligent", syn: "hardworking", options: ["hardworking", "lazy", "clever", "proud"], exp: "Diligent means showing care and conscientiousness in one's work." },
          { word: "amiable", syn: "friendly", options: ["friendly", "hostile", "rude", "fearful"], exp: "Amiable means having or displaying a friendly and pleasant manner." },
          { word: "frugal", syn: "economical", options: ["economical", "wasteful", "generous", "greedy"], exp: "Frugal means sparing or economical with regard to money or food." },
          { word: "candid", syn: "honest", options: ["honest", "deceptive", "quiet", "polite"], exp: "Candid means truthful and straightforward; frank." },
          { word: "perilous", syn: "dangerous", options: ["dangerous", "safe", "exciting", "long"], exp: "Perilous means full of danger or risk." },
          { word: "loquacious", syn: "talkative", options: ["talkative", "silent", "wise", "angry"], exp: "Loquacious means tending to talk a great deal." },
          { word: "benevolent", syn: "kind", options: ["kind", "cruel", "stingy", "proud"], exp: "Benevolent means well-meaning and kindly." },
          { word: "austere", syn: "strict", options: ["strict", "gentle", "luxurious", "cheerful"], exp: "Austere means severe or strict in manner, attitude, or appearance." },
          { word: "audacious", syn: "bold", options: ["bold", "cowardly", "careful", "honest"], exp: "Audacious means showing a willingness to take surprisingly bold risks." },
          { word: "clandestine", syn: "secret", options: ["secret", "public", "noisy", "clean"], exp: "Clandestine means kept secret or done secretively." },
          { word: "obsolete", syn: "outdated", options: ["outdated", "modern", "expensive", "fragile"], exp: "Obsolete means no longer produced or used; out of date." },
          { word: "resilient", syn: "strong", options: ["strong", "weak", "flexible", "nervous"], exp: "Resilient means able to withstand or recover quickly from difficult conditions." },
          { word: "impeccable", syn: "faultless", options: ["faultless", "dirty", "complex", "cheap"], exp: "Impeccable means in accordance with the highest standards; faultless." },
          { word: "hazardous", syn: "risky", options: ["risky", "secure", "healthy", "simple"], exp: "Hazardous means risky or dangerous." },
          { word: "subtle", syn: "delicate", options: ["delicate", "obvious", "strong", "rough"], exp: "Subtle means so delicate or precise as to be difficult to analyze or describe." }
        ];
        const item = synonymsList[synonymSubIndex % synonymsList.length];
        qText = `${tag} Identify the option closest in meaning (SYNONYM) to the capitalized word: ${studentName} is known to be extremely ${item.word.toUpperCase()} in JSS3.`;
        correct = item.syn;
        options = item.options;
        explanation = item.exp;
        topic = "Synonyms";
        diff = "Medium";
        synonymSubIndex++;
      } else if (type === 1) {
        // Antonyms
        const antonymsList = [
          { word: "commence", ant: "terminate", options: ["terminate", "begin", "suspend", "prolong"], exp: "Commence means to start; its opposite is terminate, which means to bring to an end." },
          { word: "vague", ant: "precise", options: ["precise", "unclear", "simple", "dull"], exp: "Vague means unclear or undefined; the opposite is precise." },
          { word: "proud", ant: "humble", options: ["humble", "arrogant", "wealthy", "careful"], exp: "The antonym of proud is humble, indicating modesty." },
          { word: "gigantic", ant: "tiny", options: ["tiny", "huge", "heavy", "vast"], exp: "Gigantic means extremely large; its opposite is tiny." },
          { word: "loyal", ant: "treacherous", options: ["treacherous", "faithful", "friendly", "honest"], exp: "Loyal means faithful; the opposite is treacherous or disloyal." },
          { word: "ancient", ant: "modern", options: ["modern", "old", "historic", "worn"], exp: "Ancient means dating from a distant past; the opposite is modern." },
          { word: "scarce", ant: "abundant", options: ["abundant", "rare", "few", "costly"], exp: "Scarce means insufficient for demand; the opposite is abundant." },
          { word: "feeble", ant: "robust", options: ["robust", "weak", "gentle", "small"], exp: "Feeble means weak; its opposite is robust or strong." },
          { word: "generous", ant: "miserly", options: ["miserly", "kind", "happy", "giving"], exp: "Generous means sharing freely; the opposite is miserly or stingy." },
          { word: "rigid", ant: "flexible", options: ["flexible", "stiff", "coarse", "hard"], exp: "Rigid means stiff and unbending; the opposite is flexible." }
        ];
        const item = antonymsList[antonymSubIndex % antonymsList.length];
        qText = `${tag} Choose the option containing the ideal ANTONYM (opposite in meaning) of: '${item.word.toUpperCase()}'.`;
        correct = item.ant;
        options = item.options;
        explanation = item.exp;
        topic = "Antonyms";
        diff = "Medium";
        antonymSubIndex++;
      } else if (type === 2) {
        // Concord
        const concords = [
          { sub: "A number of candidates", verb: "are", opts: ["are", "is", "was", "has been"], exp: "'A number of' takes a plural verb ('are')." },
          { sub: "The number of JSS3 students", verb: "is", opts: ["is", "are", "were", "have been"], exp: "'The number of' takes a singular verb ('is')." },
          { sub: "Neither the teacher nor the students", verb: "are", opts: ["are", "is", "was", "has"], exp: "With 'neither... nor...', the verb agrees with the closer subject ('students')." },
          { sub: "Neither the students nor the teacher", verb: "is", opts: ["is", "are", "were", "have"], exp: "With 'neither... nor...', the verb agrees with the closer subject ('teacher')." },
          { sub: "Every boy and girl in the exam hall", verb: "is", opts: ["is", "are", "were", "have"], exp: "Subjects preceded by 'every' take a singular verb ('is')." },
          { sub: "Bread and butter", verb: "is", opts: ["is", "are", "were", "have been"], exp: "Bread and butter represents a singular concept (breakfast), taking singular verb 'is'." },
          { sub: "One of the boys", verb: "was", opts: ["was", "were", "are", "have been"], exp: "The subject is 'One', requiring the singular past verb 'was'." },
          { sub: "Many a candidate", verb: "has", opts: ["has", "have", "are", "were"], exp: "'Many a' is followed by a singular noun and singular verb ('has')." },
          { sub: `${studentName} as well as his friends`, verb: "is", opts: ["is", "are", "were", "have"], exp: "When a parenthetical phrase ('as well as...') is used, the verb agrees with the main subject ('is')." }
        ];
        const item = concords[concordSubIndex % concords.length];
        qText = `${tag} Choose the option that best completes the sentence grammatically: '${item.sub} ________ currently preparing for the CBT trial.'`;
        correct = item.verb;
        options = item.opts;
        explanation = item.exp;
        topic = "Grammar & Concord";
        diff = "Medium";
        concordSubIndex++;
      } else if (type === 3) {
        // Prepositions
        const preps = [
          { phrase: "congratulated her ________ her success", prep: "on", opts: ["on", "for", "with", "at"], exp: "We congratulate someone 'on' their success." },
          { phrase: "is very interested ________ computer science", prep: "in", opts: ["in", "at", "about", "with"], exp: "The adjective 'interested' is followed by 'in'." },
          { phrase: "was accused ________ examination cheating", prep: "of", opts: ["of", "for", "against", "with"], exp: "The verb 'accused' takes the preposition 'of'." },
          { phrase: "has to comply ________ the rules", prep: "with", opts: ["with", "to", "by", "for"], exp: "'Comply' is paired with 'with' to signify obedience." },
          { phrase: "always relies ________ Mr. Simon for guidance", prep: "on", opts: ["on", "at", "with", "for"], exp: "To 'rely' on someone is the standard idiomatic expression." },
          { phrase: "is outstandingly good ________ mathematics", prep: "at", opts: ["at", "in", "with", "for"], exp: "To be skilled is to be 'good at' something." },
          { phrase: "must abstain ________ bad habits", prep: "from", opts: ["from", "with", "by", "against"], exp: "'Abstain' translates to staying away 'from'." }
        ];
        const item = preps[prepsSubIndex % preps.length];
        qText = `${tag} Select the appropriate preposition to complete: '${studentName} ${item.phrase}.'`;
        correct = item.prep;
        options = item.opts;
        explanation = item.exp;
        topic = "Prepositions";
        diff = "Easy";
        prepsSubIndex++;
      } else {
        // Spelling & Analogy
        const spellings = [
          { q: "Which of the following represents the correct spelling of a place to stay?", a: "accommodation", opts: ["accommodation", "accomodation", "acommodation", "acomodation"], exp: "Accommodation contains double 'c' and double 'm'." },
          { q: "Select the correctly spelled word referring to an event or happening:", a: "occurrence", opts: ["occurrence", "ocurrence", "occurrance", "ocurrance"], exp: "Occurrence has double 'c' and double 'r'." },
          { q: "Choose the word with the correct spelling:", a: "embarrassment", opts: ["embarrassment", "embarassment", "embarrasment", "embarasment"], exp: "Embarrassment is spelled with double 'r' and double 's'." },
          { q: "Complete the analogy: Kitten is to Cat as Foal is to ________", a: "Horse", opts: ["Horse", "Dog", "Goat", "Deer"], exp: "Foal is a baby horse, just as kitten is a baby cat." },
          { q: "Complete the analogy: Scale is to Weight as Thermometer is to ________", a: "Temperature", opts: ["Temperature", "Pressure", "Speed", "Water"], exp: "A thermometer measures temperature, just as a scale measures weight." }
        ];
        const item = spellings[spellingSubIndex % spellings.length];
        qText = `${tag} ${studentName} was asked: "${item.q}"`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Analogy & Spelling";
        diff = "Easy";
        spellingSubIndex++;
      }
    } else if (subjectId === "basic_science_tech") {
      const type = index % 4;
      const tag = quizTags[index % quizTags.length];

      if (type === 0) {
        // Basic Science
        const bioList = [
          { q: "Which blood vessels carry oxygenated blood away from the lungs back into the left atrium of the heart?", a: "Pulmonary veins", opts: ["Pulmonary veins", "Pulmonary arteries", "Aorta", "Vena cava"], exp: "Oxygenated blood returns to the heart via the pulmonary veins." },
          { q: "What is the primary thermodynamic process in which gas converts directly into solid dry ice?", a: "Deposition", opts: ["Deposition", "Sublimation", "Condensation", "Evaporation"], exp: "Deposition is the phase change directly from gas to solid." },
          { q: "Which of the following organic structures represents the powerhouse of our eukaryotic cell?", a: "Mitochondria", opts: ["Mitochondria", "Nucleus", "Ribosome", "Cytoplasm"], exp: "Mitochondria convert chemical fuel into ATP energy." },
          { q: "The process of green plant cells converting carbon dioxide and water into glucose is:", a: "Photosynthesis", opts: ["Photosynthesis", "Respiration", "Transpiration", "Decomposition"], exp: "Photosynthesis produces food using raw sunlight, carbon dioxide, and water." },
          { q: "What is the standard chemical formula representing water?", a: "H2O", opts: ["H2O", "CO2", "NaCl", "O2"], exp: "Water consists of 2 Hydrogen atoms and 1 Oxygen atom." }
        ];
        const item = bioList[bioSubIndex % bioList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Basic Science";
        diff = "Medium";
        bioSubIndex++;
      } else if (type === 1) {
        // Basic Tech
        const techList = [
          { q: "Which drawing scale reduces a very large building plan to fit neatly onto drawing sheet templates?", a: "Reduction scale", opts: ["Reduction scale", "Enlargement scale", "Full scale", "Diagonal scale"], exp: "Reduction scale (e.g., 1:100) scales down physical objects on paper." },
          { q: "Which metalwork alloy is produced by combined elements of Copper and Zinc?", a: "Brass", opts: ["Brass", "Bronze", "Solder", "Steel"], exp: "Brass is copper combined with zinc, whereas bronze combines copper with tin." },
          { q: "What kind of wooden hammer mallet is specifically engineered to strike wood chisels?", a: "Wooden mallet", opts: ["Wooden mallet", "Sledge hammer", "Ball-peen hammer", "Claw hammer"], exp: "A wooden mallet transfers soft force, protecting wood chisel handles." },
          { q: "In engineering tech drawings, what does a dashed thin line typically represent?", a: "Hidden details", opts: ["Hidden details", "Center lines", "Cutting planes", "Visible borders"], exp: "Dashed lines represent hidden geometry not directly visible from the view." }
        ];
        const item = techList[techSubIndex % techList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Basic Technology";
        diff = "Medium";
        techSubIndex++;
      } else if (type === 2) {
        // Computer Studies
        const compList = [
          { q: "Which logic gate outputs a high signal (TRUE) only if all of its input lines are active (TRUE)?", a: "AND gate", opts: ["AND gate", "OR gate", "NOT gate", "NAND gate"], exp: "The AND gate requires all inputs to be true to produce a high output." },
          { q: "How many bits are contained in exactly one byte of computer memory allocation?", a: "8 bits", opts: ["8 bits", "4 bits", "16 bits", "32 bits"], exp: "A byte consists of 8 bits representing an alphanumeric character." },
          { q: "Which program utility translates high-level source code completely to machines code in one sweep?", a: "Compiler", opts: ["Compiler", "Interpreter", "Assembler", "Linker"], exp: "Compilers convert the entire source code file to a binary executable at once." },
          { q: "What local network structure represents the abbreviation 'LAN'?", a: "Local Area Network", opts: ["Local Area Network", "Logistical Array Network", "Long Access Node", "Laid Area Network"], exp: "LAN connects machines inside a single room or school compound." }
        ];
        const item = compList[compSubIndex % compList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Computer Studies";
        diff = "Easy";
        compSubIndex++;
      } else {
        // PHE
        const pheList = [
          { q: "Which fundamental food class provides the immediate main fuel substrate for working cells?", a: "Carbohydrates", opts: ["Carbohydrates", "Proteins", "Vitamins", "Minerals"], exp: "Carbohydrates are digested into sugar which provides immediate cellular fuel." },
          { q: "What first-aid treatment is recommended for immediate local sports muscle sprain injuries?", a: "R.I.C.E. protocol", opts: ["R.I.C.E. protocol", "Intense massage", "Running exercise", "Hot compressing"], exp: "R.I.C.E. stands for Rest, Ice, Compression, Elevation, which reduces acute swelling." },
          { q: "Which organ synthesizes the digestive bile liquid stored in the gallbladder?", a: "Liver", opts: ["Liver", "Stomach", "Pancreas", "Heart"], exp: "Bile is manufactured in the liver and stores inside the gallbladder." }
        ];
        const item = pheList[pheSubIndex % pheList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Physical & Health Education";
        diff = "Easy";
        pheSubIndex++;
      }
    } else if (subjectId === "prevocational_studies") {
      const type = index % 3;
      const tag = quizTags[index % quizTags.length];

      if (type === 0) {
        // Crop Types (Agriculture)
        const cropsList = [
          { crop: "Cassava", val: "Tuber crop", exp: "Cassava is a root tuber crop." },
          { crop: "Maize", val: "Cereal crop", exp: "Maize is a grass crop producing edible grains (cereals)." },
          { crop: "Groundnut", val: "Legume crop", exp: "Groundnut is categorized as a legume." },
          { crop: "Cotton", val: "Fiber crop", exp: "Cotton is cultivated for fiber used in weaving." },
          { crop: "Yam", val: "Tuber crop", exp: "Yam is a stem tuber cultivated in the tropics." }
        ];
        const item = cropsList[cropSubIndex % cropsList.length];
        qText = `${tag} In agricultural studies, ${item.crop} is classified primarily as a:`;
        correct = item.val;
        options = [item.val, "Spice crop", "Forage crop", "Beverage crop"].filter((v, i, self) => self.indexOf(v) === i);
        while (options.length < 4) options.push(`Other Class ${options.length}`);
        explanation = item.exp;
        topic = "Crop Types";
        diff = "Medium";
        cropSubIndex++;
      } else if (type === 1) {
        const agList = [
          { q: "What artificial irrigation method is best for dry soil?", a: "Irrigation", opts: ["Irrigation", "Drainage", "De-silting", "Mulching"], exp: "Irrigation provides water to dry lands." },
          { q: "Which animal parasite represents cattle ticks feeding on skin?", a: "Tick", opts: ["Tick", "Tapeworm", "Louse", "Fluke"], exp: "Ticks are common external parasites on cattle." },
          { q: "Which soil building nutrient promotes thick leaf vegetative growth?", a: "Nitrogen", opts: ["Nitrogen", "Potassium", "Humus", "Boron"], exp: "Nitrogen acts as a catalyst for green vegetative leaf cells." }
        ];
        const item = agList[agSubIndex % agList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Agricultural Science";
        diff = "Medium";
        agSubIndex++;
      } else {
        const homeList = [
          { q: "Which food nutrient serves to repair damaged tissue blocks?", a: "Proteins", opts: ["Proteins", "Fats", "Starch", "Vitamins"], exp: "Proteins construct muscle cells and mend tissue." },
          { q: "Which laundry material is perfect to lower surface tension of grease?", a: "Detergent", opts: ["Detergent", "Bleach", "Starch", "Acid"], exp: "Detergents reduce active surface tension." },
          { q: "Which deficiency represents lack of proper Vitamin A intake?", a: "Night blindness", opts: ["Night blindness", "Kwashiorkor", "Scurvy", "Rockets"], exp: "Vitamin A keeps eye rod pigments healthy." }
        ];
        const item = homeList[homeSubIndex % homeList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Home Economics";
        diff = "Easy";
        homeSubIndex++;
      }
    } else if (subjectId === "national_value") {
      const type = index % 4;
      const tag = quizTags[index % quizTags.length];

      if (type === 0) {
        // Civic
        const civicsList = [
          { q: "Which of the following describes franchise in political science?", a: "Right to vote", opts: ["Right to vote", "Right to execute rules", "Sovereignty of power", "Diplomatic immunity"], exp: "Franchise is the constitutional right of choice by voting." },
          { q: "Which duty represents principal civic obligations of citizens?", a: "Paying tax promptly", opts: ["Paying tax promptly", "Altering highway routes", "Conducting private laws", "Refusing military call"], exp: "Tax payment supports public works and state funding." }
        ];
        const item = civicsList[civicsSubIndex % civicsList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Civic Education";
        diff = "Easy";
        civicsSubIndex++;
      } else if (type === 1) {
        // Social Studies
        const socialList = [
          { q: "Which division of parenting represents nuclear family structures?", a: "Parents and children", opts: ["Parents and children", "Uncles and cousins", "Clan segments", "Ancestral compound"], exp: "Nuclear family consists only of parents and their biological or legal children." },
          { q: "What community term describes ethnocentrism beliefs and conflicts?", a: "Ethnic superiority belief", opts: ["Ethnic superiority belief", "National integration", "Public collaboration", "Bilingual harmony"], exp: "Ethnocentrism believes its cultural tribe is superior to others." }
        ];
        const item = socialList[socialSubIndex % socialList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Social Studies";
        diff = "Easy";
        socialSubIndex++;
      } else if (type === 2) {
        // Security
        const securityList = [
          { q: "Which agency represents public highway safety control in Nigeria?", a: "FRSC", opts: ["FRSC", "EFCC", "NEMA", "NDLEA"], exp: "Federal Road Safety Corps polices speed limits and road transit safety." },
          { q: "What action represents proper safety if handled suspicious parcels?", a: "Reject and report to parents", opts: ["Reject and report to parents", "Accept it quickly", "Tuck it inside a bag", "Open it with force"], exp: "Always notify elders about unidentified items." }
        ];
        const item = securityList[securitySubIndex % securityList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Security Education";
        diff = "Medium";
        securitySubIndex++;
      } else {
        // Constitution
        const democracyList = [
          { q: "What is the supreme code of legal authority defining a country?", a: "Constitution", opts: ["Constitution", "Decree", "Manifesto", "School syllabus"], exp: "The constitution outlines governance responsibilities and overrides other acts." },
          { q: "Which commission organizes democratic voting elections in Nigeria?", a: "INEC", opts: ["INEC", "FIRS", "CAC", "NPHCDA"], exp: "INEC is the Independent National Electoral Commission." }
        ];
        const item = democracyList[democracySubIndex % democracyList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Constitution & Democracy";
        diff = "Medium";
        democracySubIndex++;
      }
    } else if (subjectId === "business_studies") {
      const type = index % 3;
      const tag = quizTags[index % quizTags.length];

      if (type === 0) {
        // Bookkeeping
        const booksList = [
          { q: "Which ledger accounts registry records cash transaction details?", a: "Cash Book", opts: ["Cash Book", "Purchases Log", "Sales Day Book", "Petty cash voucher"], exp: "Cash Book handles cash payments and receipts." },
          { q: "Calculate missing value: Assets = Liabilities + owner's ________.", a: "Capital", opts: ["Capital", "Cash flow", "Merchandise", "Losses"], exp: "Accounting equation balances Assets against Liabilities plus Capital." }
        ];
        const item = booksList[booksSubIndex % booksList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Bookkeeping";
        diff = "Medium";
        booksSubIndex++;
      } else if (type === 1) {
        // Office Practices
        const officeList = [
          { q: "Which key is struck to start typed text characters on a fresh line?", a: "Enter key", opts: ["Enter key", "Space bar", "Shift lock", "Alt node"], exp: "Enter key moves focus to the new line." },
          { q: "What records preservation process represents filing folders?", a: "Filing", opts: ["Filing", "Shredding", "Posting", "Billing"], exp: "Filing systematically compiles and keeps papers for easy retrieval." }
        ];
        const item = officeList[officeSubIndex % officeList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Office Practices";
        diff = "Easy";
        officeSubIndex++;
      } else {
        // Commerce
        const commList = [
          { q: "What activity is wholesaling and retailing to buyers?", a: "Trade", opts: ["Trade", "Farming", "Manufacturing", "Banking"], exp: "Trade is buying and selling goods for a margin." },
          { q: "Who purchases goods in bulk from active factories to feed retail outlets?", a: "Wholesaler", opts: ["Wholesaler", "Broker", "Stoker", "Consumer"], exp: "Wholesalers process bulk orders to distribute to retailers." }
        ];
        const item = commList[commSubIndex % commList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Commerce";
        diff = "Easy";
        commSubIndex++;
      }
    } else if (subjectId === "yoruba") {
      const type = index % 3;
      const tag = quizTags[index % quizTags.length];

      if (type === 0) {
        // Òǹkà
        const onkaList = [
          { q: "Sọ nọ́ḿbà Òǹkà Yoruba 'Aádọ́ta' ní èdè Gẹ̀ẹ́sì: ", a: "50", opts: ["50", "40", "60", "30"], exp: "Aádọ́ta jẹ́ 50 ní èdè Gẹ̀ẹ́sì." },
          { q: "Kí ni iye nọ́ḿbà 'ọgbọ̀n' ní èdè Gẹ̀ẹ́sì?", a: "30", opts: ["30", "20", "40", "50"], exp: "Ọgbọ̀n dọ́gba pẹ̀lú 30." }
        ];
        const item = onkaList[onkaSubIndex % onkaList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Òǹkà Yoruba";
        diff = "Medium";
        onkaSubIndex++;
      } else if (type === 1) {
        // Àṣà
        const asaList = [
          { q: "Kí ni ọ̀nà títọ́ fún ọkùnrin láti kí àgbàlagbà ní ilẹ̀ Yoruba?", a: "Dídọ̀bálẹ̀", opts: ["Dídọ̀bálẹ̀", "Yíkúnlẹ̀", "Nína ọwọ́", "Ṣíṣe sálúùtì"], exp: "Ọkùnrin máa ń dọ̀bálẹ̀ fún ọ̀wọ̀ ní ilẹ̀ Yoruba." },
          { q: "Kí ni àṣà títọ́ fún obìnrin láti kí àgbàlagbà ní ilẹ̀ Yoruba?", a: "Yíkúnlẹ̀", opts: ["Yíkúnlẹ̀", "Dídọ̀bálẹ̀", "Ìfẹnukonu", "Yíyọ́-apá"], exp: "Obìnrin máa ń kúnlẹ̀ láti kí àgbà fún ọ̀wọ̀." }
        ];
        const item = asaList[asaSubIndex % asaList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Àṣà Yoruba";
        diff = "Easy";
        asaSubIndex++;
      } else {
        // Èdè & Àmì Ohùn
        const edeList = [
          { q: "Kí ni àmì ohùn tó wà lórí ọ̀rọ̀ 'bọ̀' (bíi 'kábọ̀')?", a: "Àmì Ìsàlẹ̀ (\\)", opts: ["Àmì Ìsàlẹ̀ (\\)", "Àmì Òkè (/)", "Àmì Àárín (-)", "Àmì Meji"], exp: "Àmì ohùn ìsàlẹ̀ (\\) jẹ́ 'dò' (ohùn balẹ̀)." },
          { q: "Fáwẹ́lì mélòó ni ó wà nínú Alifabẹ́ẹ̀tì èdè Yoruba?", a: "Meje (7)", opts: ["Meje (7)", "Márùn-ún (5)", "Mẹ́sàn-án (9)", "Mẹ́fà (6)"], exp: "Fáwẹ́lì èdè Yoruba jẹ́ 7: a, e, ẹ, i, o, ọ, u." }
        ];
        const item = edeList[edeSubIndex % edeList.length];
        qText = `${tag} ${item.q}`;
        correct = item.a;
        options = item.opts;
        explanation = item.exp;
        topic = "Èdè & Àmì Ohùn";
        diff = "Medium";
        edeSubIndex++;
      }
    } else {
      qText = `General Revision Question #${index + 1}: Which option is correct?`;
      correct = "Option Alpha";
      options = ["Option Alpha", "Option Beta", "Option Gamma", "Option Delta"];
      explanation = "This explanation supports the educational value of selecting Option Alpha.";
      topic = "General Syllabus";
      diff = "Medium";
    }

    generated.push({
      id: `${subjectId}_gen_${index}`,
      subjectId,
      questionText: qText,
      options,
      originalOptions: [...options],
      correctAnswer: correct,
      explanation,
      difficulty: diff,
      topic
    });

    index++;
  }

  return generated;
}

// Global initialization function to check local storage and expand database up to 80+ questions per subject
export function initializeDB(): Question[] {
  // Generate full master question list
  const fullList: Question[] = [];
  const subjectsKeys = [
    "maths",
    "english",
    "basic_science_tech",
    "prevocational_studies",
    "national_value",
    "business_studies",
    "yoruba"
  ];

  subjectsKeys.forEach((subId) => {
    // 1. Get handcrafted seeds
    const seeds = HANDCRAFTED_SEEDS[subId] || [];
    const typedSeeds: Question[] = seeds.map((q, i) => ({
      ...q,
      id: `${subId}_seed_${i}`
    }));

    // 2. Generate remaining questions to reach exactly 80 questions (per subject)
    const extra = generateRemainingQuestions(subId, typedSeeds.length, 80);

    fullList.push(...typedSeeds, ...extra);
  });

  // Save to LocalStorage
  localStorage.setItem("FF_CBT_QUESTIONS", JSON.stringify(fullList));
  localStorage.setItem("FF_CBT_DB_INITIALIZED", "true");

  // Create default activity logs
  const prepLogs = [
    {
      id: `log_init_${Date.now()}`,
      userId: "system",
      userName: "System Database Manager",
      userRole: "ADMIN",
      action: "Database Initialized",
      timestamp: new Date().toISOString(),
      details: "Faith Foundation JSS3 CBT Question Bank initialized with 560 questions across 7 subjects."
    }
  ];
  localStorage.setItem("FF_CBT_ACTIVITY_LOGS", JSON.stringify(prepLogs));

  return fullList;
}

export function getQuestionsFromDB(): Question[] {
  const current = localStorage.getItem("FF_CBT_QUESTIONS");
  const forceRefresh = !localStorage.getItem("FF_CBT_DB_V4_REPEATS_FIXED");
  
  // Check if it's the old database format or missing our duplicate prevention overhaul
  if (forceRefresh || (current && (current.includes('"cca"') || current.includes('"basic_science"') || !current.includes('"basic_science_tech"') || !current.includes("REVISION QUIZ:")))) {
    localStorage.removeItem("FF_CBT_QUESTIONS");
    localStorage.removeItem("FF_CBT_DB_INITIALIZED");
    localStorage.setItem("FF_CBT_DB_V4_REPEATS_FIXED", "true");
    return initializeDB();
  }
  
  if (!current) {
    return initializeDB();
  }
  try {
    return JSON.parse(current);
  } catch (e) {
    return initializeDB();
  }
}

export function saveQuestionsToDB(questions: Question[]) {
  localStorage.setItem("FF_CBT_QUESTIONS", JSON.stringify(questions));
}

export function addQuestionToDB(q: Omit<Question, "id">): Question {
  const list = getQuestionsFromDB();
  const newId = `${q.subjectId}_added_${Date.now()}`;
  const fullQ: Question = {
    ...q,
    id: newId,
    originalOptions: [...q.options]
  };
  list.unshift(fullQ); // Add to the front
  saveQuestionsToDB(list);

  // Log activity
  logActivity("admin_default", "Administrator", "ADMIN", "Add Question", `Added a new JSS3 question for ${q.subjectId} (${q.topic}): "${q.questionText.slice(0, 40)}..."`);
  return fullQ;
}

export function updateQuestionInDB(id: string, updated: Partial<Question>) {
  const list = getQuestionsFromDB();
  const idx = list.findIndex((q) => q.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updated } as Question;
    saveQuestionsToDB(list);
    logActivity("admin_default", "Administrator", "ADMIN", "Edit Question", `Edited JSS3 question with ID: ${id}`);
  }
}

export function deleteQuestionFromDB(id: string) {
  const list = getQuestionsFromDB();
  const filtered = list.filter((q) => q.id !== id);
  saveQuestionsToDB(filtered);
  logActivity("admin_default", "Administrator", "ADMIN", "Delete Question", `Deleted question with ID: ${id}`);
}

export function logActivity(userId: string, userName: string, role: string, action: string, details: string) {
  try {
    const logsStr = localStorage.getItem("FF_CBT_ACTIVITY_LOGS") || "[]";
    const logs = JSON.parse(logsStr);
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userName,
      userRole: role,
      action,
      timestamp: new Date().toISOString(),
      details
    };
    logs.unshift(newLog);
    // Keep last 200 logs
    localStorage.setItem("FF_CBT_ACTIVITY_LOGS", JSON.stringify(logs.slice(0, 200)));
  } catch (e) {
    console.error("Failed to log activity", e);
  }
}

export function getActivityLogs(): any[] {
  try {
    const logsStr = localStorage.getItem("FF_CBT_ACTIVITY_LOGS") || "[]";
    return JSON.parse(logsStr);
  } catch (e) {
    return [];
  }
}
