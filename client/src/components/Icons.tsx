import { ReactNode } from 'react';

type IconProps = { size?: number } & React.SVGProps<SVGSVGElement>;

const IconBase = ({ size = 18, children, ...props }: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

export const Icons = {
  Dashboard: (p: IconProps) => <IconBase {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></IconBase>,
  Folder: (p: IconProps) => <IconBase {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></IconBase>,
  Check: (p: IconProps) => <IconBase {...p}><polyline points="20 6 9 17 4 12"/></IconBase>,
  CheckCircle: (p: IconProps) => <IconBase {...p}><circle cx="12" cy="12" r="9"/><polyline points="8.5 12 11 14.5 16 9.5"/></IconBase>,
  Tasks: (p: IconProps) => <IconBase {...p}><rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 10l2 2 4-4"/><path d="M8 16h8"/></IconBase>,
  Users: (p: IconProps) => <IconBase {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></IconBase>,
  Bell: (p: IconProps) => <IconBase {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></IconBase>,
  Search: (p: IconProps) => <IconBase {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></IconBase>,
  Plus: (p: IconProps) => <IconBase {...p}><path d="M12 5v14M5 12h14"/></IconBase>,
  Settings: (p: IconProps) => <IconBase {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></IconBase>,
  Calendar: (p: IconProps) => <IconBase {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></IconBase>,
  Clock: (p: IconProps) => <IconBase {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></IconBase>,
  Mail: (p: IconProps) => <IconBase {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></IconBase>,
  Lock: (p: IconProps) => <IconBase {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></IconBase>,
  User: (p: IconProps) => <IconBase {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></IconBase>,
  Shield: (p: IconProps) => <IconBase {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"/><polyline points="9 12 11 14 15 10"/></IconBase>,
  Eye: (p: IconProps) => <IconBase {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></IconBase>,
  EyeOff: (p: IconProps) => <IconBase {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/><line x1="2" y1="2" x2="22" y2="22"/></IconBase>,
  More: (p: IconProps) => <IconBase {...p}><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></IconBase>,
  X: (p: IconProps) => <IconBase {...p}><path d="M18 6 6 18M6 6l12 12"/></IconBase>,
  Edit: (p: IconProps) => <IconBase {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></IconBase>,
  Trash: (p: IconProps) => <IconBase {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></IconBase>,
  ArrowRight: (p: IconProps) => <IconBase {...p}><path d="M5 12h14"/><polyline points="13 6 19 12 13 18"/></IconBase>,
  Filter: (p: IconProps) => <IconBase {...p}><polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3"/></IconBase>,
  Zap: (p: IconProps) => <IconBase {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></IconBase>,
  Star: (p: IconProps) => <IconBase {...p}><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2"/></IconBase>,
  Message: (p: IconProps) => <IconBase {...p}><path d="M21 12a8 8 0 0 1-12 7l-6 1 1-5a8 8 0 1 1 17-3z"/></IconBase>,
  Paperclip: (p: IconProps) => <IconBase {...p}><path d="M21 11.5 12 21a6 6 0 0 1-8.5-8.5L13 3a4 4 0 0 1 5.5 5.5L9 18a2 2 0 0 1-3-3l8.5-8.5"/></IconBase>,
  ChevronDown: (p: IconProps) => <IconBase {...p}><polyline points="6 9 12 15 18 9"/></IconBase>,
  ChevronRight: (p: IconProps) => <IconBase {...p}><polyline points="9 6 15 12 9 18"/></IconBase>,
  Logout: (p: IconProps) => <IconBase {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></IconBase>,
  AlertTriangle: (p: IconProps) => <IconBase {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></IconBase>,
  Info: (p: IconProps) => <IconBase {...p}><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></IconBase>,
  Flag: (p: IconProps) => <IconBase {...p}><path d="M4 22V4s1-1 4-1 5 2 8 2 4-1 4-1v12s-1 1-4 1-5-2-8-2-4 1-4 1"/></IconBase>,
  Grid: (p: IconProps) => <IconBase {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></IconBase>,
  List: (p: IconProps) => <IconBase {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></IconBase>,
  Send: (p: IconProps) => <IconBase {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></IconBase>,
  Sparkle: (p: IconProps) => <IconBase {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></IconBase>,
  TrendUp: (p: IconProps) => <IconBase {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></IconBase>,
};
