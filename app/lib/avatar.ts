export function getAvatarSeed(userId: string, name?: string): string {
  return name || userId;
}

export function getAvatarInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const avatarColors = ["264653", "2a9d8f", "e9c46a", "f4a261", "e76f51"];
