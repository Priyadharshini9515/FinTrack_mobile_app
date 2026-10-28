import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, SIZES } from '../theme';
import { showCustomAlert } from '../utils/alert';

// Screens
import HomeScreen from '../screens/auth/HomeScreen';
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import AnalysisScreen from '../screens/shared/AnalysisScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import EditProfileScreen from '../screens/customer/EditProfileScreen';
import TransactionScreen from '../screens/customer/TransactionScreen';
import CategoriesScreen from '../screens/customer/CategoriesScreen';
import CategoryDetailsScreen from '../screens/customer/CategoryDetailsScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const commonScreenOptions = {
  headerStyle: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: '800', fontSize: SIZES.lg },
};

// Hamburger menu button for Drawer toggle
const DrawerToggleBtn = ({ navigation }) => (
  <TouchableOpacity
    onPress={() => navigation.toggleDrawer()}
    style={{ paddingHorizontal: 16, paddingVertical: 8 }}
    activeOpacity={0.7}
  >
    <Text style={{ fontSize: 22, color: COLORS.primaryLight }}>☰</Text>
  </TouchableOpacity>
);

// ──────────────────────────────────────────────
// 1. STACK NAVIGATORS (CategoriesStack & ProfileStack)
// ──────────────────────────────────────────────
function CategoriesStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={commonScreenOptions}>
      <Stack.Screen
        name="CategoriesMain"
        component={CategoriesScreen}
        options={{
          title: 'Categories',
          headerLeft: () => <DrawerToggleBtn navigation={navigation} />,
        }}
      />
      <Stack.Screen
        name="CategoryDetails"
        component={CategoryDetailsScreen}
        options={({ navigation: stackNav, route }) => ({
          title: route.params?.category?.name || 'Category Details',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => stackNav.goBack()}
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 24, color: COLORS.white }}>←</Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function ProfileStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={commonScreenOptions}>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          headerLeft: () => <DrawerToggleBtn navigation={navigation} />,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}

// ──────────────────────────────────────────────
// 2. BOTTOM TABS NAVIGATOR (5 Tabs: Home, Analysis, Transactions, Categories, Profile)
// ──────────────────────────────────────────────
function CustomerTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.cardBorder,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: COLORS.primaryLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        headerStyle: commonScreenOptions.headerStyle,
        headerTintColor: commonScreenOptions.headerTintColor,
        headerTitleStyle: commonScreenOptions.headerTitleStyle,
        tabBarIcon: ({ focused }) => {
          if (route.name === 'Analysis') {
            return (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: focused ? '#10B981' : 'rgba(124,58,237,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: -4,
                  borderWidth: 1.5,
                  borderColor: focused ? '#34D399' : 'rgba(124,58,237,0.4)',
                }}
              >
                <Text style={{ fontSize: 18 }}>📊</Text>
              </View>
            );
          }
          const icons = {
            Home: focused ? '🏠' : '🏡',
            Transactions: '⇄',
            Categories: focused ? '🗂️' : '📂',
            Profile: focused ? '👤' : '👥',
          };
          return <Text style={{ fontSize: 20 }}>{icons[route.name] || '•'}</Text>;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={CustomerHomeScreen}
        options={{
          title: 'Home',
          headerTitle: 'FinTrack Pro',
          headerLeft: () => <DrawerToggleBtn navigation={navigation} />,
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          title: 'Analysis',
          headerTitle: 'Spending Analysis',
          headerLeft: () => <DrawerToggleBtn navigation={navigation} />,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionScreen}
        options={{
          title: 'Transactions',
          headerTitle: 'Monthly Transactions',
          headerLeft: () => <DrawerToggleBtn navigation={navigation} />,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesStack}
        options={{
          title: 'Categories',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// ──────────────────────────────────────────────
// 3. DRAWER CONTENT & NAVIGATOR
// ──────────────────────────────────────────────
function CustomDrawerContent(props) {
  const { user, logout } = useApp();

  const handleLogout = () => {
    showCustomAlert('Logout Confirmation', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: COLORS.surface }}>
      {/* Profile Header */}
      <View style={drawerStyles.userHeader}>
        <View style={drawerStyles.avatar}>
          <Text style={drawerStyles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <Text style={drawerStyles.userName}>{user?.name}</Text>
        <Text style={drawerStyles.userEmail}>{user?.email}</Text>
        <View style={drawerStyles.roleBadge}>
          <Text style={drawerStyles.roleText}>{user?.role === 'admin' ? '👑 Admin' : '👤 Customer'}</Text>
        </View>
      </View>

      <DrawerItemList {...props} />

      <DrawerItem
        label="🚪  Logout"
        onPress={handleLogout}
        labelStyle={{ color: COLORS.danger, fontWeight: '700', fontSize: SIZES.base }}
        style={drawerStyles.logoutItem}
      />
    </DrawerContentScrollView>
  );
}

const drawerStyles = StyleSheet.create({
  userHeader: {
    padding: 22,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    marginBottom: 8,
    alignItems: 'center',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  avatarText: { fontSize: 28, color: COLORS.white, fontWeight: '800' },
  userName: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.white },
  userEmail: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  roleBadge: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  roleText: { fontSize: 11, color: COLORS.primaryGlow, fontWeight: '700' },
  logoutItem: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 12,
  },
});

const drawerOptions = {
  drawerStyle: {
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.cardBorder,
    width: 280,
  },
  drawerActiveTintColor: COLORS.primaryLight,
  drawerInactiveTintColor: COLORS.textSecondary,
  drawerLabelStyle: { fontSize: SIZES.base, fontWeight: '700' },
  drawerActiveBackgroundColor: 'rgba(124,58,237,0.2)',
  headerStyle: commonScreenOptions.headerStyle,
  headerTintColor: commonScreenOptions.headerTintColor,
  headerTitleStyle: commonScreenOptions.headerTitleStyle,
};

function CustomerDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={drawerOptions}
    >
      <Drawer.Screen
        name="DashboardDrawer"
        component={CustomerTabs}
        options={{
          headerShown: false,
          drawerLabel: '🏠  Home & Tabs',
          title: 'Home & Tabs',
        }}
      />
      <Drawer.Screen
        name="AnalysisDirect"
        component={AnalysisScreen}
        options={{
          title: '📊  Analysis',
          drawerLabel: '📊  Analysis Report',
        }}
      />
      <Drawer.Screen
        name="TransactionsDirect"
        component={TransactionScreen}
        options={{
          title: '💳  Transactions',
          drawerLabel: '💳  Transactions',
        }}
      />
      <Drawer.Screen
        name="CategoriesDirect"
        component={CategoriesStack}
        options={{
          headerShown: false,
          drawerLabel: '🗂️  Categories',
        }}
      />
      <Drawer.Screen
        name="ProfileDirect"
        component={ProfileStack}
        options={{
          headerShown: false,
          drawerLabel: '👤  My Profile',
        }}
      />
    </Drawer.Navigator>
  );
}

// ──────────────────────────────────────────────
// 4. ADMIN FLOW (3 Screens: Dashboard, Analysis, Profile showing Total Customers)
// ──────────────────────────────────────────────
function AdminTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.cardBorder,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: COLORS.primaryLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        headerStyle: commonScreenOptions.headerStyle,
        headerTintColor: commonScreenOptions.headerTintColor,
        headerTitleStyle: commonScreenOptions.headerTitleStyle,
        tabBarIcon: ({ focused }) => {
          const icons = {
            Dashboard: focused ? '🏠' : '🏡',
            Analysis: focused ? '📊' : '📉',
            Profile: focused ? '👑' : '👤',
          };
          return <Text style={{ fontSize: 22 }}>{icons[route.name] || '•'}</Text>;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Admin Dashboard',
          headerLeft: () => <DrawerToggleBtn navigation={navigation} />,
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          title: 'Analysis',
          headerTitle: 'Income & Expenses',
          headerLeft: () => <DrawerToggleBtn navigation={navigation} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AdminProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'Total Customers & Profile',
          headerLeft: () => <DrawerToggleBtn navigation={navigation} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AdminDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={drawerOptions}
    >
      <Drawer.Screen
        name="AdminHome"
        component={AdminTabs}
        options={{
          headerShown: false,
          drawerLabel: '🏠  Admin Dashboard',
          title: 'Admin Dashboard',
        }}
      />
      <Drawer.Screen
        name="AdminAnalysisDrawer"
        component={AnalysisScreen}
        options={{
          title: '📊  System Analysis',
          drawerLabel: '📊  System Analysis',
        }}
      />
      <Drawer.Screen
        name="AdminProfileDrawer"
        component={AdminProfileScreen}
        options={{
          title: '👥  Customers & Profile',
          drawerLabel: '👥  Customers & Profile',
        }}
      />
    </Drawer.Navigator>
  );
}

// ──────────────────────────────────────────────
// 5. ROOT NAVIGATOR
// ──────────────────────────────────────────────
export default function AppNavigator() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 50, marginBottom: 14 }}>💜</Text>
        <Text style={{ color: COLORS.white, fontSize: SIZES.xl, fontWeight: '900' }}>FinTrack Pro</Text>
        <Text style={{ color: COLORS.primaryLight, fontSize: SIZES.xs, marginTop: 4 }}>Loading your financial data...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AuthHome" component={HomeScreen} />
        </Stack.Navigator>
      ) : user.role === 'admin' ? (
        <AdminDrawer />
      ) : (
        <CustomerDrawer />
      )}
    </NavigationContainer>
  );
}
