export function canEdit(role) {
  return role === 'owner' || role === 'co-owner' || role === 'admin';
}

export function canManageTeam(role) {
  return role === 'owner' || role === 'co-owner';
}

export function canCreateCoOwners(role) {
  return role === 'owner';
}

export function normalizeRoleLabel(role) {
  if (role === 'admin') {
    return 'co-owner';
  }

  return role;
}
