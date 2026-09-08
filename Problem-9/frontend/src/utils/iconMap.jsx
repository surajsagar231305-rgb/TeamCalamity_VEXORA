import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  GraduationCap,
  Activity,
  ShieldCheck,
  Shield,
  CreditCard,
  TrendingUp,
  PieChart,
  Zap,
  Film,
  Home,
  MoreHorizontal,
  DollarSign,
  Briefcase,
  Percent,
  PlusCircle,
  Tag,
  Wallet,
  Building2,
  Receipt,
  HeartPulse,
  Smartphone,
  Landmark
} from 'lucide-react';

const iconMap = {
  'utensils': Utensils,
  'car': Car,
  'shopping-bag': ShoppingBag,
  'graduation-cap': GraduationCap,
  'activity': Activity,
  'shield-check': ShieldCheck,
  'shield': Shield,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  'pie-chart': PieChart,
  'zap': Zap,
  'film': Film,
  'home': Home,
  'more-horizontal': MoreHorizontal,
  'dollar-sign': DollarSign,
  'briefcase': Briefcase,
  'percent': Percent,
  'plus-circle': PlusCircle,
  'tag': Tag,
  'wallet': Wallet,
  'building-2': Building2,
  'receipt': Receipt,
  'heart-pulse': HeartPulse,
  'smartphone': Smartphone,
  'landmark': Landmark
};

export const CategoryIcon = ({ iconName, className = "w-5 h-5", color }) => {
  const IconComponent = iconMap[iconName] || Tag;
  return <IconComponent className={className} style={color ? { color } : {}} />;
};

export const AVAILABLE_ICONS = Object.keys(iconMap);
