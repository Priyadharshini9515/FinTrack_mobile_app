import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';
import { getAllTransactions, getUsers } from '../../utils/storage';

export default function AdminDashboardScreen({ navigation }) {
  const { logout, refreshData } = useApp();
  const [allTxns, setAllTxns] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Auto-reload on screen focus so values are always 100% live and accurate
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [txns, users] = await Promise.all([getAllTransactions(), getUsers()]);
      const validCustomers = (users || []).filter((u) => u.role === 'customer');
      const customerIds = new Set(validCustomers.map((c) => c.id));
      // Strictly customer transactions
      const customerTxns = (txns || []).filter((t) => customerIds.has(t.userId));
      setAllTxns(customerTxns);
      setCustomers(validCustomers);
      if (refreshData) refreshData();
    } catch (e) {
      console.error('Admin loadData error', e);
    }
  };

  // Exact live totals
  const totalIncome = allTxns
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const totalExpense = allTxns
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // Monthly data for last 6 months
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const monthTxns = allTxns.filter((t) => {
        const td = new Date(t.date);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
      });
      const income = monthTxns
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const expense = monthTxns
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      months.push({ key, label, income, expense });
    }
    return months;
  }, [allTxns]);

  const maxVal = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expense)), 1);

  const recentTxns = [...allTxns].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.adminName}>Admin 👑</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <KPICard label="Total Income" amount={totalIncome} color={COLORS.income} icon="📈" />
        <KPICard label="Total Expense" amount={totalExpense} color={COLORS.expense} icon="📉" />
      </View>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Net Balance (All Customers)</Text>
        <Text style={[styles.balanceAmt, { color: (totalIncome - totalExpense) >= 0 ? COLORS.income : COLORS.expense }]}>
          ₹{Math.abs(totalIncome - totalExpense).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.txnCount}>
          {allTxns.length} total transactions across {customers.length} customers
        </Text>
      </View>

      {/* Customer Wise Income & Expenses Breakdown */}
      <Text style={styles.sectionTitle}>Customer Breakdown ({customers.length})</Text>
      <View style={styles.breakdownCard}>
        {customers.length === 0 ? (
          <Text style={styles.emptyCustText}>No customers registered yet.</Text>
        ) : (
          customers.map((cust, idx) => {
            const custTxns = allTxns.filter((t) => t.userId === cust.id);
            const custInc = custTxns
              .filter((t) => t.type === 'income')
              .reduce((s, t) => s + (Number(t.amount) || 0), 0);
            const custExp = custTxns
              .filter((t) => t.type === 'expense')
              .reduce((s, t) => s + (Number(t.amount) || 0), 0);

            return (
              <View key={cust.id} style={[styles.custBreakdownRow, idx > 0 && styles.custBreakdownBorder]}>
                <View style={styles.custHeaderRow}>
                  <Text style={styles.custNameText}>{cust.name}</Text>
                  <Text style={styles.custTxnBadge}>{custTxns.length} txns</Text>
                </View>
                <Text style={styles.custEmailSub}>{cust.email}</Text>
                <View style={styles.custAmountRow}>
                  <View style={styles.custAmountCol}>
                    <Text style={styles.custAmountLabel}>Income</Text>
                    <Text style={styles.custIncomeVal}>+₹{custInc.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.custAmountCol}>
                    <Text style={styles.custAmountLabel}>Expense</Text>
                    <Text style={styles.custExpenseVal}>-₹{custExp.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.custAmountCol}>
                    <Text style={styles.custAmountLabel}>Net</Text>
                    <Text style={[styles.custNetVal, { color: custInc >= custExp ? '#34D399' : '#F87171' }]}>
                      ₹{(custInc - custExp).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Monthly Bar Chart */}
      <Text style={styles.sectionTitle}>6-Month Overview</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.income }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.expense }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>
        <View style={styles.barsRow}>
          {monthlyData.map((m) => (
            <View key={m.key} style={styles.barGroup}>
              <View style={styles.barPair}>
                <View style={[styles.bar, { height: Math.max((m.income / maxVal) * 100, 4), backgroundColor: COLORS.income }]} />
                <View style={[styles.bar, { height: Math.max((m.expense / maxVal) * 100, 4), backgroundColor: COLORS.expense }]} />
              </View>
              <Text style={styles.barLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Nav */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Analysis')}>
          <Text style={styles.quickIcon}>📊</Text>
          <Text style={styles.quickLabel}>Analysis</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.quickIcon}>👥</Text>
          <Text style={styles.quickLabel}>Customers</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {recentTxns.map((txn) => (
        <View key={txn.id} style={styles.txnRow}>
          <View style={[styles.txnDot, { backgroundColor: txn.type === 'income' ? COLORS.income : COLORS.expense }]} />
          <View style={styles.txnInfo}>
            <Text style={styles.txnTitle}>{txn.title}</Text>
            <Text style={styles.txnDate}>{new Date(txn.date).toLocaleDateString('en-IN')}</Text>
          </View>
          <Text style={[styles.txnAmt, { color: txn.type === 'income' ? COLORS.income : COLORS.expense }]}>
            {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function KPICard({ label, amount, color, icon }) {
  return (
    <View style={[styles.kpiCard, { borderColor: color + '40' }]}>
      <Text style={styles.kpiIcon}>{icon}</Text>
      <Text style={[styles.kpiAmount, { color }]}>₹{amount.toLocaleString('en-IN')}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
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
    paddingBottom: 16,
  },
  welcome: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  adminName: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: SIZES.sm },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  kpiIcon: { fontSize: 28, marginBottom: 6 },
  kpiAmount: { fontSize: SIZES.lg, fontWeight: '800' },
  kpiLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 20,
  },
  balanceLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  balanceAmt: { fontSize: SIZES.huge, fontWeight: '800', marginVertical: 4 },
  txnCount: { fontSize: SIZES.xs, color: COLORS.textMuted },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.white, paddingHorizontal: 20, marginBottom: 12 },
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chartLegend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8 },
  barGroup: { flex: 1, alignItems: 'center' },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginBottom: 4 },
  bar: { width: 14, borderRadius: 4 },
  barLabel: { fontSize: 9, color: COLORS.textMuted },
  quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickIcon: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  txnDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  txnInfo: { flex: 1 },
  txnTitle: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '700' },
  txnDate: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  txnAmt: { fontSize: SIZES.sm, fontWeight: '700' },

  // Breakdown Card
  breakdownCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 20,
  },
  emptyCustText: { color: COLORS.textMuted, fontSize: SIZES.xs, textAlign: 'center', paddingVertical: 12 },
  custBreakdownRow: { paddingVertical: 12 },
  custBreakdownBorder: { borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  custBreakdownRow: { paddingVertical: 10 },
  custHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  custNameText: { fontSize: SIZES.sm, fontWeight: '800', color: COLORS.white },
  custTxnBadge: {
    fontSize: 10,
    color: COLORS.primaryGlow,
    backgroundColor: 'rgba(124,58,237,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '700',
  },
  custEmailSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, marginBottom: 8 },
  custAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
  },
  custAmountCol: { alignItems: 'center' },
  custAmountLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: '700' },
  custIncomeVal: { fontSize: 12, fontWeight: '800', color: '#10B981', marginTop: 2 },
  custExpenseVal: { fontSize: 12, fontWeight: '800', color: '#F87171', marginTop: 2 },
  custNetVal: { fontSize: 12, fontWeight: '800', marginTop: 2 },
});
