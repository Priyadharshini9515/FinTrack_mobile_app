import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys
const KEYS = {
  USERS: 'ft_users',
  CURRENT_USER: 'ft_current_user',
  TRANSACTIONS: 'ft_transactions',
  CATEGORIES: 'ft_categories',
};

// Default admin user (hardcoded)
const DEFAULT_ADMIN = {
  id: 'admin_001',
  name: 'Admin',
  email: 'admin@finance.com',
  password: 'Admin@123',
  role: 'admin',
  phone: '9999999999',
  avatar: null,
};

// Default categories
const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: 'Food & Dining', icon: '🍔', color: '#FF6B6B', budget: 5000 },
  { id: 'cat_2', name: 'Transport', icon: '🚗', color: '#4ECDC4', budget: 3000 },
  { id: 'cat_3', name: 'Shopping', icon: '🛍️', color: '#45B7D1', budget: 8000 },
  { id: 'cat_4', name: 'Entertainment', icon: '🎬', color: '#96CEB4', budget: 2000 },
  { id: 'cat_5', name: 'Health', icon: '💊', color: '#FFEAA7', budget: 3000 },
  { id: 'cat_6', name: 'Education', icon: '📚', color: '#DDA0DD', budget: 4000 },
  { id: 'cat_7', name: 'Bills & Utilities', icon: '💡', color: '#F0E68C', budget: 5000 },
  { id: 'cat_8', name: 'Salary', icon: '💰', color: '#98FB98', budget: 0 },
];

// Initialize storage with default data
export const initializeStorage = async () => {
  try {
    const users = await AsyncStorage.getItem(KEYS.USERS);
    if (!users) {
      await AsyncStorage.setItem(KEYS.USERS, JSON.stringify([DEFAULT_ADMIN]));
    } else {
      // Ensure admin is always present
      const parsed = JSON.parse(users);
      const adminExists = parsed.find((u) => u.id === 'admin_001');
      if (!adminExists) {
        await AsyncStorage.setItem(KEYS.USERS, JSON.stringify([DEFAULT_ADMIN, ...parsed]));
      }
    }

    const categories = await AsyncStorage.getItem(KEYS.CATEGORIES);
    if (!categories) {
      await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }

    const transactions = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
    if (!transactions) {
      // Sample transactions
      const sampleTransactions = [
        {
          id: 'txn_1',
          userId: null, // will be set per customer
          title: 'Grocery Shopping',
          amount: 1200,
          type: 'expense',
          categoryId: 'cat_1',
          date: new Date(Date.now() - 86400000).toISOString(),
          note: 'Weekly groceries',
        },
        {
          id: 'txn_2',
          userId: null,
          title: 'Monthly Salary',
          amount: 45000,
          type: 'income',
          categoryId: 'cat_8',
          date: new Date(Date.now() - 2 * 86400000).toISOString(),
          note: 'October salary',
        },
        {
          id: 'txn_3',
          userId: null,
          title: 'Netflix Subscription',
          amount: 649,
          type: 'expense',
          categoryId: 'cat_4',
          date: new Date(Date.now() - 3 * 86400000).toISOString(),
          note: '',
        },
        {
          id: 'txn_4',
          userId: null,
          title: 'Electricity Bill',
          amount: 1850,
          type: 'expense',
          categoryId: 'cat_7',
          date: new Date(Date.now() - 5 * 86400000).toISOString(),
          note: 'October bill',
        },
        {
          id: 'txn_5',
          userId: null,
          title: 'Uber Ride',
          amount: 320,
          type: 'expense',
          categoryId: 'cat_2',
          date: new Date(Date.now() - 1 * 86400000).toISOString(),
          note: 'Office commute',
        },
      ];
      await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(sampleTransactions));
    }
  } catch (e) {
    console.error('Storage init error', e);
  }
};

// ──────────── USER FUNCTIONS ────────────
export const getUsers = async () => {
  const data = await AsyncStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [DEFAULT_ADMIN];
};

export const saveUser = async (user) => {
  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const getUserByEmail = async (email) => {
  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
};

export const getCurrentUser = async () => {
  const data = await AsyncStorage.getItem(KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = async (user) => {
  await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
};

export const clearCurrentUser = async () => {
  await AsyncStorage.removeItem(KEYS.CURRENT_USER);
};

// ──────────── TRANSACTION FUNCTIONS ────────────
export const getTransactions = async (userId) => {
  const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
  const all = data ? JSON.parse(data) : [];
  if (!userId) return all;
  return all.filter((t) => t.userId === userId || t.userId === null);
};

export const getAllTransactions = async () => {
  const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
};

export const addTransaction = async (transaction, userId) => {
  const all = await getAllTransactions();
  const newTxn = { ...transaction, id: `txn_${Date.now()}`, userId, date: new Date().toISOString() };
  all.push(newTxn);
  await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(all));
  return newTxn;
};

export const updateTransaction = async (updatedTxn) => {
  const all = await getAllTransactions();
  const idx = all.findIndex((t) => t.id === updatedTxn.id);
  if (idx >= 0) all[idx] = updatedTxn;
  await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(all));
};

export const deleteTransaction = async (txnId) => {
  const all = await getAllTransactions();
  const filtered = all.filter((t) => t.id !== txnId);
  await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(filtered));
};

// ──────────── CATEGORY FUNCTIONS ────────────
export const getCategories = async () => {
  const data = await AsyncStorage.getItem(KEYS.CATEGORIES);
  return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
};

export const addCategory = async (category) => {
  const cats = await getCategories();
  const newCat = { ...category, id: `cat_${Date.now()}` };
  cats.push(newCat);
  await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats));
  return newCat;
};

// ──────────── ANALYTICS HELPERS ────────────
export const getMonthlyData = (transactions, userId) => {
  const filtered = userId ? transactions.filter((t) => t.userId === userId) : transactions;
  const monthly = {};
  filtered.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
    if (t.type === 'income') monthly[key].income += t.amount;
    else monthly[key].expense += t.amount;
  });
  return monthly;
};
