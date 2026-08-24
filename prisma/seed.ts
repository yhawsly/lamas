import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function main() {
    console.log("🌱 STARTING PROFESSIONAL DATABASE SEEDING...");

    // 1. Departments
    console.log("   ➤ Creating departments...");
    const cs = await prisma.department.upsert({
        where: { code: "CS" },
        update: {},
        create: { name: "Computer Science", code: "CS" },
    });
    const eng = await prisma.department.upsert({
        where: { code: "ENG" },
        update: {},
        create: { name: "Engineering", code: "ENG" },
    });
    const biz = await prisma.department.upsert({
        where: { code: "BIZ" },
        update: {},
        create: { name: "Business Administration", code: "BIZ" },
    });

    // 2. Courses
    console.log("   ➤ Syncing course list...");
    const courseData = [
        { code: "CS101", title: "Introduction to Computer Science", departmentId: cs.id, credits: 3, level: 100, semester: 1 },
        { code: "CS102", title: "Programming Fundamentals", departmentId: cs.id, credits: 3, level: 100, semester: 2 },
        { code: "CS201", title: "Data Structures & Algorithms", departmentId: cs.id, credits: 4, level: 200, semester: 1 },
        { code: "CS202", title: "Object-Oriented Programming", departmentId: cs.id, credits: 3, level: 200, semester: 2 },
        { code: "CS203", title: "Discrete Mathematics", departmentId: cs.id, credits: 3, level: 200, semester: 1 },
        { code: "CS301", title: "Web Development", departmentId: cs.id, credits: 3, level: 300, semester: 1 },
        { code: "CS302", title: "Database Systems", departmentId: cs.id, credits: 3, level: 300, semester: 2 },
        { code: "CS303", title: "Operating Systems", departmentId: cs.id, credits: 3, level: 300, semester: 1 },
        { code: "CS401", title: "Artificial Intelligence", departmentId: cs.id, credits: 4, level: 400, semester: 1 },
        { code: "CS402", title: "Software Engineering", departmentId: cs.id, credits: 3, level: 400, semester: 2 },
        { code: "CS403", title: "Computer Networks", departmentId: cs.id, credits: 3, level: 400, semester: 1 },
        { code: "ENG101", title: "Engineering Fundamentals", departmentId: eng.id, credits: 3, level: 100, semester: 1 },
        { code: "ENG102", title: "Engineering Mathematics I", departmentId: eng.id, credits: 4, level: 100, semester: 2 },
        { code: "ENG201", title: "Engineering Mathematics II", departmentId: eng.id, credits: 4, level: 200, semester: 1 },
        { code: "ENG202", title: "Thermodynamics", departmentId: eng.id, credits: 4, level: 200, semester: 2 },
        { code: "ENG203", title: "Fluid Mechanics", departmentId: eng.id, credits: 3, level: 200, semester: 1 },
        { code: "ENG301", title: "Structural Analysis", departmentId: eng.id, credits: 3, level: 300, semester: 1 },
        { code: "ENG302", title: "Electrical Circuits", departmentId: eng.id, credits: 3, level: 300, semester: 2 },
        { code: "ENG401", title: "Control Systems Engineering", departmentId: eng.id, credits: 4, level: 400, semester: 1 },
        { code: "BIZ101", title: "Business Management Principles", departmentId: biz.id, credits: 3, level: 100, semester: 1 },
        { code: "BIZ102", title: "Principles of Accounting", departmentId: biz.id, credits: 3, level: 100, semester: 2 },
        { code: "BIZ201", title: "Marketing Strategy", departmentId: biz.id, credits: 3, level: 200, semester: 1 },
        { code: "BIZ202", title: "Organisational Behaviour", departmentId: biz.id, credits: 3, level: 200, semester: 2 },
        { code: "BIZ301", title: "Financial Management", departmentId: biz.id, credits: 4, level: 300, semester: 1 },
        { code: "BIZ302", title: "Business Ethics & Governance", departmentId: biz.id, credits: 3, level: 300, semester: 2 },
        { code: "BIZ401", title: "Strategic Management", departmentId: biz.id, credits: 3, level: 400, semester: 1 },
    ];

    // 2b. Programs
    console.log("   ➤ Syncing academic programs...");
    const btechCS = await prisma.program.upsert({
        where: { code: "BTECH_CS" },
        update: { name: "B.Tech Computer Science" },
        create: { name: "B.Tech Computer Science", code: "BTECH_CS", description: "B.Tech in Computer Science (Levels 100-400, Regular & Weekend)" }
    });
    const btechICT = await prisma.program.upsert({
        where: { code: "BTECH_ICT" },
        update: { name: "B.Tech Information and Communication Technology (ICT)" },
        create: { name: "B.Tech Information and Communication Technology (ICT)", code: "BTECH_ICT", description: "B.Tech in Information and Communication Technology (Levels 100-400, Regular & Weekend)" }
    });
    const hndCS = await prisma.program.upsert({
        where: { code: "HND_CS" },
        update: { name: "HND Computer Science" },
        create: { name: "HND Computer Science", code: "HND_CS", description: "Higher National Diploma in Computer Science (Levels 100-300, Regular & Weekend)" }
    });
    const hndICT = await prisma.program.upsert({
        where: { code: "HND_ICT" },
        update: { name: "HND Information and Communication Technology" },
        create: { name: "HND Information and Communication Technology", code: "HND_ICT", description: "Higher National Diploma in Information and Communication Technology (Levels 100-300, Regular & Weekend)" }
    });
    const btechCSTopUp = await prisma.program.upsert({
        where: { code: "BTECH_CS_TOPUP" },
        update: { name: "B.Tech Computer Science (Top-Up)" },
        create: { name: "B.Tech Computer Science (Top-Up)", code: "BTECH_CS_TOPUP", description: "B.Tech Computer Science Top-Up (Levels 300-400, Weekend Only)" }
    });
    const btechICTTopUp = await prisma.program.upsert({
        where: { code: "BTECH_ICT_TOPUP" },
        update: { name: "B.Tech ICT (Top-Up)" },
        create: { name: "B.Tech ICT (Top-Up)", code: "BTECH_ICT_TOPUP", description: "B.Tech ICT Top-Up (Levels 300-400, Weekend Only)" }
    });
    const bengEE = await prisma.program.upsert({
        where: { code: "BENG_EE" },
        update: {},
        create: { name: "BEng Electrical Engineering", code: "BENG_EE", description: "BEng in Electrical Engineering" }
    });
    const bbaACC = await prisma.program.upsert({
        where: { code: "BBA_ACC" },
        update: {},
        create: { name: "BBA Accounting", code: "BBA_ACC", description: "BBA in Accounting" }
    });

    for (const c of courseData) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { level: _level, semester: _semester, ...cleanCourse } = c;
        await prisma.course.upsert({
            where: { code: c.code },
            update: { title: c.title, credits: c.credits },
            create: cleanCourse,
        });
    }

    console.log("   ➤ Creating Program Curriculum Mappings...");
    const allCoursesDb = await prisma.course.findMany();
    for (const c of courseData) {
        const dbCourse = allCoursesDb.find(dc => dc.code === c.code);
        if (!dbCourse) continue;

        if (c.code.startsWith("CS")) {
            // 1. BTech Computer Science (Levels 100-400)
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: btechCS.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: btechCS.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });

            // 2. BTech ICT (Levels 100-400)
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: btechICT.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: btechICT.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });

            // 3. HND CS (Levels 100-300 only)
            if (c.level <= 300) {
                await prisma.curriculumMap.upsert({
                    where: { programId_courseId: { programId: hndCS.id, courseId: dbCourse.id } },
                    update: { level: c.level, semester: c.semester },
                    create: { programId: hndCS.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
                });

                // 4. HND ICT (Levels 100-300 only)
                await prisma.curriculumMap.upsert({
                    where: { programId_courseId: { programId: hndICT.id, courseId: dbCourse.id } },
                    update: { level: c.level, semester: c.semester },
                    create: { programId: hndICT.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
                });
            }

            // 5. BTech Top-Up (Levels 300-400 only, Weekend Only)
            if (c.level >= 300) {
                await prisma.curriculumMap.upsert({
                    where: { programId_courseId: { programId: btechCSTopUp.id, courseId: dbCourse.id } },
                    update: { level: c.level, semester: c.semester },
                    create: { programId: btechCSTopUp.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
                });

                await prisma.curriculumMap.upsert({
                    where: { programId_courseId: { programId: btechICTTopUp.id, courseId: dbCourse.id } },
                    update: { level: c.level, semester: c.semester },
                    create: { programId: btechICTTopUp.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
                });
            }
        } else if (c.code.startsWith("ENG")) {
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: bengEE.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: bengEE.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });
        } else if (c.code.startsWith("BIZ")) {
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: bbaACC.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: bbaACC.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });
        }
    }

    // 2c. Master Syllabi with Unique Topics for Every Single Course
    console.log("   ➤ Creating unique master syllabi with tailored topics for all courses...");
    const courseTopicsMap: Record<string, { topics: { id: number; title: string; description: string }[]; outcomes: string[] }> = {
        CS101: {
            topics: [
                { id: 1, title: "History of Computing & Von Neumann Architecture", description: "Evolution of hardware generations, CPU components, registers, and the fetch-decode-execute instruction cycle." },
                { id: 2, title: "Number Systems & Binary Arithmetic", description: "Binary, octal, hexadecimal representations, two's complement arithmetic, and IEEE 754 floating point standard." },
                { id: 3, title: "Logic Gates & Digital Circuit Foundations", description: "AND, OR, NOT, NAND, NOR, XOR gate truth tables, Boolean algebra simplification, and combinational logic design." },
                { id: 4, title: "Algorithms, Flowcharts & Pseudocode", description: "Problem solving methodologies, algorithmic decomposition, sequence, selection, iteration structures, and tracing." },
                { id: 5, title: "Operating Systems & Memory Hierarchy", description: "Roles of operating systems, kernel vs user space, memory hierarchy from cache to virtual memory and secondary storage." },
                { id: 6, title: "Computer Networks & The Internet Protocol Suite", description: "Network topologies, packet switching concepts, TCP/IP vs OSI model, DNS, IP addressing, and client-server paradigm." },
                { id: 7, title: "Cybersecurity Basics & Computing Ethics", description: "Information security principles (CIA Triad), malware threats, encryption basics, privacy legislation, and ethical computing." }
            ],
            outcomes: [
                "Demonstrate fundamental understanding of hardware and computer system architecture.",
                "Perform binary, hexadecimal conversions and two's complement mathematical computations.",
                "Design and trace structured algorithms using standardized flowcharts and pseudocode."
            ]
        },
        CS102: {
            topics: [
                { id: 1, title: "Syntax, Primitive Data Types & Operators", description: "Variables declaration, memory allocation, arithmetic, relational, and logical operator precedence in C/C++ and Python." },
                { id: 2, title: "Control Flow: Conditional Statements & Loops", description: "if-else branching, switch-case constructs, while, do-while, for loops, and nested control flow patterns." },
                { id: 3, title: "Modular Programming & Function Scope", description: "Function prototypes, parameter passing (by value vs reference), return mechanisms, recursion, and variable scope." },
                { id: 4, title: "Arrays & String Manipulation", description: "Single and multi-dimensional array memory layouts, bounds checking, string libraries, and character manipulation." },
                { id: 5, title: "Pointers & Dynamic Memory Allocation", description: "Pointer arithmetic, memory addresses, heap vs stack memory, malloc/free, new/delete, and pointer safety." },
                { id: 6, title: "Structures, Unions & File I/O Streams", description: "Custom user-defined composite data types, binary and text file read/write operations, and stream error handling." },
                { id: 7, title: "Unit Testing, Debugging & Code Profiling", description: "GDB debugging, unit test suites, assertions, defensive programming, and memory leak detection tools." }
            ],
            outcomes: [
                "Write modular, error-free procedural software implementations addressing engineering problems.",
                "Manage memory dynamically using pointers safely without leaks or segmentation faults.",
                "Implement robust file input/output routines and debugging workflows."
            ]
        },
        CS201: {
            topics: [
                { id: 1, title: "Asymptotic Analysis & Big-O Notation", description: "Growth rates of functions, worst-case, best-case, average-case analysis, and solving recurrence relations via Master theorem." },
                { id: 2, title: "Linear Structures: Linked Lists, Stacks & Queues", description: "Singly, doubly, and circular linked lists, stack applications (expression evaluation), FIFO queues, and circular buffers." },
                { id: 3, title: "Binary Trees & Self-Balancing Trees", description: "Binary Search Trees (BST), tree traversal orders (inorder, preorder, postorder), AVL tree rotations, and Red-Black properties." },
                { id: 4, title: "Heaps & Priority Queues", description: "Max-heaps, min-heaps, heapify operations, priority queue implementations, and Huffman coding data compression." },
                { id: 5, title: "Hash Tables & Collision Resolution Strategies", description: "Hash functions design, open addressing (linear/quadratic probing, double hashing), separate chaining, and load factor tuning." },
                { id: 6, title: "Graph Algorithms: Traversal, Shortest Paths & MST", description: "Adjacency matrix vs list representations, BFS, DFS, Dijkstra's algorithm, Bellman-Ford, Prim's and Kruskal's MST." },
                { id: 7, title: "Dynamic Programming & Greedy Techniques", description: "Overlapping subproblems, optimal substructure, memoization vs tabulation, knapsack problem, and longest common subsequence." }
            ],
            outcomes: [
                "Select and implement optimal data structures according to time and space complexity constraints.",
                "Construct and traverse non-linear data structures including balanced search trees and graphs.",
                "Formulate dynamic programming and greedy solutions for complex algorithmic challenges."
            ]
        },
        CS202: {
            topics: [
                { id: 1, title: "Object-Oriented Paradigms & Class Modeling", description: "Encapsulation, information hiding, access specifiers, constructors, destructors, and memory lifetime." },
                { id: 2, title: "Inheritance & Class Hierarchies", description: "Single, multiple, and multi-level inheritance, base class constructors, method overriding, and the 'super'/'base' keyword." },
                { id: 3, title: "Polymorphism & Dynamic Dispatch", description: "Static polymorphism (method overloading, operator overloading) vs runtime polymorphism (virtual methods, vtables)." },
                { id: 4, title: "Interfaces, Abstract Classes & SOLID Principles", description: "Designing extensible contracts, abstract method enforcement, Single Responsibility, Open-Closed, Liskov, Interface Segregation, and Dependency Inversion." },
                { id: 5, title: "Generics, Collections Framework & Iterators", description: "Type-safe generic classes and methods, standard template libraries/Java collections (Lists, Sets, Maps), and stream APIs." },
                { id: 6, title: "Design Patterns (Creational, Structural & Behavioral)", description: "Singleton, Factory Method, Abstract Factory, Adapter, Decorator, Observer, and Strategy design patterns." },
                { id: 7, title: "Multithreading & Concurrency Basics", description: "Thread lifecycle, runnable interfaces, synchronization blocks, locks, deadlocks, and thread-safe data structures." }
            ],
            outcomes: [
                "Architect robust enterprise software following OOP principles and SOLID design tenets.",
                "Apply industry-standard software design patterns to solve common structural and behavioral challenges.",
                "Build thread-safe, concurrent object-oriented applications using generics and collection frameworks."
            ]
        },
        CS203: {
            topics: [
                { id: 1, title: "Propositional & Predicate Logic", description: "Logical connectives, truth tables, tautologies, logical equivalences, universal/existential quantifiers, and rules of inference." },
                { id: 2, title: "Proof Techniques & Mathematical Induction", description: "Direct proofs, proof by contraposition, proof by contradiction, counterexamples, weak induction, and strong induction." },
                { id: 3, title: "Set Theory, Relations & Equivalence Classes", description: "Set operations, power sets, Cartesian products, binary relations, reflexivity, symmetry, transitivity, and partial orders (Posets)." },
                { id: 4, title: "Functions & Cardinality", description: "Domain, codomain, range, injective, surjective, bijective functions, inverse functions, composition, and countable vs uncountable infinities." },
                { id: 5, title: "Combinatorics & The Pigeonhole Principle", description: "Permutations, combinations, binomial theorem, Pascal's identity, inclusion-exclusion principle, and pigeonhole applications." },
                { id: 6, title: "Recurrence Relations & Generating Functions", description: "Solving linear homogeneous and non-homogeneous recurrence relations, divide-and-conquer recurrences, and generating functions." },
                { id: 7, title: "Graph Theory & Algebraic Structures", description: "Eulerian and Hamiltonian paths, planar graphs, graph coloring, isomorphic graphs, semigroups, groups, rings, and fields." }
            ],
            outcomes: [
                "Construct rigorous formal mathematical proofs using direct, contradiction, and inductive methods.",
                "Apply counting techniques, recurrence relations, and combinatorial principles to computational problems.",
                "Model computing relationships using formal discrete logic, sets, relations, and graph structures."
            ]
        },
        CS301: {
            topics: [
                { id: 1, title: "Semantic HTML5, Web Accessibility (a11y) & SEO", description: "Document structure, accessible ARIA roles, microdata schemas, metadata optimization, and web performance metrics (Core Web Vitals)." },
                { id: 2, title: "Modern CSS3: Flexbox, Grid & Responsive Design", description: "Advanced layouts, CSS custom properties, media queries, animations, transitions, and CSS modular architecture (BEM/Tailwind)." },
                { id: 3, title: "Modern JavaScript (ES6+) & Asynchronous Programming", description: "Arrow functions, destructuring, modules, closures, promises, async/await, event loop, and DOM manipulation APIs." },
                { id: 4, title: "Component-Based Frontend Frameworks (React/Next.js)", description: "JSX syntax, component lifecycle, props, state hooks, side effects, server-side rendering (SSR), and static site generation (SSG)." },
                { id: 5, title: "State Management & Client-Side Routing", description: "Global state patterns (Context API, Redux Toolkit, Zustand), optimistic UI updates, dynamic routing, and protected routes." },
                { id: 6, title: "RESTful API Integration & Secure Authentication", description: "Fetch/Axios, HTTP status codes, JSON Web Tokens (JWT), session cookies, OAuth2 authentication, and API error handling." },
                { id: 7, title: "Web Security & Cloud Deployment", description: "Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF), Content Security Policy (CSP), CORS, HTTPS/TLS, and Vercel/Docker deployment." }
            ],
            outcomes: [
                "Develop modern, accessible, and responsive web user interfaces following industry best practices.",
                "Build full-stack web applications integrating React/Next.js frontend with RESTful backend APIs.",
                "Secure web applications against OWASP Top 10 vulnerabilities and deploy them to cloud infrastructure."
            ]
        },
        CS302: {
            topics: [
                { id: 1, title: "Relational Data Modeling & ER Diagrams", description: "Entities, attributes, relationships, cardinality ratios, ER-to-relational schema mapping, and integrity constraints." },
                { id: 2, title: "Relational Algebra & Formal Query Languages", description: "Selection, projection, Cartesian product, joins (natural, theta, outer), division, and tuple relational calculus." },
                { id: 3, title: "Advanced SQL & Database Programmability", description: "Subqueries, window functions, common table expressions (CTEs), views, stored procedures, triggers, and user-defined functions." },
                { id: 4, title: "Functional Dependencies & Database Normalization", description: "Armstrong's axioms, closure of attribute sets, 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), and 4NF/5NF overviews." },
                { id: 5, title: "Storage Structures & Indexing Techniques", description: "File organization, disk blocks, primary/secondary indexes, clustered indexes, B-Trees, B+ Trees, and hash indexes." },
                { id: 6, title: "Transaction Processing & Concurrency Control", description: "ACID properties, serializability, two-phase locking (2PL), deadlock handling, timestamp ordering, and multiversion concurrency (MVCC)." },
                { id: 7, title: "Query Optimization & NoSQL Database Paradigms", description: "Cost-based query evaluation plans, indexing selection, document databases (MongoDB), key-value stores (Redis), and distributed CAP theorem." }
            ],
            outcomes: [
                "Design normalized relational databases from complex business domain requirements.",
                "Author complex, high-performance SQL queries, stored procedures, and triggers.",
                "Evaluate database concurrency control mechanisms, indexing strategies, and query optimization plans."
            ]
        },
        CS303: {
            topics: [
                { id: 1, title: "Operating System Architecture & Dual-Mode Operations", description: "Kernel architectures (monolithic vs microkernel), system calls, trap handlers, hardware protection, and boot sequence." },
                { id: 2, title: "Process Concept, Scheduling & Inter-Process Communication", description: "Process control blocks (PCB), context switching, CPU scheduling algorithms (FCFS, SJF, SRTF, Round Robin, Multi-Level Feedback Queues), and IPC mechanisms (pipes, message queues, shared memory)." },
                { id: 3, title: "Threads & Concurrency Management", description: "User vs kernel threads, POSIX pthreads, multicore programming challenges, race conditions, critical section problem, and Peterson's algorithm." },
                { id: 4, title: "Synchronization Primitives & Classical Problems", description: "Hardware atomic instructions (TestAndSet, CAS), mutex locks, counting semaphores, monitors, producer-consumer, reader-writer, and dining philosophers." },
                { id: 5, title: "Deadlocks: Detection, Prevention & Avoidance", description: "Coffman conditions, resource allocation graphs, deadlock prevention strategies, Banker's algorithm for avoidance, and recovery techniques." },
                { id: 6, title: "Memory Management & Virtual Memory Systems", description: "Contiguous allocation, paging, page tables, Translation Lookaside Buffer (TLB), inverted page tables, segmentation, demand paging, and page replacement algorithms (FIFO, LRU, Optimal, Clock)." },
                { id: 7, title: "File Systems, I/O Subsystems & Disk Scheduling", description: "File attributes, directory structures, inode allocation (contiguous, linked, indexed), free-space management, disk scheduling algorithms (SSTF, SCAN, C-SCAN), and RAID levels." }
            ],
            outcomes: [
                "Analyze internal kernel mechanisms including context switching, system call handling, and process scheduling.",
                "Resolve synchronization and deadlock conditions in multi-threaded concurrent environments.",
                "Evaluate virtual memory architectures, page replacement policies, and storage subsystem performance."
            ]
        },
        CS401: {
            topics: [
                { id: 1, title: "Foundations of AI & Intelligent Agents", description: "Turing test, rational agent architectures, PEAS (Performance, Environment, Actuators, Sensors) framework, and environment types." },
                { id: 2, title: "Uninformed & Informed Search Algorithms", description: "BFS, DFS, Uniform Cost Search, greedy best-first search, A* search, heuristic admissibility, consistency, and IDA*." },
                { id: 3, title: "Adversarial Search & Game Playing", description: "Minimax algorithm for two-player zero-sum games, Alpha-Beta pruning, evaluation functions, and Monte Carlo Tree Search (MCTS)." },
                { id: 4, title: "Constraint Satisfaction Problems (CSPs)", description: "Backtracking search for CSPs, forward checking, Arc Consistency (AC-3), MRV (Minimum Remaining Values), and degree heuristics." },
                { id: 5, title: "Knowledge Representation & First-Order Logic Inference", description: "Propositional theorem proving, resolution refutation, forward/backward chaining, ontology engineering, and semantic networks." },
                { id: 6, title: "Machine Learning: Supervised & Unsupervised Learning", description: "Linear regression, logistic regression, decision trees (ID3/C4.5), k-means clustering, PCA, bias-variance tradeoff, and evaluation metrics (ROC/AUC)." },
                { id: 7, title: "Deep Learning, Neural Networks & AI Ethics", description: "Multilayer perceptrons, backpropagation algorithm, CNNs for computer vision, RNNs/Transformers for NLP, LLMs, and ethical AI governance." }
            ],
            outcomes: [
                "Formulate real-world problems as search and constraint satisfaction problems and implement A* algorithms.",
                "Develop machine learning models using supervised and unsupervised techniques.",
                "Understand deep neural network architectures and assess ethical implications of automated AI systems."
            ]
        },
        CS402: {
            topics: [
                { id: 1, title: "Software Process Models & Agile Methodologies", description: "Waterfall, V-Model, Spiral, Agile Manifesto, Scrum roles/ceremonies, Kanban boards, and Extreme Programming (XP) practices." },
                { id: 2, title: "Requirements Engineering & Domain Modeling", description: "Stakeholder elicitation, functional vs non-functional requirements, user stories, acceptance criteria, and SRS standard documentation." },
                { id: 3, title: "Object-Oriented Analysis & Design with UML", description: "Use Case diagrams, Class diagrams, Sequence diagrams, State machine diagrams, Activity diagrams, and architectural views." },
                { id: 4, title: "Software Architecture & System Design", description: "Monolithic, Layered, Microservices, Event-Driven architectures, domain-driven design (DDD), API gateways, and scalability patterns." },
                { id: 5, title: "Software Verification, Validation & Testing (V&V)", description: "Test-Driven Development (TDD), unit testing frameworks, integration testing, system testing, regression testing, and mutation testing." },
                { id: 6, title: "DevOps, CI/CD & Automated Deployment", description: "Version control workflows (GitFlow, Trunk-Based), continuous integration pipelines (GitHub Actions), Docker containerization, and monitoring." },
                { id: 7, title: "Software Quality, Metrics & Maintenance", description: "Cyclomatic complexity, code smells, technical debt calculation, refactoring patterns, software evolution, and project cost estimation (COCOMO)." }
            ],
            outcomes: [
                "Lead software engineering projects from requirements elicitation through system deployment using Agile frameworks.",
                "Construct comprehensive UML architectural models and design scalable, maintainable distributed systems.",
                "Implement automated testing suites, CI/CD pipelines, and rigorous quality assurance processes."
            ]
        },
        CS403: {
            topics: [
                { id: 1, title: "Computer Network Architectures & Layered Protocols", description: "OSI 7-layer reference model, TCP/IP protocol suite, packet vs circuit switching, delay, jitter, throughput, and bandwidth metrics." },
                { id: 2, title: "Physical & Data Link Layer Protocols", description: "Transmission media, modulation techniques, framing, error detection (Parity, Checksum, CRC), HDLC, and IEEE 802.3 Ethernet." },
                { id: 3, title: "Medium Access Control & Wireless Networks", description: "Aloha, CSMA/CD, CSMA/CA, wireless LANs (IEEE 802.11 Wi-Fi standards), Bluetooth (802.15), and cellular network architectures." },
                { id: 4, title: "Network Layer: Addressing, Subnetting & Routing", description: "IPv4 addressing, VLSM subnetting, CIDR, IPv6 transition, routing algorithms (Distance Vector RIP, Link State OSPF, Path Vector BGP)." },
                { id: 5, title: "Transport Layer: UDP, TCP & Congestion Control", description: "Port multiplexing, UDP datagrams, TCP 3-way handshake, connection teardown, sliding window flow control, and TCP congestion control (AIMD, Slow Start, Fast Recovery)." },
                { id: 6, title: "Application Layer Protocols & Socket Programming", description: "DNS hierarchy and lookup, HTTP/1.1 vs HTTP/2 vs HTTP/3, SMTP/IMAP, FTP, SSH, and Berkeley socket programming in Python/C." },
                { id: 7, title: "Network Security & Cryptographic Protocols", description: "Symmetric and asymmetric encryption (AES, RSA), digital certificates (PKI), TLS/SSL handshake, IPSec VPNs, firewalls, and intrusion detection systems (IDS)." }
            ],
            outcomes: [
                "Configure complex IPv4/IPv6 networks with VLSM subnetting and routing protocols.",
                "Analyze protocol packet captures using Wireshark and write client-server network socket applications.",
                "Implement network security architectures including TLS/SSL encryption, firewalls, and VPN tunnels."
            ]
        },
        ENG101: {
            topics: [
                { id: 1, title: "Engineering Units, Dimensions & Problem Solving", description: "SI unit system, dimensional analysis, precision, significant figures, and structured engineering calculations." },
                { id: 2, title: "Statics & Force Systems in Equilibrium", description: "Vector mechanics, 2D/3D force resolution, moments, couples, free-body diagrams, and static equilibrium equations." },
                { id: 3, title: "Materials Science & Mechanical Properties", description: "Atomic structure, crystal lattices, stress-strain behavior, Hooke's Law, elasticity, plasticity, hardness, and ductile/brittle failure modes." },
                { id: 4, title: "Basic Electrical Principles for Engineers", description: "Voltage, current, electrical resistance, Ohm's law, Kirchhoff's laws, power dissipation, and DC circuit analysis." },
                { id: 5, title: "Engineering Graphics & Computer-Aided Design (CAD)", description: "Orthographic projection, isometric views, sectioning, dimensioning standards, and 3D solid modeling in CAD." },
                { id: 6, title: "Engineering Ethics, Sustainability & Safety Standards", description: "Professional engineering codes of conduct, OSHA safety regulations, environmental impact assessments, and sustainable engineering design." }
            ],
            outcomes: [
                "Apply fundamental principles of statics and mechanics to engineering equilibrium problems.",
                "Interpret engineering drawings and create 3D parametric CAD models.",
                "Adhere to ethical engineering standards, health and safety regulations, and environmental sustainability."
            ]
        },
        ENG102: {
            topics: [
                { id: 1, title: "Differential Calculus & Rate of Change", description: "Limits, continuity, derivative formulas, chain rule, implicit differentiation, and higher-order derivatives." },
                { id: 2, title: "Applications of Derivatives in Engineering", description: "Related rates, optimization problems, tangent and normal lines, Taylor and Maclaurin series expansions." },
                { id: 3, title: "Integral Calculus & Advanced Integration Techniques", description: "Riemann sums, fundamental theorem of calculus, substitution, integration by parts, and partial fractions." },
                { id: 4, title: "Geometric & Physical Applications of Integrals", description: "Area between curves, volumes of revolution (disk/washer and shell methods), arc length, surface area, and centers of mass." },
                { id: 5, title: "Complex Numbers & De Moivre's Theorem", description: "Algebra of complex numbers, Argand plane, polar and exponential forms, Euler's formula, and roots of complex numbers." },
                { id: 6, title: "First-Order Ordinary Differential Equations", description: "Separable differential equations, exact equations, integrating factors for linear first-order ODEs, and engineering growth/decay models." }
            ],
            outcomes: [
                "Solve complex rate of change and optimization problems using differential calculus.",
                "Compute areas, volumes, and mechanical properties using advanced integration techniques.",
                "Formulate and solve first-order differential equations modeling physical engineering systems."
            ]
        },
        ENG201: {
            topics: [
                { id: 1, title: "Linear Second-Order Differential Equations", description: "Homogeneous equations with constant coefficients, characteristic equation, method of undetermined coefficients, and variation of parameters." },
                { id: 2, title: "Laplace Transforms & System Modeling", description: "Definition, properties, transform pairs, step and delta functions, inverse Laplace transforms, and solving initial value differential equations." },
                { id: 3, title: "Linear Algebra: Matrices & Vector Spaces", description: "Matrix algebra, Gaussian elimination, determinants, vector spaces, linear independence, rank, and matrix inversion." },
                { id: 4, title: "Eigenvalues, Eigenvectors & Diagonalization", description: "Characteristic polynomial, eigenvalue calculation, eigenvector determination, matrix diagonalization, and quadratic forms." },
                { id: 5, title: "Vector Calculus: Gradient, Divergence & Curl", description: "Scalar and vector fields, directional derivatives, gradient, divergence, curl, conservative fields, and potential functions." },
                { id: 6, title: "Line, Surface & Volume Integrals", description: "Line integrals, Green's Theorem in the plane, surface integrals, Divergence Theorem of Gauss, and Stokes' Theorem." }
            ],
            outcomes: [
                "Model harmonic oscillators and RLC circuits using second-order differential equations and Laplace transforms.",
                "Perform eigenvalue and eigenvector transformations for structural vibration and dynamical systems.",
                "Apply vector calculus theorems (Green's, Gauss's, Stokes's) to electromagnetic and fluid engineering fields."
            ]
        },
        ENG202: {
            topics: [
                { id: 1, title: "Thermodynamic Systems, Properties & The Zeroth Law", description: "Closed and open systems, intensive and extensive properties, thermodynamic equilibrium, temperature measurement, and pressure." },
                { id: 2, title: "Pure Substances & Equations of State", description: "Phase change processes, P-v-T property diagrams, steam tables, ideal gas law, and compressibility factor." },
                { id: 3, title: "First Law of Thermodynamics: Energy Balance", description: "Work and heat interactions, conservation of mass, First Law for closed systems and steady-flow control volumes (turbines, compressors, nozzles)." },
                { id: 4, title: "Second Law of Thermodynamics & Heat Engines", description: "Thermal energy reservoirs, heat engines, refrigerators, heat pumps, Kelvin-Planck and Clausius statements, reversibility, and the Carnot cycle." },
                { id: 5, title: "Entropy, Isentropic Efficiencies & T-s Diagrams", description: "Clausius inequality, definition of entropy, increase of entropy principle, entropy balance for closed/open systems, and isentropic efficiencies of flow devices." },
                { id: 6, title: "Gas & Vapor Power Cycles", description: "Air standard assumptions, Otto cycle, Diesel cycle, Brayton cycle for gas turbines, and the Rankine cycle for steam power plants." }
            ],
            outcomes: [
                "Evaluate thermodynamic properties of pure substances using phase diagrams and steam tables.",
                "Apply the First and Second Laws of Thermodynamics to open and closed engineering systems.",
                "Calculate thermal efficiencies and power outputs for Otto, Diesel, Brayton, and Rankine cycles."
            ]
        },
        ENG203: {
            topics: [
                { id: 1, title: "Fluid Properties & Fluid Statics", description: "Viscosity (Newtonian vs non-Newtonian), surface tension, vapor pressure, hydrostatic pressure distribution, manometers, and submerged surface forces." },
                { id: 2, title: "Buoyancy, Flotation & Fluid Kinematics", description: "Archimedes' principle, metacenter and stability of floating bodies, velocity fields, streamlines, pathlines, streaklines, and vorticity." },
                { id: 3, title: "Conservation Laws: Mass, Momentum & Energy", description: "Reynolds Transport Theorem, continuity equation, linear momentum equation, Navier-Stokes equations overview, and Bernoulli's equation with limitations." },
                { id: 4, title: "Dimensional Analysis & Dynamic Similitude", description: "Dimensional homogeneity, Buckingham Pi Theorem, dimensionless numbers (Reynolds, Froude, Mach, Weber), and physical model scaling laws." },
                { id: 5, title: "Internal Incompressible Viscous Flow", description: "Laminar vs turbulent pipe flow, entrance region, Hagen-Poiseuille flow, Moody diagram, Darcy-Weisbach friction factor, and minor losses in piping systems." },
                { id: 6, title: "External Flow & Boundary Layer Theory", description: "Boundary layer concepts, laminar and turbulent boundary layer growth over flat plates, skin friction, form drag, flow separation, and aerofoil lift/drag." }
            ],
            outcomes: [
                "Determine hydrostatic forces and buoyancy stability for marine and civil hydraulic structures.",
                "Apply conservation equations and Bernoulli's theorem to piping networks and fluid machinery.",
                "Conduct dimensional analysis and compute head loss in internal piping and boundary layer drag."
            ]
        },
        ENG301: {
            topics: [
                { id: 1, title: "Structural Classifications & Static Determinacy", description: "Types of structural elements, joints, support conditions, degrees of static and kinematic indeterminacy for trusses, beams, and frames." },
                { id: 2, title: "Analysis of Determinate Trusses & Cables", description: "Method of joints, method of sections, zero-force member identification, space trusses, and flexible cable systems under point/distributed loads." },
                { id: 3, title: "Shear Force & Bending Moment in Frames", description: "Differential relationships between load, shear, and bending moment, axial force diagrams, and complete internal force diagrams for complex 2D frames." },
                { id: 4, title: "Deflection Analysis of Beams and Trusses", description: "Double integration method, moment-area theorems, conjugate beam method, and virtual work (unit load method) for elastic deflections." },
                { id: 5, title: "Energy Principles & Castigliano's Theorems", description: "Strain energy in axial, bending, shear, and torsion modes, Castigliano's First and Second Theorems, and Maxwell-Betti reciprocal theorem." },
                { id: 6, title: "Influence Lines for Determinate Structures", description: "Concept of influence lines for reactions, shears, and moments, Muller-Breslau principle, and maximum response envelope under moving vehicle loads." }
            ],
            outcomes: [
                "Determine internal force distributions and construct shear and moment diagrams for structural frames.",
                "Calculate structural deflections using virtual work and Castigliano's energy methods.",
                "Evaluate structural response to moving live loads using influence lines."
            ]
        },
        ENG302: {
            topics: [
                { id: 1, title: "Circuit Analysis Techniques: Node & Mesh Methods", description: "Kirchhoff's Current Law (KCL), Kirchhoff's Voltage Law (KVL), nodal analysis with supernodes, mesh analysis with supermeshes, and dependent source handling." },
                { id: 2, title: "Network Theorems for DC & AC Circuits", description: "Linearity, superposition theorem, source transformation, Thevenin's theorem, Norton's theorem, and maximum power transfer theorem." },
                { id: 3, title: "First and Second-Order Transient Circuit Analysis", description: "Inductor and capacitor differential equations, source-free and step responses of RL, RC, and series/parallel RLC circuits, and damping responses." },
                { id: 4, title: "Sinusoidal Steady-State & Phasor Analysis", description: "Sinusoidal waveforms, phasor transforms, complex impedance, admittance, phasor diagrams, and AC frequency response." },
                { id: 5, title: "AC Power Calculations & Power Factor Correction", description: "Instantaneous power, average (real) power, reactive power, complex power (S = P + jQ), power triangle, and power factor improvement capacitors." },
                { id: 6, title: "Three-Phase Circuits & Magnetically Coupled Systems", description: "Balanced Y-Y, Y-Delta, Delta-Y, Delta-Delta configurations, line vs phase voltages and currents, mutually coupled inductors, and ideal transformer models." }
            ],
            outcomes: [
                "Analyze complex DC and AC linear circuits using node, mesh, Thevenin, and Norton methods.",
                "Evaluate transient response and stability of first and second-order RLC electrical networks.",
                "Calculate three-phase power parameters and design power factor correction solutions."
            ]
        },
        ENG401: {
            topics: [
                { id: 1, title: "Control Systems Modeling & Transfer Functions", description: "Open-loop vs closed-loop feedback systems, differential equations of physical systems (mechanical, electrical, thermal), Laplace transfer functions, and linearization." },
                { id: 2, title: "Block Diagram Algebra & Signal Flow Graphs", description: "Block diagram reduction rules, Mason's gain formula for signal flow graphs, and closed-loop canonical transfer functions." },
                { id: 3, title: "Time-Domain Transient & Steady-State Analysis", description: "Standard test signals (step, ramp, parabolic), first and second-order response metrics (rise time, peak time, overshoot, settling time), and steady-state error analysis." },
                { id: 4, title: "Stability Analysis & The Routh-Hurwitz Criterion", description: "Concept of BIBO stability, poles and zeros on the s-plane, Routh array construction, special cases (zero in first column, row of zeros), and stability boundaries." },
                { id: 5, title: "Root Locus Design Technique", description: "Rules for root locus construction, angle and magnitude conditions, breakaway/break-in points, asymptotes, and gain selection for desired damping ratio." },
                { id: 6, title: "Frequency Response Methods: Bode & Nyquist Plots", description: "Bode magnitude and phase plots, gain margin, phase margin, Nyquist stability criterion, and mapping contours." },
                { id: 7, title: "PID Controller Design & State-Space Modeling", description: "Proportional-Integral-Derivative (PID) tuning (Ziegler-Nichols method), lead-lag compensator design, and state-space representation of MIMO systems." }
            ],
            outcomes: [
                "Formulate mathematical transfer function models of complex dynamic engineering systems.",
                "Evaluate system stability and transient performance using Routh-Hurwitz, Root Locus, and Bode methods.",
                "Design and tune PID controllers and lead-lag compensators to meet transient and steady-state specifications."
            ]
        },
        BIZ101: {
            topics: [
                { id: 1, title: "Nature of Business & Global Economic Environments", description: "Types of business organizations (sole proprietorship, partnership, corporation), stakeholder theory, economic systems, and globalization trends." },
                { id: 2, title: "The Four Functions of Management", description: "Planning (strategic, tactical, operational), organizing, leading, and controlling in modern organizational structures." },
                { id: 3, title: "Strategic Planning & Environmental Analysis", description: "Mission, vision, core values formulation, SWOT analysis, PESTLE framework, and Porter's Five Forces competitive model." },
                { id: 4, title: "Organizational Design & Team Dynamics", description: "Hierarchical vs flat organizations, departmentalization, span of control, delegation, team cohesion, and high-performance teams." },
                { id: 5, title: "Motivation Theories & Leadership Paradigms", description: "Maslow's hierarchy, Herzberg's two-factor theory, Vroom's expectancy, transformational vs transactional leadership styles." },
                { id: 6, title: "Corporate Governance & Business Ethics", description: "Ethical decision-making models, social responsibility, sustainability reporting, whistleblowing, and compliance frameworks." }
            ],
            outcomes: [
                "Synthesize the fundamental functions of business planning, organizing, leading, and controlling.",
                "Conduct strategic internal and external environmental scans using SWOT and Porter's models.",
                "Apply leadership and organizational motivation theories to enhance enterprise performance."
            ]
        },
        BIZ102: {
            topics: [
                { id: 1, title: "Accounting Framework & Double-Entry Principles", description: "The accounting equation (Assets = Liabilities + Equity), double-entry debit/credit rules, and journalizing transactions." },
                { id: 2, title: "Ledgers, Trial Balance & Period-End Adjustments", description: "General ledger posting, balancing accounts, trial balance verification, accruals, prepayments, unearned revenue, and depreciation adjustments." },
                { id: 3, title: "Preparation of Financial Statements", description: "Statement of Profit or Loss (Income Statement), Statement of Financial Position (Balance Sheet), and Statement of Changes in Equity." },
                { id: 4, title: "Cash Management & Statement of Cash Flows", description: "Bank reconciliation statements, petty cash systems, and Statement of Cash Flows (operating, investing, financing activities)." },
                { id: 5, title: "Inventory Accounting & Cost of Goods Sold", description: "Periodic vs perpetual inventory systems, valuation methods (FIFO, LIFO, Weighted Average Cost), and lower of cost or net realizable value (NRV)." },
                { id: 6, title: "Accounting Controls & Ethical Financial Reporting", description: "Internal control principles, segregation of duties, audit trails, and IFRS/GAAP regulatory compliance." }
            ],
            outcomes: [
                "Record financial transactions using the double-entry accounting framework.",
                "Prepare compliant Income Statements, Balance Sheets, and Cash Flow Statements.",
                "Perform bank reconciliations, inventory valuations, and financial adjusting entries."
            ]
        },
        BIZ201: {
            topics: [
                { id: 1, title: "Strategic Marketing & Value Creation", description: "Marketing concepts, customer value proposition, relationship marketing, and marketing audit processes." },
                { id: 2, title: "Consumer Behavior & Market Research", description: "Consumer decision-making journey, psychological influencers, primary/secondary market research, and qualitative/quantitative data analytics." },
                { id: 3, title: "Segmentation, Targeting & Positioning (STP)", description: "Demographic, psychographic, geographic, behavioral segmentation, market attractiveness evaluation, and brand perceptual mapping." },
                { id: 4, title: "Product Strategy & Brand Equity Management", description: "Product hierarchy, new product development (NPD) lifecycle, branding strategies, packaging, and brand equity models." },
                { id: 5, title: "Pricing Strategies & Value-Based Pricing", description: "Cost-plus, penetration, skimming, dynamic pricing, price elasticity of demand, and psychological pricing tactics." },
                { id: 6, title: "Omnichannel Distribution & Integrated Marketing Communications (IMC)", description: "Direct vs indirect channels, supply chain logistics, advertising, public relations, digital marketing, SEO, and social media campaigns." }
            ],
            outcomes: [
                "Conduct comprehensive market segmentation, targeting, and brand positioning strategies.",
                "Develop an integrated 4Ps marketing mix plan aligned with consumer behavior insights.",
                "Design digital marketing and omnichannel promotional campaigns measuring ROI."
            ]
        },
        BIZ202: {
            topics: [
                { id: 1, title: "Individual Behavior, Personality & Emotional Intelligence", description: "Big Five personality dimensions, Myers-Briggs (MBTI), locus of control, emotional intelligence (EQ), and job satisfaction drivers." },
                { id: 2, title: "Perception, Attribution & Decision-Making Biases", description: "Perceptual process, halo effect, stereotyping, fundamental attribution error, cognitive heuristics, and rational decision models." },
                { id: 3, title: "Workplace Motivation & Performance Systems", description: "Goal-setting theory (SMART goals), equity theory, job characteristics model, and intrinsic vs extrinsic reward structures." },
                { id: 4, title: "Group Dynamics, Teamwork & Interpersonal Conflict", description: "Tuckman's stages of group development, groupthink, social loafing, conflict management styles (Thomas-Kilmann), and negotiation skills." },
                { id: 5, title: "Organizational Power, Politics & Influence", description: "Sources of power (legitimate, reward, coercive, expert, referent), political tactics, ethical influence strategies, and empowerment." },
                { id: 6, title: "Organizational Culture, Climate & Change Management", description: "Artifacts, values, assumptions of culture, Lewin's 3-step change model, Kotter's 8-step framework, and overcoming resistance to change." }
            ],
            outcomes: [
                "Assess individual differences, emotional intelligence, and cognitive biases in organizational decision-making.",
                "Resolve interpersonal conflict and lead high-performing collaborative work teams.",
                "Manage organizational cultural transformation and institutional change initiatives."
            ]
        },
        BIZ301: {
            topics: [
                { id: 1, title: "Financial Environment & Time Value of Money", description: "Financial markets, role of the financial manager, compounding, discounting, ordinary annuities, annuities due, and loan amortization schedules." },
                { id: 2, title: "Financial Statement & Ratio Analysis", description: "Liquidity ratios (Current, Quick), asset management ratios, leverage ratios (Debt-to-Equity), profitability ratios (ROE, ROA), and DuPont analysis." },
                { id: 3, title: "Capital Budgeting Decision Criteria", description: "Net Present Value (NPV), Internal Rate of Return (IRR), Modified IRR (MIRR), Payback Period, Discounted Payback, and Profitability Index." },
                { id: 4, title: "Risk, Return & The Capital Asset Pricing Model (CAPM)", description: "Expected return, standard deviation, portfolio diversification, systematic vs unsystematic risk, beta coefficient, and the Security Market Line (SML)." },
                { id: 5, title: "Cost of Capital & Capital Structure Decisions", description: "Cost of debt, cost of preferred stock, cost of common equity, Weighted Average Cost of Capital (WACC), and Modigliani-Miller theorems." },
                { id: 6, title: "Working Capital Management & Dividend Policy", description: "Cash conversion cycle, inventory management models (EOQ), receivables policy, dividend theories, and share repurchases." }
            ],
            outcomes: [
                "Evaluate long-term corporate investment proposals using NPV, IRR, and capital budgeting criteria.",
                "Calculate Weighted Average Cost of Capital (WACC) and optimal capital structure.",
                "Analyze corporate financial health using ratio analysis and manage working capital cycles."
            ]
        },
        BIZ302: {
            topics: [
                { id: 1, title: "Ethical Theories & Moral Reasoning in Business", description: "Utilitarianism, Kantian deontology, virtue ethics, justice theory, and individual moral development stages (Kohlberg)." },
                { id: 2, title: "Corporate Governance Principles & Board Accountability", description: "Separation of ownership and control, agency theory, board composition, audit committee responsibilities, and executive compensation." },
                { id: 3, title: "Stakeholder Management & Corporate Social Responsibility (CSR)", description: "Carroll's CSR pyramid (economic, legal, ethical, philanthropic), stakeholder mapping, creating shared value (CSV), and ESG reporting." },
                { id: 4, title: "Corporate Compliance, Whistleblowing & Anti-Corruption", description: "Internal codes of conduct, whistleblower protection policies, Foreign Corrupt Practices Act (FCPA), and anti-money laundering compliance." },
                { id: 5, title: "Functional Ethical Dilemmas: Marketing, Finance & HR", description: "Truth in advertising, predatory pricing, insider trading, creative accounting, workplace discrimination, harassment, and employee privacy." },
                { id: 6, title: "Environmental Sustainability & Ethical Leadership", description: "Carbon footprint management, circular economy models, fair trade practices, ethical supply chains, and building ethical corporate cultures." }
            ],
            outcomes: [
                "Resolve ethical dilemmas across business operations using established moral reasoning frameworks.",
                "Evaluate corporate governance structures, board oversight, and executive fiduciary responsibilities.",
                "Formulate corporate social responsibility (CSR) and ESG sustainability policies."
            ]
        },
        BIZ401: {
            topics: [
                { id: 1, title: "Strategic Intent, Vision & Competitive Advantage", description: "Defining strategic vision, mission statements, core values, strategic objectives, and the resource-based view (RBV) of competitive advantage." },
                { id: 2, title: "External Environmental Analysis: Macro & Industry", description: "PESTLE analysis, industry life cycle stages, strategic group mapping, and competitor intelligence." },
                { id: 3, title: "Internal Resource & Competency Audit", description: "VRIO framework (Value, Rarity, Inimitability, Organization), value chain analysis (primary vs support activities), and core competencies." },
                { id: 4, title: "Business-Level Strategies & Competitive Positioning", description: "Porter's generic strategies (Cost Leadership, Differentiation, Cost Focus, Differentiation Focus), and Blue Ocean strategy concepts." },
                { id: 5, title: "Corporate-Level Strategies: Growth & Diversification", description: "Vertical integration, horizontal integration, concentric and conglomerate diversification, BCG growth-share matrix, and GE-McKinsey matrix." },
                { id: 6, title: "Strategic Alliances, M&A & Global Strategy", description: "Mergers and acquisitions (M&A) due diligence, joint ventures, international market entry modes (exporting, licensing, FDI), and global vs multi-domestic strategies." },
                { id: 7, title: "Strategy Implementation & Balanced Scorecard Governance", description: "Strategy execution barriers, organizational alignment, Balanced Scorecard (Financial, Customer, Internal Process, Learning & Growth), and KPI tracking." }
            ],
            outcomes: [
                "Formulate overarching corporate and business unit strategies using VRIO and competitive analysis.",
                "Evaluate strategic growth avenues including mergers, acquisitions, and international expansion.",
                "Implement and monitor strategic performance using Balanced Scorecards and KPI governance frameworks."
            ]
        }
    };

    for (const course of allCoursesDb) {
        const topicEntry = courseTopicsMap[course.code];
        if (topicEntry) {
            await prisma.masterSyllabus.upsert({
                where: { courseId: course.id },
                update: {
                    mandatoryTopics: topicEntry.topics,
                    learningOutcomes: topicEntry.outcomes,
                    version: 1,
                    lastUpdatedBy: 1,
                },
                create: {
                    courseId: course.id,
                    mandatoryTopics: topicEntry.topics,
                    learningOutcomes: topicEntry.outcomes,
                    version: 1,
                    lastUpdatedBy: 1,
                }
            });
        }
    }

    const hash = await hashPassword("password123");

    // 3. Admin & Users
    console.log("   ➤ Provisioning system users with official emails...");
    // Official Super Admin (@lamas.edu.gh)
    await prisma.user.upsert({
        where: { email: "superadmin@lamas.edu.gh" },
        update: { name: "Super Administrator", role: "SUPER_ADMIN", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Super Administrator",
            email: "superadmin@lamas.edu.gh",
            passwordHash: hash,
            role: "SUPER_ADMIN",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Official System Admin (@lamas.edu.gh)
    await prisma.user.upsert({
        where: { email: "admin@lamas.edu.gh" },
        update: { name: "System Administrator", role: "ADMIN", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "System Administrator",
            email: "admin@lamas.edu.gh",
            passwordHash: hash,
            role: "ADMIN",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Sylvester Yhaw (Lecturer, CS Faculty)
    await prisma.user.upsert({
        where: { email: "slyyhaw@gmail.com" },
        update: { name: "Sylvester Yhaw", role: "LECTURER", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Sylvester Yhaw",
            email: "slyyhaw@gmail.com",
            passwordHash: hash,
            role: "LECTURER",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Dr. Redeemer (Lecturer, CS Faculty)
    await prisma.user.upsert({
        where: { email: "dherlharlhi20@gmail.com" },
        update: { name: "Dr. Redeemer", role: "LECTURER", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Dr. Redeemer",
            email: "dherlharlhi20@gmail.com",
            passwordHash: hash,
            role: "LECTURER",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Dr. Sarah Lim (Lecturer, CS Faculty)
    await prisma.user.upsert({
        where: { email: "slycrypto1@gmail.com" },
        update: { name: "Dr. Sarah Lim", role: "LECTURER", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Dr. Sarah Lim",
            email: "slycrypto1@gmail.com",
            passwordHash: hash,
            role: "LECTURER",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Mr. Manuel (Head of Department, CS)
    const hod = await prisma.user.upsert({
        where: { email: "maformaley@gmail.com" },
        update: { name: "Mr. Manuel", role: "HOD", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Mr. Manuel",
            email: "maformaley@gmail.com",
            passwordHash: hash,
            role: "HOD",
            departmentId: cs.id,
            isActive: true,
        },
    });

    await prisma.department.update({
        where: { id: cs.id },
        data: { hodId: hod.id },
    });

    // Mr. Emmanuel Edzia (Department Exam Officer, CS)
    await prisma.user.upsert({
        where: { email: "edziaemmanuel1@gmail.com" },
        update: { name: "Mr. Emmanuel Edzia", role: "DEO", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Mr. Emmanuel Edzia",
            email: "edziaemmanuel1@gmail.com",
            passwordHash: hash,
            role: "DEO",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Purge any accounts that are not in our official roster
    const validEmails = [
        "superadmin@lamas.edu.gh",
        "admin@lamas.edu.gh",
        "maformaley@gmail.com",
        "edziaemmanuel1@gmail.com",
        "slyyhaw@gmail.com",
        "dherlharlhi20@gmail.com",
        "slycrypto1@gmail.com",
    ];

    const superAdminUser = await prisma.user.findUnique({ where: { email: "superadmin@lamas.edu.gh" } });
    if (superAdminUser) {
        await prisma.academicTerm.updateMany({ data: { createdBy: superAdminUser.id } }).catch(() => {});
        await prisma.deadline.updateMany({ data: { createdBy: superAdminUser.id } }).catch(() => {});
    }

    const oldUsers = await prisma.user.findMany({
        where: { email: { notIn: validEmails } },
        select: { id: true, email: true }
    });
    const oldIds = oldUsers.map(u => u.id);
    if (oldIds.length > 0) {
        console.log(`   ➤ Purging ${oldIds.length} obsolete users and cleaning related records...`);
        const oldSubmissions = await prisma.submission.findMany({ where: { lecturerId: { in: oldIds } }, select: { id: true } });
        const oldSubIds = oldSubmissions.map(s => s.id);
        if (oldSubIds.length > 0) {
            await prisma.submissionVersion.deleteMany({ where: { submissionId: { in: oldSubIds } } }).catch(() => {});
        }
        await prisma.submission.deleteMany({ where: { lecturerId: { in: oldIds } } }).catch(() => {});
        await prisma.notification.deleteMany({ where: { userId: { in: oldIds } } }).catch(() => {});
        await prisma.activityLog.deleteMany({ where: { userId: { in: oldIds } } }).catch(() => {});
        await prisma.passwordReset.deleteMany({ where: { userId: { in: oldIds } } }).catch(() => {});
        await prisma.resource.deleteMany({ where: { lecturerId: { in: oldIds } } }).catch(() => {});
        await prisma.observation.deleteMany({ where: { OR: [{ lecturerId: { in: oldIds } }, { observerId: { in: oldIds } }] } }).catch(() => {});
        await prisma.teachingObservation.deleteMany({ where: { OR: [{ lecturerId: { in: oldIds } }, { observerId: { in: oldIds } }, { deoId: { in: oldIds } }] } }).catch(() => {});
        await prisma.examModeration.deleteMany({ where: { OR: [{ lecturerId: { in: oldIds } }, { moderatorId: { in: oldIds } }, { deoId: { in: oldIds } }] } }).catch(() => {});
        await prisma.examSessionInvigilation.deleteMany({ where: { chiefInvigilatorId: { in: oldIds } } }).catch(() => {});
        await prisma.courseSection.updateMany({ where: { lecturerId: { in: oldIds } }, data: { lecturerId: null } }).catch(() => {});
        await prisma.department.updateMany({ where: { hodId: { in: oldIds } }, data: { hodId: null } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: oldIds } } }).catch(() => {});
    }

    // 4. Academic Terms (Semester 1 Past Archive & Semester 2 Active for August)
    console.log("   ➤ Setting up Semester 1 (Archived) and Semester 2 (Active for August 2026)...");
    await prisma.academicTerm.updateMany({ data: { isActive: false } });

    // Past Semester 1 (Archived)
    const term1 = await prisma.academicTerm.upsert({
        where: { name: "Semester 1 2025/2026" },
        update: { 
            startDate: new Date("2026-01-12"),
            endDate: new Date("2026-06-30"),
            isActive: false 
        },
        create: {
            name: "Semester 1 2025/2026",
            startDate: new Date("2026-01-12"),
            endDate: new Date("2026-06-30"),
            isActive: false,
            createdBy: superAdminUser ? superAdminUser.id : 1,
        }
    });

    // Current Semester 2 (Live Active for August 2026)
    const term = await prisma.academicTerm.upsert({
        where: { name: "Semester 2 2025/2026" },
        update: { 
            startDate: new Date("2026-08-06"),
            endDate: new Date("2026-11-30"),
            isActive: true 
        },
        create: {
            name: "Semester 2 2025/2026",
            startDate: new Date("2026-08-06"),
            endDate: new Date("2026-11-30"),
            isActive: true,
            createdBy: superAdminUser ? superAdminUser.id : 1,
        }
    });

    // 4b. Course Sections
    console.log("   ➤ Seeding comprehensive course sections (B.Tech 100-400, HND 100-300, Top-Up 300-400 Weekend Only)...");
    await prisma.courseSection.deleteMany(); // Reset sections to populate new columns

    const dbSlyYhaw = await prisma.user.findFirst({ where: { email: "slyyhaw@gmail.com" } });
    const dbDherlharlhi = await prisma.user.findFirst({ where: { email: "dherlharlhi20@gmail.com" } });
    const dbSlycrypto = await prisma.user.findFirst({ where: { email: "slycrypto1@gmail.com" } });

    const slyYhawId = dbSlyYhaw ? dbSlyYhaw.id : null;
    const dherId = dbDherlharlhi ? dbDherlharlhi.id : null;
    const slyId = dbSlycrypto ? dbSlycrypto.id : null;

    const allCourses = await prisma.course.findMany({
        include: { curriculumMaps: true }
    });

    for (const course of allCourses) {
        const mapLevel = course.curriculumMaps[0]?.level || 100;
        const sectionsToCreate: any[] = [];

        if (course.code === "CS101") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 100 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Tuesday",
                    startTime: "08:30 AM",
                    endTime: "10:30 AM",
                    venue: "Computer Lab 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 100 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Saturday",
                    startTime: "08:30 AM",
                    endTime: "11:30 AM",
                    venue: "CS Lab 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "HND Computer Science LVL 100 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Thursday",
                    startTime: "10:45 AM",
                    endTime: "12:45 PM",
                    venue: "Computer Lab 2",
                }
            );
        } else if (course.code === "CS102") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 100 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Monday",
                    startTime: "10:45 AM",
                    endTime: "12:45 PM",
                    venue: "Computer Lab 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 100 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Wednesday",
                    startTime: "01:30 PM",
                    endTime: "03:30 PM",
                    venue: "Science Block Rm 102",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "HND ICT LVL 100 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: dherId,
                    dayOfWeek: "Saturday",
                    startTime: "12:00 PM",
                    endTime: "03:00 PM",
                    venue: "Main Hall A",
                }
            );
        } else if (course.code === "CS201") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 200 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Wednesday",
                    startTime: "08:30 AM",
                    endTime: "10:30 AM",
                    venue: "Computer Lab 2",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 200 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: dherId,
                    dayOfWeek: "Sunday",
                    startTime: "08:30 AM",
                    endTime: "11:30 AM",
                    venue: "CS Lab 1",
                }
            );
        } else if (course.code === "CS202") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 200 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyId,
                    dayOfWeek: "Tuesday",
                    startTime: "01:30 PM",
                    endTime: "03:30 PM",
                    venue: "Computer Lab 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 200 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyId,
                    dayOfWeek: "Thursday",
                    startTime: "08:30 AM",
                    endTime: "10:30 AM",
                    venue: "Lecture Theatre 2",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "HND Computer Science LVL 200 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyId,
                    dayOfWeek: "Saturday",
                    startTime: "08:30 AM",
                    endTime: "11:30 AM",
                    venue: "Computer Lab 3",
                }
            );
        } else if (course.code === "CS203") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 200 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Friday",
                    startTime: "08:30 AM",
                    endTime: "10:30 AM",
                    venue: "Science Block Rm 102",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "HND ICT LVL 200 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Friday",
                    startTime: "11:00 AM",
                    endTime: "01:00 PM",
                    venue: "Computer Lab 2",
                }
            );
        } else if (course.code === "CS301") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 300 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Monday",
                    startTime: "01:30 PM",
                    endTime: "03:30 PM",
                    venue: "Software Engineering Lab",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science Top-Up LVL 300 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Saturday",
                    startTime: "03:30 PM",
                    endTime: "06:30 PM",
                    venue: "CS Lab 1",
                }
            );
        } else if (course.code === "CS302") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 300 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyId,
                    dayOfWeek: "Tuesday",
                    startTime: "10:45 AM",
                    endTime: "12:45 PM",
                    venue: "Computer Lab 2",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT Top-Up LVL 300 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyId,
                    dayOfWeek: "Sunday",
                    startTime: "03:30 PM",
                    endTime: "06:30 PM",
                    venue: "CS Lab 2",
                }
            );
        } else if (course.code === "CS303") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 300 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Wednesday",
                    startTime: "10:45 AM",
                    endTime: "12:45 PM",
                    venue: "Science Block Rm 102",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 300 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: dherId,
                    dayOfWeek: "Sunday",
                    startTime: "12:00 PM",
                    endTime: "03:00 PM",
                    venue: "Auditorium Annex",
                }
            );
        } else if (course.code === "CS401") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 400 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Thursday",
                    startTime: "01:30 PM",
                    endTime: "03:30 PM",
                    venue: "Computer Lab 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science Top-Up LVL 400 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Saturday",
                    startTime: "03:30 PM",
                    endTime: "06:30 PM",
                    venue: "Main Hall A",
                }
            );
        } else if (course.code === "CS402") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 400 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyId,
                    dayOfWeek: "Friday",
                    startTime: "01:30 PM",
                    endTime: "03:30 PM",
                    venue: "Software Engineering Lab",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT Top-Up LVL 400 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyId,
                    dayOfWeek: "Sunday",
                    startTime: "03:30 PM",
                    endTime: "06:30 PM",
                    venue: "Computer Lab 3",
                }
            );
        } else if (course.code === "CS403") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 400 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyId,
                    dayOfWeek: "Monday",
                    startTime: "08:30 AM",
                    endTime: "10:30 AM",
                    venue: "Lecture Theatre 2",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 400 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyId,
                    dayOfWeek: "Saturday",
                    startTime: "12:00 PM",
                    endTime: "03:00 PM",
                    venue: "CS Lab 1",
                }
            );
        } else if (course.code.startsWith("ENG")) {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: `BEng Electrical LVL ${mapLevel} (Regular)`,
                    session: "REGULAR",
                    lecturerId: null,
                    dayOfWeek: "Tuesday",
                    startTime: "09:00 AM",
                    endTime: "11:00 AM",
                    venue: "Engineering Hall 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: `BEng Mechanical LVL ${mapLevel} (Weekend)`,
                    session: "WEEKEND",
                    lecturerId: null,
                    dayOfWeek: "Saturday",
                    startTime: "09:00 AM",
                    endTime: "12:00 PM",
                    venue: "Engineering Hall 2",
                }
            );
        } else if (course.code.startsWith("BIZ")) {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: `BBA Accounting LVL ${mapLevel} (Regular)`,
                    session: "REGULAR",
                    lecturerId: null,
                    dayOfWeek: "Wednesday",
                    startTime: "10:00 AM",
                    endTime: "12:00 PM",
                    venue: "Business Block Rm 4",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: `BBA Marketing LVL ${mapLevel} (Weekend)`,
                    session: "WEEKEND",
                    lecturerId: null,
                    dayOfWeek: "Saturday",
                    startTime: "01:00 PM",
                    endTime: "04:00 PM",
                    venue: "Business Block Rm 5",
                }
            );
        }

        if (sectionsToCreate.length > 0) {
            // Seed for current term (Semester 2)
            await prisma.courseSection.createMany({ data: sectionsToCreate });
            // Seed corresponding historical sections for archived term (Semester 1)
            const pastSections = sectionsToCreate.map(s => ({ ...s, termId: term1.id }));
            await prisma.courseSection.createMany({ data: pastSections });
        }
    }

    // 5. Exam Halls
    console.log("   ➤ Syncing exam halls...");
    const hallAR = await prisma.examHall.upsert({
        where: { name: "AR Block" },
        update: { capacity: 180 },
        create: { name: "AR Block", capacity: 180, code: "AR-BLK", location: "Main Academic Quad" }
    });
    const hallLab1 = await prisma.examHall.upsert({
        where: { name: "Computer Lab 1" },
        update: { capacity: 60 },
        create: { name: "Computer Lab 1", capacity: 60, code: "CS-LAB1", location: "CS Department Building" }
    });
    const hallLab2 = await prisma.examHall.upsert({
        where: { name: "Computer Lab 2" },
        update: { capacity: 60 },
        create: { name: "Computer Lab 2", capacity: 60, code: "CS-LAB2", location: "CS Department Building" }
    });
    const hallLT2 = await prisma.examHall.upsert({
        where: { name: "Lecture Theatre 2" },
        update: { capacity: 120 },
        create: { name: "Lecture Theatre 2", capacity: 120, code: "LT-2", location: "Faculty of Engineering" }
    });

    // 5b. Exam Session Invigilation Matrix (Past Archive & Live)
    console.log("   ➤ Seeding invigilation sessions for archive and live terms...");
    await prisma.examSessionInvigilation.deleteMany();
    
    // Live Term 2 Invigilations
    await prisma.examSessionInvigilation.createMany({
        data: [
            {
                termId: term.id,
                courseCode: "CS201",
                courseTitle: "Data Structures & Algorithms",
                examDate: new Date("2026-11-24T09:00:00Z"),
                timeSlot: "09:00 - 12:00",
                sessionType: "MAIN",
                hallId: hallAR.id,
                chiefInvigilatorId: dherId,
                assistantInvigilatorIds: slyYhawId ? [slyYhawId] : [],
                targetClass: "200 Level — B.Tech Computer Science",
                studentCount: 120,
            },
            {
                termId: term.id,
                courseCode: "CS301",
                courseTitle: "Web Development",
                examDate: new Date("2026-11-25T14:00:00Z"),
                timeSlot: "14:00 - 17:00",
                sessionType: "MAIN",
                hallId: hallLab1.id,
                chiefInvigilatorId: slyYhawId,
                assistantInvigilatorIds: slyId ? [slyId] : [],
                targetClass: "300 Level — B.Tech Computer Science",
                studentCount: 55,
            },
            // Archived Term 1 Invigilations (Historical Snapshot)
            {
                termId: term1.id,
                courseCode: "CS101",
                courseTitle: "Introduction to Computer Science",
                examDate: new Date("2026-05-18T09:00:00Z"),
                timeSlot: "09:00 - 12:00",
                sessionType: "MAIN",
                hallId: hallLT2.id,
                chiefInvigilatorId: slyYhawId,
                assistantInvigilatorIds: dherId ? [dherId] : [],
                targetClass: "100 Level — B.Tech Computer Science",
                studentCount: 110,
            },
            {
                termId: term1.id,
                courseCode: "CS203",
                courseTitle: "Discrete Mathematics",
                examDate: new Date("2026-05-20T14:00:00Z"),
                timeSlot: "14:00 - 17:00",
                sessionType: "MAIN",
                hallId: hallAR.id,
                chiefInvigilatorId: dherId,
                assistantInvigilatorIds: slyId ? [slyId] : [],
                targetClass: "200 Level — B.Tech Computer Science",
                studentCount: 95,
            },
            {
                termId: term1.id,
                courseCode: "CS303",
                courseTitle: "Operating Systems",
                examDate: new Date("2026-05-22T09:00:00Z"),
                timeSlot: "09:00 - 12:00",
                sessionType: "MAIN",
                hallId: hallLab2.id,
                chiefInvigilatorId: slyId,
                assistantInvigilatorIds: slyYhawId ? [slyYhawId] : [],
                targetClass: "300 Level — B.Tech Computer Science",
                studentCount: 48,
            }
        ]
    });

    // 6. Deadlines (Archived Term 1 & Live Term 2)
    console.log("   ➤ Initializing comprehensive academic deadlines...");
    await prisma.deadline.deleteMany();
    
    // Live Term 2 Deadlines
    await prisma.deadline.create({
        data: {
            type: "SEMESTER_CALENDAR",
            label: "Semester 2 Calendar & Outline Submission",
            dueDate: new Date("2026-09-15T23:59:00Z"),
            createdBy: hod.id,
            termId: term.id,
        }
    });
    const dlTopicsTerm2 = await prisma.deadline.create({
        data: {
            type: "COURSE_TOPICS",
            label: "Weekly Lecture Plans & Topics",
            dueDate: new Date("2026-09-25T23:59:00Z"),
            createdBy: hod.id,
            termId: term.id,
        }
    });

    // Archived Term 1 Deadlines (Completed Historical)
    const dlCalTerm1 = await prisma.deadline.create({
        data: {
            type: "SEMESTER_CALENDAR",
            label: "Semester 1 Course Outline Submission",
            dueDate: new Date("2026-02-15T23:59:00Z"),
            createdBy: hod.id,
            termId: term1.id,
        }
    });
    const dlTopicsTerm1 = await prisma.deadline.create({
        data: {
            type: "COURSE_TOPICS",
            label: "Semester 1 Final Course Topics & Assessments",
            dueDate: new Date("2026-05-01T23:59:00Z"),
            createdBy: hod.id,
            termId: term1.id,
        }
    });

    // 7. Submissions (Archived Term 1 Completed & Live Term 2 Active)
    console.log("   ➤ Populating rich historical submissions and live submissions with full weekly modules...");
    await prisma.submissionVersion.deleteMany();
    await prisma.submission.deleteMany();

    // Live Term 2 Submissions with complete weekly modules & lesson plans
    const allDbSections = await prisma.courseSection.findMany({
        where: { termId: term.id },
        include: { course: true }
    });

    // Group sections by lecturer & course
    const lecturerCourseSectionsMap: { [key: string]: { lecturerId: number, course: any, sections: any[] } } = {};
    for (const sec of allDbSections) {
        if (!sec.lecturerId) continue;
        const key = `${sec.lecturerId}_${sec.courseId}`;
        if (!lecturerCourseSectionsMap[key]) {
            lecturerCourseSectionsMap[key] = {
                lecturerId: sec.lecturerId,
                course: sec.course,
                sections: []
            };
        }
        lecturerCourseSectionsMap[key].sections.push(sec);
    }

    for (const key of Object.keys(lecturerCourseSectionsMap)) {
        const item = lecturerCourseSectionsMap[key];
        const rawTopics = courseTopicsMap[item.course.code]?.topics || [
            { id: 1, title: "Course Introduction & Fundamentals", description: "Foundational concepts and principles." },
            { id: 2, title: "Theoretical Foundations", description: "Core paradigms and models." },
            { id: 3, title: "Methodologies & Tools", description: "Practical applications and software tools." },
            { id: 4, title: "Mid-Term Review & Applied Project", description: "Synthesis of concepts and laboratory evaluation." },
            { id: 5, title: "Advanced Topics & Industry Case Studies", description: "In-depth modern domain exploration." },
            { id: 6, title: "Special Topics & Best Practices", description: "Cutting-edge techniques and optimization." },
            { id: 7, title: "Revision & Final Project Presentations", description: "Comprehensive review and course capstone." },
        ];

        const mappedClasses = item.sections.map(sec => ({
            id: sec.id.toString(),
            name: sec.name,
            modules: rawTopics.map((t: any, idx: number) => ({
                id: t.id || idx + 1,
                week: idx + 1,
                title: t.title,
                description: t.description || "Core theoretical concepts, interactive demonstrations, and laboratory work.",
                lesson_plan: `1. Interactive lecture presentation on ${t.title}\n2. Practical laboratory / case study session\n3. Review quiz and student Q&A`,
                completed: idx < 2, // First 2 weeks completed for realistic progress
                resources: []
            }))
        }));

        await prisma.submission.create({
            data: {
                lecturerId: item.lecturerId,
                type: "COURSE_TOPICS",
                title: `${item.course.code} - Complete Syllabus & Weekly Modules`,
                content: {
                    courseId: item.course.id,
                    basicInfo: {
                        courseCode: item.course.code,
                        title: item.course.title,
                        description: item.course.description || "",
                        credits: String(item.course.credits ?? 3)
                    },
                    topics: rawTopics,
                    classes: mappedClasses,
                    assessments: [
                        { id: 1, name: "Continuous Assessment / Quizzes", weight: 20 },
                        { id: 2, name: "Mid-Semester Examination & Labs", weight: 30 },
                        { id: 3, name: "Final Semester Examination", weight: 50 }
                    ]
                },
                deadlineId: dlTopicsTerm2.id,
                status: "SUBMITTED",
                submittedAt: new Date("2026-08-12"),
                termId: term.id
            }
        });
    }

    // Historical Term 1 Submissions (Approved / Archive Snapshot)
    const historicalSubmissions = [
        {
            lecturerId: dherId || 1,
            type: "SEMESTER_CALENDAR" as const,
            title: "CS101 - Semester 1 Course Outline & Calendar",
            content: { 
                weeks: [
                    { week: 1, topic: "Computer Architecture Fundamentals" },
                    { week: 2, topic: "Number Systems and Boolean Logic" },
                    { week: 3, topic: "Introduction to Algorithms and Flowcharts" },
                    { week: 4, topic: "Operating Systems Overview" },
                ],
                note: "Approved by HOD with distinction."
            },
            deadlineId: dlCalTerm1.id,
            status: "APPROVED" as const,
            submittedAt: new Date("2026-01-28"),
            feedback: "Exceptional alignment with faculty learning outcomes. Approved by HOD.",
            termId: term1.id,
        },
        {
            lecturerId: slyYhawId || 1,
            type: "SEMESTER_CALENDAR" as const,
            title: "CS301 - Web Development Semester 1 Syllabus",
            content: { 
                weeks: [
                    { week: 1, topic: "Modern HTML5 & Semantic Web" },
                    { week: 2, topic: "CSS3 Flexbox & Grid Systems" },
                    { week: 3, topic: "JavaScript ES6+ & DOM Manipulation" },
                    { week: 4, topic: "RESTful API Integration & Fetch" },
                ],
                note: "Comprehensive practical syllabus."
            },
            deadlineId: dlCalTerm1.id,
            status: "APPROVED" as const,
            submittedAt: new Date("2026-01-30"),
            feedback: "Approved. Practical lab assessments well weighted.",
            termId: term1.id,
        },
        {
            lecturerId: slyId || 1,
            type: "COURSE_TOPICS" as const,
            title: "CS203 - Discrete Mathematics Topics & Assessments",
            content: { 
                sections: [
                    { name: "Section A", marks: 40, type: "Compulsory Theory" },
                    { name: "Section B", marks: 60, type: "Problem Solving & Proofs" },
                ],
                moderationStatus: "PASSED"
            },
            deadlineId: dlTopicsTerm1.id,
            status: "APPROVED" as const,
            submittedAt: new Date("2026-04-20"),
            feedback: "Moderated by Department Board and approved for final printing.",
            termId: term1.id,
        }
    ];

    for (const sub of historicalSubmissions) {
        if (sub.lecturerId) {
            await prisma.submission.create({ data: sub });
        }
    }

    // 8. Teaching Observations & Moderations (Term 1 Completed Archive)
    console.log("   ➤ Seeding completed historical observations & moderations...");
    await prisma.teachingObservation.deleteMany();
    await prisma.examModeration.deleteMany();
    await prisma.observation.deleteMany();

    const deoUser = await prisma.user.findFirst({ where: { role: "DEO" } });
    const deoId = deoUser ? deoUser.id : (superAdminUser ? superAdminUser.id : 1);

    if (slyYhawId && dherId) {
        // Completed Form A / Course Outline Review for Term 1
        await prisma.observation.create({
            data: {
                termId: term1.id,
                courseCode: "CS101",
                lecturerId: dherId,
                observerId: slyYhawId,
                status: "COMPLETED",
                reviewData: {
                    recommendation: "APPROVED",
                    score: 95,
                    feedback: "Exceptional course outline adhering to all university accreditation standards.",
                    criteria: {
                        learningOutcomesClear: true,
                        weeklyScheduleDetailed: true,
                        assessmentAligned: true,
                        requiredReadingsListed: true
                    },
                    completedAt: "2026-02-20T14:30:00Z"
                }
            }
        });

        // Completed Form B / Teaching Observation for Term 1
        await prisma.teachingObservation.create({
            data: {
                termId: term1.id,
                courseCode: "CS101",
                lecturerId: dherId,
                observerId: slyYhawId,
                deoId: deoId,
                status: "COMPLETED",
                sessionDate: new Date("2026-03-12T10:00:00Z"),
                venue: "Computer Lab 1",
                formBData: {
                    lessonTopic: "Data Representation & Binary Arithmetic",
                    studentAttendance: 72,
                    ratings: {
                        contentKnowledge: 5,
                        teachingMethodology: 4,
                        studentEngagement: 5,
                        classroomManagement: 5,
                        timeManagement: 4,
                    },
                    strengths: "Clear explanations, active student interaction, and structured slides.",
                    areasForImprovement: "Provide additional practice questions for non-CS background students.",
                    observerSigned: true,
                    lecturerSigned: true,
                }
            }
        });

        // Completed Form C / Moderation for Term 1
        await prisma.examModeration.create({
            data: {
                termId: term1.id,
                courseCode: "CS201",
                lecturerId: dherId,
                moderatorId: slyYhawId,
                deoId: deoId,
                status: "COMPLETED",
                reviewData: {
                    moderationType: "END_SEMESTER",
                    ratings: {
                        syllabusCoverage: 5,
                        markingSchemeClarity: 5,
                        questionDistribution: 4,
                        bloomsTaxonomyBalance: 5,
                    },
                    feedback: "Exam paper is well-balanced and covers all Core modules.",
                    decision: "APPROVED",
                    moderatorSigned: true,
                    lecturerSigned: true,
                }
            }
        });
    }

    // 10. Audit Trail Activity Logs
    console.log("   ➤ Seeding comprehensive audit activity logs...");
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    const redeemerUser = await prisma.user.findFirst({ where: { email: "redeemer@lamas.edu.gh" } });
    const slyUser = await prisma.user.findFirst({ where: { email: "sly.yhaw@lamas.edu.gh" } });
    const auditDeoUser = await prisma.user.findFirst({ where: { email: "deo@lamas.edu.gh" } });

    if (redeemerUser && slyUser && adminUser && auditDeoUser) {
        // Clear previous activity logs to ensure clean, relevant entries
        await prisma.activityLog.deleteMany({});

        const auditEntries = [
            {
                userId: redeemerUser.id,
                action: "SUBMISSION_CREATED",
                detail: "Submitted Course Outline & Syllabus for CS101: Introduction to Computer Science",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            },
            {
                userId: redeemerUser.id,
                action: "SUBMISSION_CREATED",
                detail: "Submitted Course Outline & Syllabus for CS201: Data Structures & Algorithms",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
            },
            {
                userId: slyUser.id,
                action: "SUBMISSION_REVIEWED",
                detail: "Reviewed CS101 Course Outline: APPROVED (Score: 95/100). Commendable syllabus structure & alignment with NAPTEX standards.",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
            },
            {
                userId: slyUser.id,
                action: "SUBMISSION_REVIEWED",
                detail: "Reviewed CS201 Course Outline: APPROVED (Score: 98/100). Rigorous algorithmic progression & lab components.",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
            },
            {
                userId: redeemerUser.id,
                action: "SUBMISSION_UPDATED",
                detail: "Updated weekly lecture plan and practical lab schedule for CS102 (Programming Fundamentals)",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
            },
            {
                userId: slyUser.id,
                action: "OBSERVATION_ASSIGNED",
                detail: "Assigned Peer Teaching Observation for CS101 (Section: B.Tech ICT LVL 100 Regular)",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            },
            {
                userId: slyUser.id,
                action: "OBSERVATION_COMPLETED",
                detail: "Completed Form B Peer Teaching Evaluation for Dr. Redeemer. Overall Score: 94/100 (Exemplary classroom engagement).",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
            },
            {
                userId: redeemerUser.id,
                action: "RESOURCE_UPLOADED",
                detail: "Uploaded lecture material: 'CS201_Data_Structures_Graph_Algorithms_Module.pdf' (12.4 MB)",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
            },
            {
                userId: slyUser.id,
                action: "DEPARTMENT_BROADCAST",
                detail: "Broadcasted priority notice to Computer Science faculty: 'Pre-moderation question submission deadline is Friday 5:00 PM.'",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
            },
            {
                userId: slyUser.id,
                action: "DIRECT_NOTIFICATION",
                detail: "Sent direct confirmation to Dr. Redeemer regarding teaching schedule allocation for B.Tech ICT 100 Weekend stream.",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 52),
            },
            {
                userId: auditDeoUser.id,
                action: "ADMIN_ACTION",
                detail: "Generated and published Final Examination Invigilation Matrix across 4 Main Halls (AR Block, Computer Lab 1 & 2, LT 2).",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
            },
            {
                userId: adminUser.id,
                action: "ADMIN_ACTION",
                detail: "Configured academic deadlines and activated Semester 2 (August 2026) cycle.",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
            },
            {
                userId: redeemerUser.id,
                action: "LOGIN",
                detail: "Lecturer session initiated from IP 192.168.1.102 (Mozilla Firefox / Windows x64)",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 100),
            },
            {
                userId: slyUser.id,
                action: "LOGIN",
                detail: "HOD session initiated from IP 192.168.1.45 (Google Chrome / macOS)",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 102),
            }
        ];

        for (const entry of auditEntries) {
            await prisma.activityLog.create({
                data: {
                    userId: entry.userId,
                    action: entry.action,
                    detail: entry.detail,
                    createdAt: entry.createdAt,
                }
            });
        }
    }

    console.log("\n✅ PROFESSIONAL SEEDING WITH RICH ARCHIVE DATA COMPLETE.");
    console.log("--------------------------------------------------");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
