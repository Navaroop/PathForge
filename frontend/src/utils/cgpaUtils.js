export const GRADE_POINTS = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, P: 4, F: 0, I: 4, 'Ab/R': 0, 'L/AB': 0 };
export const ALL_GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'I', 'Ab/R', 'L/AB'];
export const NORMAL_GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];

export const ABS_THRESHOLDS = [
  { min: 95, grade: 'O', gp: 10 }, { min: 85, grade: 'A+', gp: 9 }, { min: 75, grade: 'A', gp: 8 },
  { min: 65, grade: 'B+', gp: 7 }, { min: 55, grade: 'B', gp: 6 }, { min: 45, grade: 'C', gp: 5 },
  { min: 40, grade: 'P', gp: 4 }, { min: 0, grade: 'F', gp: 0 },
];

export function pctToGrade(pct) {
  for (const t of ABS_THRESHOLDS) if (pct >= t.min) return t;
  return { grade: 'F', gp: 0 };
}

// WGP = ceil( S1×0.30 + S2×0.45 + LE×0.25 )
export function calcWGP(s1Grade, s2Grade, leGrade) {
  const s1 = GRADE_POINTS[s1Grade] ?? 0;
  const s2 = GRADE_POINTS[s2Grade] ?? 0;
  const le = GRADE_POINTS[leGrade] ?? 0;
  const raw = s1 * 0.30 + s2 * 0.45 + le * 0.25;
  return { s1, s2, le, raw: parseFloat(raw.toFixed(4)), wgp: Math.ceil(raw) };
}

// Lab+Theory: Final% = (WGP/10×100×0.70) + (lab×0.30)
export function calcLabTheory(rawWgp, labMarks) {
  // Theory uses RAW wgp (before ceil)
  const theoryPart = (rawWgp / 10) * 100 * 0.70;
  const labPart = labMarks * 0.30;
  const finalPct = theoryPart + labPart;
  // Final GP = finalPct / 10, then CEIL to nearest integer (per university formula)
  const rawGP = finalPct / 10;
  const finalGP = Math.min(10, Math.ceil(rawGP));
  // Map integer GP to grade
  const gpToGrade = { 10: 'O', 9: 'A+', 8: 'A', 7: 'B+', 6: 'B', 5: 'C', 4: 'P', 0: 'F' };
  const grade = gpToGrade[finalGP] || 'F';
  return {
    theoryPart: parseFloat(theoryPart.toFixed(2)),
    labPart: parseFloat(labPart.toFixed(2)),
    finalPct: parseFloat(finalPct.toFixed(2)),
    rawGP: parseFloat(rawGP.toFixed(4)),
    gp: finalGP,
    grade: grade,
  };
}

export function getEffectiveGP(sub) {
  if (['I', 'Ab/R', 'L/AB'].includes(sub.grade)) return GRADE_POINTS[sub.grade] ?? 0;

  // ── Simple mode: user enters final grade directly ──
  if (sub.inputMode === 'simple') {
    const gp = GRADE_POINTS[sub.grade] ?? 0;
    if (sub.labEnabled) return calcLabTheory(gp, Number(sub.labMarks) || 0).gp;
    return gp;
  }

  // ── Detailed mode: S1 + S2 + LE → WGP ──
  let baseGP;
  if (sub.gradingMode === 'absolute') {
    const pct = (Number(sub.maxMarks) || 100) > 0 ? ((Number(sub.marksObtained) || 0) / (Number(sub.maxMarks) || 100)) * 100 : 0;
    baseGP = pctToGrade(pct).gp;
  } else {
    const w = calcWGP(sub.s1Grade || 'O', sub.s2Grade || 'O', sub.leGrade || 'O');
    baseGP = w.raw; // raw (unceiled) for lab+theory formula
  }
  if (sub.labEnabled) return calcLabTheory(baseGP, Number(sub.labMarks) || 0).gp;
  return Math.ceil(baseGP); // ceil WGP when no lab
}

export function getEffectiveGrade(sub) {
  if (['I', 'Ab/R', 'L/AB'].includes(sub.grade)) return sub.grade;

  // ── Simple mode ──
  if (sub.inputMode === 'simple') {
    if (sub.labEnabled) {
      const gp = GRADE_POINTS[sub.grade] ?? 0;
      return calcLabTheory(gp, Number(sub.labMarks) || 0).grade;
    }
    return sub.grade;
  }

  // ── Detailed mode ──
  let baseGP;
  if (sub.gradingMode === 'absolute') {
    const pct = (Number(sub.maxMarks) || 100) > 0 ? ((Number(sub.marksObtained) || 0) / (Number(sub.maxMarks) || 100)) * 100 : 0;
    baseGP = pctToGrade(pct).gp;
  } else {
    baseGP = calcWGP(sub.s1Grade || 'O', sub.s2Grade || 'O', sub.leGrade || 'O').raw;
  }
  if (sub.labEnabled) return calcLabTheory(baseGP, Number(sub.labMarks) || 0).grade;
  const ceiledGP = Math.min(10, Math.ceil(baseGP));
  const gpToGrade = { 10: 'O', 9: 'A+', 8: 'A', 7: 'B+', 6: 'B', 5: 'C', 4: 'P', 0: 'F' };
  return gpToGrade[ceiledGP] || 'F';
}

export function calcGPA(subjects) {
  if (!subjects || subjects.length === 0) return 0;
  const tc = subjects.reduce((s, sub) => s + Number(sub.credits), 0);
  const tg = subjects.reduce((s, sub) => s + Number(sub.credits) * getEffectiveGP(sub), 0);
  return tc === 0 ? 0 : parseFloat((tg / tc).toFixed(2));
}

export function calcCGPA(sems) {
  if (sems.length === 0) return 0;
  const gpas = sems.map(s => calcGPA(s.subjects));
  return parseFloat((gpas.reduce((s, g) => s + g, 0) / gpas.length).toFixed(2));
}
