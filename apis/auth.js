import { api } from "./axios";
import APIConfig from "./config";

export const AuthApi = {
    login(data){
        const url = `${APIConfig.auth}/cms-login`
        return api.post(url, data)
    },
    logout(data){
        const url = `${APIConfig.auth}/logout`
        return api.post(url, data)
    },
    register(data){
        const url = `${APIConfig.auth}/register`
        return api.post(url, data)
    },
    forgotPassword(data){
        const url = `${APIConfig.auth}/forgot-password`
        return api.post(url, data)
    },
    resetPassword(data){
        const url = `${APIConfig.auth}/reset-password`
        return api.post(url, data)
    },
    refreshToken(data){
        const url = `${APIConfig.auth}/refresh-token`
        return api.post(url, data)
    },
    changePassword(data){
        const url = `${APIConfig.auth}/change-password`
        return api.post(url, data)
    }
}

export const UserApi = {
    // Profile management
    getProfile(){
        const url = `${APIConfig.user}/profile`
        return api.get(url)
    },
    updateProfile(data){
        const url = `${APIConfig.user}/profile`
        return api.put(url, data)
    },
    
    // Avatar management
    uploadAvatar(formData){
        const url = `${APIConfig.user}/upload-avatar`
        return api.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
    },
    deleteAvatar(){
        const url = `${APIConfig.user}/delete-avatar`
        return api.delete(url)
    },
    
    // User management (Admin only)
    getAllUsers(params){
        const url = `${APIConfig.user}/users`
        return api.get(url, { params })
    },
    getUserById(id){
        const url = `${APIConfig.user}/users/${id}`
        return api.get(url)
    },
    updateUser(id, data){
        const url = `${APIConfig.user}/users/${id}`
        return api.put(url, data)
    },
    updateUserRole(id, data){
        const url = `${APIConfig.user}/users/${id}/role`
        return api.put(url, data)
    },
    toggleUserStatus(id, data){
        const url = `${APIConfig.user}/users/${id}/status`
        return api.put(url, data)
    },
    changeUserPassword(id, data){
        const url = `${APIConfig.user}/users/${id}/password`
        return api.put(url, data)
    },
    deleteUser(id){
        const url = `${APIConfig.user}/users/${id}`
        return api.delete(url)
    },
    createUser(data){
        const url = `${APIConfig.auth}/admin/create`
        return api.post(url, data)
    },
    
    // Permission management
    getUserPermissions(){
        const url = `${APIConfig.user}/permissions`
        return api.get(url)
    },
    getAllPermissions(){
        const url = `${APIConfig.user}/permissions/all`
        return api.get(url)
    },
    getRolePermissions(role){
        const url = `${APIConfig.user}/roles/${role}/permissions`
        return api.get(url)
    },
    updateUserPermissions(userId, customPermissions){
        const url = `${APIConfig.user}/users/${userId}/permissions`
        return api.put(url, { customPermissions })
    }
}

