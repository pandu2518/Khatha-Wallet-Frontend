import axiosClient from "./axiosClient";

export const getStaff = (retailerId) => axiosClient.get(`/staff?retailerId=${retailerId}`);
export const addStaff = (staff, retailerId) => axiosClient.post(`/staff?retailerId=${retailerId}`, staff);
export const deleteStaff = (id, retailerId) => axiosClient.delete(`/staff/${id}?retailerId=${retailerId}`);

export const getTodayAttendance = (retailerId) => axiosClient.get(`/staff/attendance/today?retailerId=${retailerId}`);
export const markAttendance = (attendance, retailerId) => axiosClient.post(`/staff/attendance?retailerId=${retailerId}`, attendance);
export const getStaffAttendance = (staffId, retailerId) => axiosClient.get(`/staff/${staffId}/attendance?retailerId=${retailerId}`);
export const getMonthlyAttendance = (staffId, month, year, retailerId) =>
    axiosClient.get(`/staff/${staffId}/attendance/monthly?month=${month}&year=${year}&retailerId=${retailerId}`);
