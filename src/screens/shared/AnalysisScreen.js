import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../theme';
import { showCustomAlert } from '../../utils/alert';

const { width } = Dimensions.get('window');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── SVG Donut Ring for Individual Target Cards ──
function TargetDonutRing({ pct, color = '#38BDF8', size = 78, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(pct, 0), 100);
  const strokeDashoffset = circumference - (circumference * progress) / 100;
  const ringColor = pct >= 90 ? '#EF4444' : pct >= 50 ? '#F59E0B' : color || '#10B981';

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Dynamic Progress Arc */}
        {progress > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>
      <View style={styles.donutTextWrap}>
        <Text style={styles.donutTextVal}>{pct}%</Text>
      </View>
    </View>
  );
}

// ── Multi-Category Donut Chart for My Targets Overview (User Request) ──
function MultiSegmentDonutChart({ targets, totalSpent, totalBudget, overallPct }) {
  const size = 150;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const activeTargets = targets.filter((t) => t.spent > 0);
  let cumulative = 0;

  return (
    <View style={styles.donutOverviewCard}>
      <View style={styles.donutCardHeader}>
        <Text style={styles.donutCardTitle}>🍩 My Targets Donut Chart</Text>
        <Text style={styles.donutCardBadge}>{overallPct}% Used</Text>
      </View>

      <View style={styles.donutContentRow}>
        {/* Donut Graphic */}
        <View style={styles.donutGraphicWrap}>
          <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            {/* Background Track */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Multi Category Segments */}
            {activeTargets.map((t) => {
              const fraction = totalSpent > 0 ? t.spent / totalSpent : 0;
              const sliceLength = circumference * fraction;
              const strokeDasharray = `${sliceLength} ${circumference - sliceLength}`;
              const strokeDashoffset = -cumulative;
              cumulative += sliceLength;

              return (
                <Circle
                  key={t.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={t.color || COLORS.primaryLight}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                />
              );
            })}
          </Svg>

          {/* Center Hole Content */}
          <View style={styles.donutCenterHole}>
            <Text style={styles.donutHoleIcon}>🎯</Text>
            <Text style={styles.donutHoleAmt}>₹{totalSpent.toLocaleString('en-IN')}</Text>
            <Text style={styles.donutHoleSub}>Total Spent</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.donutLegendCol}>
          {targets.slice(0, 4).map((t) => (
            <View key={t.id} style={styles.donutLegendItem}>
              <View style={[styles.donutLegendDot, { backgroundColor: t.color || COLORS.primaryLight }]} />
              <View style={styles.donutLegendTextWrap}>
                <Text style={styles.donutLegendName} numberOfLines={1}>
                  {t.icon} {t.name}
                </Text>
                <Text style={styles.donutLegendVal}>
                  ₹{t.spent.toLocaleString('en-IN')} ({t.pct}%)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function AnalysisScreen() {
  const { transactions, categories, user } = useApp();
  const [selectedDayIdx, setSelectedDayIdx] = useState(null);

  const now = new Date();

  // Strict user isolation: User 1 sees User 1's data; User 2 sees User 2's data; Admin sees all customer data
  const userTxns = useMemo(() => {
    if (user?.role === 'admin') {
      return transactions.filter((t) => t.userId !== null && t.userId !== undefined);
    }
    return transactions.filter((t) => t.userId === user?.id);
  }, [transactions, user]);

  const totalIncome = userTxns
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpense = userTxns
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // Group transactions by Day of the Week (Mon - Sun) for the chart
  const weekDayData = useMemo(() => {
    // Current week starting from Monday
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Mon...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);

    return DAYS.map((dayLabel, index) => {
      const targetDate = new Date(monday.getTime() + index * 86400000);
      const targetDateStr = targetDate.toDateString();

      const dayTxns = userTxns.filter((t) => new Date(t.date).toDateString() === targetDateStr);
      const income = dayTxns
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const expense = dayTxns
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

      return {
        label: dayLabel,
        date: targetDate,
        dateFormatted: targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        income,
        expense,
      };
    });
  }, [userTxns]);

  // Determine max value for the Y-axis scale (15k, 10k, 5k, 1k, 0)
  const maxDayVal = Math.max(
    ...weekDayData.map((d) => Math.max(d.income, d.expense)),
    5000
  );

  // Grid steps: 15k, 10k, 5k, 1k
  const gridSteps = [
    { label: `${Math.round((maxDayVal * 1.0) / 1000)}k`, factor: 1.0 },
    { label: `${Math.round((maxDayVal * 0.66) / 1000)}k`, factor: 0.66 },
    { label: `${Math.round((maxDayVal * 0.33) / 1000)}k`, factor: 0.33 },
    { label: '0k', factor: 0 },
  ];

  // My Targets: dynamically computed so percentage strictly increases whenever money is spent
  const targets = useMemo(() => {
    const list = categories.map((cat) => {
      const catSpent = userTxns
        .filter((t) => t.categoryId === cat.id && t.type === 'expense')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const budget = Number(cat.budget) || 5000;
      // Exact percentage: increases whenever catSpent increases!
      const pct = budget > 0 ? Math.round((catSpent / budget) * 100) : 0;
      return {
        ...cat,
        spent: catSpent,
        budget,
        pct,
      };
    });
    // Put categories that have active spending first
    return list.sort((a, b) => b.spent - a.spent);
  }, [categories, userTxns]);

  const totalBudget = categories.reduce((s, c) => s + (Number(c.budget) || 0), 0);
  const overallSpentPct = totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ── 1. Top Card: Income & Expenses Dual Bar Chart (Figma Screenshot) ── */}
      <View style={styles.chartCard}>
        {/* Card Header with Search and Calendar icons */}
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Income & Expenses</Text>
          <View style={styles.iconButtonRow}>
            <TouchableOpacity
              style={styles.circleIconBtn}
              onPress={() => showCustomAlert('Search', 'Filter by date range or transaction title')}
            >
              <Text style={styles.circleBtnIcon}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleIconBtn}
              onPress={() => showCustomAlert('Calendar', `Current Week: ${weekDayData[0].dateFormatted} - ${weekDayData[6].dateFormatted}`)}
            >
              <Text style={styles.circleBtnIcon}>📅</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart Body with Y-Axis and Dual Bars */}
        <View style={styles.chartArea}>
          {/* Y-Axis Labels & Dashed Lines */}
          <View style={styles.yAxisWrap}>
            {gridSteps.map((step) => (
              <View key={step.label} style={styles.gridLineRow}>
                <Text style={styles.yAxisText}>{step.label}</Text>
                <View style={styles.dashedLine} />
              </View>
            ))}
          </View>

          {/* Bars Container */}
          <View style={styles.barsContainer}>
            {weekDayData.map((d, idx) => {
              const incomeH = maxDayVal > 0 ? Math.max((d.income / maxDayVal) * 140, 6) : 6;
              const expenseH = maxDayVal > 0 ? Math.max((d.expense / maxDayVal) * 140, 6) : 6;
              const isSelected = selectedDayIdx === idx;

              return (
                <TouchableOpacity
                  key={d.label}
                  style={[styles.dayColumn, isSelected && styles.dayColSelected]}
                  onPress={() => setSelectedDayIdx(isSelected ? null : idx)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dualBarWrap}>
                    {/* Teal Bar (Income) */}
                    <View style={[styles.barTeal, { height: incomeH }]} />
                    {/* Blue Bar (Expense) */}
                    <View style={[styles.barBlue, { height: expenseH }]} />
                  </View>
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Breakdown */}
        {selectedDayIdx !== null && (
          <View style={styles.selectedDayBadge}>
            <Text style={styles.selectedDayTitle}>
              {weekDayData[selectedDayIdx].label} ({weekDayData[selectedDayIdx].dateFormatted})
            </Text>
            <View style={styles.selectedDayRow}>
              <Text style={styles.dayIncomeText}>
                ↗ Income: +₹{weekDayData[selectedDayIdx].income.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.dayExpenseText}>
                ↘ Expense: -₹{weekDayData[selectedDayIdx].expense.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── 2. Metric Cards: Income & Expense (Matching Screenshot) ── */}
      <View style={styles.metricRow}>
        {/* Income Card */}
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrapTeal}>
            <Text style={styles.metricArrowTeal}>↗</Text>
          </View>
          <Text style={styles.metricLabel}>Income</Text>
          <Text style={styles.metricValueTeal}>
            ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Expense Card */}
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrapBlue}>
            <Text style={styles.metricArrowBlue}>↘</Text>
          </View>
          <Text style={styles.metricLabel}>Expense</Text>
          <Text style={styles.metricValueBlue}>
            ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* ── 3. Overall Budget Utilization Card ── */}
      <View style={styles.overallBudgetCard}>
        <View style={styles.overallBudgetHeader}>
          <Text style={styles.overallBudgetTitle}>🎯 Total Budget Utilization</Text>
          <Text style={[styles.overallBudgetPct, { color: overallSpentPct >= 90 ? '#EF4444' : '#34D399' }]}>
            {overallSpentPct}% Used
          </Text>
        </View>
        <View style={styles.overallProgressBarTrack}>
          <View
            style={[
              styles.overallProgressBarFill,
              {
                width: `${Math.min(overallSpentPct, 100)}%`,
                backgroundColor: overallSpentPct >= 90 ? '#EF4444' : overallSpentPct >= 60 ? '#FBBF24' : '#10B981',
              },
            ]}
          />
        </View>
        <View style={styles.overallBudgetLabels}>
          <Text style={styles.overallBudgetSpent}>Spent: ₹{totalExpense.toLocaleString('en-IN')}</Text>
          <Text style={styles.overallBudgetTotal}>Budget: ₹{totalBudget.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* ── 4. My Targets Donut Chart Overview (User Request: Donut Chart use panniko analys page la my target ku) ── */}
      <MultiSegmentDonutChart
        targets={targets}
        totalSpent={totalExpense}
        totalBudget={totalBudget}
        overallPct={overallSpentPct}
      />

      {/* ── 5. Category Target Donut Cards (Individual Donut Progress Rings) ── */}
      <View style={styles.targetsHeaderRow}>
        <Text style={styles.sectionHeader}>Category Targets</Text>
        <Text style={styles.targetsSubHeader}>Donut ring fills with spend</Text>
      </View>
      <View style={styles.targetsGrid}>
        {targets.map((tgt) => (
          <TouchableOpacity
            key={tgt.id}
            style={styles.targetCard}
            onPress={() =>
              showCustomAlert(
                `🎯 ${tgt.name} Target`,
                `Amount Spent: ₹${tgt.spent.toLocaleString('en-IN')}\nMonthly Budget: ₹${tgt.budget.toLocaleString('en-IN')}\nDonut Utilization: ${tgt.pct}%`
              )
            }
            activeOpacity={0.8}
          >
            {/* SVG Donut Ring Component */}
            <View style={styles.donutRingWrap}>
              <TargetDonutRing pct={tgt.pct} color={tgt.color} size={78} strokeWidth={8} />
            </View>

            {/* Target Label */}
            <Text style={styles.targetLabel}>{tgt.icon} {tgt.name}</Text>

            {/* Dynamic Progress Bar */}
            <View style={styles.targetProgressBarTrack}>
              <View
                style={[
                  styles.targetProgressBarFill,
                  {
                    width: `${Math.min(tgt.pct, 100)}%`,
                    backgroundColor: tgt.pct >= 90 ? '#EF4444' : tgt.pct >= 50 ? '#FBBF24' : '#10B981',
                  },
                ]}
              />
            </View>

            <Text style={styles.targetSub}>
              ₹{tgt.spent.toLocaleString('en-IN')} / ₹{tgt.budget.toLocaleString('en-IN')}
            </Text>

            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>
                {tgt.pct > 0 ? `+${tgt.pct}% used` : '0% used'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* User Indicator */}
      <View style={styles.userFootnote}>
        <Text style={styles.userFootnoteText}>
          👤 Viewing personal financial analytics for: <Text style={{ color: COLORS.primaryLight, fontWeight: '800' }}>{user?.name || 'Customer'}</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 50 },

  // Top Chart Card (from Screenshot)
  chartCard: {
    margin: 18,
    backgroundColor: '#1C133B',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: SIZES.lg,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  iconButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  circleIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124,58,237,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  circleBtnIcon: {
    fontSize: 14,
  },
  chartArea: {
    height: 190,
    position: 'relative',
    marginTop: 8,
  },
  yAxisWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingBottom: 26,
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisText: {
    width: 30,
    fontSize: 10,
    color: '#8B83A8',
    fontWeight: '700',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.7,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginLeft: 32,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
  },
  dayColSelected: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderRadius: 8,
  },
  dualBarWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: 6,
  },
  // Teal Bar (Income)
  barTeal: {
    width: 9,
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  // Blue/Purple Bar (Expense)
  barBlue: {
    width: 9,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 10,
    color: '#A299C2',
    fontWeight: '700',
    marginTop: 2,
  },
  dayLabelSelected: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  selectedDayBadge: {
    marginTop: 14,
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  selectedDayTitle: {
    fontSize: 11,
    color: COLORS.primaryLight,
    fontWeight: '800',
    marginBottom: 4,
  },
  selectedDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayIncomeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  dayExpenseText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '700',
  },

  // 2. Metric Cards (Income & Expense)
  metricRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 14,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1C133B',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  metricIconWrapTeal: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricArrowTeal: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '900',
  },
  metricIconWrapBlue: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricArrowBlue: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 12,
    color: '#A299C2',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValueTeal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#10B981',
  },
  metricValueBlue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#3B82F6',
  },

  // 3. My Targets Section
  sectionHeader: {
    fontSize: SIZES.lg,
    fontWeight: '800',
    color: COLORS.white,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
  },
  targetCard: {
    width: '47%',
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  ringContainer: {
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  ringOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.85)',
    borderTopColor: '#FFFFFF',
    borderRightColor: '#93C5FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPercentText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  targetLabel: {
    fontSize: SIZES.base,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
  },
  targetSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },

  // Dynamic Progress Bar in Target Cards
  targetProgressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 6,
  },
  targetProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  targetBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  targetBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Overall Budget Card
  overallBudgetCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#1C133B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  overallBudgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  overallBudgetTitle: {
    fontSize: SIZES.sm,
    fontWeight: '800',
    color: COLORS.white,
  },
  overallBudgetPct: {
    fontSize: SIZES.base,
    fontWeight: '900',
  },
  overallProgressBarTrack: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  overallProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  overallBudgetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overallBudgetSpent: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  overallBudgetTotal: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
  },
  targetsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingRight: 20,
  },
  targetsSubHeader: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '700',
  },

  // 🍩 Donut Chart Styles
  donutRingWrap: {
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutTextWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutTextVal: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
  },
  donutOverviewCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#1E143F',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.4)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  donutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  donutCardTitle: {
    fontSize: SIZES.base,
    fontWeight: '800',
    color: COLORS.white,
  },
  donutCardBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
    backgroundColor: 'rgba(16,185,129,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  donutContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  donutGraphicWrap: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenterHole: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutHoleIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  donutHoleAmt: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
  },
  donutHoleSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  donutLegendCol: {
    flex: 1,
    gap: 10,
  },
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  donutLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  donutLegendTextWrap: {
    flex: 1,
  },
  donutLegendName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  donutLegendVal: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  userFootnote: {
    marginHorizontal: 18,
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    alignItems: 'center',
  },
  userFootnoteText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
