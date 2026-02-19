/**
 * Question Engine — NeuralExam
 * Manages the question bank with IRT parameters, Bloom levels, and curriculum alignment.
 */

const QuestionEngine = (() => {

  const BLOOM_LEVELS = ['Remember','Understand','Apply','Analyze','Evaluate','Create'];
  const DIFFICULTIES = ['Easy','Medium','Hard'];
  const SUBJECTS = ['Computer Science','Mathematics','Physics','Chemistry'];

  // ─── Question Bank ───────────────────────────────────────────────────────────
  const questionBank = [
    // Computer Science
    {id:'q001',subject:'Computer Science',topic:'Data Structures',text:'What is the time complexity of searching in a balanced Binary Search Tree?',type:'MCQ',bloom:'Remember',difficulty:'Easy',irt:{a:0.8,b:-1.2,c:0.25},options:['O(1)','O(log n)','O(n)','O(n log n)'],correct:1,tags:['BST','Complexity']},
    {id:'q002',subject:'Computer Science',topic:'Algorithms',text:'Which sorting algorithm has the best average-case time complexity?',type:'MCQ',bloom:'Understand',difficulty:'Easy',irt:{a:1.0,b:-0.8,c:0.25},options:['Bubble Sort','Selection Sort','Merge Sort','Insertion Sort'],correct:2,tags:['Sorting','Complexity']},
    {id:'q003',subject:'Computer Science',topic:'Data Structures',text:'Explain the difference between a stack and a queue. Provide a real-world use case for each.',type:'Subjective',bloom:'Understand',difficulty:'Medium',irt:{a:1.2,b:0.0,c:0.0},rubric:[{criterion:'Stack definition',maxScore:2},{criterion:'Queue definition',maxScore:2},{criterion:'Stack use case',maxScore:3},{criterion:'Queue use case',maxScore:3}],tags:['Stack','Queue']},
    {id:'q004',subject:'Computer Science',topic:'Algorithms',text:'Given an array [3,1,4,1,5,9,2,6], trace the execution of QuickSort and show the pivot selections.',type:'Subjective',bloom:'Apply',difficulty:'Hard',irt:{a:1.8,b:1.5,c:0.0},rubric:[{criterion:'Correct pivot selection',maxScore:3},{criterion:'Partition logic',maxScore:4},{criterion:'Recursion trace',maxScore:3}],tags:['QuickSort','Trace']},
    {id:'q005',subject:'Computer Science',topic:'Graphs',text:'Which algorithm is used to find the shortest path in a weighted graph with non-negative edges?',type:'MCQ',bloom:'Remember',difficulty:'Easy',irt:{a:0.9,b:-1.0,c:0.25},options:["Dijkstra's","Bellman-Ford","Floyd-Warshall","BFS"],correct:0,tags:['Graph','Shortest Path']},
    {id:'q006',subject:'Computer Science',topic:'OS',text:'What is a deadlock? Describe the four necessary conditions for deadlock to occur.',type:'Subjective',bloom:'Analyze',difficulty:'Medium',irt:{a:1.4,b:0.3,c:0.0},rubric:[{criterion:'Deadlock definition',maxScore:2},{criterion:'Mutual exclusion',maxScore:2},{criterion:'Hold and wait',maxScore:2},{criterion:'No preemption',maxScore:2},{criterion:'Circular wait',maxScore:2}],tags:['OS','Deadlock']},
    {id:'q007',subject:'Computer Science',topic:'Networks',text:'In the OSI model, which layer is responsible for end-to-end communication?',type:'MCQ',bloom:'Remember',difficulty:'Easy',irt:{a:0.7,b:-1.5,c:0.25},options:['Network Layer','Transport Layer','Session Layer','Application Layer'],correct:1,tags:['OSI','Networking']},
    {id:'q008',subject:'Computer Science',topic:'Databases',text:'Analyze the trade-offs between normalization and denormalization in database design for a high-traffic e-commerce platform.',type:'Subjective',bloom:'Evaluate',difficulty:'Hard',irt:{a:2.0,b:1.8,c:0.0},rubric:[{criterion:'Normalization benefits',maxScore:3},{criterion:'Denormalization benefits',maxScore:3},{criterion:'Trade-off analysis',maxScore:4}],tags:['DB','Normalization']},
    {id:'q009',subject:'Computer Science',topic:'Algorithms',text:'What is the space complexity of Depth-First Search on a graph with V vertices and E edges?',type:'MCQ',bloom:'Understand',difficulty:'Medium',irt:{a:1.3,b:0.2,c:0.25},options:['O(1)','O(V)','O(E)','O(V+E)'],correct:1,tags:['DFS','Complexity']},
    {id:'q010',subject:'Computer Science',topic:'OOP',text:'Design a class hierarchy for a vehicle management system. Apply SOLID principles and justify your design choices.',type:'Subjective',bloom:'Create',difficulty:'Hard',irt:{a:1.9,b:2.0,c:0.0},rubric:[{criterion:'Class hierarchy design',maxScore:3},{criterion:'SOLID application',maxScore:4},{criterion:'Justification quality',maxScore:3}],tags:['OOP','SOLID']},
    {id:'q011',subject:'Computer Science',topic:'Data Structures',text:'A hash table uses chaining for collision resolution. What is the average-case time complexity for lookup?',type:'MCQ',bloom:'Apply',difficulty:'Medium',irt:{a:1.5,b:0.5,c:0.25},options:['O(1)','O(log n)','O(n)','O(n²)'],correct:0,tags:['Hash Table','Collision']},
    {id:'q012',subject:'Computer Science',topic:'Algorithms',text:'Compare dynamic programming and greedy algorithms. When would you prefer one over the other?',type:'Subjective',bloom:'Evaluate',difficulty:'Hard',irt:{a:1.7,b:1.2,c:0.0},rubric:[{criterion:'DP explanation',maxScore:3},{criterion:'Greedy explanation',maxScore:3},{criterion:'Comparison and examples',maxScore:4}],tags:['DP','Greedy']},

    // Mathematics
    {id:'q013',subject:'Mathematics',topic:'Calculus',text:'What is the derivative of f(x) = x³ + 3x² - 5x + 2?',type:'MCQ',bloom:'Apply',difficulty:'Easy',irt:{a:0.9,b:-1.1,c:0.25},options:['3x² + 6x - 5','3x² + 3x - 5','x² + 6x - 5','3x³ + 6x - 5'],correct:0,tags:['Derivative','Polynomial']},
    {id:'q014',subject:'Mathematics',topic:'Linear Algebra',text:'Prove that the eigenvalues of a symmetric matrix are always real.',type:'Subjective',bloom:'Evaluate',difficulty:'Hard',irt:{a:1.8,b:1.6,c:0.0},rubric:[{criterion:'Setup with complex eigenvalue assumption',maxScore:3},{criterion:'Conjugate transpose argument',maxScore:4},{criterion:'Conclusion',maxScore:3}],tags:['Eigenvalues','Proof']},
    {id:'q015',subject:'Mathematics',topic:'Probability',text:'Two dice are rolled. What is the probability that the sum is greater than 9?',type:'MCQ',bloom:'Apply',difficulty:'Medium',irt:{a:1.2,b:0.4,c:0.25},options:['1/6','1/4','1/5','1/3'],correct:0,tags:['Probability','Dice']},
    {id:'q016',subject:'Mathematics',topic:'Statistics',text:'Explain the Central Limit Theorem and its significance in statistical inference.',type:'Subjective',bloom:'Understand',difficulty:'Medium',irt:{a:1.3,b:0.1,c:0.0},rubric:[{criterion:'CLT statement',maxScore:3},{criterion:'Conditions',maxScore:3},{criterion:'Significance/applications',maxScore:4}],tags:['CLT','Statistics']},

    // Physics
    {id:'q017',subject:'Physics',topic:'Mechanics',text:'A ball is thrown vertically upward with initial velocity 20 m/s. What is the maximum height reached? (g = 10 m/s²)',type:'MCQ',bloom:'Apply',difficulty:'Easy',irt:{a:1.0,b:-0.9,c:0.25},options:['10 m','20 m','40 m','80 m'],correct:1,tags:['Kinematics','Projectile']},
    {id:'q018',subject:'Physics',topic:'Thermodynamics',text:'Derive the efficiency of a Carnot engine operating between temperatures T₁ and T₂.',type:'Subjective',bloom:'Analyze',difficulty:'Hard',irt:{a:1.7,b:1.4,c:0.0},rubric:[{criterion:'Carnot cycle description',maxScore:3},{criterion:'Work and heat expressions',maxScore:4},{criterion:'Efficiency derivation',maxScore:3}],tags:['Carnot','Thermodynamics']},
    {id:'q019',subject:'Physics',topic:'Electromagnetism',text:'According to Faraday\'s law, what induces an EMF in a conductor?',type:'MCQ',bloom:'Remember',difficulty:'Easy',irt:{a:0.8,b:-1.3,c:0.25},options:['Constant magnetic field','Changing magnetic flux','Static electric field','Constant current'],correct:1,tags:['Faraday','EMF']},

    // Chemistry
    {id:'q020',subject:'Chemistry',topic:'Organic',text:'What is the IUPAC name of CH₃-CH₂-CH(OH)-CH₃?',type:'MCQ',bloom:'Apply',difficulty:'Medium',irt:{a:1.1,b:0.3,c:0.25},options:['2-butanol','3-butanol','1-butanol','2-methylpropanol'],correct:0,tags:['IUPAC','Alcohols']},
    {id:'q021',subject:'Chemistry',topic:'Physical',text:'Explain Le Chatelier\'s principle with an example involving the Haber process.',type:'Subjective',bloom:'Apply',difficulty:'Medium',irt:{a:1.4,b:0.2,c:0.0},rubric:[{criterion:'Principle statement',maxScore:3},{criterion:'Haber process equation',maxScore:3},{criterion:'Effect of pressure/temperature',maxScore:4}],tags:['Equilibrium','Haber']},
    {id:'q022',subject:'Chemistry',topic:'Inorganic',text:'Which of the following has the highest electronegativity?',type:'MCQ',bloom:'Remember',difficulty:'Easy',irt:{a:0.7,b:-1.6,c:0.25},options:['Oxygen','Nitrogen','Chlorine','Fluorine'],correct:3,tags:['Electronegativity','Periodic Table']},
  ];

  // ─── Public API ──────────────────────────────────────────────────────────────
  function getAll() { return [...questionBank]; }

  function getById(id) { return questionBank.find(q => q.id === id); }

  function getBySubject(subject) {
    return questionBank.filter(q => !subject || q.subject === subject);
  }

  function getByFilters({subject='', bloom='', difficulty='', type=''} = {}) {
    return questionBank.filter(q =>
      (!subject || q.subject === subject) &&
      (!bloom || q.bloom === bloom) &&
      (!difficulty || q.difficulty === difficulty) &&
      (!type || q.type === type)
    );
  }

  function selectForExam({subject='', count=20, easyPct=30, mediumPct=50, hardPct=20, bloomWeights={}} = {}) {
    const pool = getBySubject(subject);
    const easy = pool.filter(q => q.difficulty === 'Easy');
    const medium = pool.filter(q => q.difficulty === 'Medium');
    const hard = pool.filter(q => q.difficulty === 'Hard');

    const nEasy = Math.round(count * easyPct / 100);
    const nMedium = Math.round(count * mediumPct / 100);
    const nHard = count - nEasy - nMedium;

    const pick = (arr, n) => shuffle([...arr]).slice(0, Math.min(n, arr.length));
    return [...pick(easy, nEasy), ...pick(medium, nMedium), ...pick(hard, nHard)];
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function addQuestion(q) {
    q.id = 'q' + String(questionBank.length + 1).padStart(3, '0');
    q.irt = q.irt || {a: 1.0, b: 0.0, c: q.type === 'MCQ' ? 0.25 : 0.0};
    questionBank.push(q);
    return q;
  }

  function deleteQuestion(id) {
    const idx = questionBank.findIndex(q => q.id === id);
    if (idx > -1) questionBank.splice(idx, 1);
  }

  function getStats() {
    const total = questionBank.length;
    const bySubject = {};
    const byBloom = {};
    const byDiff = {};
    questionBank.forEach(q => {
      bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
      byBloom[q.bloom] = (byBloom[q.bloom] || 0) + 1;
      byDiff[q.difficulty] = (byDiff[q.difficulty] || 0) + 1;
    });
    return {total, bySubject, byBloom, byDiff};
  }

  return {getAll, getById, getBySubject, getByFilters, selectForExam, addQuestion, deleteQuestion, getStats, BLOOM_LEVELS, DIFFICULTIES, SUBJECTS};
})();
