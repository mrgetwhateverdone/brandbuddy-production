import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  Settings as SettingsIcon, 
  Brain, 
  Cpu, 
  Database, 
  Layout as LayoutIcon,
  Monitor,
  Sliders,
  Trash2,
  Clock,
  Globe,
  DollarSign,
  FileText,
  Package,
  Building2
} from "lucide-react";

/**
 * This part of the code creates the comprehensive Settings page with tabs
 * Organizes settings into logical groups for better user experience
 */
export default function Settings() {
  const {
    settings,
    updateAgentSetting,
    updateAISetting,
    updateCacheSetting,
    updatePageSetting,
    updateDisplaySetting,
    updateOperationalSetting,
    updateUISetting,
    updateQuickAction,
    clearCache,
    resetToDefaults
  } = useSettings();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  /**
   * This part of the code handles cache clearing with user confirmation
   * Provides feedback on cache status and clearing results
   */
  const handleClearCache = () => {
    clearCache();
    console.log('AI cache cleared successfully');
  };

  /**
   * This part of the code handles resetting all settings to defaults
   * Includes confirmation step to prevent accidental resets
   */
  const handleResetToDefaults = () => {
    if (showResetConfirm) {
      resetToDefaults();
      setShowResetConfirm(false);
      console.log('Settings reset to defaults');
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 5000);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        {/* This part of the code creates the main settings header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-blue-600" />
              Settings
            </h1>
            <p className="text-gray-700 text-lg mt-2">
              Configure your CargoCore experience and AI assistant behavior
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleResetToDefaults}
              className={showResetConfirm ? "border-red-500 text-red-600 bg-red-50" : "bg-white border-gray-300 text-gray-700"}
            >
              {showResetConfirm ? "Click again to confirm" : "Reset to Defaults"}
            </Button>
          </div>
        </div>

        {/* This part of the code creates the tabbed interface for organized settings */}
        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="agents" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600">
              <Brain className="h-4 w-4" />
              AI Agents
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600">
              <Monitor className="h-4 w-4" />
              Display & Data
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600">
              <Building2 className="h-4 w-4" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* AI AGENTS TAB */}
          <TabsContent value="agents" className="space-y-6 mt-6">
            {/* Agent Configuration */}
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                  <Brain className="h-6 w-6 text-blue-600" />
                  Agent Configuration
                </CardTitle>
                <p className="text-gray-700 text-base mt-2">
                  Control AI agent behavior and threshold settings
                </p>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                
                {/* Dashboard Agent */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <LayoutIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">Dashboard Agent</p>
                        <p className="text-base text-gray-600">Cross-domain critical issues detection</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.agents.dashboard.enabled}
                      onCheckedChange={(checked) => updateAgentSetting('dashboard', 'enabled', checked)}
                    />
                  </div>
                  
                  {settings.agents.dashboard.enabled && (
                    <div className="ml-20 bg-white p-6 rounded-lg border border-gray-300">
                      <label className="text-base font-bold text-gray-900 block mb-3">Notification Threshold</label>
                      <Select
                        value={settings.agents.dashboard.notificationThreshold}
                        onValueChange={(value) => updateAgentSetting('dashboard', 'notificationThreshold', value)}
                      >
                        <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                          <SelectValue className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-400 shadow-lg">
                          <SelectItem value="high" className="text-gray-900 font-medium">High severity only</SelectItem>
                          <SelectItem value="medium_high" className="text-gray-900 font-medium">Medium and high severity</SelectItem>
                          <SelectItem value="all" className="text-gray-900 font-medium">All insights</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Orders Agent */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Package className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">Orders Agent</p>
                        <p className="text-base text-gray-600">Delay and cancellation detection</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.agents.orders.enabled}
                      onCheckedChange={(checked) => updateAgentSetting('orders', 'enabled', checked)}
                    />
                  </div>
                  
                  {settings.agents.orders.enabled && (
                    <div className="ml-20 bg-white p-6 rounded-lg border border-gray-300">
                      <label className="text-base font-bold text-gray-900 block mb-3">SLA Risk Threshold</label>
                      <Select
                        value={settings.agents.orders.slaRiskThreshold}
                        onValueChange={(value) => updateAgentSetting('orders', 'slaRiskThreshold', value)}
                      >
                        <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                          <SelectValue className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-400 shadow-lg">
                          <SelectItem value="6_hours" className="text-gray-900 font-medium">6 hours before deadline</SelectItem>
                          <SelectItem value="12_hours" className="text-gray-900 font-medium">12 hours before deadline</SelectItem>
                          <SelectItem value="24_hours" className="text-gray-900 font-medium">24 hours before deadline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Analytics Agent */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Sliders className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">Analytics Agent</p>
                        <p className="text-base text-gray-600">Trend analysis and anomaly detection</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.agents.analytics.enabled}
                      onCheckedChange={(checked) => updateAgentSetting('analytics', 'enabled', checked)}
                    />
                  </div>
                  
                  {settings.agents.analytics.enabled && (
                    <div className="ml-20 bg-white p-6 rounded-lg border border-gray-300">
                      <label className="text-base font-bold text-gray-900 block mb-3">Anomaly Sensitivity</label>
                      <Select
                        value={settings.agents.analytics.anomalySensitivity}
                        onValueChange={(value) => updateAgentSetting('analytics', 'anomalySensitivity', value)}
                      >
                        <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                          <SelectValue className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-400 shadow-lg">
                          <SelectItem value="high" className="text-gray-900 font-medium">High (detect subtle changes)</SelectItem>
                          <SelectItem value="medium" className="text-gray-900 font-medium">Medium (balanced detection)</SelectItem>
                          <SelectItem value="low" className="text-gray-900 font-medium">Low (major changes only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Inventory Agent */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Database className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">Inventory Agent</p>
                        <p className="text-base text-gray-600">Stock optimization and reorder suggestions</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.agents.inventory.enabled}
                      onCheckedChange={(checked) => updateAgentSetting('inventory', 'enabled', checked)}
                    />
                  </div>
                  
                  {settings.agents.inventory.enabled && (
                    <div className="ml-20 bg-white p-6 rounded-lg border border-gray-300">
                      <label className="text-base font-bold text-gray-900 block mb-3">Reorder Point Strategy</label>
                      <Select
                        value={settings.agents.inventory.reorderStrategy}
                        onValueChange={(value) => updateAgentSetting('inventory', 'reorderStrategy', value)}
                      >
                        <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                          <SelectValue className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-400 shadow-lg">
                          <SelectItem value="conservative" className="text-gray-900 font-medium">Conservative (higher safety stock)</SelectItem>
                          <SelectItem value="balanced" className="text-gray-900 font-medium">Balanced (standard levels)</SelectItem>
                          <SelectItem value="aggressive" className="text-gray-900 font-medium">Aggressive (minimal stock)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Configuration */}
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                  <Cpu className="h-6 w-6 text-purple-600" />
                  AI Configuration
                </CardTitle>
                <p className="text-gray-700 text-base mt-2">
                  Optimize AI performance and control token usage
                </p>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                
                {/* Refresh Strategy */}
                <div className="space-y-6">
                  <label className="text-xl font-bold text-gray-900 block">Refresh Strategy</label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="radio"
                        id="on_load"
                        checked={settings.ai.refreshStrategy === 'on_load'}
                        onChange={() => updateAISetting('refreshStrategy', 'on_load')}
                        className="h-5 w-5 text-blue-600"
                      />
                      <label htmlFor="on_load" className="text-base">
                        <span className="font-bold text-gray-900">Only on full app load</span>
                        <p className="text-gray-600">Most efficient - AI runs once per session</p>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="radio"
                        id="every_page"
                        checked={settings.ai.refreshStrategy === 'every_page'}
                        onChange={() => updateAISetting('refreshStrategy', 'every_page')}
                        className="h-5 w-5 text-blue-600"
                      />
                      <label htmlFor="every_page" className="text-base">
                        <span className="font-bold text-gray-900">Every page visit</span>
                        <p className="text-gray-600">Moderate usage - AI runs when you visit pages</p>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="radio"
                        id="manual"
                        checked={settings.ai.refreshStrategy === 'manual'}
                        onChange={() => updateAISetting('refreshStrategy', 'manual')}
                        className="h-5 w-5 text-blue-600"
                      />
                      <label htmlFor="manual" className="text-base">
                        <span className="font-bold text-gray-900">Manual refresh only</span>
                        <p className="text-gray-600">Maximum control - AI runs only when you request it</p>
                      </label>
                    </div>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Cost Controls */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    💰 Cost Controls
                  </h3>
                  
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
                    <div>
                      <label className="text-base font-bold text-gray-900 block mb-3">AI Model</label>
                      <Select
                        value={settings.ai.model}
                        onValueChange={(value) => updateAISetting('model', value)}
                      >
                        <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                          <SelectValue className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-400 shadow-lg">
                          <SelectItem value="gpt-3.5-turbo" className="text-gray-900 font-medium">Fast Model (Cheaper, faster)</SelectItem>
                          <SelectItem value="gpt-4" className="text-gray-900 font-medium">Advanced Model (More capable, slower)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-base font-bold text-gray-900 mb-4 block">
                        Max Tokens per Request: {settings.ai.maxTokens}
                      </label>
                      <Slider
                        value={[settings.ai.maxTokens]}
                        onValueChange={([value]) => updateAISetting('maxTokens', value)}
                        min={50}
                        max={500}
                        step={25}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>50 (minimal)</span>
                        <span>500 (detailed)</span>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-base text-blue-800 font-medium">
                        <strong>Estimated Cost:</strong> Per request: ~$0.0003
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DISPLAY & DATA TAB */}
          <TabsContent value="display" className="space-y-6 mt-6">
            {/* Dashboard & Display Settings */}
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                  <Monitor className="h-6 w-6 text-green-600" />
                  Dashboard & Display Settings
                </CardTitle>
                <p className="text-gray-700 text-base mt-2">
                  Control default page, refresh behavior, and display formats
                </p>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
                  {/* Default Landing Page */}
                  <div>
                    <label className="text-base font-bold text-gray-900 block mb-3">Default Landing Page</label>
                    <Select
                      value={settings.display.defaultPage}
                      onValueChange={(value) => updateDisplaySetting('defaultPage', value)}
                    >
                      <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                        <SelectValue className="text-gray-900" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-400 shadow-lg">
                        <SelectItem value="dashboard" className="text-gray-900 font-medium">Dashboard (Overview)</SelectItem>
                        <SelectItem value="orders" className="text-gray-900 font-medium">Orders (Order Management)</SelectItem>
                        <SelectItem value="inventory" className="text-gray-900 font-medium">Inventory (Stock Levels)</SelectItem>
                        <SelectItem value="analytics" className="text-gray-900 font-medium">Analytics (Business Intelligence)</SelectItem>
                        <SelectItem value="warehouses" className="text-gray-900 font-medium">Warehouses (Facility Management)</SelectItem>
                        <SelectItem value="cost_management" className="text-gray-900 font-medium">Cost Management</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 mt-2">Page that loads when you first open CargoCore</p>
                  </div>

                  {/* Auto-Refresh Settings */}
                  <div>
                    <label className="text-base font-bold text-gray-900 block mb-3">Auto-Refresh Interval</label>
                    <Select
                      value={settings.display.refreshInterval}
                      onValueChange={(value) => updateDisplaySetting('refreshInterval', value)}
                    >
                      <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                        <SelectValue className="text-gray-900" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-400 shadow-lg">
                        <SelectItem value="30s" className="text-gray-900 font-medium">Every 30 seconds</SelectItem>
                        <SelectItem value="1min" className="text-gray-900 font-medium">Every 1 minute</SelectItem>
                        <SelectItem value="5min" className="text-gray-900 font-medium">Every 5 minutes</SelectItem>
                        <SelectItem value="manual" className="text-gray-900 font-medium">Manual refresh only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 mt-2">How often data refreshes automatically</p>
                  </div>

                  {/* Time Zone */}
                  <div>
                    <label className="text-base font-bold text-gray-900 block mb-3">Time Zone</label>
                    <Select
                      value={settings.display.timeZone}
                      onValueChange={(value) => updateDisplaySetting('timeZone', value)}
                    >
                      <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                        <SelectValue className="text-gray-900" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-400 shadow-lg">
                        <SelectItem value="America/New_York" className="text-gray-900 font-medium">Eastern (EST/EDT)</SelectItem>
                        <SelectItem value="America/Chicago" className="text-gray-900 font-medium">Central (CST/CDT)</SelectItem>
                        <SelectItem value="America/Denver" className="text-gray-900 font-medium">Mountain (MST/MDT)</SelectItem>
                        <SelectItem value="America/Los_Angeles" className="text-gray-900 font-medium">Pacific (PST/PDT)</SelectItem>
                        <SelectItem value="UTC" className="text-gray-900 font-medium">UTC (Coordinated Universal Time)</SelectItem>
                        <SelectItem value="Europe/London" className="text-gray-900 font-medium">London (GMT/BST)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 mt-2">Display timestamps in your local timezone</p>
                  </div>

                  {/* Currency Format */}
                  <div>
                    <label className="text-base font-bold text-gray-900 block mb-3">Currency Format</label>
                    <Select
                      value={settings.display.currencyFormat}
                      onValueChange={(value) => updateDisplaySetting('currencyFormat', value)}
                    >
                      <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                        <SelectValue className="text-gray-900" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-400 shadow-lg">
                        <SelectItem value="usd_symbol" className="text-gray-900 font-medium">$1,234.56 (USD with symbol)</SelectItem>
                        <SelectItem value="usd_no_symbol" className="text-gray-900 font-medium">1,234.56 (USD without symbol)</SelectItem>
                        <SelectItem value="eur" className="text-gray-900 font-medium">€1,234.56 (EUR)</SelectItem>
                        <SelectItem value="gbp" className="text-gray-900 font-medium">£1,234.56 (GBP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Number Precision */}
                  <div>
                    <label className="text-base font-bold text-gray-900 block mb-3">Number Decimal Places</label>
                    <Select
                      value={settings.display.numberFormat.toString()}
                      onValueChange={(value) => updateDisplaySetting('numberFormat', value === 'auto' ? 'auto' : parseInt(value))}
                    >
                      <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                        <SelectValue className="text-gray-900" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-400 shadow-lg">
                        <SelectItem value="0" className="text-gray-900 font-medium">No decimals (1,234)</SelectItem>
                        <SelectItem value="2" className="text-gray-900 font-medium">Two decimals (1,234.56)</SelectItem>
                        <SelectItem value="auto" className="text-gray-900 font-medium">Auto-format based on value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OPERATIONS TAB */}
          <TabsContent value="operations" className="space-y-6 mt-6">
            {/* Operational Preferences */}
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                  <Building2 className="h-6 w-6 text-orange-600" />
                  Operational Preferences
                </CardTitle>
                <p className="text-gray-700 text-base mt-2">
                  Set default filters, formats, and operational behaviors
                </p>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
                  {/* Date Format */}
                  <div>
                    <label className="text-base font-bold text-gray-900 block mb-3">Date Format</label>
                    <Select
                      value={settings.operational.dateFormat}
                      onValueChange={(value) => updateOperationalSetting('dateFormat', value)}
                    >
                      <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                        <SelectValue className="text-gray-900" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-400 shadow-lg">
                        <SelectItem value="mm_dd_yyyy" className="text-gray-900 font-medium">MM/DD/YYYY (US Format)</SelectItem>
                        <SelectItem value="dd_mm_yyyy" className="text-gray-900 font-medium">DD/MM/YYYY (International)</SelectItem>
                        <SelectItem value="iso" className="text-gray-900 font-medium">YYYY-MM-DD (ISO Standard)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 mt-2">How dates appear throughout the app</p>
                  </div>

                  {/* Table Page Size */}
                  <div>
                    <label className="text-base font-bold text-gray-900 block mb-3">Default Table Page Size</label>
                    <Select
                      value={settings.operational.tablePageSize.toString()}
                      onValueChange={(value) => updateOperationalSetting('tablePageSize', parseInt(value))}
                    >
                      <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                        <SelectValue className="text-gray-900" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-400 shadow-lg">
                        <SelectItem value="15" className="text-gray-900 font-medium">15 rows per page</SelectItem>
                        <SelectItem value="25" className="text-gray-900 font-medium">25 rows per page</SelectItem>
                        <SelectItem value="50" className="text-gray-900 font-medium">50 rows per page</SelectItem>
                        <SelectItem value="100" className="text-gray-900 font-medium">100 rows per page</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 mt-2">Number of items to show in data tables</p>
                  </div>

                  {/* Default Warehouses */}
                  <div className="space-y-3">
                    <label className="text-base font-bold text-gray-900 block">Default Warehouse Filters</label>
                    <div className="p-4 bg-white rounded-lg border border-gray-300">
                      <p className="text-base text-gray-700 mb-3">
                        <strong>Currently:</strong> {settings.operational.defaultWarehouses.length === 0 
                          ? "All warehouses selected" 
                          : `${settings.operational.defaultWarehouses.length} warehouses selected`}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateOperationalSetting('defaultWarehouses', [])}
                        className="bg-white border-gray-400 text-gray-700 font-medium"
                      >
                        Reset to All Warehouses
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Warehouse filters that are applied by default when loading pages</p>
                  </div>

                  {/* Default Brands */}
                  <div className="space-y-3">
                    <label className="text-base font-bold text-gray-900 block">Default Brand Filters</label>
                    <div className="p-4 bg-white rounded-lg border border-gray-300">
                      <p className="text-base text-gray-700 mb-3">
                        <strong>Currently:</strong> {settings.operational.defaultBrands.length === 0 
                          ? "All brands selected" 
                          : `${settings.operational.defaultBrands.length} brands selected`}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateOperationalSetting('defaultBrands', [])}
                        className="bg-white border-gray-400 text-gray-700 font-medium"
                      >
                        Reset to All Brands
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Brand filters that are applied by default when loading pages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SYSTEM TAB */}
          <TabsContent value="system" className="space-y-6 mt-6">
            {/* Page-Specific Controls */}
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                  <FileText className="h-6 w-6 text-indigo-600" />
                  Page-Specific AI Controls
                </CardTitle>
                <p className="text-gray-700 text-base mt-2">
                  Enable or disable AI insights for individual pages
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-6">
                    {Object.entries(settings.pages).map(([page, enabled]) => (
                      <div key={page} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-300">
                        <span className="text-base font-bold capitalize text-gray-900">
                          {page.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => updatePageSetting(page as keyof typeof settings.pages, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cache Management */}
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                  <Database className="h-6 w-6 text-red-600" />
                  Cache Management
                </CardTitle>
                <p className="text-gray-700 text-base mt-2">
                  Store AI results to avoid repeated calls and reduce costs
                </p>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-300">
                    <span className="font-bold text-lg text-gray-900">Cache Enabled</span>
                    <Switch
                      checked={settings.cache.enabled}
                      onCheckedChange={(checked) => updateCacheSetting('enabled', checked)}
                    />
                  </div>

                  {settings.cache.enabled && (
                    <div>
                      <label className="text-base font-bold text-gray-900 block mb-3">Cache Duration</label>
                      <Select
                        value={settings.cache.duration}
                        onValueChange={(value) => updateCacheSetting('duration', value)}
                      >
                        <SelectTrigger className="bg-white border-gray-400 text-gray-900 font-medium h-12">
                          <SelectValue className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-400 shadow-lg">
                          <SelectItem value="1_hour" className="text-gray-900 font-medium">1 Hour</SelectItem>
                          <SelectItem value="1_day" className="text-gray-900 font-medium">1 Day</SelectItem>
                          <SelectItem value="1_week" className="text-gray-900 font-medium">1 Week</SelectItem>
                          <SelectItem value="manual" className="text-gray-900 font-medium">Until manually cleared</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-300">
                    <p className="text-base text-gray-700">
                      Cache contains: <strong className="text-gray-900">{settings.cache.currentQueries} queries</strong>
                    </p>
                    <p className="text-base text-gray-700">
                      Storage: <strong className="text-gray-900">{settings.cache.storageUsed} used</strong>
                    </p>
                  </div>

                  <Button
                    variant="destructive"
                    onClick={handleClearCache}
                    className="w-full h-12 text-base font-medium"
                    disabled={settings.cache.currentQueries === 0}
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Clear All AI Cache
                  </Button>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <p className="text-base font-bold text-blue-900">Current Status</p>
                    </div>
                    <p className="text-base text-blue-800 mt-2">
                      AI is configured for <strong>{settings.ai.refreshStrategy.replace('_', ' ')}</strong> with{' '}
                      <strong>{settings.ai.model}</strong> model. Cache is{' '}
                      <strong>{settings.cache.enabled ? 'enabled' : 'disabled'}</strong>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}