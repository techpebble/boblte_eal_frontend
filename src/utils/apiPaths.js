export const BASE_URL = "https://boblte-eal-api.techpebble.com";

//utils/apiPaths.js
export const API_PATHS = {
    AUTH: {
        LOGIN: "api/v1/auth/login",
        GET_USER_INFO: "api/v1/auth/getUser",
    },
    DASHBOARD: {
        GET_DATA: 'api/v1/dashboard'
    },
    EALISSUANCE: {
        GET_DATA: 'api/v1/eal_issuance',
        ADD_DATA: 'api/v1/eal_issuance'
    },
    EALUSAGE: {
        GET_DATA: 'api/v1/eal_usage',
        ADD_DATA: 'api/v1/eal_usage'
    },
    EALDISPATCH: {
        GET_DATA: 'api/v1/eal_dispatch',
        ADD_DATA: 'api/v1/eal_dispatch',
        ADD_EAL_LINK: 'api/v1/eal_dispatch/add_eal_link',
        REMOVE_EAL_LINK: 'api/v1/eal_dispatch/remove_eal_link'
    },
    DISPATCH: {
        GET_DATA: 'api/v1/dispatch',
        ADD_DATA: 'api/v1/dispatch',
        UPDATE_DATA: 'api/v1/dispatch'
    },
    COMPANY: {
        GET_DATA: 'api/v1/companies',
    },
    DELIVRY: {
        GET_DATA: 'api/v1/delivery',
    },
    PACK: {
        GET_DATA: 'api/v1/packs',
    },
    ITEM: {
        GET_DATA: 'api/v1/items',
    }
}