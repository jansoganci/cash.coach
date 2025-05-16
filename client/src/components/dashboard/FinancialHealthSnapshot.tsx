import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertCircle, Check } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface FinancialHealthSnapshotProps {
  className?: string;
}

const FinancialHealthSnapshot: React.FC<FinancialHealthSnapshotProps> = ({ className }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  
  // Fetch financial health data
  const { data: healthData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/financial-health'],
    refetchOnWindowFocus: false,
  });

  // Calculate financial health score (0-100)
  const calculateHealthScore = () => {
    if (!healthData) return 0;
    
    // Basic calculation based on various factors
    const {
      debtToIncomeRatio = 0,
      savingsRate = 0,
      emergencyFundStatus = 0,
      expenseRatio = 0,
      investmentDiversity = 0
    } = healthData;
    
    // Lower debt-to-income is better (weight: 25%)
    const debtScore = Math.max(0, 100 - (debtToIncomeRatio * 100)) * 0.25;
    
    // Higher savings rate is better (weight: 20%)
    const savingsScore = Math.min(100, savingsRate * 200) * 0.20;
    
    // Emergency fund status (0-1) (weight: 25%)
    const emergencyScore = emergencyFundStatus * 100 * 0.25;
    
    // Lower expense ratio is better (weight: 15%)
    const expenseScore = Math.max(0, 100 - (expenseRatio * 100)) * 0.15;
    
    // Investment diversity (0-1) (weight: 15%)
    const diversityScore = investmentDiversity * 100 * 0.15;
    
    // Total score
    return Math.round(debtScore + savingsScore + emergencyScore + expenseScore + diversityScore);
  };

  // Get health status label and color based on score
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: t('financialHealth.excellent'), color: 'text-green-600', icon: Check };
    if (score >= 60) return { label: t('financialHealth.good'), color: 'text-emerald-500', icon: TrendingUp };
    if (score >= 40) return { label: t('financialHealth.fair'), color: 'text-amber-500', icon: TrendingDown };
    return { label: t('financialHealth.needsWork'), color: 'text-red-500', icon: AlertCircle };
  };

  // Get appropriate recommendations based on health score
  const getRecommendations = (healthData: any) => {
    if (!healthData) return [];
    
    const recommendations = [];
    
    if (healthData.debtToIncomeRatio > 0.36) {
      recommendations.push(t('financialHealth.recommendations.reduceDti'));
    }
    
    if (healthData.savingsRate < 0.15) {
      recommendations.push(t('financialHealth.recommendations.increaseSavings'));
    }
    
    if (healthData.emergencyFundStatus < 0.5) {
      recommendations.push(t('financialHealth.recommendations.buildEmergencyFund'));
    }
    
    if (healthData.expenseRatio > 0.7) {
      recommendations.push(t('financialHealth.recommendations.reduceExpenses'));
    }
    
    if (recommendations.length === 0) {
      recommendations.push(t('financialHealth.recommendations.onTrack'));
    }
    
    return recommendations;
  };

  const score = calculateHealthScore();
  const status = getHealthStatus(score);
  const StatusIcon = status.icon;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardTitle>
          <CardDescription><Skeleton className="h-4 w-32" /></CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-16 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-4/5 mb-1" />
          <Skeleton className="h-4 w-3/5 mb-3" />
          <Skeleton className="h-9 w-full rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('financialHealth.title')}</CardTitle>
          <CardDescription>{t('financialHealth.error')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline" className="w-full">
            {t('common.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          {t('financialHealth.title')}
          <div className={`p-1.5 rounded-full ${score >= 60 ? 'bg-green-100' : score >= 40 ? 'bg-amber-100' : 'bg-red-100'}`}>
            <StatusIcon className={`h-5 w-5 ${status.color}`} />
          </div>
        </CardTitle>
        <CardDescription>{t('financialHealth.snapshot')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{t('financialHealth.score')}</span>
          <span className="text-sm font-semibold">{score}/100 - <span className={status.color}>{status.label}</span></span>
        </div>
        
        <Progress value={score} className="h-2 mb-4" />
        
        <div className="space-y-3 mb-4">
          {healthData && (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">{t('financialHealth.debtToIncome')}</p>
                  <p className="font-semibold">{Math.round(healthData.debtToIncomeRatio * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('financialHealth.savingsRate')}</p>
                  <p className="font-semibold">{Math.round(healthData.savingsRate * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('financialHealth.emergencyFund')}</p>
                  <p className="font-semibold">{Math.round(healthData.emergencyFundStatus * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('financialHealth.investmentDiversity')}</p>
                  <p className="font-semibold">{Math.round(healthData.investmentDiversity * 100)}%</p>
                </div>
              </div>
            </>
          )}
        </div>
        
        {healthData && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">{t('financialHealth.recommendations.title')}</h4>
            <ul className="text-sm space-y-1">
              {getRecommendations(healthData).map((rec, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-1.5 text-primary-500">•</span> {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <Button 
          onClick={() => refetch()} 
          variant="default" 
          className="w-full"
        >
          {t('financialHealth.refresh')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FinancialHealthSnapshot;