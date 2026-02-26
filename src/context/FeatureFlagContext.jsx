import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const FeatureFlagContext = createContext();

export const FeatureFlagProvider = ({ children }) => {
    const [flags, setFlags] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlags = async () => {
            try {
                // Fetch flags from the new backend endpoint
                const response = await axiosClient.get('/api/config/flags');
                setFlags(response.data);
                console.log('Feature Flags Loaded:', response.data);
            } catch (error) {
                console.error('Failed to load feature flags:', error);
                // Fallback to empty flags or some defaults if needed
                setFlags({});
            } finally {
                setLoading(false);
            }
        };

        fetchFlags();
    }, []);

    // Helper function to check if a specific flag is enabled
    const isEnabled = (flagKey) => {
        return !!flags[flagKey];
    };

    return (
        <FeatureFlagContext.Provider value={{ flags, loading, isEnabled }}>
            {!loading ? children : <div className="loader">Initializing Config...</div>}
        </FeatureFlagContext.Provider>
    );
};

export const useFeatureFlags = () => {
    const context = useContext(FeatureFlagContext);
    if (!context) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
    }
    return context;
};
