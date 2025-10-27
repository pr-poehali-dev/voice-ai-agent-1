const USER_ID_KEY = 'poehali_user_id';

function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
    console.log('[USER_ID] Generated new user ID:', userId);
  }
  
  return userId;
}
