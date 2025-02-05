import { Home, Settings, Users, LucideIcon, LetterText, NotebookText, HelpCircle, Shapes, UserPen } from "lucide-react";

export type SideNavItem = {
  title: string;
  path: string;
  icon?: LucideIcon;
  submenu?: boolean;
  subMenuItems?: SideNavItem[];
};

export const SIDENAV_ITEMS = [
  {
    title: "Home",
    path: "/admin",
    icon: Home,
  },
  {
    title: "Posts",
    path: "/admin/posts",
    icon: LetterText,
    submenu: true,
    subMenuItems: [
      { title: "All Post", path: "/admin/posts" },
      { title: "Add New Post", path: "/admin/posts/create" },
    ],
  },
  {
    title: "Pages",
    path: "/admin/pages",
    icon: NotebookText,
    submenu: true,
    subMenuItems: [
      { title: "All Pages", path: "pages" },
      { title: "Add New Page", path: "pages/create" },
    ],
  },
  {
    title: "Categories",
    path: "/admin/categories",
    icon: Shapes,
    submenu: true,
    subMenuItems: [
      { title: "All Categories", path: "/admin/categories" },
      { title: "Add New Categories", path: "/admin/categories/create" },
    ],
  },
  {
    title: "Users",
    path: "/admin/users",
    icon: Users,
    submenu: true,
    subMenuItems: [
      { title: "All Users", path: "/admin/users" },
      { title: "Add New User", path: "/admin/users/create" },
    ],
  },
  {
    title: "Profile",
    path: "/admin/profile",
    icon: UserPen,
  },
  {
    title: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Help",
    path: "/admin/help",
    icon: HelpCircle,
  },
];
