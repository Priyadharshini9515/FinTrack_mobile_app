import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';
import { showCustomAlert } from '../../utils/alert';

const REPORT_PERIODS = ['Daily', 'Weekly', 'Monthly'];

export default function CustomerHomeScreen({ navigation }) {
  const { user, transactions, categories, addNewTransaction } = useApp();

  // Quick Add Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [selectedCat, setSelectedCat] = useState('');
  const [note, setNote] = useState('');

  const now = new Date();
  const currentMonthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // User's transactions
  const userTxns = useMemo(() => {
    return transactions.filter((t) => t.userId === user?.id);
  }, [transactions, user]);

  // Monthly filtered transactions
  const filteredTxns = useMemo(() => {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return userTxns.filter((t) => {
      const td = new Date(t.date);
      return td >= monthStart && td <= monthEnd;
    });
  }, [userTxns]);

  const periodIncome = filteredTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const periodExpense = filteredTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const periodBalance = periodIncome - periodExpense;

  // Overall lifetime balance
  const totalIncome = userTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = userTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const overallBalance = totalIncome - totalExpense;

  const openQuickAdd = (defaultType = 'expense') => {
    setType(defaultType);
    setTitle('');
    setAmount('');
    setSelectedCat(categories[0]?.id || '');
    setNote('');
    setModalVisible(true);
  };

  const handleQuickAdd = async () => {
    if (!title.trim() || !amount) {
      showCustomAlert('Missing Info', 'Please enter transaction title and amount.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showCustomAlert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    await addNewTransaction({
      title: title.trim(),
      amount: parsedAmount,
      type,
      categoryId: selectedCat || categories[0]?.id,
      note,
    });
    setModalVisible(false);
  };

  const adjustAmount = (delta) => {
    const cur = parseFloat(amount) || 0;
    const next = Math.max(0, cur + delta);
    setAmount(next === 0 ? '' : String(next));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello,</Text>
            <Text style={styles.userNameText}>{user?.name || 'Customer'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.headerAvatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarEmoji}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceCardTitle}>Total Wallet Balance</Text>
          <Text style={[styles.balanceCardAmount, { color: overallBalance >= 0 ? '#34D399' : '#F87171' }]}>
            ₹{overallBalance.toLocaleString('en-IN')}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceSubLabel}>↓ Total Income</Text>
              <Text style={styles.balanceIncome}>+₹{totalIncome.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceCol}>
              <Text style={styles.balanceSubLabel}>↑ Total Expense</Text>
              <Text style={styles.balanceExpense}>-₹{totalExpense.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.2)' }]} onPress={() => openQuickAdd('expense')}>
            <Text style={styles.actionIcon}>💸</Text>
            <Text style={[styles.actionText, { color: '#F87171' }]}>+ Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.2)' }]} onPress={() => openQuickAdd('income')}>
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={[styles.actionText, { color: '#34D399' }]}>+ Add Income</Text>
          </TouchableOpacity>
        </View>

        {/* Dedicated Monthly Report */}
        <View style={styles.reportSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📅 Monthly Report</Text>
            <View style={styles.periodBadge}>
              <Text style={styles.periodBadgeText}>{currentMonthName}</Text>
            </View>
          </View>

          {/* Monthly Report Card */}
          <View style={styles.reportCard}>
            <Text style={styles.reportPeriodLabel}>{currentMonthName} Summary</Text>
            <View style={styles.reportStatsRow}>
              <View style={styles.reportStatItem}>
                <Text style={styles.reportStatValGreen}>+₹{periodIncome.toLocaleString('en-IN')}</Text>
                <Text style={styles.reportStatDesc}>Income</Text>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportStatItem}>
                <Text style={styles.reportStatValRed}>-₹{periodExpense.toLocaleString('en-IN')}</Text>
                <Text style={styles.reportStatDesc}>Expense</Text>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportStatItem}>
                <Text style={[styles.reportStatVal, { color: periodBalance >= 0 ? '#34D399' : '#F87171' }]}>
                  {periodBalance >= 0 ? '+' : ''}₹{periodBalance.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.reportStatDesc}>Net Saving</Text>
              </View>
            </View>
            <Text style={styles.reportCountText}>{filteredTxns.length} transactions recorded this month</Text>
          </View>
        </View>

        {/* Category Spending Quick View */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>🗂️ Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.seeAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.slice(0, 5).map((cat) => {
            const spent = userTxns
              .filter((t) => t.categoryId === cat.id && t.type === 'expense')
              .reduce((s, t) => s + t.amount, 0);
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.catCard}
                onPress={() => navigation.navigate('Categories', { screen: 'CategoryDetails', params: { category: cat } })}
              >
                <View style={[styles.catIconWrap, { backgroundColor: cat.color + '25' }]}>
                  <Text style={styles.catEmoji}>{cat.icon}</Text>
                </View>
                <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                <Text style={[styles.catSpent, { color: cat.color }]}>₹{spent.toLocaleString('en-IN')}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recent Transactions */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>🕒 Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAllText}>All Transactions →</Text>
          </TouchableOpacity>
        </View>
        {userTxns.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubText}>Tap '+ Add Expense' above to get started</Text>
          </View>
        ) : (
          userTxns.slice(0, 5).map((txn) => {
            const cat = categories.find((c) => c.id === txn.categoryId);
            return (
              <View key={txn.id} style={styles.txnCard}>
                <View style={[styles.txnIconWrap, { backgroundColor: (cat?.color || COLORS.primary) + '25' }]}>
                  <Text style={styles.txnEmoji}>{cat?.icon || '💳'}</Text>
                </View>
                <View style={styles.txnDetails}>
                  <Text style={styles.txnTitle}>{txn.title}</Text>
                  <Text style={styles.txnMeta}>
                    {cat?.name || 'General'} • {new Date(txn.date).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <Text style={[styles.txnAmount, { color: txn.type === 'income' ? COLORS.income : COLORS.expense }]}>
                  {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Quick Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{type === 'expense' ? '💸 Add Expense' : '💰 Add Income'}</Text>

            {/* Type selector */}
            <View style={styles.modalTypeRow}>
              <TouchableOpacity
                style={[styles.modalTypeBtn, type === 'expense' && { backgroundColor: COLORS.expense }]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.modalTypeBtnText, type === 'expense' && { color: COLORS.white }]}>📉 Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalTypeBtn, type === 'income' && { backgroundColor: COLORS.income }]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.modalTypeBtnText, type === 'income' && { color: COLORS.white }]}>📈 Income</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Title (e.g. Dinner, Grocery, Salary)"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Amount with Steppers (Increment/Decrement) */}
            <View style={styles.amountInputWrap}>
              <TextInput
                style={styles.modalAmountInput}
                placeholder="Amount (₹)"
                placeholderTextColor={COLORS.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustAmount(-100)}>
                <Text style={styles.stepperText}>-100</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustAmount(100)}>
                <Text style={styles.stepperText}>+100</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustAmount(500)}>
                <Text style={styles.stepperText}>+500</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustAmount(1000)}>
                <Text style={styles.stepperText}>+1000</Text>
              </TouchableOpacity>
            </View>

            {/* Category selection */}
            <Text style={styles.modalSubLabel}>Select Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalCatScroll}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.modalCatChip, selectedCat === c.id && { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight }]}
                  onPress={() => setSelectedCat(c.id)}
                >
                  <Text style={styles.modalCatChipEmoji}>{c.icon}</Text>
                  <Text style={[styles.modalCatChipText, selectedCat === c.id && { color: COLORS.white }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalInput}
              placeholder="Note (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={note}
              onChangeText={setNote}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleQuickAdd}>
                <Text style={styles.modalSaveText}>Save Transaction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  welcomeText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  userNameText: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white, marginTop: 2 },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  avatarEmoji: { fontSize: 20, color: COLORS.white, fontWeight: '800' },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  balanceCardTitle: { fontSize: SIZES.xs, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  balanceCardAmount: { fontSize: 32, fontWeight: '900', marginVertical: 8 },
  balanceRow: { flexDirection: 'row', paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  balanceCol: { flex: 1 },
  divider: { width: 1, backgroundColor: COLORS.cardBorder, marginHorizontal: 12 },
  balanceSubLabel: { fontSize: 11, color: COLORS.textMuted },
  balanceIncome: { fontSize: SIZES.base, fontWeight: '700', color: '#34D399', marginTop: 2 },
  balanceExpense: { fontSize: SIZES.base, fontWeight: '700', color: '#F87171', marginTop: 2 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 8,
  },
  actionIcon: { fontSize: 18 },
  actionText: { fontSize: SIZES.sm, fontWeight: '700' },
  reportSection: { marginBottom: 20 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.white },
  periodBadge: {
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  periodBadgeText: { fontSize: 11, color: COLORS.primaryGlow, fontWeight: '700' },
  reportCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  reportPeriodLabel: { fontSize: SIZES.xs, color: COLORS.primaryLight, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  reportStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportStatItem: { flex: 1, alignItems: 'center' },
  reportDivider: { width: 1, height: 36, backgroundColor: COLORS.cardBorder },
  reportStatValGreen: { fontSize: SIZES.base, fontWeight: '800', color: '#34D399' },
  reportStatValRed: { fontSize: SIZES.base, fontWeight: '800', color: '#F87171' },
  reportStatVal: { fontSize: SIZES.base, fontWeight: '800' },
  reportStatDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  reportCountText: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 14, fontStyle: 'italic' },
  seeAllText: { fontSize: SIZES.xs, color: COLORS.primaryLight, fontWeight: '700' },
  catScroll: { paddingLeft: 20, marginBottom: 20 },
  catCard: {
    width: 110,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  catIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  catEmoji: { fontSize: 22 },
  catName: { fontSize: 11, color: COLORS.text, fontWeight: '600', marginBottom: 4 },
  catSpent: { fontSize: SIZES.sm, fontWeight: '800' },
  emptyBox: { marginHorizontal: 20, padding: 28, backgroundColor: COLORS.surface, borderRadius: 16, alignItems: 'center' },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: COLORS.textSecondary, fontSize: SIZES.base, fontWeight: '600' },
  emptySubText: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 4 },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  txnIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txnEmoji: { fontSize: 20 },
  txnDetails: { flex: 1 },
  txnTitle: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '700' },
  txnMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  txnAmount: { fontSize: SIZES.base, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white, marginBottom: 16 },
  modalTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  modalTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalTypeBtnText: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '700' },
  modalInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: SIZES.base,
    marginBottom: 10,
  },
  amountInputWrap: { marginBottom: 8 },
  modalAmountInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
  },
  stepperRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stepperBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  stepperText: { color: COLORS.primaryLight, fontSize: 12, fontWeight: '700' },
  modalSubLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  modalCatScroll: { marginBottom: 14 },
  modalCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalCatChipEmoji: { fontSize: 14, marginRight: 6 },
  modalCatChipText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: SIZES.base },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  modalSaveText: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.base },
});
