import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ProfileImages } from '../../assets/images/profile';
import BottomNav from '../../components/BottomNav';
import { useProfileViewModel } from '../../viewmodels/useProfileViewModel';
import { useEffect } from 'react';
import { CircleDollarSign ,Calendar1,ArrowRightLeft, Notebook} from 'lucide-react-native';

interface StatCard {
  id: number;
  value: string;
  label: string;
  backgroundColor: string;
  icon: React.ComponentType<any>;
}

interface PaymentItem {
  _id: string;
  orderRef: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  createdAt: string;
}

const PaymentHistory = () => {
  type ProfileScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'Profile'
  >;
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const {
    paymentHistory,
    paymentStats,
    isLoading,
    loadProfile,
  }: any = useProfileViewModel();

  useEffect(() => {
    loadProfile();
  }, []);

  const statCards: StatCard[] = [
    {
      id: 1,
      value: '$' + String(paymentStats?.totalSpent ?? 0),
      label: 'Total Spent',
      backgroundColor: '#FFF7DD',
      icon: CircleDollarSign,
    },
    {
      id: 2,
      value:'$' + String(paymentStats?.thisMonth ?? 0),
      label: 'This Month',
      backgroundColor: '#FFE8E8',
      icon: Calendar1,
    },
    {
      id: 3,
      value:  String(paymentStats?.totalTransactions ?? 0),
      label: 'Transactions',
      backgroundColor: '#FFE8E8',
      icon: ArrowRightLeft,
    },
    {
      id: 4,
      value: '$' + String(paymentStats?.lastPaymentAmount ?? 0),
      label: 'Last Payment',
      backgroundColor: '#FFF7DD',
      icon: Notebook,
    },
  ];

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPlanName = (planName: string) => {
    if (!planName) return '';
    return planName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'COMPLETED') return '#27AE60';
    if (upperStatus === 'FAILED') return '#e74c3c';
    return '#f4b942';
  };

  const renderPaymentItem = ({ item }: { item: PaymentItem }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.orderRef}>{item.orderRef}</Text>
          <Text style={styles.paymentDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.paymentRight}>
          <Text style={styles.paymentAmount}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status.charAt(0).toUpperCase() +
                item.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.paymentFooter}>
        <Text style={styles.planName}>{formatPlanName(item.plan)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Image
                style={styles.backIcon}
                source={ProfileImages.ArrowIcon1}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment History</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View
              key={stat.id}
              style={[
                styles.statCard,
                { backgroundColor: stat.backgroundColor },
                index % 2 === 0 ? styles.statCardLeft : styles.statCardRight,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#B95E82" />
              ) : (
                <>
                  {(() => {
                    const Icon = stat.icon as React.ComponentType<any> | undefined;
                    return Icon ? <Icon /> : null;
                  })()}
                  {/* <Image source={stat?.icon} style={styles.statIcon} /> */}
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </>
              )}
            </View>
          ))}
        </View>

        {/* Payments List */}
        <View style={styles.paymentsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B95E82" />
            </View>
          ) : paymentHistory && paymentHistory.length > 0 ? (
            <FlatList
              data={paymentHistory}
              renderItem={renderPaymentItem}
              keyExtractor={item => item._id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No payment history found</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNav active="Profile" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 39,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 16,
    height: 16,
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
    marginLeft: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    height: 133,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 19,
    marginBottom: 16,
  },
  statCardLeft: {
    marginRight: '4%',
  },
  statCardRight: {
    marginLeft: 0,
  },
  statIcon: {
    width: 28,
    height: 28,
    marginBottom: 10,
  },
  statValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 28,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 5,
  },
  statLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#000000',
    textAlign: 'center',
  },
  paymentsSection: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    lineHeight: 22,
    color: '#494949',
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  orderRef: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  paymentDate: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B6B6B',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 20,
    color: '#1A1A1A',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    lineHeight: 14,
  },
  paymentFooter: {
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    paddingTop: 12,
  },
  planName: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#6B6B6B',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
  },
  emptyText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
  },
});

export default PaymentHistory;
