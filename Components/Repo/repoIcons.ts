// The BorgWarehouse ghost logo (rendered by BorgWarehouseIcon, not a Tabler icon).
export const BORGWAREHOUSE_ICON = 'BorgWarehouse';
export const DEFAULT_REPO_ICON = BORGWAREHOUSE_ICON;

export type RepoIconCategory = {
  label: string;
  icons: string[];
};

export const REPO_ICON_CATEGORIES: RepoIconCategory[] = [
  {
    label: 'BorgWarehouse',
    icons: ['BorgWarehouse'],
  },
  {
    label: 'Storage & NAS',
    icons: [
      'IconDatabase',
      'IconDatabaseCog',
      'IconDatabaseImport',
      'IconDatabaseExport',
      'IconServer',
      'IconServer2',
      'IconServerBolt',
      'IconServerCog',
      'IconDeviceFloppy',
      'IconDeviceSdCard',
      'IconDisc',
      'IconBuildingWarehouse',
    ],
  },
  {
    label: 'Cloud & Network',
    icons: [
      'IconCloud',
      'IconCloudUpload',
      'IconCloudCheck',
      'IconCloudLock',
      'IconWorld',
      'IconWorldUpload',
      'IconNetwork',
      'IconRouter',
      'IconPlug',
      'IconUsb',
    ],
  },
  {
    label: 'Backup & Files',
    icons: [
      'IconArchive',
      'IconBox',
      'IconPackage',
      'IconPackages',
      'IconStack',
      'IconStack2',
      'IconFolder',
      'IconFolderOpen',
      'IconFiles',
      'IconFileZip',
      'IconHistory',
      'IconRefresh',
    ],
  },
  {
    label: 'Devices',
    icons: [
      'IconDeviceDesktop',
      'IconDeviceLaptop',
      'IconDeviceMobile',
      'IconDeviceTv',
      'IconDevices',
      'IconCpu',
    ],
  },
  {
    label: 'Security',
    icons: [
      'IconLock',
      'IconLockCheck',
      'IconShield',
      'IconShieldCheck',
      'IconShieldLock',
      'IconKey',
      'IconFingerprint',
    ],
  },
  {
    label: 'Systems',
    icons: [
      'IconBrandDebian',
      'IconBrandUbuntu',
      'IconBrandRedhat',
      'IconBrandAndroid',
      'IconBrandWindows',
      'IconBrandApple',
      'IconBrandDocker',
    ],
  },
  {
    label: 'Media & Dev',
    icons: ['IconPhoto', 'IconVideo', 'IconMusic', 'IconMail', 'IconCode', 'IconTerminal'],
  },
  {
    label: 'Other',
    icons: [
      'IconHome',
      'IconBuilding',
      'IconBuildingBank',
      'IconBriefcase',
      'IconClock',
      'IconCalendarTime',
      'IconChartBar',
      'IconChartLine',
      'IconHexagon',
      'IconCircleDot',
    ],
  },
];

export const REPO_ICON_NAMES: string[] = REPO_ICON_CATEGORIES.flatMap((c) => c.icons);

export const isValidRepoIcon = (name: unknown): name is string =>
  typeof name === 'string' && REPO_ICON_NAMES.includes(name);
