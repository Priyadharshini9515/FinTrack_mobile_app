import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';
import { getUsers } from '../../utils/storage';
import { showCustomAlert } from '../../utils/alert';

export default function AdminProfileScreen({ navigation }) {
  const { user, logout, transactions, refreshData } = useApp();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-refresh customers whenever Admin Profile comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
      if (refreshData) refreshData();
    }, [])
  );

  const fetchUsers = async () => {
    setLoading(true);
    const users = await getUsers();
    setAllUsers(users || []);
    setLoading(false);
  };

  const customersList = allUsers.filter((u) => u.role === 'customer');
  const totalCustomers = customersList.length;

  const handleLogout = () => {
    showCustomAlert('Logout Confirmation', 'Are you sure you want to exit Admin Panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Admin Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👑</Text>
        </View>
        <Text style={styles.adminName}>{user?.name || 'Admin'}</Text>
        <Text style={styles.adminEmail}>{user?.email || 'admin@finance.com'}</Text>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Master Administrator</Text>
        </View>
      </View>

      {/* 🌟 Total Customers Highlight Card (Requirement: Profile Screen la total customer theriyanum) 🌟 */}
      <View style={styles.highlightCard}>
        <View style={styles.highlightHeader}>
          <Text style={styles.highlightTitle}>👥 Total Customers</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <Text style={styles.totalCustomersNumber}>{totalCustomers}</Text>
        <Text style={styles.highlightSub}>Registered active customers in system</Text>
      </View>

      {/* System Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Accounts</Text>
          <Text style={styles.metricVal}>{allUsers.length}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Transactions</Text>
          <Text style={[styles.metricVal, { color: COLORS.primaryLight }]}>{transactions.length}</Text>
        </View>
      </View>

      {/* Customer Directory List */}
      <View style={styles.directorySection}>
        <Text style={styles.directoryTitle}>Registered Customers List ({totalCustomers})</Text>
        {customersList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No registered customers yet.</Text>
            <Text style={styles.emptySub}>Sign up from Home Screen to register a customer account.</Text>
          </View>
        ) : (
          customersList.map((cust, idx) => {
            const userTxnsCount = transactions.filter((t) => t.userId === cust.id).length;
            return (
              <View key={cust.id} style={styles.customerRow}>
                <View style={styles.custAvatar}>
                  <Text style={styles.custAvatarText}>{cust.name?.charAt(0).toUpperCase() || 'C'}</Text>
                </View>
                <View style={styles.custInfo}>
                  <View style={styles.custNameRow}>
                    <Text style={styles.custName}>{cust.name}</Text>
                    <Text style={styles.custIndex}>#{idx + 1}</Text>
                  </View>
                  <Text style={styles.custEmail}>📧 {cust.email}</Text>
                  <Text style={styles.custPhone}>📱 {cust.phone || 'No phone'}</Text>
                </View>
                <View style={styles.custBadge}>
                  <Text style={styles.custBadgeText}>{userTxnsCount} txns</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Admin Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪  Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 50 },
  header: {
    alignItems: 'center',
    paddingVertical: 26,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarEmoji: { fontSize: 32 },
  adminName: { fontSize: SIZES.xxl, fontWeight: '900', color: COLORS.white },
  adminEmail: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  adminBadge: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  adminBadgeText: { fontSize: 11, color: COLORS.primaryGlow, fontWeight: '800' },

  // Highlight Card for Total Customers
  highlightCard: {
    marginHorizontal: 18,
    marginBottom: 16,
    backgroundColor: '#1E143F',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  highlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightTitle: {
    fontSize: SIZES.base,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    color: '#34D399',
    fontWeight: '800',
  },
  totalCustomersNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#A78BFA',
    marginVertical: 6,
  },
  highlightSub: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: SIZES.xl,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 4,
  },

  // Directory Section
  directorySection: {
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  directoryTitle: {
    fontSize: SIZES.base,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  custAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  custAvatarText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '800',
  },
  custInfo: {
    flex: 1,
  },
  custNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
  },
  custName: {
    fontSize: SIZES.sm,
    color: COLORS.text,
    fontWeight: '800',
  },
  custIndex: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  custEmail: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  custPhone: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  custBadge: {
    backgroundColor: 'rgba(124,58,237,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  custBadgeText: {
    fontSize: 10,
    color: COLORS.primaryGlow,
    fontWeight: '700',
  },

  // Action Buttons
  actionSection: {
    paddingHorizontal: 18,
    gap: 12,
  },
  refreshBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  refreshText: {
    color: COLORS.primaryLight,
    fontSize: SIZES.base,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: SIZES.base,
    fontWeight: '700',
  },
});
