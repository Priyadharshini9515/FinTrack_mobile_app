import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { TextInput } from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';
import { showCustomAlert } from '../../utils/alert';

const BG_IMAGE = require('../../../assets/login_bg.jpg');

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('signin');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Sign Up state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const { login, signup } = useApp();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please enter your email and password.');
      showCustomAlert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoginLoading(true);
    const result = await login(loginEmail.trim().toLowerCase(), loginPassword);
    setLoginLoading(false);

    if (!result.success) {
      setErrorMsg(result.message);
      showCustomAlert('Login Failed', result.message);
    } else {
      setSuccessMsg('Welcome back!');
    }
  };

  const handleSignup = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedName = signupName.trim();
    const trimmedEmail = signupEmail.trim().toLowerCase();
    const trimmedPhone = signupPhone.trim();

    if (!trimmedName) {
      setErrorMsg('Please enter your full name.');
      showCustomAlert('Missing Name', 'Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      showCustomAlert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // 10-digit phone number validation
    if (!trimmedPhone || trimmedPhone.length !== 10 || !/^\d{10}$/.test(trimmedPhone)) {
      setErrorMsg('Phone number must be exactly 10 digits.');
      showCustomAlert('Invalid Phone Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!signupPassword || signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      showCustomAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (signupPassword !== signupConfirm) {
      setErrorMsg('Passwords do not match.');
      showCustomAlert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setSignupLoading(true);
    const result = await signup(trimmedName, trimmedEmail, signupPassword, trimmedPhone);
    setSignupLoading(false);

    if (!result.success) {
      setErrorMsg(result.message);
      showCustomAlert('Signup Failed', result.message);
    } else {
      setSuccessMsg('Account created successfully! Logging you in...');
      showCustomAlert('Success 🎉', `Welcome to FinTrack Pro, ${trimmedName}! Your account has been created.`);
    }
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>💜</Text>
            </View>
            <Text style={styles.appName}>FinTrack </Text>
            <Text style={styles.tagline}>Smart Finance. Smarter You.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Tab Switcher */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'signin' && styles.tabActive]}
                onPress={() => handleTabChange('signin')}
              >
                <Text style={[styles.tabText, activeTab === 'signin' && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'signup' && styles.tabActive]}
                onPress={() => handleTabChange('signup')}
              >
                <Text style={[styles.tabText, activeTab === 'signup' && styles.tabTextActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Error & Success Messages */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>✅  {successMsg}</Text>
              </View>
            ) : null}

            {activeTab === 'signin' ? (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Welcome Back! 👋</Text>
                <Text style={styles.formSubtitle}>Sign in to manage your finances</Text>

                <InputField
                  placeholder="Email Address"
                  icon="📧"
                  value={loginEmail}
                  onChangeText={(t) => { setLoginEmail(t); setErrorMsg(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <InputField
                  placeholder="Password"
                  icon="🔒"
                  value={loginPassword}
                  onChangeText={(t) => { setLoginPassword(t); setErrorMsg(''); }}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[styles.btn, loginLoading && styles.btnDisabled]}
                  onPress={handleLogin}
                  disabled={loginLoading}
                >
                  <Text style={styles.btnText}>{loginLoading ? 'Signing In...' : 'Sign In →'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Create Account ✨</Text>
                <Text style={styles.formSubtitle}>Sign up as Customer to track expenses</Text>

                <InputField
                  placeholder="Full Name"
                  icon="👤"
                  value={signupName}
                  onChangeText={(t) => { setSignupName(t); setErrorMsg(''); }}
                />
                <InputField
                  placeholder="Email Address"
                  icon="📧"
                  value={signupEmail}
                  onChangeText={(t) => { setSignupEmail(t); setErrorMsg(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <InputField
                  placeholder="Phone Number (10 digits)"
                  icon="📱"
                  value={signupPhone}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
                    setSignupPhone(digits);
                    setErrorMsg('');
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
                {signupPhone.length > 0 && signupPhone.length < 10 && (
                  <Text style={styles.charCountText}>{10 - signupPhone.length} more digits needed</Text>
                )}
                <InputField
                  placeholder="Password (min 6 characters)"
                  icon="🔒"
                  value={signupPassword}
                  onChangeText={(t) => { setSignupPassword(t); setErrorMsg(''); }}
                  secureTextEntry
                />
                <InputField
                  placeholder="Confirm Password"
                  icon="🔑"
                  value={signupConfirm}
                  onChangeText={(t) => { setSignupConfirm(t); setErrorMsg(''); }}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[styles.btn, signupLoading && styles.btnDisabled]}
                  onPress={handleSignup}
                  disabled={signupLoading}
                >
                  <Text style={styles.btnText}>{signupLoading ? 'Creating Account...' : 'Create Account →'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

function InputField({ placeholder, icon, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, maxLength }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 10, 30, 0.70)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(124,58,237,0.3)',
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoIcon: { fontSize: 34 },
  appName: {
    fontSize: SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: SIZES.sm,
    color: COLORS.primaryGlow,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'rgba(26,16,53,0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
    overflow: 'hidden',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  tabRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.35)' },
  tabBtn: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: COLORS.primary, backgroundColor: 'rgba(124,58,237,0.15)' },
  tabText: { fontSize: SIZES.base, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.primaryLight, fontWeight: '800' },
  errorBox: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.5)',
  },
  errorText: { color: '#FCA5A5', fontSize: SIZES.xs, fontWeight: '700' },
  successBox: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.5)',
  },
  successText: { color: '#6EE7B7', fontSize: SIZES.xs, fontWeight: '700' },
  form: { padding: 22 },
  formTitle: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  formSubtitle: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginBottom: 20 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: COLORS.white, fontSize: SIZES.base, paddingVertical: 12 },
  charCountText: {
    fontSize: 11,
    color: COLORS.primaryLight,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 6,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700', letterSpacing: 0.5 },
  adminHint: {
    marginTop: 18,
    padding: 12,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.35)',
  },
  hintTitle: { fontSize: SIZES.xs, color: COLORS.primaryLight, fontWeight: '700', marginBottom: 4 },
  hintText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
});
