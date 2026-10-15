import type { Course, CourseId, Lesson } from './types.ts';

/* Curriculum built from the lesson folders and syllabi in the CFI Drive folder. */

const drive = (id: string | null): string | null =>
  id ? `https://docs.google.com/presentation/d/${id}/edit` : null;

function L(n: number, title: string, o: Partial<Lesson> = {}): Lesson {
  return {
    n,
    title,
    kind: 'lesson',
    topics: '',
    standard: '',
    deck: null,
    draft: false,
    optional: false,
    note: '',
    ...o,
  };
}

interface Shared {
  title: string;
  topics: string;
  standard: string;
}

const CM: Record<string, Shared> = {
  phys: { title: 'Aviation Physiology', topics: 'Vision and night scanning, illusions, disorientation, hypoxia, hyperventilation, decompression sickness, alcohol and drugs', standard: 'Oral quiz' },
  adm: { title: 'ADM, Judgment and CRM/SRM', topics: 'Decision-making process, PIC responsibility, hazardous attitudes, workload, situational awareness, CFIT, automation', standard: 'Oral quiz' },
  far: { title: 'Commercial FARs and NTSB 830', topics: 'Parts 1, 39, 43, 61, 91, 93, 119 and NTSB 830', standard: 'Oral quiz' },
  power: { title: 'High Performance Powerplants', topics: 'Fuel injection, starts, EGT and CHT, abnormal combustion, induction icing, turbocharging, constant-speed props', standard: 'Oral quiz; Ch 11A questions 80% or better' },
  env: { title: 'Environmental and Ice Control Systems', topics: 'Oxygen systems, pressurization, airfoil, windshield and prop ice control', standard: 'Oral quiz; Ch 11B questions 80% or better' },
  gear: { title: 'Retractable Landing Gear', topics: 'Gear systems, speed limits, procedures, malfunctions, emergency extension', standard: 'Oral quiz; Ch 11C questions 80% or better' },
  aero: { title: 'Advanced Aerodynamics', topics: 'Lift, drag, ground effect, load factor, V-g diagram, stability, stalls and spins', standard: 'Oral quiz; Ch 12A questions 80% or better' },
  perf: { title: 'Predicting Performance', topics: 'Density altitude, surface winds, weight, runway conditions, POH performance charts', standard: 'Oral quiz; Ch 12B questions 80% or better' },
  wb: { title: 'Weight and Balance', topics: 'CG limits, computation, graph and table methods, weight shift', standard: 'Oral quiz; Ch 12C questions 80% or better' },
  maxp: { title: 'Maximum Performance Takeoffs and Landings', topics: 'Short-field takeoff and landing, maximum performance climb, combined procedures', standard: 'Oral quiz; Ch 14A questions 80% or better' },
  steep: { title: 'Steep Turns and Chandelles', topics: 'Description and procedure for each maneuver, performance factors, safety', standard: 'Oral quiz; Ch 14B and 14C questions 80% or better' },
  lazy: { title: 'Lazy Eights, Eights-on-Pylons, Steep Spirals, Power-Off 180', topics: 'Description and procedure for each maneuver', standard: 'Oral quiz; Ch 14 sections D to F questions 80% or better' },
  emerg: { title: 'Emergency Procedures', topics: 'Emergency descent, forced landing, in-flight fire, partial power loss, door opening, asymmetric flaps, survival gear', standard: 'Oral quiz; Ch 13A questions 80% or better' },
  cdm: { title: 'Commercial Decision Making', topics: 'CRM and SRM, CFIT, risk and task management, automation, hazardous attitudes, communication, workload', standard: 'Oral quiz; Ch 13B questions 80% or better' },
};

function fromCM(n: number, key: string, o: Partial<Lesson> = {}): Lesson {
  const c = CM[key];
  return L(n, c.title, { topics: c.topics, standard: c.standard, ...o });
}

const PRIVATE: Lesson[] = [
  L(1, 'School Policies and Intro to Human Factors', { deck: drive('17M-1KjipCrFR3hT-aKgbYT6raoBuwSEn4wQGJQeElHc') }),
  L(2, 'Airplane Systems', { deck: drive('1AlQgIdjYxv-bLQmVBhqosil2OMlKuFyOOE5wAvLSBDA') }),
  L(3, 'Aerodynamics', { deck: drive('1FPt02RcKHkvy3dLh7xqC6d5gCVSUU8rrpsQhWH_n0N8') }),
  L(4, 'The Flight Environment: Airspace', { deck: drive('1VXUUL9wMaTnQnZlQxqmN6qey6C2NCe1AWplYxLjTp5c') }),
  L(5, 'Communication', { deck: drive('14mkmI5NNECluzXFly9BVQquRA_VDV3DVJ54PV23-ySY') }),
  L(6, 'Weather Theory', { deck: drive('1TAxjefzjoiDAK4RntBK0ixj9VQCQjNJ7LF-oKGoSMUY') }),
  L(7, 'Weather Products and Forecasting', { deck: drive('1T-EaHWqZOx_9oTdzlMoN7iZFsNPOCiGBnXMbs9X_lK8') }),
  L(8, 'FAR/AIM Tabbing', { deck: drive('135thiHL11kd2Dgqr3OtnfDfQsQkzhptoyHwRvCxNNLA') }),
  L(9, 'Aircraft Performance', { deck: drive('1GJJ7ovw6J_jukR7pTV-qr2xv8v4JRBxkpItwJNS-sJw'), draft: true }),
  L(10, 'Cross Country Flight Planning and Navigation', { deck: drive('1iYi7agZO5uireOmIZX4gL8URXlluARsM5UZnxObPd5Q'), draft: true }),
  L(11, 'Aviation Physiology and ADM', { deck: drive('1Tk_Ppd4XakQe_rAtKAj44E7mDcoaBl3lUbhYkD66YdE'), draft: true }),
];

const INSTRUMENT: Lesson[] = [
  L(1, 'Course Overview, Training Opportunities and Advanced Human Factors', { deck: drive('1TcADcUDMbA-WMmVLWXVDM7k5uKFbUe_SFGhHz2h96b8') }),
  L(2, 'Flight Instrument Systems', { deck: drive('1mGQLDSuloe6eITmVS360JzXPi08oOnqCMTvpADo-rA0') }),
  L(3, 'Attitude Instrument Flying'),
  L(4, 'Instrument Navigation'),
  L(5, 'Instrument Regulations'),
  L(6, 'Airports, Airspace, and Flight Information'),
  L(7, 'The Air Traffic Control System'),
  L(8, 'ATC Clearances'),
  L(9, 'Stage I Exam', { kind: 'exam', standard: 'Score 80% or better, review every miss' }),
  L(10, 'Departure Charts and Procedures'),
  L(11, 'Enroute and Area Charts and Enroute Procedures'),
  L(12, 'Holding Procedures'),
  L(13, 'Arrival Charts and Procedures'),
  L(14, 'Approach Charts'),
  L(15, 'Approach Procedures'),
  L(16, 'VOR and GPS Approaches'),
  L(17, 'ILS Approaches'),
  L(18, 'RNAV Approaches'),
  L(19, 'Stage II Exam', { kind: 'exam', standard: 'Score 80% or better, review every miss' }),
  L(20, 'Weather Factors and Weather Hazards'),
  L(21, 'Printed Reports and Forecasts'),
  L(22, 'Graphic Weather Products'),
  L(23, 'Sources of Weather Information'),
  L(24, 'IFR Emergencies'),
  L(25, 'IFR Decision Making and Flight Planning'),
  L(26, 'Stage III Exam', { kind: 'exam', standard: 'Score 80% or better, review every miss' }),
  L(27, 'End-of-Course Exam', { kind: 'exam', standard: 'Score 80% or better, review every miss' }),
];

const COMM_SINGLE_ADDON: Lesson[] = [
  fromCM(1, 'phys'),
  fromCM(2, 'adm'),
  fromCM(3, 'far'),
  fromCM(4, 'power'),
  fromCM(5, 'env'),
  fromCM(6, 'gear'),
  fromCM(7, 'aero'),
  fromCM(8, 'perf'),
  fromCM(9, 'wb'),
  fromCM(10, 'maxp'),
  fromCM(11, 'steep'),
  fromCM(12, 'lazy'),
  fromCM(13, 'emerg', { note: 'The syllabus lists Ch 13B (Commercial Decision Making) as study material but has no lesson for it.' }),
  L(14, 'End-of-Course Exam', { kind: 'exam', topics: 'Every knowledge area on the FAA commercial airmen knowledge test', standard: 'Score 80% or better, review every miss before the knowledge test' }),
];

const COMM_MULTI_INITIAL: Lesson[] = [
  L(1, 'Airports, Airspace, Weather and Charts Review', { topics: 'Runway markings, LAHSO, lighting, airspace, weather hazards and products, VFR charts', standard: 'Oral quiz; Ch 3A and Ch 9 questions 80% or better', note: 'Students in the combined Instrument/Commercial course skip this review.' }),
  L(2, 'Pilotage, Dead Reckoning and Flight Planning', { topics: 'Checkpoints, navigation log, flight plan, position reports, hazardous terrain', standard: 'Oral quiz' }),
  fromCM(3, 'phys'),
  fromCM(4, 'adm'),
  fromCM(5, 'far'),
  L(6, 'Stage I Exam', { kind: 'exam', topics: 'Lessons 1 to 5', standard: 'Score 80% or better, review every miss' }),
  fromCM(7, 'power'),
  fromCM(8, 'env'),
  fromCM(9, 'gear'),
  fromCM(10, 'aero'),
  fromCM(11, 'perf'),
  fromCM(12, 'wb'),
  fromCM(13, 'maxp'),
  fromCM(14, 'steep'),
  fromCM(15, 'lazy'),
  fromCM(16, 'emerg'),
  fromCM(17, 'cdm'),
  L(18, 'Stage II Exam', { kind: 'exam', topics: 'Ch 11 to 14: powerplants, ice control, gear, aerodynamics, performance, weight and balance, maneuvers, emergencies, decision making', standard: 'Score 80% or better, review every miss' }),
  L(19, 'Commercial End-of-Course Exam', { kind: 'exam', topics: 'Every knowledge area on the FAA commercial airmen knowledge test', standard: 'Score 80% or better, review every miss before the knowledge test' }),
  L(20, 'Multi: Training Program, Human Factors and Normal Operations', { deck: drive('1UF1cEFFXYYVILlAZVUY8U5sXEqzHRL27sS76DRu6mVc'), topics: 'Why a multi-engine rating, PIC, high-altitude physiology, checklists, preflight, short-field takeoff and landing, go-around', standard: 'Oral quiz; Exercise 4A 80% or better' }),
  L(21, 'Multi: Airplane Systems, Weight and Balance, Performance', { deck: drive('1UAl-NOG8qMdZSx_xgAsEM_Ikt9uX32tPlB4WXhz6rRs'), topics: 'Powerplant and airframe systems, props and feathering, weight and balance, engine-out performance penalty, accelerate-stop and accelerate-go, single-engine ceilings', standard: 'Exercises 2A to 2C 80% or better' }),
  L(22, 'Multi: Aerodynamics and Maneuvers', { topics: 'Induced flow, critical engine, Vmc, windmilling prop, feathering, sideslip, controllability vs performance, steep turns, slow flight, stalls, spin awareness', standard: 'Exercises 3A, 3B, 4B 80% or better' }),
  L(23, 'Multi: Engine-Out Operations', { topics: 'Pitch, power, drag; identify, verify, troubleshoot; feathering and restart; takeoff, enroute, landing and go-around engine out; Vmc and drag demonstrations', standard: 'Exercises 5A and 5B 80% or better' }),
  L(24, 'Multi: Instruments and Decision Making', { topics: 'Attitude instrument flying, departure, enroute and engine-out approach, decision-making process, poor judgment chain', standard: 'Exercises 5C and 5D 80% or better' }),
  L(25, 'Multi: Stage Exam (Ch 1 to 5)', { kind: 'exam', topics: 'Operations and systems, aerodynamics, performance, weight and balance, engine-out, multi-engine instruments', standard: 'Score 80% or better, review every miss' }),
  L(26, 'Multi: End-of-Course Exam', { kind: 'exam', topics: 'Operations and systems, aerodynamics, performance, weight and balance, engine-out, multi-engine instruments', standard: 'Score 80% or better, review every miss' }),
];

const COMM_MULTI_ADDON: Lesson[] = [
  L(1, 'Exploring the Multi-Engine Rating, Human Factors and Normal Operations', { topics: 'Training path, human factors, high-altitude physiology, checklists, preflight, short-field takeoff and landing, go-around', standard: 'Oral quiz; Exercise 4A 80% or better' }),
  L(2, 'Aircraft Systems, Weight and Balance, and Performance', { deck: drive('1rVkVth6C_2JByZQAb8t2Z1AtXy8j5K37fboXASFS_BM'), topics: 'Powerplant and airframe systems, weight and balance, accelerate-stop and accelerate-go, single-engine ceilings', standard: 'Exercises 2A to 2C 80% or better', note: 'Deck linked is the Seminole Systems presentation.' }),
  L(3, 'Multi-Engine Aerodynamics and Maneuvers', { deck: drive('1zbywKCeMplXsXo7-cXxr5vW3QMoqKF0nJmtE996b2JY'), topics: 'Boundary layer, induced flow, turning tendencies, steep turns, slow flight, stalls, spin awareness, emergency descent', standard: 'Exercises 3A and 4B 80% or better' }),
  L(4, 'Stage I Exam', { kind: 'exam', topics: 'Ch 1, Ch 2, Ch 3A, Ch 4', standard: 'Score 80% or better, review every miss' }),
  L(5, 'Engine-Out Aerodynamics and Operations', { topics: 'Yaw and roll, critical engine, Vmc, windmilling prop, feathering, sideslip, engine-out takeoff, enroute and landing, decision making, poor judgment chain', standard: 'Exercises 3B, 5A, 5B, 5D 80% or better' }),
  L(6, 'Stage II Exam', { kind: 'exam', topics: 'Stage II material: engine-out aerodynamics and operations', standard: 'Score 80% or better, review every miss' }),
  L(7, 'End-of-Course Exam: VFR', { kind: 'exam', optional: true, topics: 'End-of-course exam, questions 1 to 20', standard: 'Score 80% or better', note: 'For students who are not instrument rated. Skip it when continuing to Stage III.' }),
  L(8, 'Operating on Instruments', { topics: 'Instrument procedures with both engines operating and with one engine inoperative', standard: 'Exercise 5C 80% or better', note: 'Prepare the multi-engine instrument briefings before Flight Lesson 11.' }),
  L(9, 'Stage III Exam', { kind: 'exam', topics: 'Stage III material: multi-engine instrument operations', standard: 'Score 80% or better, review every miss' }),
  L(10, 'End-of-Course Exam', { kind: 'exam', topics: 'End-of-course exam, questions 1 to 25', standard: 'Score 80% or better, review every miss' }),
];

export const COURSES: Record<CourseId, Course> = {
  private: { id: 'private', name: 'Private Pilot', short: 'Private', lessons: PRIVATE },
  instrument: { id: 'instrument', name: 'Instrument Rating', short: 'Instrument', lessons: INSTRUMENT },
  casel: { id: 'casel', name: 'Commercial Single Add-on', short: 'Comm. single add-on', lessons: COMM_SINGLE_ADDON },
  cmi: { id: 'cmi', name: 'Commercial Multi Initial', short: 'Comm. multi initial', lessons: COMM_MULTI_INITIAL },
  camel: { id: 'camel', name: 'Commercial Multi Add-on', short: 'Comm. multi add-on', lessons: COMM_MULTI_ADDON },
};

export const COURSE_ORDER: CourseId[] = ['private', 'instrument', 'casel', 'cmi', 'camel'];

export const RATING_LABEL: Record<number, string> = {
  1: 'Shaky',
  2: 'Needs review',
  3: 'Proficient',
  4: 'Test-ready',
};
