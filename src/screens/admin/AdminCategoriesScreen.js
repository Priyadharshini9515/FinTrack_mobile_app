import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';
import { showCustomAlert } from '../../utils/alert';
import { addCategory } from '../../utils/storage';

const DEFAULT_ICONS = ['🍔', '🚗', '🛍️', '🎬', '💊', '📚', '💡', '💰', '✈️', '🎮', '🏋️', '☕'];
const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F0E68C', '#98FB98', '#A78BFA', '#F472B6'];

export default function AdminCategoriesScreen() {
  const { categories, refreshData, updateCategoryBudget } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🍔');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');

  const handleCreateCategory = async () => {
    if (!name.trim()) {
      showCustomAlert('Missing Name', 'Please enter a category name.');
      return;
    }
    const parsedBudget = parseFloat(budget) || 0;
    await addCategory({
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      budget: parsedBudget,
    });
    await refreshData();
    setModalVisible(false);
    setName('');
    setBudget('');
    showCustomAlert('Category Added', `Category "${name.trim()}" has been created!`);
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Category Management</Text>
          <Text style={styles.headerSub}>{categories.length} Active Categories</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ New Category</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Grid */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: cat.color + '25' }]}>
                <Text style={styles.icon}>{cat.icon}</Text>
              </View>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={[styles.budgetVal, { color: cat.color }]}>
                Budget: ₹{(cat.budget || 0).toLocaleString('en-IN')}
              </Text>
              {/* Quick Budget Increment / Decrement Steppers */}
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => updateCategoryBudget(cat.id, -500)}
                >
                  <Text style={styles.stepText}>-500</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stepBtn, styles.stepBtnAdd]}
                  onPress={() => updateCategoryBudget(cat.id, 500)}
                >
                  <Text style={[styles.stepText, styles.stepTextAdd]}>+500</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>✨ Add New Category</Text>

            <TextInput
              style={styles.input}
              placeholder="Category Name (e.g. Travel, Gym, Coffee)"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Default Monthly Budget (₹)"
              placeholderTextColor={COLORS.textMuted}
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />

            {/* Choose Icon */}
            <Text style={styles.label}>Choose Icon:</Text>
            <View style={styles.iconRow}>
              {DEFAULT_ICONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.iconChoice, selectedIcon === emoji && styles.iconChoiceSelected]}
                  onPress={() => setSelectedIcon(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Choose Color */}
            <Text style={styles.label}>Choose Color:</Text>
            <View style={styles.colorRow}>
              {DEFAULT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorChoice, { backgroundColor: c }, selectedColor === c && styles.colorChoiceSelected]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateCategory}>
                <Text style={styles.saveText}>Save Category</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  scroll: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  iconWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  icon: { fontSize: 26 },
  catName: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '700', textAlign: 'center' },
  budgetVal: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  stepperRow: { flexDirection: 'row', gap: 8, marginTop: 10, width: '100%' },
  stepBtn: {
    flex: 1,
    paddingVertical: 5,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  stepText: { fontSize: 10, color: '#F87171', fontWeight: '700' },
  stepBtnAdd: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  stepTextAdd: { color: '#34D399' },
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
  modalTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.white, marginBottom: 14 },
  input: {
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
  label: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', marginTop: 6, marginBottom: 8 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  iconChoice: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  iconChoiceSelected: { borderColor: COLORS.primaryLight, backgroundColor: COLORS.primary },
  emojiText: { fontSize: 18 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  colorChoice: { width: 28, height: 28, borderRadius: 14 },
  colorChoiceSelected: { borderWidth: 3, borderColor: COLORS.white },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelText: { color: COLORS.textSecondary, fontWeight: '700' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  saveText: { color: COLORS.white, fontWeight: '700' },
});
