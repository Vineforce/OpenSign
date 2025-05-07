import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Parse from "parse";

const EditUser = ({ userData, handleClose, refreshList, setIsAlert }) => {
    const { t } = useTranslation();
    const [formdata, setFormdata] = useState({
        name: "",
        phone: "",
        email: "",
        team: "",
        password: "",
        role: "",
        jobtitle: "",
        userId: "",
    });

    useEffect(() => {
        if (userData && typeof userData === "object") {
            const cleanRole = userData.UserRole?.replace(/^.*?_/, "") || "";
            setFormdata((prev) => ({
                ...prev,
                name: userData.Name || "",
                phone: userData.Phone || "",
                email: userData.Email || "",
                jobtitle: userData.JobTitle || "",
                role: cleanRole,
                userId: userData.UserId
            }));
        }
    }, [userData]);

    const role = ["OrgAdmin", "Editor", "User"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const userIdToUpdate = formdata.userId?.objectId;
            const params = { userId: userIdToUpdate, name: formdata.name, phoneNumber: formdata.phone, jobtitle: formdata.jobtitle, userRole:formdata.role }
            const res = await Parse.Cloud.run('editUser', params);
            if (res) {
                if (refreshList) {
                    refreshList();
                    setIsAlert({ type: "success", msg: "User updated successfully!" });
                    handleClose();
                }
            }
            else {
                setIsAlert({ type: "danger", msg: "Error updating user!" });
            }
        } catch (error) {
            console.error("Error updating user:", error);
            setIsAlert({ type: "danger", msg: "Error updating user!" });
        }
    };

    const handleChange = (event) => {
        let { name, value } = event.target;
        if (name === "email") {
            value = value?.toLowerCase()?.replace(/\s/g, "");
        }
        setFormdata((prev) => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        handleClose();
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label
                        htmlFor="name"
                        className="block text-xs text-gray-700 font-semibold"
                    >
                        {t("name")}
                        <span className="text-[red] text-[13px]"> *</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formdata.name}
                        onChange={(e) => handleChange(e)}
                        onInvalid={(e) =>
                            e.target.setCustomValidity(t("input-required"))
                        }
                        onInput={(e) => e.target.setCustomValidity("")}
                        required
                        className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                    />
                </div>
                <div className="mb-3">
                    <label
                        htmlFor="email"
                        className="block text-xs text-gray-700 font-semibold"
                    >
                        {t("email")}
                        <span className="text-[red] text-[13px]"> *</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formdata.email}
                        onChange={(e) => handleChange(e)}
                        required
                        readOnly
                        disabled
                        onInvalid={(e) =>
                            e.target.setCustomValidity(t("input-required"))
                        }
                        onInput={(e) => e.target.setCustomValidity("")}
                        className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                    />
                </div>
                <div className="mb-3">
                    <label
                        htmlFor="phone"
                        className="block text-xs text-gray-700 font-semibold"
                    >
                        {t("phone")}
                        {/* <span className="text-[red] text-[13px]"> *</span> */}
                    </label>
                    <input
                        type="text"
                        name="phone"
                        placeholder={t("phone-optional")}
                        value={formdata.phone}
                        onChange={(e) => handleChange(e)}
                        className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                    />
                </div>
                <div className="mb-3">
                    <label className="block text-xs text-gray-700 font-semibold">
                        {"Job Title"}
                    </label>
                    <input
                        type="text"
                        name="jobtitle"
                        placeholder={"Enter job title"}
                        value={formdata.jobtitle}
                        onChange={handleChange}
                        className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                    />
                </div>
                <div className="mb-3">
                    <label
                        htmlFor="phone"
                        className="block text-xs text-gray-700 font-semibold"
                    >
                        {t("Role")}
                        <span className="text-[red] text-[13px]"> *</span>
                    </label>
                    <select
                        value={formdata.role}
                        onChange={(e) => handleChange(e)}
                        name="role"
                        className="op-select op-select-bordered op-select-sm focus:outline-none hover:border-base-content w-full text-xs"
                        onInvalid={(e) =>
                            e.target.setCustomValidity(t("input-required"))
                        }
                        onInput={(e) => e.target.setCustomValidity("")}
                        required
                    >
                        <option defaultValue={""} value={""}>
                            {t("Select")}
                        </option>
                        {role.length > 0 &&
                            role.map((x) => (
                                <option key={x} value={x}>
                                    {x}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="flex items-center mt-3 gap-2 text-white">
                    <button type="submit" className="op-btn op-btn-primary">
                        {t("submit")}
                    </button>
                    <div
                        type="button"
                        onClick={() => handleCancel()}
                        className="op-btn op-btn-secondary"
                    >
                        {t("cancel")}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditUser;