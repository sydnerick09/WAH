// lib/auth.js
export function getUsers() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('bh_users') || '[]');
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bh_users', JSON.stringify(users));
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('bh_current_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bh_current_user', JSON.stringify(user));
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bh_current_user');
}

export function registerUser({ fullName, email, phone, country, password }) {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return { success: false, message: 'Email already registered.' };
  }
  const newUser = {
    id: Date.now().toString(),
    fullName,
    email,
    phone,
    country,
    password,
    balance: 0,
    activated: false,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return { success: true, user: newUser };
}

export function loginUser({ email, password }) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return { success: false, message: 'Invalid email or password.' };
  setCurrentUser(user);
  return { success: true, user };
}

export function activateUser(userId) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  users[idx].activated = true;
  users[idx].balance = (users[idx].balance || 0) + 0;
  saveUsers(users);
  setCurrentUser(users[idx]);
  return users[idx];
}

export function updateUserBalance(userId, amount) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  users[idx].balance = (users[idx].balance || 0) + amount;
  saveUsers(users);
  setCurrentUser(users[idx]);
  return users[idx];
}
