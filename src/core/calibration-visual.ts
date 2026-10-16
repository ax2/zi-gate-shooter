export type CalibrationBand=0|1|2|3;
/** Presentation ceiling only; calibration damage and rewards remain unbounded. */
export const calibrationVisualBand=(n=0):CalibrationBand=>!Number.isFinite(n)||n<1?0:n>=6?3:n>=3?2:1;
