export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  size: number
  lastUpdateTime?: number
}

export type Effect = {
  progress: number
  lastUpdateTime?: number
}

export type ParticlePhysicsConfig = {
  gravity: number // Acceleration downward (pixels/frame²)
  airResistance: number // Velocity multiplier per frame (0-1)
  lifeDrain: number // Life reduction per frame (0-1)
  maxCatchupTime: number // Maximum time to catch up in ms (e.g., 2000)
}

export const DEFAULT_CONFIG: ParticlePhysicsConfig = {
  airResistance: 0.9,
  gravity: 0.05,
  lifeDrain: 0.005,
  maxCatchupTime: 5000,
}

export function updateParticlePhysics(
  particle: Particle,
  currentTime: number,
  config: ParticlePhysicsConfig = DEFAULT_CONFIG,
) {
  // Initialize lastUpdateTime if not set
  if (particle.lastUpdateTime === undefined) {
    particle.lastUpdateTime = currentTime
    return particle
  }

  const deltaMs = currentTime - particle.lastUpdateTime

  // If too much time has passed, consider the particle dead
  // This prevents extreme catch-up calculations
  if (deltaMs > config.maxCatchupTime) {
    return null
  }

  // Convert delta to "frames" (assuming 60fps = ~16.67ms per frame)
  const deltaFrames = deltaMs / 16.67

  // Calculate new life first
  const newLife = particle.life - config.lifeDrain * deltaFrames

  // Particle is dead
  if (newLife <= 0) {
    return null
  }

  // For physics calculations, we'll iterate through frames
  // But we can optimize for large deltas using analytical solutions

  let newX = particle.x
  let newY = particle.y
  let newVx = particle.vx
  let newVy = particle.vy

  if (deltaFrames < 10) {
    // Small time delta: iterate frame by frame for accuracy
    for (let i = 0; i < deltaFrames; i++) {
      // Apply velocity
      newX += newVx
      newY += newVy

      // Apply gravity
      newVy += config.gravity

      // Apply air resistance
      newVx *= config.airResistance
      newVy *= config.airResistance
    }
  } else {
    // Large time delta: use analytical approximation
    // This is more efficient and avoids loop iteration

    // For constant acceleration (gravity) and exponential drag (air resistance):
    // Position with drag is complex, so we use a simplified approximation

    // Calculate terminal velocity (where drag = gravity)
    // This gives us a reasonable approximation for large time deltas
    const dragFactor = 1 - config.airResistance

    // Approximate velocity after drag over multiple frames
    // v_final ≈ v_initial * resistance^frames
    const resistanceMultiplier = Math.pow(config.airResistance, deltaFrames)

    // For X: just apply resistance
    newVx = particle.vx * resistanceMultiplier

    // For Y: gravity accumulates, but drag reduces it
    // Simplified: average velocity over the period
    const avgVy = particle.vy + (config.gravity * deltaFrames) / 2
    newVy = (particle.vy + config.gravity * deltaFrames) * resistanceMultiplier

    // Position: integrate average velocity
    newX = particle.x + (particle.vx * (1 - resistanceMultiplier)) / dragFactor
    newY =
      particle.y +
      (avgVy * (1 - resistanceMultiplier)) / dragFactor +
      (config.gravity * deltaFrames * deltaFrames) / 2
  }

  // Update particle with new values
  particle.x = newX
  particle.y = newY
  particle.vx = newVx
  particle.vy = newVy
  particle.life = newLife
  particle.size = newLife // Size correlates with life
  particle.lastUpdateTime = currentTime

  return particle
}

export function updateParticles(
  particles: Particle[],
  currentTime: number,
  config: ParticlePhysicsConfig = DEFAULT_CONFIG,
) {
  const updatedParticles = []
  for (const particle of particles) {
    const p = updateParticlePhysics(particle, currentTime, config)
    if (p) updatedParticles.push(p)
  }
  return updatedParticles
}

export function updateEffect(
  effect: Effect,
  currentTime: number,
  config: ParticlePhysicsConfig = DEFAULT_CONFIG,
) {
  if (effect.lastUpdateTime === undefined) {
    effect.lastUpdateTime = currentTime
    return effect
  }

  const deltaMs = currentTime - effect.lastUpdateTime

  if (deltaMs > config.maxCatchupTime) {
    return null
  }

  const deltaFrames = deltaMs / 16.67

  const progress = effect.progress + config.lifeDrain * deltaFrames

  if (progress >= 1) {
    return null
  }

  effect.progress = progress
  effect.lastUpdateTime = currentTime
  return effect
}
