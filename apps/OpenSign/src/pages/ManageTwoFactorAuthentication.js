import React, { useEffect, useState } from "react";
import Parse from "parse";


const ManageTwoFactorAuthentication = () => {

    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const check2FA = async () => {
            try {
                const currentUser = Parse.User.current();
                const params = { UserId: currentUser.id };
                const res = await Parse.Cloud.run('IsTwoFactorAuthenticationEnabled', params);
                if (res) {
                    setIs2FAEnabled(true);
                } else {
                    setIs2FAEnabled(false);
                }
            } catch (error) {
                console.error('Error checking 2FA:', error);
            } finally {
                setLoading(false);
            }
        };

        check2FA();
    }, []);


    const handleToggle = () => {
        setIs2FAEnabled(!is2FAEnabled);
    };

    const handleSave = async () => {
        setSaving(true);
        // console.log(`2FA is now ${is2FAEnabled ? 'enabled' : 'disabled'}`);        
        const currentUser = Parse.User.current();
        const params = { UserId: currentUser.id, EnableTwoFactorAuthentication: is2FAEnabled }
        const res = await Parse.Cloud.run('ManageTwoFactorAuthentication', params);
        if (res) {
            setSuccessMessage(`2FA has been ${is2FAEnabled ? 'enabled' : 'disabled'}.`);
            setSaving(false);
        }
        else {
            setSuccessMessage(`Something went wrong`);
            setSaving(false);
        }
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    };

    return (
        <div className="relative">
            <div className="p-4 w-full bg-base-100 text-base-content op-card shadow-lg">
                <h2 className="text-lg font-semibold mb-2">Two-Factor Authentication</h2>

                {loading ? (
                    <p className="text-gray-500">Loading 2FA status...</p>
                ) : (
                    <>
                        <div>
                            <p className="mb-4">
                                Status: <span className={is2FAEnabled ? 'text-green-600' : 'text-red-600'}>
                                    {is2FAEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </p>
                            <label className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    checked={is2FAEnabled}
                                    onChange={handleToggle}
                                    className="toggle toggle-primary"
                                />
                                Enable 2FA
                            </label>
                        </div>
                        <div>
                            <button
                                onClick={handleSave}
                                className="btn btn-primary px-4"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                        {successMessage && (
                            <div className="mt-4 text-green-600 font-semibold">
                                {successMessage}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ManageTwoFactorAuthentication;
