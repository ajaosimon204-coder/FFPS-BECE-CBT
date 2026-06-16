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
      const type = index % 4;
      const vocab = [
        { word: "ABRUPT", syn: "sudden", ant: "gradual" },
        { word: "LOYAL", syn: "faithful", ant: "treacherous" },
        { word: "GIGANTIC", syn: "huge", ant: "tiny" },
        { word: "ANCIENT", syn: "old", ant: "modern" },
        { word: "ACUTE", syn: "sharp", ant: "mild" },
        { word: "SINCERE", syn: "honest", ant: "insincere" },
        { word: "GENEROUS", syn: "kind", ant: "miserly" },
        { word: "DEFEND", syn: "protect", ant: "attack" }
      ];
      const selected = vocab[index % vocab.length];

      if (type === 0) {
        qText = `Choose the word which is most nearly SYNONYMOUS in meaning to: '${selected.word}'`;
        correct = selected.syn;
        options = [selected.syn, selected.ant, "redundant", "passive"];
        explanation = `The synonym (word with similar meaning) of '${selected.word}' is '${selected.syn}'.`;
        topic = "Synonyms";
        diff = "Easy";
      } else if (type === 1) {
        qText = `Choose the option containing the ideal ANTONYM (opposite in meaning) of: '${selected.word}'`;
        correct = selected.ant;
        options = [selected.ant, selected.syn, "artificial", "neutral"];
        explanation = `The antonym (word with opposite meaning) of '${selected.word}' is '${selected.ant}'.`;
        topic = "Antonyms";
        diff = "Easy";
      } else if (type === 2) {
        // Concord
        const nouns = ["The flock of birds", "The committee", "A group of boys", "A pack of wolves"];
        const noun = nouns[index % nouns.length];
        qText = `Select the correct form to complete: '${noun} ________ migrating south for the season.'`;
        correct = "is";
        options = ["is", "are", "have been", "were"];
        explanation = `Collective nouns representing a singular unit ('flock', 'group') require the singular verb agreement ('is').`;
        topic = "Grammar & Concord";
        diff = "Medium";
      } else {
        // Prepositions
        const phrases = [
          { s: "He was fully absorbed ________ his science project.", a: "in", opt: ["in", "at", "with", "by"] },
          { s: "Our prefect was warned against showing preference ________ his friends.", a: "for", opt: ["for", "to", "at", "by"] },
          { s: "You must comply ________ the examination code of conduct.", a: "with", opt: ["with", "to", "by", "at"] },
          { s: "He was outstandingly good ________ mathematics.", a: "at", opt: ["at", "in", "with", "for"] }
        ];
        const phrase = phrases[index % phrases.length];
        qText = phrase.s;
        correct = phrase.a;
        options = phrase.opt;
        explanation = `The standard preposition compatible with this phrase structure is '${phrase.a}'.`;
        topic = "Prepositions";
        diff = "Medium";
      }
    } else if (subjectId === "basic_science_tech") {
      const type = index % 4;
      if (type === 0) {
        qText = `Which of these blood vessels carries oxygenated blood from the lungs back to the heart?`;
        correct = "Pulmonary vein";
        options = ["Pulmonary vein", "Pulmonary artery", "Aorta", "Vena cava"];
        explanation = "The pulmonary vein is the unique vein that carries oxygenated blood from the lungs to the left atrium of the heart.";
        topic = "Basic Science";
        diff = "Medium";
      } else if (type === 1) {
        qText = `Which electronic component is specifically used to allow current to flow in one direction only?`;
        correct = "Diode";
        options = ["Diode", "Resistor", "Capacitor", "Transistor"];
        explanation = "A diode is a semiconductor device that acts as a one-way switch for current.";
        topic = "Basic Technology";
        diff = "Easy";
      } else if (type === 2) {
        qText = `In computing logic gate design, which boolean logic gate outputs TRUE only if all input values are TRUE?`;
        correct = "AND gate";
        options = ["AND gate", "OR gate", "NOT gate", "NAND gate"];
        explanation = "The AND gate requires both/all inputs to be true to produce a true output.";
        topic = "Computer Studies";
        diff = "Medium";
      } else {
        qText = `Which nutrient class represents the primary source of operational fuel and energy for the human machinery?`;
        correct = "Carbohydrates";
        options = ["Carbohydrates", "Proteins", "Vitamins", "Minerals"];
        explanation = "Carbohydrates are digested into glucose, which is the direct energy substrate for working cells.";
        topic = "Physical & Health Education";
        diff = "Easy";
      }
    } else if (subjectId === "prevocational_studies") {
      const type = index % 3;
      if (type === 0) {
        const crops = [
          { crop: "Cassava", val: "Tuber crop", exp: "Cassava stores food in its underground root tubers." },
          { crop: "Maize", val: "Cereal crop", exp: "Maize belongs to the grass family and produces edible grains (cereals)." },
          { crop: "Groundnut", val: "Legume", exp: "Groundnut is categorized as a legume, producing seeds in pods." }
        ];
        const item = crops[index % crops.length];
        qText = `In agricultural studies, ${item.crop} is classified as a:`;
        correct = item.val;
        options = [item.val, "Vegetable", "Fruit crop", "Fiber crop"].filter((v, i, self) => self.indexOf(v) === i);
        while (options.length < 4) options.push(`Other Class ${options.length}`);
        explanation = item.exp;
        topic = "Crop Types";
        diff = "Medium";
      } else if (type === 1) {
        qText = `The process of removing excess water from farmland to support healthy crop root breath is called:`;
        correct = "Drainage";
        options = ["Drainage", "Irrigation", "Mulching", "Harrowing"];
        explanation = "Drainage is the natural or artificial removal of surface and sub-surface water from an area to keep soil aeration balanced.";
        topic = "Soil & Water";
        diff = "Medium";
      } else {
        qText = `Which nutrient is mostly required for tissue repairs, growth, and building muscle blocks?`;
        correct = "Proteins";
        options = ["Proteins", "Fats and Oils", "Carbohydrates", "Minerals"];
        explanation = "Proteins are body-builders essential for cellular growth, maintenance, and structural tissues repair.";
        topic = "Nutrition & Cooking";
        diff = "Easy";
      }
    } else if (subjectId === "national_value") {
      const type = index % 4;
      if (type === 0) {
        qText = `The supreme document containing rules and fundamental principles of governance in a country is the:`;
        correct = "Constitution";
        options = ["Constitution", "Manifesto", "Decree", "Syllabus"];
        explanation = "The constitution is the supreme law of the state outlining responsibilities of citizens and governance boundaries.";
        topic = "Governance";
        diff = "Easy";
      } else if (type === 1) {
        qText = `The shared way of life of a group of people, including beliefs, values, and arts, is:`;
        correct = "Culture";
        options = ["Culture", "Tradition", "Religion", "Morals"];
        explanation = "Culture represents the cumulative lifestyle, attitudes, languages, and custom symbols of a population.";
        topic = "Culture & Society";
        diff = "Easy";
      } else if (type === 2) {
        qText = `Which organization is constitutionally empowered to compile voter registers and conduct elections in Nigeria?`;
        correct = "INEC";
        options = ["INEC", "FRSC", "EFCC", "NPC"];
        explanation = "INEC stands for Independent National Electoral Commission, responsible for conducting national general elections.";
        topic = "Democracy";
        diff = "Medium";
      } else {
        qText = `The act of rendering assistance or support to fellow citizens without expecting private profit is:`;
        correct = "Selflessness";
        options = ["Selflessness", "Corruption", "Patriotism", "Nepotism"];
        explanation = "Selflessness means serving others with care, focusing on communal value over individual financial profit.";
        topic = "Core Values";
        diff = "Easy";
      }
    } else if (subjectId === "business_studies") {
      const type = index % 3;
      if (type === 0) {
        qText = `Which book serves as the original record of daily credit purchases for a business?`;
        correct = "Purchases Journal";
        options = ["Purchases Journal", "Sales ledger", "Cash book", "Petty cash voucher"];
        explanation = "All credit transactions involving purchases are originally documented within the Purchases Journal (Day Book).";
        topic = "Bookkeeping";
        diff = "Medium";
      } else if (type === 1) {
        qText = `The process of typing documents using keyboards and standard screen alignment is:`;
        correct = "Keyboarding";
        options = ["Keyboarding", "Filing", "Invoicing", "Telephoning"];
        explanation = "Keyboarding is the primary skill of keying characters into digital formats with high accuracy and speed.";
        topic = "Keyboarding";
        diff = "Easy";
      } else {
        qText = `Which commercial activity is defined as the buying, selling, and distribution of goods and services?`;
        correct = "Trade";
        options = ["Trade", "Production", "Transport", "Warehousing"];
        explanation = "Trade refers directly to buying from suppliers and selling to buyers for a margin.";
        topic = "Commerce";
        diff = "Easy";
      }
    } else if (subjectId === "yoruba") {
      const type = index % 3;
      if (type === 0) {
        qText = `Àpẹọrẹ Òǹkà: 'Aádọ́ta' ní èdè Gẹ̀ẹ́sì jẹ́:`;
        correct = "50";
        options = ["50", "40", "60", "30"];
        explanation = "Aádọ́ta jẹ́ nọ́ḿbà àádọ́ta eyi tí ó túmọ̀ sí 50 ní èdè Gẹ̀ẹ́sì.";
        topic = "Òǹkà Yoruba";
        diff = "Easy";
      } else if (type === 1) {
        qText = `Èwo nínú àwọn nùńbà yìí ni ogún (20) ní Òǹkà Yoruba?`;
        correct = "Ogun";
        options = ["Ogun", "Ọgbọ̀n", "Ogojì", "Àádọ́ta"];
        explanation = "Ogun jẹ́ nọ́ḿbà ogún (20) ní èdè Yoruba. 'Ọgbọ̀n' jẹ́ 30, 'Ogojì' jẹ́ 40.";
        topic = "Òǹkà Yoruba";
        diff = "Medium";
      } else {
        qText = `Ìfẹnukonu tàbí kìkíni 'Ẹ kú àárọ̀' jẹ́ ìkíni fún àsìkò wo?`;
        correct = "Àárọ̀ kutukutu";
        options = ["Àárọ̀ kutukutu", "Ọ̀sán gangan", "Ìrọ̀lẹ́", "Alẹ́"];
        explanation = "A máa ń kísí àwọn ènìyàn ní 'Ẹ kú àárọ̀' nígbà ti ọjọ́ bá ṣẹ̀ṣẹ̀ bẹ̀rẹ̀, tàbí ní àárọ̀ kutukutu.";
        topic = "Àṣà Yoruba";
        diff = "Easy";
      }
    } else {
      qText = `Question #${index + 1} regarding specialized JSS3 parameters:`;
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
  // Check if it's the old database format with 12 subjects (stale/has 'cca' or 'basic_science' or has length around 960)
  if (current && (current.includes('"cca"') || current.includes('"basic_science"') || !current.includes('"basic_science_tech"'))) {
    localStorage.removeItem("FF_CBT_QUESTIONS");
    localStorage.removeItem("FF_CBT_DB_INITIALIZED");
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
