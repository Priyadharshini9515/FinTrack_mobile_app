import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';
import { getUsers } from '../../utils/storage';
import { showCustomAlert } from '../../utils/alert';

export default function AdminUsersScreen() {
  const { transactions } = useApp();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const allUsers = await getUsers();
    setUsersList(allUsers);
    setLoading(false);
  };

  const handleUserClick = (u) => {
    const userTxns = transactions.filter((t) => t.userId === u.id);
    const spent = userTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const income = userTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

    showCustomAlert(
      `👤 ${u.name} (${u.role.toUpperCase()})`,
      `Email: ${u.email}\nPhone: ${u.phone || 'N/A'}\nTotal Txns: ${userTxns.length}\nIncome: ₹${income.toLocaleString('en-IN')}\nExpenses: ₹${spent.toLocaleString('en-IN')}`
    );
  };

  const customersCount = usersList.filter((u) => u.role === 'customer').length;

  return (
    <View style={styles.container}>
      {/* Overview Cards */}
      <View style={styles.header}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Accounts</Text>
          <Text style={styles.statVal}>{usersList.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Customers</Text>
          <Text style={[styles.statVal, { color: COLORS.primaryLight }]}>{customersCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Admins</Text>
          <Text style={[styles.statVal, { color: '#FBBF24' }]}>
            {usersList.length - customersCount}
          </Text>
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={usersList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const userTxns = transactions.filter((t) => t.userId === item.id);
          const isAdm = item.role === 'admin';

          return (
            <TouchableOpacity style={styles.card} onPress={() => handleUserClick(item)} activeOpacity={0.8}>
              <View style={[styles.avatar, { backgroundColor: isAdm ? '#F59E0B' : COLORS.primary }]}>
                <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={[styles.badge, { backgroundColor: isAdm ? 'rgba(245,158,11,0.2)' : 'rgba(124,58,237,0.2)' }]}>
                    <Text style={[styles.badgeText, { color: isAdm ? '#FBBF24' : COLORS.primaryGlow }]}>
                      {isAdm ? '👑 Admin' : '👤 Customer'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.meta}>
                  📱 {item.phone || 'No phone'} • 💳 {userTxns.length} transactions
                </Text>
              </View>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
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
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, color: COLORS.white, fontWeight: '800' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  email: { fontSize: 11, color: COLORS.textSecondary },
  meta: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  arrowText: { fontSize: 22, color: COLORS.textMuted, paddingLeft: 8 },
});
