import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';
import { showCustomAlert } from '../../utils/alert';

export default function AdminTransactionsScreen() {
  const { transactions, categories, removeTransaction } = useApp();
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      return matchesType && matchesSearch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filterType, searchQuery]);

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleDelete = (txn) => {
    showCustomAlert('Admin Delete', `Are you sure you want to remove "${txn.title}" from system records?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(txn.id, txn.title) },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header Summary */}
      <View style={styles.header}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Transactions</Text>
          <Text style={styles.statVal}>{transactions.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>System Income</Text>
          <Text style={[styles.statVal, { color: COLORS.income }]}>₹{totalIncome.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>System Expense</Text>
          <Text style={[styles.statVal, { color: COLORS.expense }]}>₹{totalExpense.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or note..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['all', 'expense', 'income'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterBtn, filterType === type && styles.filterBtnActive]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
              {type === 'all' ? 'All' : type === 'expense' ? '📉 Expenses' : '📈 Income'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No transactions match your search</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cat = categories.find((c) => c.id === item.categoryId);
          return (
            <View style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: (cat?.color || COLORS.primary) + '25' }]}>
                <Text style={styles.icon}>{cat?.icon || '💳'}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>
                  {cat?.name || 'General'} • {new Date(item.date).toLocaleDateString('en-IN')}
                </Text>
                {item.userId ? (
                  <Text style={styles.userBadge}>User ID: {item.userId.slice(-6)}</Text>
                ) : (
                  <Text style={styles.userBadge}>Default Entry</Text>
                )}
              </View>
              <View style={styles.rightCol}>
                <Text style={[styles.amount, { color: item.type === 'income' ? COLORS.income : COLORS.expense }]}>
                  {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                </Text>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  statVal: { fontSize: SIZES.base, fontWeight: '800', marginTop: 4, color: COLORS.white },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.white, fontSize: SIZES.base, paddingVertical: 10 },
  clearText: { color: COLORS.textMuted, fontSize: 14, paddingHorizontal: 6 },
  filterRow: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, gap: 8 },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight },
  filterText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  filterTextActive: { color: COLORS.white },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: COLORS.textMuted, fontSize: SIZES.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  title: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '700' },
  meta: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  userBadge: { fontSize: 9, color: COLORS.primaryLight, marginTop: 2, fontWeight: '600' },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: SIZES.sm, fontWeight: '800' },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  deleteText: { color: COLORS.danger, fontSize: 10, fontWeight: '700' },
});
