/**
 * Generates a consistent, stable checkpoint ID that works across frontend and backend
 * This is the SINGLE SOURCE OF TRUTH for checkpoint identification
 */
export const getStableCheckpointId = (checkpoint, index = 0) => {
  // First priority: Any explicit ID field
  const explicitId = 
    checkpoint?.checkpointId ?? 
    checkpoint?.id ?? 
    checkpoint?._id;
  
  if (explicitId) {
    return String(explicitId);
  }

  // Second priority: Name-based ID (stable across refreshes)
  const name = checkpoint?.name?.trim();
  if (name) {
    return `CP-${name.replace(/\s+/g, '_')}`;
  }

  // Final fallback: Index-based (least stable, but consistent within session)
  return `CP-${index + 1}`;
};

/**
 * Normalizes all checkpoint data to use consistent IDs
 */
export const normalizeCheckpoints = (checkpoints) => {
  const normalized = {};
  const planLookup = new Map();

  // First pass: Build lookup from plan
  (checkpoints || []).forEach((checkpoint, index) => {
    const stableId = getStableCheckpointId(checkpoint, index);
    planLookup.set(stableId, checkpoint);
    
    // Also map name to stable ID for lookups
    if (checkpoint.name) {
      planLookup.set(checkpoint.name, checkpoint);
    }
    if (checkpoint.id) {
      planLookup.set(checkpoint.id, checkpoint);
    }
    if (checkpoint._id) {
      planLookup.set(checkpoint._id, checkpoint);
    }
    if (checkpoint.checkpointId) {
      planLookup.set(checkpoint.checkpointId, checkpoint);
    }
  });

  return { normalized: Object.fromEntries(planLookup), planLookup };
};