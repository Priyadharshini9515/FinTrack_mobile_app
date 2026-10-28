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

export default function CategoriesScreen({ navigation }) {
  const { transactions, categories, user } = useApp();

  const myTransactions = transactions.filter(
    (t) => t.userId === user?.id
  );

  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const catTxns = myTransactions.filter((t) => t.categoryId === cat.id);
      const totalSpent = catTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const totalIncome = catTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const count = catTxns.length;
      const progress = cat.budget > 0 ? Math.min(totalSpent / cat.budget, 1) : 0;
      return { ...cat, totalSpent, totalIncome, count, progress };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [transactions, categories, user]);

  const totalBudget = categories.reduce((s, c) => s + (c.budget || 0), 0);
  const totalSpent = categoryStats.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>🗂️ Categories</Text>
        <Text style={styles.subtitle}>Track your spending by category</Text>
      </View>

      {/* Overall Budget Card */}
      <View style={styles.budgetCard}>
        <View style={styles.budgetRow}>
          <View>
            <Text style={styles.budgetLabel}>Total Budget</Text>
            <Text style={styles.budgetAmount}>₹{totalBudget.toLocaleString('en-IN')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.budgetLabel}>Total Spent</Text>
            <Text style={[styles.budgetAmount, { color: COLORS.expense }]}>₹{totalSpent.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <View style={styles.totalBarBg}>
          <View
            style={[
              styles.totalBarFill,
              {
                width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                backgroundColor: totalSpent > totalBudget ? COLORS.danger : COLORS.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.budgetNote}>
          {totalBudget > 0
            ? `${Math.round((totalSpent / totalBudget) * 100)}% of budget used`
            : 'No budget set'}
        </Text>
      </View>

      {/* Category Grid */}
      <Text style={styles.sectionTitle}>All Categories</Text>
      <View style={styles.grid}>
        {categoryStats.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.catCard}
            onPress={() => navigation.navigate('CategoryDetails', { category: cat })}
            activeOpacity={0.8}
          >
            <View style={[styles.catIconBg, { backgroundColor: cat.color + '25' }]}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
            </View>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={[styles.catAmount, { color: cat.color }]}>
              ₹{cat.totalSpent.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.catCount}>{cat.count} transactions</Text>
            {cat.budget > 0 && (
              <>
                <View style={styles.catBarBg}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        width: `${cat.progress * 100}%`,
                        backgroundColor: cat.progress > 0.9 ? COLORS.danger : cat.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.catBudget, { color: cat.progress > 0.9 ? COLORS.danger : COLORS.textMuted }]}>
                  Budget: ₹{cat.budget.toLocaleString('en-IN')}
                </Text>
              </>
            )}
            <View style={styles.catTapHintRow}>
              <Text style={styles.catTapHint}>View details</Text>
              <Text style={styles.catTapArrow}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  budgetCard: {
    margin: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  budgetLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  budgetAmount: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white, marginTop: 4 },
  totalBarBg: { height: 8, backgroundColor: COLORS.surfaceLight, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  totalBarFill: { height: 8, borderRadius: 4 },
  budgetNote: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.white, paddingHorizontal: 20, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12 },
  catCard: {
    width: '46%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  catIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  catIcon: { fontSize: 26 },
  catName: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '700', marginBottom: 4 },
  catAmount: { fontSize: SIZES.lg, fontWeight: '800', marginBottom: 2 },
  catCount: { fontSize: SIZES.xs, color: COLORS.textMuted, marginBottom: 8 },
  catBarBg: { height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  catBarFill: { height: 4, borderRadius: 2 },
  catBudget: { fontSize: SIZES.xs, fontWeight: '600' },
  catTapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  catTapHint: {
    fontSize: 10,
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  catTapArrow: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: '800',
  },
});
