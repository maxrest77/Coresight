"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Activity, Bell, Shield, Save, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
    const [saved, setSaved] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <User className="text-cyan-500" />
                    Account Settings
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Manage your clinical profile, preferences, and security.
                </p>
            </div>

            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="mb-8 bg-slate-100 dark:bg-slate-800 flex flex-wrap max-w-full lg:max-w-[600px] h-auto p-1 border-0">
                        <TabsTrigger value="profile" className="flex-1 min-w-[120px] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 py-2">
                            <User className="w-4 h-4 mr-2" /> Profile
                        </TabsTrigger>
                        <TabsTrigger value="clinical" className="flex-1 min-w-[120px] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 py-2">
                            <Activity className="w-4 h-4 mr-2" /> Clinical
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex-1 min-w-[120px] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 py-2">
                            <Bell className="w-4 h-4 mr-2" /> Notifications
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex-1 min-w-[120px] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 py-2">
                            <Shield className="w-4 h-4 mr-2" /> Security
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Physician Name</label>
                                <Input defaultValue="Dr. Smith" className="bg-slate-50 dark:bg-slate-800/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact Email</label>
                                <Input defaultValue="dr.smith@coresight.ai" className="bg-slate-50 dark:bg-slate-800/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Specialty</label>
                                <Input defaultValue="Radiology" className="bg-slate-50 dark:bg-slate-800/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Medical License Number</label>
                                <Input defaultValue="MD-849201-B" className="bg-slate-50 dark:bg-slate-800/50" />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Clinical Preferences Tab */}
                    <TabsContent value="clinical" className="space-y-6">
                        <div className="space-y-6">
                            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/20">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-medium text-slate-900 dark:text-white">AI Confidence Threshold</div>
                                    <div className="text-sm text-cyan-600 font-bold">85%</div>
                                </div>
                                <p className="text-sm text-slate-500 mb-4">
                                    Determines the minimum confidence level required for the CoreSight AI to automatically flag a scan as "High Risk".
                                </p>
                                <input type="range" min="50" max="99" defaultValue="85" className="w-full accent-cyan-500" />
                            </div>

                            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/20 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white">Default Export Format</div>
                                    <p className="text-sm text-slate-500">Choose the format for downloading batch scan results.</p>
                                </div>
                                <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white">
                                    <option>PDF Report</option>
                                    <option>CSV Export</option>
                                    <option>DICOM Overlay</option>
                                </select>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-6">
                        <div className="space-y-4">
                            {[
                                { title: "Critical Findings Alert", desc: "Immediate email when a scan is flagged as High Risk." },
                                { title: "Weekly Digest", desc: "A summary of all scans processed throughout the week." },
                                { title: "System Updates", desc: "Notifications regarding CoreSight AI model updates and maintenance." },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/20">
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-white">{item.title}</div>
                                        <div className="text-sm text-slate-500">{item.desc}</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-cyan-500"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                                <div className="relative">
                                    <Input 
                                        type={showPassword ? "text" : "password"} 
                                        defaultValue="Sup3rS3cr3tP@ssw0rd!" 
                                        className="bg-slate-50 dark:bg-slate-800/50 pr-10" 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full sm:w-auto">Change Password</Button>
                        </div>

                        <hr className="border-slate-200 dark:border-slate-800 my-6" />

                        <div className="flex items-center justify-between p-4 border border-blue-200 dark:border-blue-900/50 rounded-xl bg-blue-50 dark:bg-blue-900/10">
                            <div>
                                <div className="font-medium text-blue-900 dark:text-blue-100">Two-Factor Authentication</div>
                                <div className="text-sm text-blue-700 dark:text-blue-300">Add an extra layer of security to your medical account.</div>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">Enable 2FA</Button>
                        </div>
                    </TabsContent>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                        <Button 
                            onClick={handleSave}
                            className={`min-w-[120px] transition-all ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-white`}
                        >
                            {saved ? (
                                <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                            )}
                        </Button>
                    </div>
                </Tabs>
            </Card>
        </div>
    );
}
