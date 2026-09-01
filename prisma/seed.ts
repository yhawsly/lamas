import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { ResourceStatus, ResourceType, SubmissionStatus, SubmissionType, ObservationStatus } from "@prisma/client";

async function main() {
    console.log("🌱 STARTING PROFESSIONAL COMPUTER SCIENCE DEPARTMENT DATABASE SEEDING...");

    // =========================================================================
    // 1. DEPARTMENT SETUP
    // =========================================================================
    console.log("   ➤ Setting up Academic Department (Computer Science)...");
    const cs = await prisma.department.upsert({
        where: { code: "CS" },
        update: { name: "Department of Computer Science" },
        create: { name: "Department of Computer Science", code: "CS" },
    });

    // =========================================================================
    // 2. USER ROLES & FACULTY ROSTER PROVISIONING
    // =========================================================================
    console.log("   ➤ Provisioning verified faculty & administrative accounts...");
    const defaultPasswordHash = await hashPassword("password123");

    // 2a. Super Administrator
    const superAdmin = await prisma.user.upsert({
        where: { email: "superadmin@lamas.edu.gh" },
        update: { name: "Super Administrator", role: "SUPER_ADMIN", departmentId: cs.id, isActive: true, passwordHash: defaultPasswordHash },
        create: {
            name: "Super Administrator",
            email: "superadmin@lamas.edu.gh",
            passwordHash: defaultPasswordHash,
            role: "SUPER_ADMIN",
            departmentId: cs.id,
            isActive: true,
            phone: "+233 24 100 0001",
        },
    });

    // 2b. System Administrator
    const systemAdmin = await prisma.user.upsert({
        where: { email: "admin@lamas.edu.gh" },
        update: { name: "System Administrator", role: "ADMIN", departmentId: cs.id, isActive: true, passwordHash: defaultPasswordHash },
        create: {
            name: "System Administrator",
            email: "admin@lamas.edu.gh",
            passwordHash: defaultPasswordHash,
            role: "ADMIN",
            departmentId: cs.id,
            isActive: true,
            phone: "+233 24 100 0002",
        },
    });

    // 2c. Head of Department (HOD Computer Science)
    const hod = await prisma.user.upsert({
        where: { email: "maformaley@gmail.com" },
        update: { name: "Mr. Manuel (HOD CS)", role: "HOD", departmentId: cs.id, isActive: true, passwordHash: defaultPasswordHash },
        create: {
            name: "Mr. Manuel (HOD CS)",
            email: "maformaley@gmail.com",
            passwordHash: defaultPasswordHash,
            role: "HOD",
            departmentId: cs.id,
            isActive: true,
            phone: "+233 24 555 1010",
        },
    });

    // Link HOD to Computer Science Department
    await prisma.department.update({
        where: { id: cs.id },
        data: { hodId: hod.id },
    });

    // 2d. Department Exam Officer (DEO)
    const deo = await prisma.user.upsert({
        where: { email: "edziaemmanuel1@gmail.com" },
        update: { name: "Mr. Emmanuel Edzia (DEO)", role: "DEO", departmentId: cs.id, isActive: true, passwordHash: defaultPasswordHash },
        create: {
            name: "Mr. Emmanuel Edzia (DEO)",
            email: "edziaemmanuel1@gmail.com",
            passwordHash: defaultPasswordHash,
            role: "DEO",
            departmentId: cs.id,
            isActive: true,
            phone: "+233 24 777 2020",
        },
    });

    // 2e. Computer Science Faculty Lecturers
    const lecturer1 = await prisma.user.upsert({
        where: { email: "slyyhaw@gmail.com" },
        update: { 
            name: "Sylvester Yhaw", 
            role: "LECTURER", 
            departmentId: cs.id, 
            isActive: true, 
            passwordHash: defaultPasswordHash,
            specializations: ["Web Development & Cloud Computing", "Artificial Intelligence & Machine Learning", "Computer Networks & Distributed Systems"]
        },
        create: {
            name: "Sylvester Yhaw",
            email: "slyyhaw@gmail.com",
            passwordHash: defaultPasswordHash,
            role: "LECTURER",
            departmentId: cs.id,
            isActive: true,
            phone: "+233 20 123 4567",
            specializations: ["Web Development & Cloud Computing", "Artificial Intelligence & Machine Learning", "Computer Networks & Distributed Systems"]
        },
    });

    const lecturer2 = await prisma.user.upsert({
        where: { email: "dherlharlhi20@gmail.com" },
        update: { 
            name: "Dr. Redeemer", 
            role: "LECTURER", 
            departmentId: cs.id, 
            isActive: true, 
            passwordHash: defaultPasswordHash,
            specializations: ["Data Structures & Algorithms", "Operating Systems & Systems Programming", "Discrete Mathematics & Logic"]
        },
        create: {
            name: "Dr. Redeemer",
            email: "dherlharlhi20@gmail.com",
            passwordHash: defaultPasswordHash,
            role: "LECTURER",
            departmentId: cs.id,
            isActive: true,
            phone: "+233 20 987 6543",
            specializations: ["Data Structures & Algorithms", "Operating Systems & Systems Programming", "Discrete Mathematics & Logic"]
        },
    });

    const lecturer3 = await prisma.user.upsert({
        where: { email: "slycrypto1@gmail.com" },
        update: { 
            name: "Dr. Sarah Lim", 
            role: "LECTURER", 
            departmentId: cs.id, 
            isActive: true, 
            passwordHash: defaultPasswordHash,
            specializations: ["Database Systems & SQL", "Object-Oriented Programming & Java", "Software Engineering & DevOps"]
        },
        create: {
            name: "Dr. Sarah Lim",
            email: "slycrypto1@gmail.com",
            passwordHash: defaultPasswordHash,
            role: "LECTURER",
            departmentId: cs.id,
            isActive: true,
            phone: "+233 20 456 7890",
            specializations: ["Database Systems & SQL", "Object-Oriented Programming & Java", "Software Engineering & DevOps"]
        },
    });

    // Clean up obsolete users outside official roster
    const validEmails = [
        "superadmin@lamas.edu.gh",
        "admin@lamas.edu.gh",
        "maformaley@gmail.com",
        "edziaemmanuel1@gmail.com",
        "slyyhaw@gmail.com",
        "dherlharlhi20@gmail.com",
        "slycrypto1@gmail.com",
    ];

    await prisma.user.updateMany({
        where: { email: { notIn: validEmails } },
        data: { isActive: false }
    });

    // =========================================================================
    // 3. COMPUTER SCIENCE DEGREE PROGRAMS
    // =========================================================================
    console.log("   ➤ Syncing Computer Science degree & diploma programs...");
    const btechCS = await prisma.program.upsert({
        where: { code: "BTECH_CS" },
        update: { name: "B.Tech Computer Science" },
        create: { name: "B.Tech Computer Science", code: "BTECH_CS", description: "B.Tech in Computer Science (Levels 100-400, Regular & Weekend Streams)" }
    });
    const btechICT = await prisma.program.upsert({
        where: { code: "BTECH_ICT" },
        update: { name: "B.Tech Information & Communication Technology" },
        create: { name: "B.Tech Information & Communication Technology", code: "BTECH_ICT", description: "B.Tech in Information & Communication Technology (Levels 100-400, Regular & Weekend Streams)" }
    });
    const hndCS = await prisma.program.upsert({
        where: { code: "HND_CS" },
        update: { name: "HND Computer Science" },
        create: { name: "HND Computer Science", code: "HND_CS", description: "Higher National Diploma in Computer Science (Levels 100-300)" }
    });
    const hndICT = await prisma.program.upsert({
        where: { code: "HND_ICT" },
        update: { name: "HND Information & Communication Technology" },
        create: { name: "HND Information & Communication Technology", code: "HND_ICT", description: "Higher National Diploma in ICT (Levels 100-300)" }
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

    // =========================================================================
    // 4. COMPUTER SCIENCE COURSES & CURRICULUM
    // =========================================================================
    console.log("   ➤ Syncing 11 Computer Science courses...");
    const csCoursesList = [
        { code: "CS101", title: "Introduction to Computer Science & Systems", domain: "Computer Foundations & Architecture", credits: 3, level: 100, semester: 1 },
        { code: "CS102", title: "Programming Fundamentals in C/C++", domain: "Programming Fundamentals & C/C++", credits: 3, level: 100, semester: 2 },
        { code: "CS201", title: "Data Structures & Algorithms", domain: "Data Structures & Algorithms", credits: 4, level: 200, semester: 1 },
        { code: "CS202", title: "Object-Oriented Programming with Java", domain: "Object-Oriented Programming & Java", credits: 3, level: 200, semester: 2 },
        { code: "CS203", title: "Discrete Mathematics & Logic", domain: "Discrete Mathematics & Logic", credits: 3, level: 200, semester: 1 },
        { code: "CS301", title: "Web Development & Cloud Architecture", domain: "Web Development & Cloud Computing", credits: 3, level: 300, semester: 1 },
        { code: "CS302", title: "Database Systems & SQL Programmability", domain: "Database Systems & SQL", credits: 3, level: 300, semester: 2 },
        { code: "CS303", title: "Operating Systems & Systems Programming", domain: "Operating Systems & Systems Programming", credits: 3, level: 300, semester: 1 },
        { code: "CS401", title: "Artificial Intelligence & Neural Networks", domain: "Artificial Intelligence & Machine Learning", credits: 4, level: 400, semester: 1 },
        { code: "CS402", title: "Software Engineering & DevOps Practices", domain: "Software Engineering & DevOps", credits: 3, level: 400, semester: 2 },
        { code: "CS403", title: "Computer Networks & Distributed Systems", domain: "Computer Networks & Distributed Systems", credits: 3, level: 400, semester: 1 },
    ];

    // Clean non-CS courses if needed
    await prisma.curriculumMap.deleteMany({ where: { course: { code: { not: { startsWith: "CS" } } } } }).catch(() => {});
    await prisma.masterSyllabus.deleteMany({ where: { course: { code: { not: { startsWith: "CS" } } } } }).catch(() => {});
    await prisma.courseSection.deleteMany({ where: { course: { code: { not: { startsWith: "CS" } } } } }).catch(() => {});
    await prisma.course.deleteMany({ where: { code: { not: { startsWith: "CS" } } } }).catch(() => {});

    for (const c of csCoursesList) {
        await prisma.course.upsert({
            where: { code: c.code },
            update: { title: c.title, domain: c.domain, credits: c.credits, departmentId: cs.id },
            create: {
                code: c.code,
                title: c.title,
                domain: c.domain,
                credits: c.credits,
                departmentId: cs.id,
            },
        });
    }

    const allDbCourses = await prisma.course.findMany({ where: { code: { startsWith: "CS" } } });

    // Map curriculum to degree programs
    console.log("   ➤ Mapping curriculum across CS programs...");
    for (const c of csCoursesList) {
        const dbCourse = allDbCourses.find(dc => dc.code === c.code);
        if (!dbCourse) continue;

        // B.Tech CS (100 - 400)
        await prisma.curriculumMap.upsert({
            where: { programId_courseId: { programId: btechCS.id, courseId: dbCourse.id } },
            update: { level: c.level, semester: c.semester },
            create: { programId: btechCS.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
        });

        // B.Tech ICT (100 - 400)
        await prisma.curriculumMap.upsert({
            where: { programId_courseId: { programId: btechICT.id, courseId: dbCourse.id } },
            update: { level: c.level, semester: c.semester },
            create: { programId: btechICT.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
        });

        // HND CS & HND ICT (100 - 300 only)
        if (c.level <= 300) {
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: hndCS.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: hndCS.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: hndICT.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: hndICT.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });
        }

        // Top-Up Programs (300 - 400 only)
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
    }

    // =========================================================================
    // 5. MASTER SYLLABI FOR ALL CS COURSES
    // =========================================================================
    console.log("   ➤ Creating verified Master Syllabi with weekly topics & outcomes...");
    const csCourseTopicsMap: Record<string, { topics: { id: number; title: string; description: string }[]; outcomes: string[] }> = {
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
                { id: 1, title: "Syntax, Primitive Data Types & Operators", description: "Variables declaration, memory allocation, arithmetic, relational, and logical operator precedence in C/C++." },
                { id: 2, title: "Control Flow: Conditional Statements & Loops", description: "if-else branching, switch-case constructs, while, do-while, for loops, and nested control flow patterns." },
                { id: 3, title: "Modular Programming & Function Scope", description: "Function prototypes, parameter passing (by value vs reference), return mechanisms, recursion, and variable scope." },
                { id: 4, title: "Arrays & String Manipulation", description: "Single and multi-dimensional array memory layouts, bounds checking, string libraries, and character manipulation." },
                { id: 5, title: "Pointers & Dynamic Memory Allocation", description: "Pointer arithmetic, memory addresses, heap vs stack memory, malloc/free, new/delete, and pointer safety." },
                { id: 6, title: "Structures, Unions & File I/O Streams", description: "Custom user-defined composite data types, binary and text file read/write operations, and stream error handling." },
                { id: 7, title: "Unit Testing, Debugging & Code Profiling", description: "GDB debugging, unit test suites, assertions, defensive programming, and memory leak detection tools." }
            ],
            outcomes: [
                "Write modular, error-free procedural software implementations addressing computational problems.",
                "Manage memory dynamically using pointers safely without leaks or segmentation faults.",
                "Implement robust file input/output routines and structured debugging workflows."
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
                { id: 2, title: "Inheritance & Class Hierarchies", description: "Single, multiple, and multi-level inheritance, base class constructors, method overriding, and the 'super' keyword." },
                { id: 3, title: "Polymorphism & Dynamic Dispatch", description: "Static polymorphism (method overloading) vs runtime polymorphism (virtual methods, dynamic method binding)." },
                { id: 4, title: "Interfaces, Abstract Classes & SOLID Principles", description: "Designing extensible contracts, abstract method enforcement, Single Responsibility, Open-Closed, and Dependency Inversion." },
                { id: 5, title: "Generics, Collections Framework & Iterators", description: "Type-safe generic classes and methods, Java Collections Framework (Lists, Sets, Maps), and stream APIs." },
                { id: 6, title: "Design Patterns (Creational, Structural & Behavioral)", description: "Singleton, Factory Method, Adapter, Decorator, Observer, and Strategy design patterns." },
                { id: 7, title: "Multithreading & Concurrency Basics", description: "Thread lifecycle, runnable interfaces, synchronization blocks, locks, and thread-safe data structures." }
            ],
            outcomes: [
                "Architect robust enterprise software following OOP principles and SOLID design tenets.",
                "Apply industry-standard software design patterns to solve common architectural challenges.",
                "Build thread-safe, concurrent object-oriented applications using generics and collection frameworks."
            ]
        },
        CS203: {
            topics: [
                { id: 1, title: "Propositional & Predicate Logic", description: "Logical connectives, truth tables, tautologies, logical equivalences, universal/existential quantifiers, and rules of inference." },
                { id: 2, title: "Proof Techniques & Mathematical Induction", description: "Direct proofs, proof by contraposition, proof by contradiction, counterexamples, weak induction, and strong induction." },
                { id: 3, title: "Set Theory, Relations & Equivalence Classes", description: "Set operations, power sets, Cartesian products, binary relations, reflexivity, symmetry, transitivity, and partial orders." },
                { id: 4, title: "Functions & Cardinality", description: "Domain, codomain, range, injective, surjective, bijective functions, composition, and countable vs uncountable infinities." },
                { id: 5, title: "Combinatorics & The Pigeonhole Principle", description: "Permutations, combinations, binomial theorem, Pascal's identity, inclusion-exclusion principle, and pigeonhole applications." },
                { id: 6, title: "Recurrence Relations & Generating Functions", description: "Solving linear homogeneous and non-homogeneous recurrence relations, and divide-and-conquer recurrences." },
                { id: 7, title: "Graph Theory & Algebraic Structures", description: "Eulerian and Hamiltonian paths, planar graphs, graph coloring, isomorphic graphs, semigroups, and groups." }
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
                { id: 2, title: "Modern CSS3: Flexbox, Grid & Responsive Design", description: "Advanced layouts, CSS custom properties, media queries, animations, transitions, and CSS modular architecture." },
                { id: 3, title: "Modern JavaScript (ES6+) & Asynchronous Programming", description: "Arrow functions, destructuring, modules, closures, promises, async/await, event loop, and DOM manipulation APIs." },
                { id: 4, title: "Component-Based Frontend Frameworks (React/Next.js)", description: "JSX syntax, component lifecycle, props, state hooks, side effects, server-side rendering (SSR), and static site generation (SSG)." },
                { id: 5, title: "State Management & Client-Side Routing", description: "Global state patterns (Context API, Zustand), optimistic UI updates, dynamic routing, and protected routes." },
                { id: 6, title: "RESTful API Integration & Secure Authentication", description: "Fetch/Axios, HTTP status codes, JSON Web Tokens (JWT), session cookies, OAuth2 authentication, and API error handling." },
                { id: 7, title: "Web Security & Cloud Deployment", description: "Cross-Site Scripting (XSS), CSRF, Content Security Policy (CSP), CORS, HTTPS/TLS, and Vercel/Docker deployment." }
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
                { id: 6, title: "Transaction Processing & Concurrency Control", description: "ACID properties, serializability, two-phase locking (2PL), deadlock handling, timestamp ordering, and MVCC." },
                { id: 7, title: "Query Optimization & NoSQL Database Paradigms", description: "Cost-based query evaluation plans, document databases (MongoDB), key-value stores (Redis), and distributed CAP theorem." }
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
                { id: 2, title: "Process Concept, Scheduling & Inter-Process Communication", description: "Process control blocks (PCB), context switching, CPU scheduling algorithms (FCFS, SJF, Round Robin, Multilevel Feedback Queues), and IPC mechanisms." },
                { id: 3, title: "Threads & Concurrency Management", description: "User vs kernel threads, POSIX pthreads, multicore programming challenges, race conditions, and critical section problem." },
                { id: 4, title: "Synchronization Primitives & Classical Problems", description: "Mutex locks, counting semaphores, monitors, producer-consumer, reader-writer, and dining philosophers." },
                { id: 5, title: "Deadlocks: Detection, Prevention & Avoidance", description: "Coffman conditions, resource allocation graphs, deadlock prevention strategies, and Banker's algorithm for avoidance." },
                { id: 6, title: "Memory Management & Virtual Memory Systems", description: "Paging, page tables, TLB, segmentation, demand paging, and page replacement algorithms (FIFO, LRU, Optimal, Clock)." },
                { id: 7, title: "File Systems, I/O Subsystems & Disk Scheduling", description: "Inode allocation (contiguous, linked, indexed), disk scheduling algorithms (SSTF, SCAN, C-SCAN), and RAID levels." }
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
                { id: 2, title: "Uninformed & Informed Search Algorithms", description: "BFS, DFS, Uniform Cost Search, greedy best-first search, A* search, heuristic admissibility, and consistency." },
                { id: 3, title: "Adversarial Search & Game Playing", description: "Minimax algorithm for two-player zero-sum games, Alpha-Beta pruning, evaluation functions, and Monte Carlo Tree Search (MCTS)." },
                { id: 4, title: "Constraint Satisfaction Problems (CSPs)", description: "Backtracking search for CSPs, forward checking, Arc Consistency (AC-3), MRV (Minimum Remaining Values), and degree heuristics." },
                { id: 5, title: "Knowledge Representation & First-Order Logic Inference", description: "Propositional theorem proving, resolution refutation, forward/backward chaining, ontology engineering, and semantic networks." },
                { id: 6, title: "Machine Learning: Supervised & Unsupervised Learning", description: "Linear regression, logistic regression, decision trees, k-means clustering, PCA, bias-variance tradeoff, and evaluation metrics (ROC/AUC)." },
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
                { id: 1, title: "Software Process Models & Agile Methodologies", description: "Waterfall, Spiral, Agile Manifesto, Scrum roles/ceremonies, Kanban boards, and Extreme Programming (XP) practices." },
                { id: 2, title: "Requirements Engineering & Domain Modeling", description: "Stakeholder elicitation, functional vs non-functional requirements, user stories, acceptance criteria, and SRS standard documentation." },
                { id: 3, title: "Object-Oriented Analysis & Design with UML", description: "Use Case diagrams, Class diagrams, Sequence diagrams, State machine diagrams, and architectural views." },
                { id: 4, title: "Software Architecture & System Design", description: "Monolithic, Layered, Microservices, Event-Driven architectures, domain-driven design (DDD), API gateways, and scalability patterns." },
                { id: 5, title: "Software Verification, Validation & Testing (V&V)", description: "Test-Driven Development (TDD), unit testing frameworks, integration testing, system testing, regression testing, and mutation testing." },
                { id: 6, title: "DevOps, CI/CD & Automated Deployment", description: "Version control workflows (GitFlow, Trunk-Based), continuous integration pipelines (GitHub Actions), and Docker containerization." },
                { id: 7, title: "Software Quality, Metrics & Maintenance", description: "Cyclomatic complexity, code smells, technical debt calculation, refactoring patterns, and project cost estimation." }
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
                { id: 2, title: "Physical & Data Link Layer Protocols", description: "Transmission media, framing, error detection (Parity, Checksum, CRC), HDLC, and IEEE 802.3 Ethernet." },
                { id: 3, title: "Medium Access Control & Wireless Networks", description: "Aloha, CSMA/CD, CSMA/CA, wireless LANs (IEEE 802.11 Wi-Fi standards), Bluetooth, and cellular network architectures." },
                { id: 4, title: "Network Layer: Addressing, Subnetting & Routing", description: "IPv4 addressing, VLSM subnetting, CIDR, IPv6 transition, routing algorithms (Distance Vector RIP, Link State OSPF, Path Vector BGP)." },
                { id: 5, title: "Transport Layer: UDP, TCP & Congestion Control", description: "Port multiplexing, UDP datagrams, TCP 3-way handshake, connection teardown, sliding window flow control, and TCP congestion control." },
                { id: 6, title: "Application Layer Protocols & Socket Programming", description: "DNS hierarchy and lookup, HTTP/1.1 vs HTTP/2 vs HTTP/3, SMTP/IMAP, FTP, SSH, and Berkeley socket programming in Python/C." },
                { id: 7, title: "Network Security & Cryptographic Protocols", description: "Symmetric and asymmetric encryption (AES, RSA), digital certificates (PKI), TLS/SSL handshake, IPSec VPNs, and firewalls." }
            ],
            outcomes: [
                "Configure complex IPv4/IPv6 networks with VLSM subnetting and dynamic routing protocols.",
                "Analyze protocol packet captures using Wireshark and write client-server network socket applications.",
                "Implement network security architectures including TLS/SSL encryption, firewalls, and VPN tunnels."
            ]
        }
    };

    for (const course of allDbCourses) {
        const topicEntry = csCourseTopicsMap[course.code];
        if (topicEntry) {
            await prisma.masterSyllabus.upsert({
                where: { courseId: course.id },
                update: {
                    mandatoryTopics: topicEntry.topics,
                    learningOutcomes: topicEntry.outcomes,
                    version: 1,
                    lastUpdatedBy: hod.id,
                },
                create: {
                    courseId: course.id,
                    mandatoryTopics: topicEntry.topics,
                    learningOutcomes: topicEntry.outcomes,
                    version: 1,
                    lastUpdatedBy: hod.id,
                }
            });
        }
    }

    // =========================================================================
    // 6. ACADEMIC TERMS & DEADLINES
    // =========================================================================
    console.log("   ➤ Configuring Live Term (Semester 2 2025/2026) and Archived Term (Semester 1 2025/2026)...");
    await prisma.academicTerm.updateMany({ data: { isActive: false } });

    // Archived Term 1 (Historical Archive)
    const term1 = await prisma.academicTerm.upsert({
        where: { name: "Semester 1 2025/2026" },
        update: { 
            startDate: new Date("2026-01-12T00:00:00Z"),
            endDate: new Date("2026-06-30T23:59:59Z"),
            isActive: false 
        },
        create: {
            name: "Semester 1 2025/2026",
            startDate: new Date("2026-01-12T00:00:00Z"),
            endDate: new Date("2026-06-30T23:59:59Z"),
            isActive: false,
            createdBy: superAdmin.id,
        }
    });

    // Live Term 2 (Active Live Term)
    const term2 = await prisma.academicTerm.upsert({
        where: { name: "Semester 2 2025/2026" },
        update: { 
            startDate: new Date("2026-08-06T00:00:00Z"),
            endDate: new Date("2026-11-30T23:59:59Z"),
            isActive: true 
        },
        create: {
            name: "Semester 2 2025/2026",
            startDate: new Date("2026-08-06T00:00:00Z"),
            endDate: new Date("2026-11-30T23:59:59Z"),
            isActive: true,
            createdBy: superAdmin.id,
        }
    });

    // Deadlines
    console.log("   ➤ Initializing academic submission deadlines for Computer Science...");
    await prisma.deadline.deleteMany();

    // Term 2 Deadlines (Active)
    await prisma.deadline.create({
        data: {
            type: SubmissionType.SEMESTER_CALENDAR,
            label: "Semester 2 Course Outlines & Syllabi Dossier",
            dueDate: new Date("2026-09-15T23:59:00Z"),
            createdBy: hod.id,
            termId: term2.id,
        }
    });

    const dlTopicsTerm2 = await prisma.deadline.create({
        data: {
            type: SubmissionType.COURSE_TOPICS,
            label: "Weekly Lecture Log & Laboratory Activity Tracking",
            dueDate: new Date("2026-09-30T23:59:00Z"),
            createdBy: hod.id,
            termId: term2.id,
        }
    });

    await prisma.deadline.create({
        data: {
            type: SubmissionType.OBSERVATION_REPORT,
            label: "Mid-Semester Teaching Observation Dossier Submission",
            dueDate: new Date("2026-10-20T23:59:00Z"),
            createdBy: hod.id,
            termId: term2.id,
        }
    });

    // Term 1 Deadlines (Archived)
    const dlCalTerm1 = await prisma.deadline.create({
        data: {
            type: SubmissionType.SEMESTER_CALENDAR,
            label: "Semester 1 Course Outline Submission",
            dueDate: new Date("2026-02-15T23:59:00Z"),
            createdBy: hod.id,
            termId: term1.id,
        }
    });

    const dlTopicsTerm1 = await prisma.deadline.create({
        data: {
            type: SubmissionType.COURSE_TOPICS,
            label: "Semester 1 Final Course Topics & Assessments",
            dueDate: new Date("2026-05-01T23:59:00Z"),
            createdBy: hod.id,
            termId: term1.id,
        }
    });

    // =========================================================================
    // 7. COURSE SECTIONS & TEACHING SCHEDULES
    // =========================================================================
    console.log("   ➤ Seeding comprehensive course sections with times, days, and venues...");
    await prisma.courseSection.deleteMany();

    const slyId = lecturer1.id;
    const dherId = lecturer2.id;
    const sarahId = lecturer3.id;

    const sectionsData = [
        // CS101 - Sylvester Yhaw & Dr. Redeemer
        { code: "CS101", name: "B.Tech Computer Science LVL 100 (Regular)", session: "REGULAR" as const, lecturerId: slyId, dayOfWeek: "Tuesday", startTime: "08:30 AM", endTime: "10:30 AM", venue: "Computer Lab 1" },
        { code: "CS101", name: "B.Tech ICT LVL 100 (Weekend)", session: "WEEKEND" as const, lecturerId: slyId, dayOfWeek: "Saturday", startTime: "08:30 AM", endTime: "11:30 AM", venue: "CS Lab 1" },
        { code: "CS101", name: "HND Computer Science LVL 100 (Regular)", session: "REGULAR" as const, lecturerId: dherId, dayOfWeek: "Thursday", startTime: "10:45 AM", endTime: "12:45 PM", venue: "Computer Lab 2" },
        
        // CS102 - Dr. Redeemer
        { code: "CS102", name: "B.Tech Computer Science LVL 100 (Regular)", session: "REGULAR" as const, lecturerId: dherId, dayOfWeek: "Monday", startTime: "10:45 AM", endTime: "12:45 PM", venue: "Computer Lab 1" },
        { code: "CS102", name: "B.Tech ICT LVL 100 (Regular)", session: "REGULAR" as const, lecturerId: dherId, dayOfWeek: "Wednesday", startTime: "01:30 PM", endTime: "03:30 PM", venue: "Science Block Rm 102" },
        { code: "CS102", name: "HND ICT LVL 100 (Weekend)", session: "WEEKEND" as const, lecturerId: dherId, dayOfWeek: "Saturday", startTime: "12:00 PM", endTime: "03:00 PM", venue: "Main Hall A" },

        // CS201 - Dr. Redeemer
        { code: "CS201", name: "B.Tech Computer Science LVL 200 (Regular)", session: "REGULAR" as const, lecturerId: dherId, dayOfWeek: "Wednesday", startTime: "08:30 AM", endTime: "10:30 AM", venue: "Computer Lab 2" },
        { code: "CS201", name: "B.Tech ICT LVL 200 (Weekend)", session: "WEEKEND" as const, lecturerId: dherId, dayOfWeek: "Sunday", startTime: "08:30 AM", endTime: "11:30 AM", venue: "CS Lab 1" },

        // CS202 - Dr. Sarah Lim
        { code: "CS202", name: "B.Tech Computer Science LVL 200 (Regular)", session: "REGULAR" as const, lecturerId: sarahId, dayOfWeek: "Tuesday", startTime: "01:30 PM", endTime: "03:30 PM", venue: "Computer Lab 1" },
        { code: "CS202", name: "B.Tech ICT LVL 200 (Regular)", session: "REGULAR" as const, lecturerId: sarahId, dayOfWeek: "Thursday", startTime: "08:30 AM", endTime: "10:30 AM", venue: "Lecture Theatre 2" },
        { code: "CS202", name: "HND Computer Science LVL 200 (Weekend)", session: "WEEKEND" as const, lecturerId: sarahId, dayOfWeek: "Saturday", startTime: "08:30 AM", endTime: "11:30 AM", venue: "Computer Lab 3" },

        // CS203 - Dr. Redeemer
        { code: "CS203", name: "B.Tech Computer Science LVL 200 (Regular)", session: "REGULAR" as const, lecturerId: dherId, dayOfWeek: "Friday", startTime: "08:30 AM", endTime: "10:30 AM", venue: "Science Block Rm 102" },
        { code: "CS203", name: "HND ICT LVL 200 (Regular)", session: "REGULAR" as const, lecturerId: dherId, dayOfWeek: "Friday", startTime: "11:00 AM", endTime: "01:00 PM", venue: "Computer Lab 2" },

        // CS301 - Sylvester Yhaw
        { code: "CS301", name: "B.Tech Computer Science LVL 300 (Regular)", session: "REGULAR" as const, lecturerId: slyId, dayOfWeek: "Monday", startTime: "01:30 PM", endTime: "03:30 PM", venue: "Software Engineering Lab" },
        { code: "CS301", name: "B.Tech Computer Science Top-Up LVL 300 (Weekend)", session: "WEEKEND" as const, lecturerId: slyId, dayOfWeek: "Saturday", startTime: "03:30 PM", endTime: "06:30 PM", venue: "CS Lab 1" },

        // CS302 - Dr. Sarah Lim
        { code: "CS302", name: "B.Tech Computer Science LVL 300 (Regular)", session: "REGULAR" as const, lecturerId: sarahId, dayOfWeek: "Tuesday", startTime: "10:45 AM", endTime: "12:45 PM", venue: "Computer Lab 2" },
        { code: "CS302", name: "B.Tech ICT Top-Up LVL 300 (Weekend)", session: "WEEKEND" as const, lecturerId: sarahId, dayOfWeek: "Sunday", startTime: "03:30 PM", endTime: "06:30 PM", venue: "CS Lab 2" },

        // CS303 - Dr. Redeemer
        { code: "CS303", name: "B.Tech Computer Science LVL 300 (Regular)", session: "REGULAR" as const, lecturerId: dherId, dayOfWeek: "Wednesday", startTime: "10:45 AM", endTime: "12:45 PM", venue: "Science Block Rm 102" },
        { code: "CS303", name: "B.Tech ICT LVL 300 (Weekend)", session: "WEEKEND" as const, lecturerId: dherId, dayOfWeek: "Sunday", startTime: "12:00 PM", endTime: "03:00 PM", venue: "Auditorium Annex" },

        // CS401 - Sylvester Yhaw
        { code: "CS401", name: "B.Tech Computer Science LVL 400 (Regular)", session: "REGULAR" as const, lecturerId: slyId, dayOfWeek: "Thursday", startTime: "01:30 PM", endTime: "03:30 PM", venue: "Computer Lab 1" },
        { code: "CS401", name: "B.Tech Computer Science Top-Up LVL 400 (Weekend)", session: "WEEKEND" as const, lecturerId: slyId, dayOfWeek: "Saturday", startTime: "03:30 PM", endTime: "06:30 PM", venue: "Main Hall A" },

        // CS402 - Dr. Sarah Lim
        { code: "CS402", name: "B.Tech Computer Science LVL 400 (Regular)", session: "REGULAR" as const, lecturerId: sarahId, dayOfWeek: "Friday", startTime: "01:30 PM", endTime: "03:30 PM", venue: "Software Engineering Lab" },
        { code: "CS402", name: "B.Tech ICT Top-Up LVL 400 (Weekend)", session: "WEEKEND" as const, lecturerId: sarahId, dayOfWeek: "Sunday", startTime: "03:30 PM", endTime: "06:30 PM", venue: "Computer Lab 3" },

        // CS403 - Dr. Sarah Lim
        { code: "CS403", name: "B.Tech ICT LVL 400 (Regular)", session: "REGULAR" as const, lecturerId: sarahId, dayOfWeek: "Monday", startTime: "08:30 AM", endTime: "10:30 AM", venue: "Lecture Theatre 2" },
        { code: "CS403", name: "B.Tech Computer Science LVL 400 (Weekend)", session: "WEEKEND" as const, lecturerId: sarahId, dayOfWeek: "Saturday", startTime: "12:00 PM", endTime: "03:00 PM", venue: "CS Lab 1" },
    ];

    for (const sec of sectionsData) {
        const course = allDbCourses.find(c => c.code === sec.code);
        if (!course) continue;

        // Seed for active live term (Term 2)
        await prisma.courseSection.create({
            data: {
                courseId: course.id,
                termId: term2.id,
                name: sec.name,
                session: sec.session,
                lecturerId: sec.lecturerId,
                dayOfWeek: sec.dayOfWeek,
                startTime: sec.startTime,
                endTime: sec.endTime,
                venue: sec.venue,
            }
        });

        // Seed corresponding historical sections for archived term (Term 1)
        await prisma.courseSection.create({
            data: {
                courseId: course.id,
                termId: term1.id,
                name: sec.name,
                session: sec.session,
                lecturerId: sec.lecturerId,
                dayOfWeek: sec.dayOfWeek,
                startTime: sec.startTime,
                endTime: sec.endTime,
                venue: sec.venue,
            }
        });
    }


    // =========================================================================
    // 9. VERIFIED EDUCATIONAL RESOURCES & LECTURE FILES
    // =========================================================================
    console.log("   ➤ Seeding verified educational resources, code files, slides, and manuals...");
    await prisma.resource.deleteMany();

    const resourcesSeedData = [
        {
            title: "CS301 Web Development — Modern Full-Stack Architecture Guide",
            description: "Comprehensive guide covering Next.js 15, React 19, RESTful API design, and authentication patterns.",
            url: "/uploads/CS301_FullStack_Architecture_Guide.pdf",
            type: ResourceType.PDF,
            status: ResourceStatus.APPROVED,
            lecturerId: slyId,
            departmentId: cs.id,
            feedback: "Approved by HOD. Excellent reference material for Level 300 students.",
        },
        {
            title: "CS201 Data Structures & Algorithms — Core Lecture Slides Deck",
            description: "Complete presentation slides for Big-O analysis, balanced trees, graph traversal, and dynamic programming.",
            url: "/uploads/CS201_Data_Structures_Slides.pptx",
            type: ResourceType.SLIDES,
            status: ResourceStatus.APPROVED,
            lecturerId: dherId,
            departmentId: cs.id,
            feedback: "Approved for departmental distribution.",
        },
        {
            title: "CS401 AI & Deep Learning — PyTorch Neural Networks Lab Code",
            description: "Starter repository containing PyTorch implementations of CNNs, RNNs, and Transformer attention modules.",
            url: "/uploads/CS401_PyTorch_AI_Lab_Code.zip",
            type: ResourceType.CODE,
            status: ResourceStatus.APPROVED,
            lecturerId: slyId,
            departmentId: cs.id,
            feedback: "Code cleanly documented with unit tests. Approved.",
        },
        {
            title: "CS302 Database Systems — Normalization & SQL Queries Worksheet",
            description: "Practical laboratory worksheet with hands-on exercises for 1NF to BCNF and complex SQL joins.",
            url: "/uploads/CS302_Normalization_Worksheet.docx",
            type: ResourceType.DOCUMENT,
            status: ResourceStatus.APPROVED,
            lecturerId: sarahId,
            departmentId: cs.id,
            feedback: "Approved by HOD for Semester 2 labs.",
        },
        {
            title: "CS101 Intro to Computer Science — Architecture Video Walkthrough",
            description: "Video lecture explaining the CPU fetch-decode-execute cycle and memory hierarchy.",
            url: "/uploads/CS101_CPU_Architecture_Lecture.mp4",
            type: ResourceType.VIDEO,
            status: ResourceStatus.APPROVED,
            lecturerId: slyId,
            departmentId: cs.id,
            feedback: "Clear audio and visual quality.",
        },
        {
            title: "CS202 Object-Oriented Programming — Java Design Patterns Project",
            description: "Enterprise Java project demonstrating Singleton, Factory, and Observer architectural patterns.",
            url: "/uploads/CS202_Java_Patterns_Project.zip",
            type: ResourceType.CODE,
            status: ResourceStatus.PENDING,
            lecturerId: sarahId,
            departmentId: cs.id,
            feedback: null,
        },
        {
            title: "CS102 Programming Fundamentals — C/C++ Laboratory Manual",
            description: "Laboratory manual with 14 weekly programming challenges from pointers to dynamic memory.",
            url: "/uploads/CS102_Cpp_Lab_Manual.pdf",
            type: ResourceType.PDF,
            status: ResourceStatus.APPROVED,
            lecturerId: dherId,
            departmentId: cs.id,
            feedback: "Standardized departmental manual approved.",
        },
        {
            title: "CS403 Computer Networks — Wireshark Packet Capture Lab Guide",
            description: "Hands-on packet inspection instructions for TCP 3-way handshake, DNS, and TLS handshakes.",
            url: "/uploads/CS403_Wireshark_Packet_Labs.pdf",
            type: ResourceType.PDF,
            status: ResourceStatus.APPROVED,
            lecturerId: sarahId,
            departmentId: cs.id,
            feedback: "Approved.",
        },
        {
            title: "CS303 Operating Systems — Linux Process Scheduling Simulator",
            description: "Interactive Excel model comparing FCFS, Round Robin, and Multi-Level Feedback Queue scheduling.",
            url: "/uploads/CS303_Process_Scheduling_Simulation.xlsx",
            type: ResourceType.SPREADSHEET,
            status: ResourceStatus.APPROVED,
            lecturerId: dherId,
            departmentId: cs.id,
            feedback: "Formulas and macros verified. Approved.",
        },
        {
            title: "Computer Science Department Quality Assurance Guidelines 2026",
            description: "Official departmental handbook outlining course dossier requirements, rubric grading, and peer observations.",
            url: "/uploads/CS_QA_Handbook_2026.pdf",
            type: ResourceType.PDF,
            status: ResourceStatus.APPROVED,
            lecturerId: hod.id,
            departmentId: cs.id,
            feedback: "Institutional policy document published.",
        }
    ];

    for (const res of resourcesSeedData) {
        await prisma.resource.create({ data: res });
    }

    // =========================================================================
    // 10. SUBMISSIONS & COURSE DOSSIERS
    // =========================================================================
    console.log("   ➤ Populating rich live and historical submissions with complete weekly modules...");
    await prisma.submissionVersion.deleteMany();
    await prisma.submission.deleteMany();

    const activeSections = await prisma.courseSection.findMany({
        where: { termId: term2.id },
        include: { course: true }
    });

    const lecturerSectionsMap: { [key: string]: { lecturerId: number, course: any, sections: any[] } } = {};
    for (const sec of activeSections) {
        if (!sec.lecturerId) continue;
        const key = `${sec.lecturerId}_${sec.courseId}`;
        const existing = lecturerSectionsMap[key];
        if (!existing) {
            lecturerSectionsMap[key] = {
                lecturerId: sec.lecturerId,
                course: sec.course,
                sections: [sec]
            };
        } else {
            existing.sections.push(sec);
        }
    }

    for (const item of Object.values(lecturerSectionsMap)) {
        const rawTopics = csCourseTopicsMap[item.course.code]?.topics || [
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
                completed: idx < 3, // First 3 weeks completed
                resources: []
            }))
        }));

        const isApproved = item.course.code === "CS301" || item.course.code === "CS101" || item.course.code === "CS201";

        const submission = await prisma.submission.create({
            data: {
                lecturerId: item.lecturerId,
                type: SubmissionType.COURSE_TOPICS,
                title: `${item.course.code} - Complete Syllabus & Weekly Modules`,
                content: {
                    courseId: item.course.id,
                    basicInfo: {
                        courseCode: item.course.code,
                        title: item.course.title,
                        description: `Comprehensive academic syllabus for ${item.course.title}.`,
                        credits: String(item.course.credits ?? 3)
                    },
                    topics: rawTopics,
                    classes: mappedClasses,
                    assessments: [
                        { id: 1, name: "Continuous Assessment / Quizzes", weight: 20 },
                        { id: 2, name: "Mid-Semester Examination & Labs", weight: 20 },
                        { id: 3, name: "End of Semester Examination", weight: 60 }
                    ]
                },
                deadlineId: dlTopicsTerm2.id,
                status: isApproved ? SubmissionStatus.APPROVED : SubmissionStatus.SUBMITTED,
                submittedAt: new Date("2026-08-12T14:30:00Z"),
                feedback: isApproved ? "Excellent syllabus alignment with faculty learning outcomes. Approved by HOD." : null,
                termId: term2.id
            }
        });

        await prisma.submissionVersion.create({
            data: {
                submissionId: submission.id,
                isDraft: false,
                savedAt: new Date("2026-08-12T14:30:00Z"),
                snapshot: submission.content as any
            }
        });
    }

    // Historical Submissions for Term 1
    const historicalSubmissions = [
        {
            lecturerId: slyId,
            type: SubmissionType.SEMESTER_CALENDAR,
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
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date("2026-01-28T10:00:00Z"),
            feedback: "Exceptional alignment with faculty learning outcomes. Approved by HOD.",
            termId: term1.id,
        },
        {
            lecturerId: slyId,
            type: SubmissionType.SEMESTER_CALENDAR,
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
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date("2026-01-30T11:30:00Z"),
            feedback: "Approved. Practical lab assessments well weighted.",
            termId: term1.id,
        },
        {
            lecturerId: dherId,
            type: SubmissionType.COURSE_TOPICS,
            title: "CS201 - Data Structures Semester 1 Course Outline",
            content: { 
                sections: [
                    { name: "Section A", marks: 40, type: "Compulsory Theory" },
                    { name: "Section B", marks: 60, type: "Problem Solving & Proofs" },
                ],
                moderationStatus: "PASSED"
            },
            deadlineId: dlTopicsTerm1.id,
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date("2026-02-05T09:15:00Z"),
            feedback: "Moderated by Department Board and approved for final teaching.",
            termId: term1.id,
        },
        {
            lecturerId: sarahId,
            type: SubmissionType.COURSE_TOPICS,
            title: "CS202 - OOP Java Semester 1 Course Dossier",
            content: { 
                sections: [
                    { name: "Lab Exercises", marks: 30 },
                    { name: "Midterm Project", marks: 20 },
                    { name: "Final Exam", marks: 50 }
                ]
            },
            deadlineId: dlTopicsTerm1.id,
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date("2026-02-08T15:00:00Z"),
            feedback: "Approved by HOD.",
            termId: term1.id,
        }
    ];

    for (const sub of historicalSubmissions) {
        await prisma.submission.create({ data: sub });
    }

    // =========================================================================
    // 11. REVIEWS & APPRAISALS (FORM A, FORM B, FORM C)
    // =========================================================================
    console.log("   ➤ Populating completed & pending reviews (Form A, Form B, Form C)...");
    await prisma.teachingObservation.deleteMany();
    await prisma.examModeration.deleteMany();
    await prisma.observation.deleteMany();

    // 11a. FORM A: Course Outline & Syllabus Review (Observation model)
    // Completed Live Term 2 Form A reviews
    await prisma.observation.create({
        data: {
            termId: term2.id,
            courseCode: "CS301",
            lecturerId: slyId,
            observerId: dherId,
            sessionDate: new Date("2026-08-18T10:00:00Z"),
            venue: "Software Engineering Lab",
            status: ObservationStatus.COMPLETED,
            feedback: "Course outline is thoroughly aligned with modern industry web standards. Rigorous lab component included.",
            reviewData: {
                materialsReviewed: {
                    courseOutline: true,
                    mainTextbook: true,
                    lectureNotes: true,
                    otherTLMs: true
                },
                criteria: {
                    courseOutline: {
                        formatConforms: 5,
                        descConforms: 5,
                        objSpecific: 5,
                        outcomesAchievable: 5,
                        topicsRelevant: 5,
                        remarks: {
                            formatConforms: "Strictly conforms to HTU Computer Science syllabus template.",
                            descConforms: "Clear description of full-stack web architecture.",
                            outcomesAchievable: "Measurable Bloom's taxonomy learning outcomes."
                        }
                    },
                    mainTextbook: {
                        coversContent: 5,
                        isCurrent: 5,
                        isAccessible: 4,
                        remarks: {
                            coversContent: "Covers all 7 core modules including React 19 & Next.js.",
                            isCurrent: "Modern 2025/2026 edition referenced."
                        }
                    },
                    lectureNotes: {
                        linkedToContent: 5,
                        clear: 5,
                        concise: 4,
                        wellOrganized: 5,
                        remarks: {
                            linkedToContent: "Direct correlation between slide decks and syllabus topics."
                        }
                    },
                    otherTLMs: {
                        relevant: 5,
                        suitable: 5,
                        remarks: {
                            relevant: "Interactive code sandbox & GitHub starter repos provided."
                        }
                    }
                },
                strengthsWeaknesses: {
                    courseOutline: { strengths: "Exemplary modular pacing with clear hands-on laboratory milestones.", weaknesses: "None observed." },
                    mainTextbook: { strengths: "Latest industry-standard textbook referenced.", weaknesses: "Physical library copies should be supplemented." },
                    lectureNotes: { strengths: "Rich code snippets and architectural diagrams included.", weaknesses: "None." },
                    otherTLMs: { strengths: "Cloud-hosted development environments set up for students.", weaknesses: "None." }
                },
                recommendations: "Recommended for unconditional departmental approval and teaching delivery.",
                overallRating: "Excellent"
            }
        }
    });

    await prisma.observation.create({
        data: {
            termId: term2.id,
            courseCode: "CS201",
            lecturerId: dherId,
            observerId: slyId,
            sessionDate: new Date("2026-08-19T09:00:00Z"),
            venue: "Computer Lab 2",
            status: ObservationStatus.COMPLETED,
            feedback: "Data structures syllabus covers all core algorithms with excellent theoretical and practical balance.",
            reviewData: {
                materialsReviewed: {
                    courseOutline: true,
                    mainTextbook: true,
                    lectureNotes: true,
                    otherTLMs: true
                },
                criteria: {
                    courseOutline: {
                        formatConforms: 5,
                        descConforms: 5,
                        objSpecific: 5,
                        outcomesAchievable: 5,
                        topicsRelevant: 5,
                        remarks: {
                            formatConforms: "Conforms to departmental accreditation criteria.",
                            topicsRelevant: "Covers balanced trees, graphs, and dynamic programming."
                        }
                    },
                    mainTextbook: {
                        coversContent: 5,
                        isCurrent: 4,
                        isAccessible: 5,
                        remarks: { coversContent: "Comprehensive coverage of asymptotic analysis." }
                    },
                    lectureNotes: {
                        linkedToContent: 5,
                        clear: 5,
                        concise: 5,
                        wellOrganized: 5,
                        remarks: {}
                    },
                    otherTLMs: {
                        relevant: 5,
                        suitable: 5,
                        remarks: {}
                    }
                },
                strengthsWeaknesses: {
                    courseOutline: { strengths: "Rigorous Big-O progression and thorough tree traversal modules.", weaknesses: "None." },
                    mainTextbook: { strengths: "Classic algorithms textbook with rigorous proofs.", weaknesses: "None." },
                    lectureNotes: { strengths: "Clear whiteboard traces and complexity derivations.", weaknesses: "None." },
                    otherTLMs: { strengths: "Visualizer links provided for graph traversal.", weaknesses: "None." }
                },
                recommendations: "Approved for full academic delivery.",
                overallRating: "Excellent"
            }
        }
    });

    // Pending Live Term 2 Form A review (Dr. Sarah Lim - CS402)
    await prisma.observation.create({
        data: {
            termId: term2.id,
            courseCode: "CS402",
            lecturerId: sarahId,
            observerId: slyId,
            sessionDate: new Date("2026-09-10T14:00:00Z"),
            venue: "Software Engineering Lab",
            status: ObservationStatus.PENDING,
        }
    });

    // 11b. FORM B: Classroom Teaching Observation (TeachingObservation model)
    // Completed Live Term 2 Form B
    await prisma.teachingObservation.create({
        data: {
            termId: term2.id,
            courseCode: "CS201",
            lecturerId: dherId,
            observerId: slyId,
            deoId: deo.id,
            sessionDate: new Date("2026-08-20T08:30:00Z"),
            venue: "Computer Lab 2",
            status: ObservationStatus.COMPLETED,
            formBData: {
                metadata: {
                    programme: "B.Tech Computer Science (Level 200)",
                    lessonTopic: "Binary Search Tree Traversal & Balancing Rotations",
                    modeOfDelivery: "Hybrid (Lecture Slides & Live Coding)",
                    venue: "Computer Lab 2",
                    lessonPeriodFrom: "08:30 AM",
                    lessonPeriodTo: "10:30 AM",
                    observationPeriodFrom: "08:30 AM",
                    observationPeriodTo: "10:30 AM",
                    natureOfTeaching: "Practical"
                },
                criteria: {
                    startOfLesson: {
                        suitablyDressed: 5,
                        punctual: 5,
                        rapport: 5,
                        reviewedPrevious: 5,
                        explainedObjectives: 5,
                        remarks: {
                            punctual: "Arrived 10 minutes before session; workstations pre-configured.",
                            explainedObjectives: "Session outcomes written clearly on whiteboard."
                        }
                    },
                    delivery: {
                        audible: 5,
                        modeAppropriate: 5,
                        paceAppropriate: 4,
                        movementEquitable: 5,
                        sustainedAttention: 5,
                        allowedContributions: 5,
                        allowedQuestions: 5,
                        deliveryEthical: 5,
                        remarks: {
                            movementEquitable: "Actively walked between student rows assisting with pointer debug errors.",
                            allowedQuestions: "Encouraged diverse student participation and troubleshooting."
                        }
                    },
                    conclusion: {
                        summarizedSatisfactorily: 5,
                        encouragedExploration: 5,
                        gaveAssignment: 5,
                        remarks: {
                            gaveAssignment: "Assigned AVL rotation coding exercise due next laboratory session."
                        }
                    },
                    contentKnowledge: {
                        knowledgeable: 5,
                        connectedRealLife: 5,
                        deliveredClearly: 5,
                        usedRelevantMaterials: 5,
                        respondedQuestions: 5,
                        remarks: {
                            knowledgeable: "Demonstrated deep mastery of non-linear data structures and recursion."
                        }
                    }
                },
                strengthsWeaknesses: {
                    strengths: "Interactive live algorithmic tracing; students actively implemented tree balancing on their workstations with immediate feedback.",
                    weaknesses: "Slightly quick pace in the initial 15 minutes of recursion review."
                },
                recommendations: "Continue utilizing visual animation tools for complex pointer manipulations.",
                overallRating: "Excellent",
                teacherComments: "Thank you for the constructive feedback. Supplementary tutorial handouts will be provided."
            }
        }
    });

    await prisma.teachingObservation.create({
        data: {
            termId: term2.id,
            courseCode: "CS301",
            lecturerId: slyId,
            observerId: sarahId,
            deoId: deo.id,
            sessionDate: new Date("2026-08-22T13:30:00Z"),
            venue: "Software Engineering Lab",
            status: ObservationStatus.COMPLETED,
            formBData: {
                metadata: {
                    programme: "B.Tech Computer Science (Level 300)",
                    lessonTopic: "React 19 Server Actions & Optimistic State Updates",
                    modeOfDelivery: "Practical Coding Demonstration",
                    venue: "Software Engineering Lab",
                    lessonPeriodFrom: "01:30 PM",
                    lessonPeriodTo: "03:30 PM",
                    observationPeriodFrom: "01:30 PM",
                    observationPeriodTo: "03:30 PM",
                    natureOfTeaching: "Practical"
                },
                criteria: {
                    startOfLesson: {
                        suitablyDressed: 5,
                        punctual: 5,
                        rapport: 5,
                        reviewedPrevious: 5,
                        explainedObjectives: 5,
                        remarks: { explainedObjectives: "Clear roadmap on full-stack data mutation patterns." }
                    },
                    delivery: {
                        audible: 5,
                        modeAppropriate: 5,
                        paceAppropriate: 5,
                        movementEquitable: 4,
                        sustainedAttention: 5,
                        allowedContributions: 5,
                        allowedQuestions: 5,
                        deliveryEthical: 5,
                        remarks: { deliveryEthical: "Professional and inclusive classroom environment." }
                    },
                    conclusion: {
                        summarizedSatisfactorily: 5,
                        encouragedExploration: 5,
                        gaveAssignment: 5,
                        remarks: {}
                    },
                    contentKnowledge: {
                        knowledgeable: 5,
                        connectedRealLife: 5,
                        deliveredClearly: 5,
                        usedRelevantMaterials: 5,
                        respondedQuestions: 5,
                        remarks: { knowledgeable: "Outstanding mastery of modern full-stack web architecture." }
                    }
                },
                strengthsWeaknesses: {
                    strengths: "Interactive live-coding demo with instant student feedback. Hands-on debugging exercises.",
                    weaknesses: "Provide slide handout PDF prior to lecture."
                },
                recommendations: "Keep engaging students in real-world deployment challenges.",
                overallRating: "Excellent",
                teacherComments: "Handouts will be uploaded to the Resources tab prior to future lectures."
            }
        }
    });

    // Pending Live Term 2 Form B (Dr. Sarah Lim - CS302 Database Systems)
    await prisma.teachingObservation.create({
        data: {
            termId: term2.id,
            courseCode: "CS302",
            lecturerId: sarahId,
            observerId: dherId,
            deoId: deo.id,
            sessionDate: new Date("2026-09-12T10:45:00Z"),
            venue: "Computer Lab 2",
            status: ObservationStatus.PENDING,
        }
    });

    // 11c. FORM C: Examination Moderation Records (ExamModeration model)
    // Completed Live Term 2 Form C
    await prisma.examModeration.create({
        data: {
            termId: term2.id,
            courseCode: "CS201",
            lecturerId: dherId,
            moderatorId: slyId,
            deoId: deo.id,
            status: ObservationStatus.COMPLETED,
            reviewData: {
                natureOfExam: {
                    written: true,
                    practical: true,
                    oral: false
                },
                materialsReviewed: {
                    courseOutline: true,
                    examQuestions: true,
                    markingScheme: true,
                    specificationTable: true
                },
                examQuestions: {
                    objectiveTest: { yes: true, no: false, numQuestions: "20", numToAnswer: "20" },
                    essayTest: { yes: true, no: false, numQuestions: "4", numToAnswer: "3" },
                    practicalTest: { yes: true, no: false, numQuestions: "2", numToAnswer: "2" }
                },
                criteria: {
                    examQuestions: {
                        formatConforms: 5,
                        instructionsClear: 5,
                        questionsClear: 5,
                        durationFair: 4,
                        coversOutline: 5,
                        difficultyAppropriate: 5,
                        remarks: {
                            formatConforms: "Conforms to university examination formatting standards.",
                            coversOutline: "All 7 syllabus topic modules represented proportionally.",
                            difficultyAppropriate: "Good balance of Bloom's cognitive taxonomy levels."
                        }
                    },
                    markingScheme: {
                        comprehensible: 5,
                        answersCorrect: 5,
                        marksFair: 5,
                        subMarksSum: 5,
                        totalMarksSum: 5,
                        remarks: {
                            subMarksSum: "Sub-mark breakdowns are unambiguous and total exactly 100 marks.",
                            answersCorrect: "Model code solutions tested and verified error-free."
                        }
                    }
                },
                changesExamQuestions: [
                    "Question 2b: Clarified edge condition when root node is null.",
                    "Question 4a: Fixed minor typographical error in time complexity formula.",
                    "", "", ""
                ],
                changesMarkingScheme: [
                    "Marking rubric for Section B Question 3 adjusted to award 2 marks for memory cleanup.",
                    "", "", "", ""
                ],
                strengthsWeaknesses: {
                    examQuestions: {
                        strengths: "Comprehensive coverage of algorithm design, analysis, and data structure implementation.",
                        weaknesses: "None observed."
                    },
                    markingScheme: {
                        strengths: "Step-by-step mark allocations with alternate correct implementation solutions provided.",
                        weaknesses: "None."
                    }
                },
                generalComments: "The examination paper is rigorous, fair, and ready for printing and administration.",
                overallRatingExam: "Excellent",
                overallRatingMarking: "Excellent"
            }
        }
    });

    await prisma.examModeration.create({
        data: {
            termId: term2.id,
            courseCode: "CS301",
            lecturerId: slyId,
            moderatorId: sarahId,
            deoId: deo.id,
            status: ObservationStatus.COMPLETED,
            reviewData: {
                natureOfExam: {
                    written: true,
                    practical: true,
                    oral: false
                },
                materialsReviewed: {
                    courseOutline: true,
                    examQuestions: true,
                    markingScheme: true,
                    specificationTable: true
                },
                examQuestions: {
                    objectiveTest: { yes: true, no: false, numQuestions: "15", numToAnswer: "15" },
                    essayTest: { yes: true, no: false, numQuestions: "3", numToAnswer: "2" },
                    practicalTest: { yes: true, no: false, numQuestions: "2", numToAnswer: "2" }
                },
                criteria: {
                    examQuestions: {
                        formatConforms: 5,
                        instructionsClear: 5,
                        questionsClear: 5,
                        durationFair: 5,
                        coversOutline: 5,
                        difficultyAppropriate: 5,
                        remarks: {
                            coversOutline: "Comprehensive coverage of React, REST APIs, and authentication."
                        }
                    },
                    markingScheme: {
                        comprehensible: 5,
                        answersCorrect: 5,
                        marksFair: 5,
                        subMarksSum: 5,
                        totalMarksSum: 5,
                        remarks: {}
                    }
                },
                changesExamQuestions: [
                    "Question 1c: Updated API endpoint URL to standard RESTful format.",
                    "", "", "", ""
                ],
                changesMarkingScheme: ["", "", "", "", ""],
                strengthsWeaknesses: {
                    examQuestions: {
                        strengths: "Practical coding questions reflect real-world industry architecture.",
                        weaknesses: "None."
                    },
                    markingScheme: {
                        strengths: "Marking breakdown is granular and objective.",
                        weaknesses: "None."
                    }
                },
                generalComments: "High-quality exam paper approved for final administration.",
                overallRatingExam: "Excellent",
                overallRatingMarking: "Excellent"
            }
        }
    });

    // Pending Live Term 2 Form C (CS401 - Artificial Intelligence)
    await prisma.examModeration.create({
        data: {
            termId: term2.id,
            courseCode: "CS401",
            lecturerId: slyId,
            moderatorId: dherId,
            deoId: deo.id,
            status: ObservationStatus.PENDING,
        }
    });

    // =========================================================================
    // 12. NOTIFICATIONS
    // =========================================================================
    console.log("   ➤ Generating official faculty & officer notifications...");
    await prisma.notification.deleteMany();

    const notificationsData = [
        {
            userId: slyId,
            message: "Your CS301 (Web Development) course outline was reviewed and APPROVED by Dr. Redeemer.",
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        },
        {
            userId: slyId,
            message: "You have been assigned as Peer Observer for CS302 (Web Development) on Oct 14.",
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        },
        {
            userId: dherId,
            message: "Form C Moderation completed and approved for CS201 (Data Structures & Algorithms).",
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        },
        {
            userId: sarahId,
            message: "Reminder: You have a scheduled Teaching Observation for CS302 on September 12 at 10:45 AM (Computer Lab 2).",
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        },
        {
            userId: hod.id,
            message: "New course outline submission received for CS402 (Software Engineering) awaiting HOD sign-off.",
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        },
        {
            userId: deo.id,
            message: "Final Course Allocation Matrix for Semester 2 2025/2026 successfully published across Computer Science department.",
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        }
    ];

    for (const notif of notificationsData) {
        await prisma.notification.create({ data: notif });
    }

    // =========================================================================
    // 13. AUDIT TRAIL ACTIVITY LOGS
    // =========================================================================
    console.log("   ➤ Logging comprehensive audit trail events...");
    await prisma.activityLog.deleteMany();

    const auditEntries = [
        {
            userId: slyId,
            action: "SUBMISSION_CREATED",
            detail: "Submitted Course Outline & Syllabus for CS301: Web Development & Cloud Architecture",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
            userId: dherId,
            action: "SUBMISSION_CREATED",
            detail: "Submitted Course Outline & Syllabus for CS201: Data Structures & Algorithms",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        },
        {
            userId: hod.id,
            action: "SUBMISSION_REVIEWED",
            detail: "Reviewed and APPROVED CS301 Course Outline (Score: 96/100). Outstanding alignment with NAPTEX standards.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        },
        {
            userId: hod.id,
            action: "SUBMISSION_REVIEWED",
            detail: "Reviewed and APPROVED CS201 Course Outline (Score: 98/100). Commendable lab and theoretical progression.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        },
        {
            userId: deo.id,
            action: "OBSERVATION_ASSIGNED",
            detail: "Assigned Form B Classroom Observation for CS302: Dr. Sarah Lim (Observer: Dr. Redeemer)",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
        },
        {
            userId: slyId,
            action: "OBSERVATION_COMPLETED",
            detail: "Completed Form B Peer Observation for Dr. Redeemer on CS201 (Score: 95/100). Exemplary student engagement.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
        {
            userId: slyId,
            action: "RESOURCE_UPLOADED",
            detail: "Uploaded lecture material: 'CS301_FullStack_Architecture_Guide.pdf' (PDF format)",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
        },
        {
            userId: hod.id,
            action: "DEPARTMENT_BROADCAST",
            detail: "Broadcasted faculty reminder: 'Mid-semester continuous assessment reports due by Friday 5:00 PM.'",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        },
        {
            userId: deo.id,
            action: "ALLOCATION_MATRIX_UPDATED",
            detail: "Updated and published semester course allocation matrix across Computer Science faculty.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
        },
        {
            userId: systemAdmin.id,
            action: "TERM_ACTIVATED",
            detail: "Activated academic cycle: Semester 2 2025/2026 for Computer Science Department.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
        },
        {
            userId: slyId,
            action: "LOGIN",
            detail: "Lecturer session authenticated from IP 192.168.1.102 (Mozilla Firefox / Windows x64)",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 100),
        },
        {
            userId: hod.id,
            action: "LOGIN",
            detail: "HOD administrative session authenticated from IP 192.168.1.45 (Google Chrome / macOS)",
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

    console.log("\n=========================================================================");
    console.log("✅ COMPUTER SCIENCE DEPARTMENT DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=========================================================================");
    console.log("   👑 Super Admin: superadmin@lamas.edu.gh (password: password123)");
    console.log("   🛡️ System Admin: admin@lamas.edu.gh     (password: password123)");
    console.log("   🏛️ HOD (CS):     maformaley@gmail.com    (password: password123)");
    console.log("   📋 DEO (CS):     edziaemmanuel1@gmail.com (password: password123)");
    console.log("   🎓 Lecturers:");
    console.log("      - Sylvester Yhaw: slyyhaw@gmail.com     (password: password123)");
    console.log("      - Dr. Redeemer:   dherlharlhi20@gmail.com (password: password123)");
    console.log("      - Dr. Sarah Lim:  slycrypto1@gmail.com   (password: password123)");
    console.log("=========================================================================\n");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
