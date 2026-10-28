import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';
import { showCustomAlert } from '../../utils/alert';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function TransactionScreen() {
  const { transactions, categories, user, addNewTransaction, editTransaction, removeTransaction } = useApp();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [selectedCat, setSelectedCat] = useState('');
  const [note, setNote] = useState('');

  const myTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        t.userId === user?.id &&
        d.getMonth() === selectedMonth &&
        d.getFullYear() === selectedYear
      );
    });
  }, [transactions, selectedMonth, selectedYear, user]);

  const totalIncome = myTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = myTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netMonthBalance = totalIncome - totalExpense;

  const openAddModal = (defaultType = 'expense') => {
    setEditingTxn(null);
    setTitle('');
    setAmount('');
    setType(defaultType);
    setSelectedCat(categories[0]?.id || '');
    setNote('');
    setModalVisible(true);
  };

  const openEditModal = (txn) => {
    setEditingTxn(txn);
    setTitle(txn.title);
    setAmount(String(txn.amount));
    setType(txn.type);
    setSelectedCat(txn.categoryId);
    setNote(txn.note || '');
    setModalVisible(true);
  };

  const adjustAmount = (delta) => {
    const cur = parseFloat(amount) || 0;
    const next = Math.max(0, cur + delta);
    setAmount(next === 0 ? '' : String(next));
  };

  const handleSave = async () => {
    if (!title.trim() || !amount) {
      showCustomAlert('Missing Fields', 'Please enter transaction title and amount.');
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      showCustomAlert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    const txnData = {
      title: title.trim(),
      amount: parsed,
      type,
      categoryId: selectedCat || categories[0]?.id,
      note,
    };
    if (editingTxn) {
      await editTransaction({ ...editingTxn, ...txnData });
    } else {
      await addNewTransaction(txnData);
    }
    setModalVisible(false);
  };

  const handleDelete = (txn) => {
    showCustomAlert('Delete Transaction', `Are you sure you want to delete "${txn.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(txn.id, txn.title) },
    ]);
  };

  const changeMonth = (dir) => {
    let m = selectedMonth + dir;
    let y = selectedYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  return (
    <View style={styles.container}>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{MONTHS[selectedMonth]} {selectedYear}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: COLORS.income + '50' }]}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={[styles.summaryAmount, { color: COLORS.income }]}>+₹{totalIncome.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: COLORS.expense + '50' }]}>
          <Text style={styles.summaryLabel}>Total Expense</Text>
          <Text style={[styles.summaryAmount, { color: COLORS.expense }]}>-₹{totalExpense.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: COLORS.primaryLight + '50' }]}>
          <Text style={styles.summaryLabel}>Net Flow</Text>
          <Text style={[styles.summaryAmount, { color: netMonthBalance >= 0 ? '#34D399' : '#F87171' }]}>
            ₹{netMonthBalance.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Add Buttons Bar */}
      <View style={styles.addBar}>
        <TouchableOpacity style={styles.addExpenseBtn} onPress={() => openAddModal('expense')}>
          <Text style={styles.addExpenseText}>💸 + Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addIncomeBtn} onPress={() => openAddModal('income')}>
          <Text style={styles.addIncomeText}>💰 + Add Income</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <FlatList
        data={myTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No transactions in {MONTHS[selectedMonth]}</Text>
            <Text style={styles.emptySubText}>Tap '+ Add Expense' or '+' button below to record one</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cat = categories.find((c) => c.id === item.categoryId);
          return (
            <TouchableOpacity
              style={styles.txnCard}
              onPress={() => openEditModal(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.txnIconBg, { backgroundColor: (cat?.color || COLORS.primary) + '25' }]}>
                <Text style={styles.txnIcon}>{cat?.icon || '💳'}</Text>
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnTitle}>{item.title}</Text>
                <Text style={styles.txnCat}>
                  {cat?.name || 'General'} • {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
                {item.note ? <Text style={styles.txnNote}>{item.note}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.txnAmount, { color: item.type === 'income' ? COLORS.income : COLORS.expense }]}>
                  {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBadge}>
                  <Text style={styles.deleteBadgeText}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => openAddModal('expense')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add / Edit Transaction Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingTxn ? '✏️ Edit Transaction' : type === 'expense' ? '💸 New Expense' : '💰 New Income'}
            </Text>

            {/* Type Toggle */}
            <View style={styles.typeRow}>
              {['expense', 'income'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    type === t && { backgroundColor: t === 'income' ? COLORS.income : COLORS.expense },
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeBtnText, type === t && { color: COLORS.white }]}>
                    {t === 'income' ? '📈 Income' : '📉 Expense'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Title (e.g. Grocery, Coffee, Electric bill)"
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Stepper & Amount Input (Increment / Decrement) */}
            <View style={styles.amountWrap}>
              <TouchableOpacity style={styles.stepperMiniBtn} onPress={() => adjustAmount(-50)}>
                <Text style={styles.stepperMiniText}>-50</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.modalAmountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.stepperMiniBtn} onPress={() => adjustAmount(50)}>
                <Text style={styles.stepperMiniText}>+50</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Increment Buttons */}
            <View style={styles.quickStepRow}>
              <TouchableOpacity style={styles.quickStepBtn} onPress={() => adjustAmount(-100)}>
                <Text style={styles.quickStepText}>-100</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickStepBtn} onPress={() => adjustAmount(100)}>
                <Text style={styles.quickStepText}>+100</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickStepBtn} onPress={() => adjustAmount(500)}>
                <Text style={styles.quickStepText}>+500</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickStepBtn} onPress={() => adjustAmount(1000)}>
                <Text style={styles.quickStepText}>+1000</Text>
              </TouchableOpacity>
            </View>

            {/* Category picker */}
            <Text style={styles.fieldLabel}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.catChip,
                    selectedCat === c.id && { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight },
                  ]}
                  onPress={() => setSelectedCat(c.id)}
                >
                  <Text style={styles.catChipIcon}>{c.icon}</Text>
                  <Text style={[styles.catChipText, selectedCat === c.id && { color: COLORS.white }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalInput}
              value={note}
              onChangeText={setNote}
              placeholder="Note (optional)"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSave}>
                <Text style={styles.saveModalText}>Save Transaction</Text>
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  arrowBtn: { padding: 8 },
  arrowText: { fontSize: 26, color: COLORS.primaryLight, fontWeight: '700' },
  monthText: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.white },
  summaryRow: { flexDirection: 'row', padding: 14, gap: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  summaryAmount: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  addBar: { flexDirection: 'row', paddingHorizontal: 14, gap: 10, marginBottom: 8 },
  addExpenseBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  addExpenseText: { color: '#F87171', fontWeight: '700', fontSize: SIZES.xs },
  addIncomeBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  addIncomeText: { color: '#34D399', fontWeight: '700', fontSize: SIZES.xs },
  emptyBox: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textSecondary, fontWeight: '700' },
  emptySubText: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  txnIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  txnIcon: { fontSize: 20 },
  txnInfo: { flex: 1 },
  txnTitle: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '700' },
  txnCat: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  txnNote: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontStyle: 'italic' },
  txnAmount: { fontSize: SIZES.base, fontWeight: '800' },
  deleteBadge: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 6 },
  deleteBadgeText: { color: COLORS.danger, fontSize: 10, fontWeight: '800' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  fabText: { fontSize: 32, color: COLORS.white, fontWeight: '400', lineHeight: 34 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white, marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typeBtnText: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '700' },
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
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepperMiniBtn: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  stepperMiniText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  modalAmountInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: SIZES.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  quickStepRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  quickStepBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  quickStepText: { color: COLORS.primaryLight, fontSize: 11, fontWeight: '700' },
  fieldLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  catScroll: { marginBottom: 14 },
  catChip: {
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
  catChipIcon: { fontSize: 14, marginRight: 6 },
  catChipText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 6 },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: SIZES.base },
  saveModalBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  saveModalText: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.base },
});
