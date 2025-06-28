import { LuLayoutDashboard, LuFactory, LuBuilding, LuLogOut, LuTruck, LuLink2 } from "react-icons/lu";

export const SIDE_MENU_DATA = [
    {
        id: "01",
        label: "Dashboard",
        icon: LuLayoutDashboard,
        path: "/dashboard"
    },
    {
        id: "02",
        label: "EAL Issuance",
        icon: LuBuilding,
        path: "/eal-issuance"
    },
    {
        id: "03",
        label: "EAL Usage",
        icon: LuFactory,
        path: "/eal-usage"
    },
    {
        id: "04",
        label: "Dispatch",
        icon: LuTruck,
        path: "/dispatch"
    },
    {
        id: "05",
        label: "Logout",
        icon: LuLogOut,
        path: "/logout"
    },
];