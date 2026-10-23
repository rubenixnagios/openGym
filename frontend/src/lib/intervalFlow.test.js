
import { describe, expect, it } from 'vitest'
import {
  createIntervalFlow,
  isIntervalDone,
  currentIntervalDuration,
  advanceInterval,
  intervalStateFromRoutine,
  completedIntervalExercises,
  INTERVAL_PHASE_WORK,
  INTERVAL_PHASE_REST,
  INTERVAL_PHASE_DONE,
} from './intervalFlow.js'

describe('intervalFlow', () => {
  const config = {
    rounds: 2,
    exerciseCount: 3,
    workSec: 30,
    restSec: 15,
  }

  it('starts with an initial rest before the first exercise', () => {
    const flow = createIntervalFlow(config)

    expect(flow).toMatchObject({
      round: 0,
      exercise: 0,
      phase: INTERVAL_PHASE_REST,
      initialRest: true,
      rounds: 2,
      exerciseCount: 3,
      workSec: 30,
      restSec: 15,
    })

    expect(currentIntervalDuration(flow)).toBe(15)
    expect(isIntervalDone(flow)).toBe(false)
    expect(completedIntervalExercises(flow)).toBe(0)
  })

  it('moves from initial rest to the first work interval', () => {
    const flow = createIntervalFlow(config)
    const next = advanceInterval(flow)

    expect(next).toMatchObject({
      round: 0,
      exercise: 0,
      phase: INTERVAL_PHASE_WORK,
      initialRest: false,
    })

    expect(currentIntervalDuration(next)).toBe(30)
  })

  it('moves from work to rest and then to the next exercise', () => {
    let flow = createIntervalFlow(config)

    flow = advanceInterval(flow) // Initial rest -> work 1
    flow = advanceInterval(flow) // Work 1 -> rest before exercise 2

    expect(flow).toMatchObject({
      round: 0,
      exercise: 1,
      phase: INTERVAL_PHASE_REST,
    })
    expect(completedIntervalExercises(flow)).toBe(1)

    flow = advanceInterval(flow) // Rest -> work 2

    expect(flow).toMatchObject({
      round: 0,
      exercise: 1,
      phase: INTERVAL_PHASE_WORK,
    })
  })

  it('starts the next round after resting following the last exercise', () => {
    let flow = createIntervalFlow({
      rounds: 2,
      exerciseCount: 2,
      workSec: 30,
      restSec: 15,
    })

    flow = advanceInterval(flow) // Initial rest -> work 1
    flow = advanceInterval(flow) // Work 1 -> rest before exercise 2
    flow = advanceInterval(flow) // Rest -> work 2
    flow = advanceInterval(flow) // Work 2 -> rest, next round

    expect(flow).toMatchObject({
      round: 1,
      exercise: 0,
      phase: INTERVAL_PHASE_REST,
    })

    flow = advanceInterval(flow) // Rest -> first work of round 2

    expect(flow).toMatchObject({
      round: 1,
      exercise: 0,
      phase: INTERVAL_PHASE_WORK,
    })
  })

  it('finishes immediately after the final work interval', () => {
    let flow = createIntervalFlow({
      rounds: 1,
      exerciseCount: 2,
      workSec: 30,
      restSec: 15,
    })

    flow = advanceInterval(flow) // Initial rest -> work 1
    flow = advanceInterval(flow) // Work 1 -> rest before exercise 2
    flow = advanceInterval(flow) // Rest -> work 2
    flow = advanceInterval(flow) // Final work -> done

    expect(flow.phase).toBe(INTERVAL_PHASE_DONE)
    expect(isIntervalDone(flow)).toBe(true)
    expect(currentIntervalDuration(flow)).toBe(0)
    expect(completedIntervalExercises(flow)).toBe(2)
  })

  it('allows zero rest', () => {
    let flow = createIntervalFlow({
      rounds: 1,
      exerciseCount: 2,
      workSec: 30,
      restSec: 0,
    })

    flow = advanceInterval(flow) // Initial rest -> work 1
    flow = advanceInterval(flow) // Work 1 -> rest before exercise 2

    expect(flow.phase).toBe(INTERVAL_PHASE_REST)
    expect(currentIntervalDuration(flow)).toBe(0)
  })

  it('does not advance a completed flow', () => {
    const flow = {
      ...createIntervalFlow(config),
      phase: INTERVAL_PHASE_DONE,
    }

    expect(advanceInterval(flow)).toBe(flow)
  })
})

describe('intervalStateFromRoutine', () => {
  it('builds interval state from an interval routine', () => {
    const flow = intervalStateFromRoutine({
      id: 'hiit',
      type: 'interval',
      interval: {
        rounds: 4,
        workSec: 30,
        restSec: 15,
      },
      ex: [
        { id: 'burpees' },
        { id: 'squats' },
        { id: 'pushups' },
      ],
    })

    expect(flow).toMatchObject({
      round: 0,
      exercise: 0,
      phase: INTERVAL_PHASE_REST,
      initialRest: true,
      rounds: 4,
      exerciseCount: 3,
      workSec: 30,
      restSec: 15,
    })
  })

  it('returns null for a normal routine', () => {
    expect(intervalStateFromRoutine({
      id: 'normal',
      ex: [{ id: 'squat' }],
    })).toBeNull()
  })

  it('returns null for an interval routine without exercises', () => {
    expect(intervalStateFromRoutine({
      id: 'empty',
      type: 'interval',
      interval: {
        rounds: 4,
        workSec: 30,
        restSec: 15,
      },
      ex: [],
    })).toBeNull()
  })
})

describe('completedIntervalExercises', () => {
  it('counts completed exercises during work, rest and completion', () => {
    const base = {
      rounds: 4,
      exerciseCount: 3,
    }

    expect(completedIntervalExercises({
      ...base,
      round: 0,
      exercise: 0,
      phase: INTERVAL_PHASE_WORK,
    })).toBe(0)

    expect(completedIntervalExercises({
      ...base,
      round: 0,
      exercise: 1,
      phase: INTERVAL_PHASE_REST,
    })).toBe(1)

    expect(completedIntervalExercises({
      ...base,
      round: 1,
      exercise: 1,
      phase: INTERVAL_PHASE_WORK,
    })).toBe(4)

    expect(completedIntervalExercises({
      ...base,
      round: 1,
      exercise: 2,
      phase: INTERVAL_PHASE_REST,
    })).toBe(5)

    expect(completedIntervalExercises({
      ...base,
      round: 3,
      exercise: 2,
      phase: INTERVAL_PHASE_DONE,
    })).toBe(12)
  })

  it('counts zero completed exercises during the initial rest', () => {
    expect(completedIntervalExercises({
      round: 0,
      exercise: 0,
      phase: INTERVAL_PHASE_REST,
      initialRest: true,
      rounds: 4,
      exerciseCount: 3,
    })).toBe(0)
  })
})
