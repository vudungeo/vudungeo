export const APP_NAME = 'vudungeo';

export const DEFAULT_REGION = 'eu';
export const DEFAULT_DAYS = 7;

export const REGION_OPTIONS = [
    { label: 'Europe (EU)', value: 'eu' },
    { label: 'Americas (US)', value: 'us' }
];

export const API = {
    BASE_URL: '/api',
    CHARACTER_PROFILE_PATH: '/api/v1/characters/profile',
    FIELDS: 'mythic_plus_recent_runs,mythic_plus_scores_by_season:current'
};

export const LOCAL_API = {
    BASE_URL: '/local',
    CHARACTERS_PATH: '/v1/characters'
};
