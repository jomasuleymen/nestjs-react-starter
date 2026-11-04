import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

import { useThemeStore } from './themeStore';

export const ColorSchemeSwitch = () => {
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const setColorScheme = useThemeStore((state) => state.setColorScheme);

  const isDark = colorScheme === 'dark';
  const label = isDark ? 'Включить светлую тему' : 'Включить тёмную тему';

  return (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        size="large"
        type="text"
        onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
      />
    </Tooltip>
  );
};
