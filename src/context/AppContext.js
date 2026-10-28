import React, { createContext, useContext, useState, useEffect } from 'react';
import { showCustomAlert } from '../utils/alert';
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  getUserByEmail,
  saveUser,
  initializeStorage,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  updateCategory,
} from '../utils/storage';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    await initializeStorage();
    const current = await getCurrentUser();
    if (current) {
      setUser(current);
      await loadUserData(current);
    }
    const cats = await getCategories();
    setCategories(cats);
    setLoading(false);
  };

  const loadUserData = async (u) => {
    if (!u) return;
    const txns = await getTransactions(u.role === 'admin' ? null : u.id);
    setTransactions(txns);
    const cats = await getCategories();
    setCategories(cats);
  };

  const login = async (email, password) => {
    const found = await getUserByEmail(email);
    if (!found) return { success: false, message: 'No account found with this email.' };
    if (found.password !== password) return { success: false, message: 'Incorrect password.' };
    await setCurrentUser(found);
    setUser(found);
    await loadUserData(found);
    return { success: true, user: found };
  };

  const signup = async (name, email, password, phone) => {
    const existing = await getUserByEmail(email);
    if (existing) return { success: false, message: 'Email already registered.' };
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      phone: phone || '',
      role: 'customer',
      avatar: null,
      createdAt: new Date().toISOString(),
    };
    await saveUser(newUser);

    // Create unique starter transactions specifically for this user
    const randomSalary = 25000 + Math.floor(Math.random() * 20000);
    const randomGrocery = 1200 + Math.floor(Math.random() * 1500);
    const randomTravel = 350 + Math.floor(Math.random() * 400);

    const starterTxns = [
      {
        title: 'Monthly Salary',
        amount: randomSalary,
        type: 'income',
        categoryId: 'cat_8',
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
        note: 'Income Deposit',
      },
      {
        title: 'Grocery Mart',
        amount: randomGrocery,
        type: 'expense',
        categoryId: 'cat_1',
        date: new Date(Date.now() - 1 * 86400000).toISOString(),
        note: 'Weekly essentials',
      },
      {
        title: 'Cab Travel',
        amount: randomTravel,
        type: 'expense',
        categoryId: 'cat_2',
        date: new Date().toISOString(),
        note: 'City travel',
      },
    ];

    for (const st of starterTxns) {
      await addTransaction(st, newUser.id);
    }

    await setCurrentUser(newUser);
    setUser(newUser);
    await loadUserData(newUser);
    return { success: true, user: newUser };
  };

  const logout = async () => {
    await clearCurrentUser();
    setUser(null);
    setTransactions([]);
  };

  const updateProfile = async (updates) => {
    const updated = { ...user, ...updates };
    await saveUser(updated);
    await setCurrentUser(updated);
    setUser(updated);
    return updated;
  };

  const addNewTransaction = async (txnData) => {
    const newTxn = await addTransaction(txnData, user.id);
    setTransactions((prev) => [newTxn, ...prev]);
    // Personalized alert
    const cat = categories.find((c) => c.id === txnData.categoryId);
    const catName = cat ? cat.name : 'General';
    if (txnData.type === 'expense') {
      showCustomAlert(
        '💸 Expense Added',
        `₹${txnData.amount.toLocaleString('en-IN')} spent on ${catName}.\nTransaction: "${txnData.title}" recorded successfully!`,
        [{ text: 'OK' }]
      );
    } else {
      showCustomAlert(
        '💰 Income Added',
        `₹${txnData.amount.toLocaleString('en-IN')} received!\nTransaction: "${txnData.title}" recorded successfully!`,
        [{ text: 'Great!' }]
      );
    }
    return newTxn;
  };

  const editTransaction = async (updatedTxn) => {
    await updateTransaction(updatedTxn);
    setTransactions((prev) => prev.map((t) => (t.id === updatedTxn.id ? updatedTxn : t)));
    showCustomAlert('✏️ Transaction Updated', `"${updatedTxn.title}" has been updated successfully.`);
  };

  const removeTransaction = async (txnId, txnTitle) => {
    await deleteTransaction(txnId);
    setTransactions((prev) => prev.filter((t) => t.id !== txnId));
    showCustomAlert('🗑️ Transaction Deleted', `"${txnTitle}" has been removed from your records.`);
  };

  const updateCategoryBudget = async (categoryId, delta) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const newBudget = Math.max(0, (cat.budget || 0) + delta);
    const updated = { ...cat, budget: newBudget };
    await updateCategory(updated);
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? updated : c)));
    showCustomAlert('📊 Budget Updated', `${cat.name} budget is now ₹${newBudget.toLocaleString('en-IN')}`);
  };

  const refreshData = async () => {
    if (user) await loadUserData(user);
    const cats = await getCategories();
    setCategories(cats);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        transactions,
        categories,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        addNewTransaction,
        editTransaction,
        removeTransaction,
        updateCategoryBudget,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
