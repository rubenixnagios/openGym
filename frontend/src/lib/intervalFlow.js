
export const INTERVAL_PHASE_WORK = 'work'
export const INTERVAL_PHASE_REST = 'rest'
export const INTERVAL_PHASE_DONE = 'done'

export function createIntervalFlow({
  rounds,
  exerciseCount,
  workSec,
  restSec,
}) {
  return {
    round: 0,
    exercise: 0,
    phase: INTERVAL_PHASE_REST,
    initialRest: true,
    rounds: Math.max(1, Number(rounds) || 1),
    exerciseCount: Math.max(1, Number(exerciseCount) || 1),
    workSec: Math.max(1, Number(workSec) || 1),
    restSec: Math.max(0, Number(restSec) || 0),
  }
}

export function isIntervalDone(flow) {
  return flow?.phase === INTERVAL_PHASE_DONE
}

export function currentIntervalDuration(flow) {
  if (!flow || isIntervalDone(flow)) return 0

  return flow.phase === INTERVAL_PHASE_WORK
    ? flow.workSec
    : flow.restSec
}

export function advanceInterval(flow) {
  if (!flow || isIntervalDone(flow)) return flow

  if (flow.phase === INTERVAL_PHASE_REST) {
    return {
      ...flow,
      phase: INTERVAL_PHASE_WORK,
      initialRest: false,
    }
  }

  const isLastExercise = flow.exercise >= flow.exerciseCount - 1
  const isLastRound = flow.round >= flow.rounds - 1

  // No hi ha descans després de l'últim interval.
  if (isLastExercise && isLastRound) {
    return {
      ...flow,
      phase: INTERVAL_PHASE_DONE,
    }
  }

  // Següent exercici de la mateixa ronda.
  if (!isLastExercise) {
    return {
      ...flow,
      exercise: flow.exercise + 1,
      phase: INTERVAL_PHASE_REST,
      initialRest: false,
    }
  }

  // Primera pausa de la ronda següent.
  return {
    ...flow,
    round: flow.round + 1,
    exercise: 0,
    phase: INTERVAL_PHASE_REST,
    initialRest: false,
  }
}

export function intervalStateFromRoutine(routine) {
  if (!routine || routine.type !== 'interval') return null

  const cfg = routine.interval || {}
  const exerciseCount = Array.isArray(routine.ex)
    ? routine.ex.length
    : 0

  if (!exerciseCount) return null

  return createIntervalFlow({
    rounds: cfg.rounds,
    exerciseCount,
    workSec: cfg.workSec,
    restSec: cfg.restSec,
  })
}

export function completedIntervalExercises(flow) {
  if (!flow) return 0

  if (isIntervalDone(flow)) {
    return flow.rounds * flow.exerciseCount
  }

  return flow.round * flow.exerciseCount + flow.exercise
}
