import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';
import { showCustomAlert } from '../../utils/alert';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showCustomAlert('Validation', 'Name cannot be empty.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone && cleanPhone.length !== 10) {
      showCustomAlert('Invalid Phone Number', 'Phone number must be exactly 10 digits.');
      return;
    }
    setLoading(true);
    await updateProfile({ name: name.trim(), phone: cleanPhone });
    setLoading(false);
    showCustomAlert('✅ Profile Updated', 'Your profile has been updated successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.subtitle}>Update your profile information</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <InputField label="Full Name" icon="👤" value={name} onChangeText={setName} placeholder="Enter your name" />
        <InputField
          label="Email Address"
          icon="📧"
          value={user?.email}
          editable={false}
          placeholder="Email (cannot be changed)"
          style={{ opacity: 0.5 }}
        />
        <InputField
          label="Phone Number"
          icon="📱"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.btnContainer}>
        <TouchableOpacity style={[styles.saveBtn, loading && styles.disabled]} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? 'Saving...' : '💾  Save Changes'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InputField({ label, icon, value, onChangeText, placeholder, keyboardType, editable, style }) {
  return (
    <View style={[styles.fieldContainer, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Text style={styles.fieldIcon}>{icon}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType || 'default'}
          editable={editable !== false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.surface,
    marginBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, color: COLORS.white, fontWeight: '800' },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  form: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.white, marginBottom: 16 },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
  },
  fieldIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: COLORS.white, fontSize: SIZES.base, paddingVertical: 14 },
  btnContainer: { paddingHorizontal: 20, marginTop: 8, gap: 12 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  disabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
  cancelBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelBtnText: { color: COLORS.textSecondary, fontSize: SIZES.base, fontWeight: '600' },
});
