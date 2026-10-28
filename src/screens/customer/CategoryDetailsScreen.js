import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';

export default function CategoryDetailsScreen({ route, navigation }) {
  const { category: initialCategory } = route.params;
  const { transactions, categories, user, updateCategoryBudget } = useApp();

  // Find the reactive category from context
  const category = categories.find((c) => c.id === initialCategory.id) || initialCategory;

  const catTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.categoryId === category.id && t.userId === user?.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, category.id, user]);

  const totalSpent = catTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = catTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const budget = category.budget || 0;
  const budgetUsed = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  // Monthly breakdown
  const monthly = useMemo(() => {
    const map = {};
    catTransactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      if (!map[key]) map[key] = { key, label, expense: 0, income: 0 };
      if (t.type === 'expense') map[key].expense += t.amount;
      else map[key].income += t.amount;
    });
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [catTransactions]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CategoriesMain');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 🌟 Simple Back Arrow Button (Requirement: categories la one click panni ulla pona return back vara oru button kudu like back arrow simple) 🌟 */}
      <View style={styles.topBackBar}>
        <TouchableOpacity style={styles.simpleBackBtn} onPress={handleBack} activeOpacity={0.7}>
          <View style={styles.backCircle}>
            <Text style={styles.simpleBackArrow}>←</Text>
          </View>
          <Text style={styles.simpleBackText}>Back to Categories</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={[styles.hero, { backgroundColor: category.color + '20' }]}>
        <View style={[styles.heroIcon, { backgroundColor: category.color + '30', borderColor: category.color }]}>
          <Text style={styles.heroEmoji}>{category.icon}</Text>
        </View>
        <Text style={styles.heroName}>{category.name}</Text>
        <Text style={styles.heroCount}>{catTransactions.length} transactions recorded</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label="Total Spent" amount={totalSpent} color={COLORS.expense} icon="📉" />
        <StatCard label="Total Income" amount={totalIncome} color={COLORS.income} icon="📈" />
      </View>

      {/* Budget Card with Increment / Decrement controls */}
      <View style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetTitle}>Monthly Budget Limit</Text>
          <Text style={[styles.budgetPct, { color: budgetUsed >= 90 ? COLORS.danger : COLORS.primaryLight }]}>
            {budget > 0 ? `${Math.round(budgetUsed)}%` : 'No Limit'}
          </Text>
        </View>

        <View style={styles.budgetBar}>
          <View
            style={[
              styles.budgetBarFill,
              {
                width: `${budgetUsed}%`,
                backgroundColor: budgetUsed >= 90 ? COLORS.danger : category.color || COLORS.primary,
              },
            ]}
          />
        </View>

        <View style={styles.budgetLabels}>
          <Text style={styles.budgetSub}>Spent: ₹{totalSpent.toLocaleString('en-IN')}</Text>
          <Text style={styles.budgetSub}>Budget: ₹{budget.toLocaleString('en-IN')}</Text>
        </View>

        {/* Budget Increment / Decrement Steppers */}
        <View style={styles.adjustBudgetBox}>
          <Text style={styles.adjustTitle}>Adjust Budget (Increment / Decrement):</Text>
          <View style={styles.adjustBtnRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => updateCategoryBudget(category.id, -1000)}>
              <Text style={styles.adjustBtnText}>-₹1,000</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => updateCategoryBudget(category.id, -500)}>
              <Text style={styles.adjustBtnText}>-₹500</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.adjustBtn, styles.adjustBtnAdd]} onPress={() => updateCategoryBudget(category.id, 500)}>
              <Text style={[styles.adjustBtnText, styles.adjustBtnTextAdd]}>+₹500</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.adjustBtn, styles.adjustBtnAdd]} onPress={() => updateCategoryBudget(category.id, 1000)}>
              <Text style={[styles.adjustBtnText, styles.adjustBtnTextAdd]}>+₹1,000</Text>
            </TouchableOpacity>
          </View>
        </View>

        {budgetUsed >= 90 && budget > 0 && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ Alert: You have used over 90% of this category's budget!</Text>
          </View>
        )}
      </View>

      {/* Monthly Summary */}
      {monthly.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📅 Monthly History</Text>
          {monthly.map((m) => (
            <View key={m.key} style={styles.monthRow}>
              <Text style={styles.monthLabel}>{m.label}</Text>
              <View style={styles.monthAmounts}>
                {m.expense > 0 && (
                  <Text style={[styles.monthAmt, { color: COLORS.expense }]}>-₹{m.expense.toLocaleString('en-IN')}</Text>
                )}
                {m.income > 0 && (
                  <Text style={[styles.monthAmt, { color: COLORS.income }]}>+₹{m.income.toLocaleString('en-IN')}</Text>
                )}
              </View>
            </View>
          ))}
        </>
      )}

      {/* Transaction List */}
      <Text style={styles.sectionTitle}>💳 Transactions ({catTransactions.length})</Text>
      {catTransactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No transactions recorded for this category</Text>
        </View>
      ) : (
        catTransactions.map((txn) => (
          <View key={txn.id} style={styles.txnRow}>
            <View style={[styles.txnDot, { backgroundColor: txn.type === 'income' ? COLORS.income : COLORS.expense }]} />
            <View style={styles.txnInfo}>
              <Text style={styles.txnTitle}>{txn.title}</Text>
              <Text style={styles.txnDate}>
                {new Date(txn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              {txn.note ? <Text style={styles.txnNote}>{txn.note}</Text> : null}
            </View>
            <Text style={[styles.txnAmt, { color: txn.type === 'income' ? COLORS.income : COLORS.expense }]}>
              {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
            </Text>
          </View>
        ))
      )}

      {/* Bottom Simple Back Button */}
      <View style={styles.bottomBackBar}>
        <TouchableOpacity style={styles.bottomBackBtn} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.bottomBackArrow}>←</Text>
          <Text style={styles.bottomBackText}>Back to Categories</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, amount, color, icon }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '40' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statAmount, { color }]}>₹{amount.toLocaleString('en-IN')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  topBackBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  simpleBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.5)',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  backCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleBackArrow: {
    fontSize: 16,
    color: '#A78BFA',
    fontWeight: '900',
    marginTop: -2,
  },
  simpleBackText: {
    fontSize: SIZES.sm,
    color: COLORS.white,
    fontWeight: '800',
  },
  bottomBackBar: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  bottomBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
  },
  bottomBackArrow: {
    fontSize: 18,
    color: COLORS.primaryLight,
    fontWeight: '900',
  },
  bottomBackText: {
    fontSize: SIZES.sm,
    color: COLORS.white,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 10,
  },
  heroEmoji: { fontSize: 34 },
  heroName: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white },
  heroCount: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  statAmount: { fontSize: SIZES.lg, fontWeight: '800', marginTop: 2 },
  budgetCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  budgetTitle: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.white },
  budgetPct: { fontSize: SIZES.base, fontWeight: '800' },
  budgetBar: { height: 8, backgroundColor: COLORS.surfaceLight, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  budgetBarFill: { height: 8, borderRadius: 4 },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  budgetSub: { fontSize: 11, color: COLORS.textMuted },
  adjustBudgetBox: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  adjustTitle: { fontSize: 11, color: COLORS.primaryLight, fontWeight: '700', marginBottom: 8 },
  adjustBtnRow: { flexDirection: 'row', gap: 6 },
  adjustBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  adjustBtnText: { color: '#F87171', fontSize: 11, fontWeight: '700' },
  adjustBtnAdd: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  adjustBtnTextAdd: { color: '#34D399' },
  warningBanner: {
    marginTop: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  warningText: { color: COLORS.danger, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  sectionTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.white, paddingHorizontal: 20, marginBottom: 10 },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  monthLabel: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '600' },
  monthAmounts: { gap: 2, alignItems: 'flex-end' },
  monthAmt: { fontSize: SIZES.sm, fontWeight: '700' },
  emptyBox: { marginHorizontal: 20, padding: 24, backgroundColor: COLORS.surface, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: SIZES.xs },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  txnDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  txnInfo: { flex: 1 },
  txnTitle: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '700' },
  txnDate: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  txnNote: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, fontStyle: 'italic' },
  txnAmt: { fontSize: SIZES.sm, fontWeight: '800' },
});
