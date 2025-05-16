import React from 'react';
import { CoinSpinner, ChartSpinner, DollarSpinner, WalletSpinner, FinancialSpinner } from './spinners';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export default function SpinnerDemo() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Financial Loading Spinners</h2>
      <p className="text-gray-600">A collection of animated spinners with financial themes to enhance the user experience during loading states.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Coin Spinner Card */}
        <Card>
          <CardHeader>
            <CardTitle>Coin Spinner</CardTitle>
            <CardDescription>Animated coin flip loading spinner</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg w-full h-24">
              <CoinSpinner size="lg" />
            </div>
            <div className="flex space-x-4">
              <CoinSpinner size="sm" variant="primary" />
              <CoinSpinner size="sm" variant="secondary" />
              <CoinSpinner size="sm" variant="accent" />
            </div>
          </CardContent>
        </Card>
        
        {/* Chart Spinner Card */}
        <Card>
          <CardHeader>
            <CardTitle>Chart Spinner</CardTitle>
            <CardDescription>Animated bar chart loading spinner</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg w-full h-24">
              <ChartSpinner size="lg" />
            </div>
            <div className="flex space-x-4">
              <ChartSpinner size="sm" variant="primary" />
              <ChartSpinner size="sm" variant="secondary" />
              <ChartSpinner size="sm" variant="accent" />
            </div>
          </CardContent>
        </Card>
        
        {/* Dollar Spinner Card */}
        <Card>
          <CardHeader>
            <CardTitle>Dollar Spinner</CardTitle>
            <CardDescription>Animated dollar sign loading spinner</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg w-full h-24">
              <DollarSpinner size="lg" />
            </div>
            <div className="flex space-x-4">
              <DollarSpinner size="sm" variant="primary" />
              <DollarSpinner size="sm" variant="secondary" />
              <DollarSpinner size="sm" variant="accent" />
            </div>
          </CardContent>
        </Card>
        
        {/* Wallet Spinner Card */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Spinner</CardTitle>
            <CardDescription>Animated wallet loading spinner</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg w-full h-24">
              <WalletSpinner size="lg" />
            </div>
            <div className="flex space-x-4">
              <WalletSpinner size="sm" variant="primary" />
              <WalletSpinner size="sm" variant="secondary" />
              <WalletSpinner size="sm" variant="accent" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Combined Spinner Showcase */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Combined Financial Spinner</CardTitle>
          <CardDescription>The FinancialSpinner component can be used to easily switch between different spinner types or randomly select one</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center space-y-4">
              <h3 className="text-lg font-medium">Size Variations</h3>
              <div className="flex items-end space-x-4">
                <FinancialSpinner size="sm" type="dollar" />
                <FinancialSpinner size="md" type="dollar" />
                <FinancialSpinner size="lg" type="dollar" />
                <FinancialSpinner size="xl" type="dollar" />
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <h3 className="text-lg font-medium">Color Variations</h3>
              <div className="flex space-x-4">
                <FinancialSpinner size="lg" type="dollar" variant="primary" />
                <FinancialSpinner size="lg" type="dollar" variant="secondary" />
                <FinancialSpinner size="lg" type="dollar" variant="accent" />
                <div className="bg-gray-900 p-2 rounded">
                  <FinancialSpinner size="lg" type="dollar" variant="white" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}