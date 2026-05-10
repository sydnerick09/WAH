// lib/auth.js

/* ─────────────────────────────────────────────
   GET ALL USERS
───────────────────────────────────────────── */
export function getUsers() {

  if (typeof window === 'undefined') {
    return [];
  }

  try {

    return JSON.parse(
      localStorage.getItem('bh_users') || '[]'
    );

  } catch {

    return [];

  }
}

/* ─────────────────────────────────────────────
   SAVE USERS
───────────────────────────────────────────── */
export function saveUsers(users) {

  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    'bh_users',
    JSON.stringify(users)
  );
}

/* ─────────────────────────────────────────────
   GET CURRENT USER
───────────────────────────────────────────── */
export function getCurrentUser() {

  if (typeof window === 'undefined') {
    return null;
  }

  try {

    const current =
      localStorage.getItem('bh_current_user');

    if (!current) {
      return null;
    }

    const parsedUser = JSON.parse(current);

    // get fresh updated user
    const users = getUsers();

    const updatedUser = users.find(
      u => u.id === parsedUser.id
    );

    if (!updatedUser) {
      return null;
    }

    // sync latest
    localStorage.setItem(
      'bh_current_user',
      JSON.stringify(updatedUser)
    );

    return updatedUser;

  } catch {

    return null;

  }
}

/* ─────────────────────────────────────────────
   SET CURRENT USER
───────────────────────────────────────────── */
export function setCurrentUser(user) {

  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    'bh_current_user',
    JSON.stringify(user)
  );
}

/* ─────────────────────────────────────────────
   LOGOUT
───────────────────────────────────────────── */
export function logout() {

  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('bh_current_user');
}

/* ─────────────────────────────────────────────
   REGISTER USER
───────────────────────────────────────────── */
export function registerUser({
  fullName,
  email,
  phone,
  country,
  password,
  activated = false,
  premium = false,
  balance = 0,
  referralCount = 0,
  referredBy = null,
}) {

  const users = getUsers();

  // check duplicate email
  const existingUser = users.find(
    u => u.email === email
  );

  if (existingUser) {

    return {
      success: false,
      message: 'Email already registered.',
    };

  }

  // create user
  const newUser = {

    id: Date.now().toString(),

    fullName,
    email,
    phone,
    country,
    password,

    // account
    activated,
    premium,

    // earnings
    balance,

    // referrals
    referralCount,
    referredBy,

    // stats
    completedTasks: 0,
    activeBids: 0,

    // timestamps
    createdAt: new Date().toISOString(),
  };

  // add user
  users.push(newUser);

  /* ─────────────────────────────────────────
     REFERRAL SYSTEM
  ───────────────────────────────────────── */
  if (
    referredBy &&
    referredBy !== newUser.id
  ) {

    const referrerIndex = users.findIndex(
      u => u.id === referredBy
    );

    if (referrerIndex !== -1) {

      users[referrerIndex].referralCount =
        (users[referrerIndex].referralCount || 0) + 1;

      users[referrerIndex].balance =
        (users[referrerIndex].balance || 0) + 70;

    }
  }

  // save all users
  saveUsers(users);

  return {
    success: true,
    user: newUser,
  };
}

/* ─────────────────────────────────────────────
   LOGIN USER
───────────────────────────────────────────── */
export function loginUser({
  email,
  password,
}) {

  const users = getUsers();

  const user = users.find(
    u =>
      u.email === email &&
      u.password === password
  );

  if (!user) {

    return {
      success: false,
      message: 'Invalid email or password.',
    };

  }

  // save session
  setCurrentUser(user);

  return {
    success: true,
    user,
  };
}

/* ─────────────────────────────────────────────
   ACTIVATE USER
───────────────────────────────────────────── */
export function activateUser(userId) {

  const users = getUsers();

  const userIndex = users.findIndex(
    u => u.id === userId
  );

  if (userIndex === -1) {
    return null;
  }

  // activate account
  users[userIndex].activated = true;

  // save users
  saveUsers(users);

  // update logged in user
  setCurrentUser(users[userIndex]);

  return users[userIndex];
}

/* ─────────────────────────────────────────────
   UPGRADE TO PREMIUM
───────────────────────────────────────────── */
export function upgradeToPremium(userId) {

  const users = getUsers();

  const userIndex = users.findIndex(
    u => u.id === userId
  );

  if (userIndex === -1) {
    return null;
  }

  users[userIndex].premium = true;

  saveUsers(users);

  setCurrentUser(users[userIndex]);

  return users[userIndex];
}

/* ─────────────────────────────────────────────
   UPDATE USER BALANCE
───────────────────────────────────────────── */
export function updateUserBalance(
  userId,
  amount
) {

  const users = getUsers();

  const userIndex = users.findIndex(
    u => u.id === userId
  );

  if (userIndex === -1) {
    return null;
  }

  users[userIndex].balance =
    (users[userIndex].balance || 0) + amount;

  saveUsers(users);

  setCurrentUser(users[userIndex]);

  return users[userIndex];
}

/* ─────────────────────────────────────────────
   COMPLETE TASK
───────────────────────────────────────────── */
export function completeTask(
  userId,
  rewardAmount = 0
) {

  const users = getUsers();

  const userIndex = users.findIndex(
    u => u.id === userId
  );

  if (userIndex === -1) {
    return null;
  }

  users[userIndex].completedTasks =
    (users[userIndex].completedTasks || 0) + 1;

  users[userIndex].balance =
    (users[userIndex].balance || 0) + rewardAmount;

  saveUsers(users);

  setCurrentUser(users[userIndex]);

  return users[userIndex];
}

/* ─────────────────────────────────────────────
   CREATE BID
───────────────────────────────────────────── */
export function createBid(userId) {

  const users = getUsers();

  const userIndex = users.findIndex(
    u => u.id === userId
  );

  if (userIndex === -1) {
    return null;
  }

  users[userIndex].activeBids =
    (users[userIndex].activeBids || 0) + 1;

  saveUsers(users);

  setCurrentUser(users[userIndex]);

  return users[userIndex];
}

/* ─────────────────────────────────────────────
   RESET STORAGE (OPTIONAL)
───────────────────────────────────────────── */
export function clearAllUsers() {

  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('bh_users');

  localStorage.removeItem('bh_current_user');
}