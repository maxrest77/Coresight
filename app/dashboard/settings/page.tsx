"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Activity, Bell, Shield, Save, CheckCircle2, Eye, EyeOff, Loader2, AlertCircle, Mail, Database, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, saveUserProfile, deleteAllUserData, deleteUserProfile, UserProfile } from "@/lib/firestoreService";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";

export default function SettingsPage() {
    const { user, reauthenticateWithPassword, deleteUserAccount } = useAuth();
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Password change state
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Data wipe state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deletingData, setDeletingData] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [deleteSuccess, setDeleteSuccess] = useState("");

    // Account deletion state
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [accountDeletePassword, setAccountDeletePassword] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [accountDeleteError, setAccountDeleteError] = useState("");

    const [profile, setProfile] = useState<Partial<UserProfile>>({
        displayName: "",
        contactEmail: "",
        specialty: "",
        licenseNumber: "",
    });

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        getUserProfile(user.uid)
            .then((data) => {
                if (data) {
                    setProfile(data);
                } else {
                    // pre-fill from Auth if no profile exists yet
                    setProfile(prev => ({
                        ...prev,
                        displayName: user.displayName || "",
                        contactEmail: user.email || "",
                    }));
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await saveUserProfile(user.uid, profile);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Failed to save profile", error);
        } finally {
            setSaving(false);
        }
    };

    const handleSendPasswordReset = async () => {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser || !currentUser.email) return;

        setPasswordChanging(true);
        setPasswordMessage(null);
        
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            setPasswordMessage({ type: 'success', text: "Verification email sent. Please check your inbox to reset your password." });
        } catch (error: any) {
            console.error("Password reset error:", error);
            setPasswordMessage({ type: 'error', text: "Failed to send reset email. Please try again." });
        } finally {
            setPasswordChanging(false);
        }
    };

    const handleDeleteData = async () => {
        if (!user) return;
        setDeletingData(true);
        setDeleteError("");
        setDeleteSuccess("");
        try {
            const isVerified = await reauthenticateWithPassword(deletePassword);
            if (!isVerified) {
                setDeleteError("Incorrect password. Please try again.");
                setDeletingData(false);
                return;
            }
            await deleteAllUserData(user.uid);
            setShowDeleteModal(false);
            setDeletePassword("");
            setDeleteSuccess("All patient records and scans have been permanently deleted.");
            setTimeout(() => setDeleteSuccess(""), 5000);
        } catch (err) {
            console.error("Failed to delete data:", err);
            setDeleteError("Failed to delete data. Please try again.");
        } finally {
            setDeletingData(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        setDeletingAccount(true);
        setAccountDeleteError("");
        try {
            const isVerified = await reauthenticateWithPassword(accountDeletePassword);
            if (!isVerified) {
                setAccountDeleteError("Incorrect password. Please try again.");
                setDeletingAccount(false);
                return;
            }
            await deleteAllUserData(user.uid);
            await deleteUserProfile(user.uid);
            await deleteUserAccount();
        } catch (err) {
            console.error("Failed to delete account:", err);
            setAccountDeleteError("Failed to delete account. Please try again.");
        } finally {
            setDeletingAccount(false);
        }
    };

    const getHashedEmail = (email: string | null | undefined) => {
        if (!email) return "";
        const [local, domain] = email.split("@");
        if (!domain) return email;
        const hashedLocal = local.length > 2 
            ? `${local.substring(0, 2)}${"*".repeat(local.length - 2)}` 
            : `${local.substring(0, 1)}*`;
        return `${hashedLocal}@${domain}`;
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

            {deleteSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 rounded-xl flex gap-3 text-emerald-700 dark:text-emerald-400 animate-in slide-in-from-top-4">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{deleteSuccess}</p>
                </div>
            )}

            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="mb-8 bg-slate-100 dark:bg-slate-800 flex flex-wrap max-w-full lg:max-w-[800px] h-auto p-1 border-0">
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
                        <TabsTrigger value="data" className="flex-1 min-w-[120px] data-[state=active]:bg-rose-50 dark:data-[state=active]:bg-rose-900/40 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400 py-2 transition-colors">
                            <Database className="w-4 h-4 mr-2" /> Data
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12 text-slate-500">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Loading profile...
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Physician Name</label>
                                    <Input 
                                        value={profile.displayName || ""}
                                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                        className="bg-slate-50 dark:bg-slate-800/50" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact Email</label>
                                    <Input 
                                        value={profile.contactEmail || ""}
                                        onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                                        className="bg-slate-50 dark:bg-slate-800/50" 
                                        type="email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Specialty</label>
                                    <Input 
                                        value={profile.specialty || ""}
                                        onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                                        placeholder="e.g. Radiology, Oncology"
                                        className="bg-slate-50 dark:bg-slate-800/50" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Medical License Number</label>
                                    <Input 
                                        value={profile.licenseNumber || ""}
                                        onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                                        placeholder="e.g. MD-12345"
                                        className="bg-slate-50 dark:bg-slate-800/50" 
                                    />
                                </div>
                            </div>
                        )}
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
                        <div className="space-y-4 max-w-md border border-slate-200 dark:border-slate-800 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/20">
                            <div>
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Update Password</h3>
                                <p className="text-sm text-slate-500 mb-4">For security reasons, you cannot change your password directly here. We will send a verification link to your registered email address.</p>
                            </div>
                            
                            {passwordMessage && (
                                <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                                    {passwordMessage.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
                                    <span>{passwordMessage.text}</span>
                                </div>
                            )}

                            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                                    <Mail className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Linked Email</div>
                                    <div className="text-sm font-medium text-slate-900 dark:text-white font-mono">{getHashedEmail(user?.email)}</div>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={handleSendPasswordReset}
                                disabled={passwordChanging || !user?.email}
                                className="w-full sm:w-auto mt-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                            >
                                {passwordChanging ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Send Verification Email"}
                            </Button>
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

                    {/* Data Management Tab */}
                    <TabsContent value="data" className="space-y-6">
                        <div className="p-6 border border-rose-200 dark:border-rose-900/50 rounded-xl bg-rose-50 dark:bg-rose-900/10 max-w-xl">
                            <h3 className="text-lg font-medium text-rose-900 dark:text-rose-100 mb-2">Erase All Patient Data</h3>
                            <p className="text-sm text-rose-700 dark:text-rose-300 mb-6">
                                This will permanently delete all your scanned patient records, AI predictions, heatmaps, and history from CoreSight. This action cannot be undone.
                            </p>
                            <Button 
                                onClick={() => setShowDeleteModal(true)}
                                className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Erase All Data
                            </Button>
                        </div>
                        
                        <div className="p-6 border border-red-200 dark:border-red-900/50 rounded-xl bg-red-50 dark:bg-red-900/10 max-w-xl">
                            <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">Delete Account</h3>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-6">
                                This will permanently delete your entire CoreSight account, including your profile, preferences, and all associated patient scan data. This action is irreversible.
                            </p>
                            <Button 
                                onClick={() => setShowDeleteAccountModal(true)}
                                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Account
                            </Button>
                        </div>
                    </TabsContent>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                        <Button 
                            onClick={handleSave}
                            disabled={loading || saving}
                            className={`min-w-[120px] transition-all ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-white`}
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                            ) : saved ? (
                                <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                            )}
                        </Button>
                    </div>
                </Tabs>
            </Card>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold text-xl">
                                <AlertCircle className="w-6 h-6" /> Destructive Action
                            </div>
                            <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 font-medium">
                            You are about to permanently delete all your patient scans, AI history, and predictions. This data <span className="font-bold text-rose-500">cannot be recovered</span>.
                            <br /><br />
                            Please enter your account password to confirm.
                        </p>
                        <div className="space-y-4">
                            <Input 
                                type="password" 
                                placeholder="Enter your current password" 
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50"
                            />
                            {deleteError && (
                                <p className="text-sm text-rose-500 font-medium">{deleteError}</p>
                            )}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                                <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deletingData} className="border-slate-300 dark:border-slate-700">
                                    Cancel
                                </Button>
                                <Button onClick={handleDeleteData} disabled={deletingData || !deletePassword} className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20">
                                    {deletingData ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Permanently Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteAccountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 font-bold text-xl">
                                <AlertCircle className="w-6 h-6" /> Terminate Account
                            </div>
                            <button onClick={() => setShowDeleteAccountModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 font-medium">
                            You are about to permanently delete your <span className="font-bold">entire account and all data</span>. This action <span className="font-bold text-red-500">cannot be reversed</span>.
                            <br /><br />
                            Please enter your account password to confirm termination.
                        </p>
                        <div className="space-y-4">
                            <Input 
                                type="password" 
                                placeholder="Enter your current password" 
                                value={accountDeletePassword}
                                onChange={(e) => setAccountDeletePassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50"
                            />
                            {accountDeleteError && (
                                <p className="text-sm text-red-500 font-medium">{accountDeleteError}</p>
                            )}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                                <Button variant="outline" onClick={() => setShowDeleteAccountModal(false)} disabled={deletingAccount} className="border-slate-300 dark:border-slate-700">
                                    Cancel
                                </Button>
                                <Button onClick={handleDeleteAccount} disabled={deletingAccount || !accountDeletePassword} className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20">
                                    {deletingAccount ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
