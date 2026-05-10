// lib/auth.js

// ─────────────────────────────────────────────
// GET ALL USERS
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// SAVE USERS
// ─────────────────────────────────────────────
export function saveUsers(users) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    'bh_users',
    JSON.stringify(users)
  );
}

// ─────────────────────────────────────────────
// GET CURRENT USER
// Always returns latest updated version
// ─────────────────────────────────────────────
export function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedUser = localStorage.getItem(
      'bh_current_user'
    );

    if (!storedUser) {
      return null;
    }

    const currentUser = JSON.parse(storedUser);

    // Get fresh user from database
    const users = getUsers();

    const updatedUser = users.find(
      u => u.id === currentUser.id
    );

    if (!updatedUser) {
      return null;
    }

    // Sync latest user data
    localStorage.setItem(
      'bh_current_user',
      JSON.stringify(updatedUser)
    );

    return updatedUser;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// SET CURRENT USER
// ─────────────────────────────────────────────
export function setCurrentUser(user) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    'bh_current_user',
    JSON.stringify(user)
  );
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
export function logout() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('bh_current_user');
}

// ─────────────────────────────────────────────
// REGISTER USER
// ─────────────────────────────────────────────
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

  // Check duplicate email
  const existingUser = users.find(
    u => u.email === email
  );

  if (existingUser) {
    return {
      success: false,
      message: 'Email already registered.',
    };
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),

    fullName,
    email,
    phone,
    country,
    password,

    // Account
    activated,
    premium,

    // Money
    balance,

    // Referrals
    referralCount,
    referredBy,

    // Stats
    completedTasks: 0,
    activeBids: 0,

    // Dates
    createdAt: new Date().toISOString(),
  };

  // Save user
  users.push(newUser);

  // ─────────────────────────────────────────
  // HANDLE REFERRALS
  // ─────────────────────────────────────────
  if (
    referredBy &&
    referredBy !== newUser.id
  ) {

    const referrerIndex = users.findIndex(
      u => u.id === referredBy
    );

    if (referrerIndex !== -1) {

      // Increase referrals
      users[referrerIndex].referralCount =
        (users[referrerIndex].referralCount || 0) + 1;

      // Add reward
      users[referrerIndex].balance =
        (users[referrerIndex].balance || 0) + 70;
    }
  }

  // Save all users
  saveUsers(users);

  return {
    success: true,
    user: newUser,
  };
}

// ─────────────────────────────────────────────
// LOGIN USER
// ─────────────────────────────────────────────
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

  // Save logged in user
  setCurrentUser(user);

  return {
    success: true,
    user,
  };
}

// ─────────────────────────────────────────────
// ACTIVATE USER
// ─────────────────────────────────────────────
export function activateUser(userId, amountPaid = 50) {
  if (typeof window === 'undefined') return null;

  const users = getUsers();

  const updatedUsers = users.map(user => {
    if (user.id === userId) {
      user.activated = true;

      // add payment amount to balance
      user.balance = (user.balance || 0) + Number(amountPaid);

      // reward referrer if exists
      if (user.referredBy) {
        const referrer = users.find(u => u.id === user.referredBy);

        if (referrer) {
          referrer.balance = (referrer.balance || 0) + 132;
          referrer.referralCount = (referrer.referralCount || 0) + 1;
        }
      }
    }

    return user;
  });

  localStorage.setItem('bh_users', JSON.stringify(updatedUsers));

  const currentUser = updatedUsers.find(u => u.id === userId);

  if (currentUser) {
    localStorage.setItem('bh_current_user', JSON.stringify(currentUser));
  }

  return currentUser;
}
// ─────────────────────────────────────────────
// UPGRADE TO PREMIUM
// ─────────────────────────────────────────────
export function upgradeToPremium(userId) {

  const users = getUsers();

  const userIndex = users.findIndex(
    u => u.id === userId
  );

  if (userIndex === -1) {
    return false;
  }

  users[userIndex].premium = true;

  saveUsers(users);

  setCurrentUser(users[userIndex]);

  return users[userIndex];
}

// ─────────────────────────────────────────────
// UPDATE USER BALANCE
// ─────────────────────────────────────────────
export function updateUserBalance(
  userId,
  amount
) {

  const users = getUsers();

  const userIndex = users.findIndex(
    u => u.id === userId
  );

  if (userIndex === -1) {
    return false;
  }

  users[userIndex].balance =
    (users[userIndex].balance || 0) + amount;

  saveUsers(users);

  setCurrentUser(users[userIndex]);

  return users[userIndex];
}

// ─────────────────────────────────────────────
// COMPLETE TASK
// ─────────────────────────────────────────────
export function completeTask(
  userId,
  rewardAmount = 0
) {

  const users = getUsers();

  const userIndex = users.findIndex(
    u => u.id === userId
  );

  if (userIndex === -1) {
    return false;
  }

  users[userIndex].completedTasks =
    (users[userIndex].completedTasks || 0) + 1;

  users[userIndex].balance =
    (users[userIndex].balance || 0) + rewardAmount;

  saveUsers(users);

  setCurrentUser(users[userIndex]);

  return users[userIndex];
}

// ─────────────────────────────────────────────
// CREATE BID
// ─────────────────────────────────────────────
export function createBid(userId) {

  const users = getUsers();

  const userIndex = users.findIndex(
    u => u.id === userId
  );

  if (userIndex === -1) {
    return false;
  }

  users[userIndex].activeBids =
    (users[userIndex].activeBids || 0) + 1;

  saveUsers(users);

  setCurrentUser(users[userIndex]);

  return users[userIndex];
}